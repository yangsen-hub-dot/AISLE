/* Device-local repository. Replace this boundary with an authenticated API later. */
const DB_NAME = 'aisle-contribution-workspace-v1';
let database;
export function openWorkspace() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('records', {keyPath: 'id'});
      request.result.createObjectStore('files', {keyPath: 'id'});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Local storage is unavailable. Enable site storage to save your work.'));
    request.onblocked = () => reject(new Error('Close older AISLE workspace tabs, then reload.'));
  });
  return database;
}

export async function listRecords() {
  const db = await openWorkspace();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readonly');
    const request = tx.objectStore('records').getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecord(record, files = []) {
  const db = await openWorkspace();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['records', 'files'], 'readwrite');
    const records = tx.objectStore('records');
    let saved, failure;
    const current = records.get(record.id);
    current.onsuccess = () => {
      if ((current.result?._version || 0) !== (record._version || 0)) {
        failure = new Error('This submission changed in another tab. Copy any unsaved text, then reload to use the current version.');
        tx.abort(); return;
      }
      saved = {...record, updatedAt: new Date().toISOString(), _version: (record._version || 0) + 1};
      records.put(saved);
      for (const file of files) tx.objectStore('files').put(file);
    };
    tx.oncomplete = () => resolve(saved);
    tx.onabort = () => reject(failure || new Error('Could not save locally. Storage may be full; keep this tab open and export your work.'));
    tx.onerror = () => { failure ||= new Error('Could not save locally. Check browser storage availability.'); };
  });
}

export async function readFile(id) {
  const db = await openWorkspace();
  return new Promise((resolve, reject) => {
    const request = db.transaction('files', 'readonly').objectStore('files').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function exportRecord(record, {unsavedDraft = false} = {}) {
  const all = [...record.attachments, ...record.revisions.flatMap(r => r.attachments || [])];
  const ids = [...new Set(all.map(f => f.id))];
  const files = [];
  for (const id of ids) {
    const entry = await readFile(id);
    if (!entry) throw new Error('An attachment is missing from local storage. Restore it before exporting.');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('An attachment could not be read.'));
      reader.readAsDataURL(entry.blob);
    });
    files.push({id, dataUrl});
  }
  return new Blob([JSON.stringify({format:'aisle-contribution-package',version:1,exportedAt:new Date().toISOString(),unsavedDraft,record,files},null,2)], {type:'application/json'});
}
