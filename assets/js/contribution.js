import {createSubmission,validateFields,submitRecord,reviewRecord,canEdit,stageOf,statusLabel} from './contribution-model.js?v=c6fd4b2ff6a2';
import {groups,labelFor,scientificChecks,technicalChecks} from './contribution-fields.js?v=c6fd4b2ff6a2';
import {listRecords,saveRecord,readFile,downloadBlob,exportRecord} from './contribution-store.js?v=c6fd4b2ff6a2';

const app = document.getElementById('contribution-app');
const isReview = app?.dataset.mode === 'review';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => new Date(value).toLocaleString(undefined, {dateStyle:'medium',timeStyle:'short'});
let records = [], active, section = 'profile', dirty = false, errors = [], notice = '', busy = false;
let reviewFilter = 'all', search = '';
const inputDrafts = new Map();
function auxKey(input) {
  if (['reviewer-name','review-notes','help-topic','help-text'].includes(input.id)) return input.id;
  return input.dataset.helpReply ? 'reply:'+input.dataset.helpReply : '';
}
function rememberAux(event) {
  const key=auxKey(event.target);
  if (!active || !key) return;
  const draft=inputDrafts.get(active.id) || {values:{},dirty:new Set()};
  draft.values[key]=event.target.value;draft.dirty.add(key);inputDrafts.set(active.id,draft);
}
function clearAux(keys) {
  const draft=inputDrafts.get(active.id);
  if (!draft) return;
  for (const key of keys) {delete draft.values[key];draft.dirty.delete(key);}
}
const labels = {attachments:'Files & access',preview:'Preview & submit'};
const taskStage = () => active && stageOf(active) === 'task';
const tabs = () => [...groups.filter(g => !g.stage || taskStage()).map(g => [g.id,g.title]),['attachments',labels.attachments],['preview',labels.preview]];

function message(text, error = false) {
  const target = app.querySelector('#cw-message');
  if (target) { target.textContent = text; target.className = error ? 'cw-message error' : 'cw-message'; }
}
function setDirty() {
  dirty = true;
  const target = app.querySelector('#cw-save-state');
  if (target) target.textContent = 'Unsaved changes';
}
async function persist() {
  if (!active || !dirty) return;
  active = await saveRecord(active);
  records = records.map(r => r.id === active.id ? active : r);
  dirty = false;
}

function badge(record) { return '<span class="cw-status">'+esc(statusLabel(record.status))+'</span>'; }
function fieldHTML([key,label,type,hint]) {
  const value = active.fields[key] || '';
  const error = errors.find(e => e.field === key);
  const attrs = 'id="field-'+key+'" name="'+key+'" aria-describedby="help-'+key+(error?' error-'+key:'')+'"'+(error?' aria-invalid="true"':'');
  const control = type === 'textarea' ? '<textarea '+attrs+' rows="4" maxlength="12000">'+esc(value)+'</textarea>'
    : type === 'select' ? '<select '+attrs+'><option value="">Select execution responsibility</option>'+hint.split('|').map(o => {const [v,t]=o.split(':');return '<option value="'+v+'"'+(value===v?' selected':'')+'>'+t+'</option>';}).join('')+'</select>'
    : '<input '+attrs+' type="'+type+'" maxlength="300" value="'+esc(value)+'" autocomplete="'+({contributorName:'name',email:'email',affiliation:'organization'}[key] || 'off')+'">';
  return '<div class="cw-field"><label for="field-'+key+'">'+esc(label)+'</label>'+control+'<small id="help-'+key+'">'+esc(type==='select'?'Select the responsible environment before describing its requirements.':hint)+'</small>'+(error?'<p class="cw-field-error" id="error-'+key+'">'+esc(error.message)+'</p>':'')+'</div>';
}

function fileList(files, editable = false) {
  if (!files.length) return '<p class="cw-muted">No files attached. An access plan or resource link can be described in the task fields.</p>';
  return '<ul class="cw-files">'+files.map(f => '<li><div><strong>'+esc(f.name)+'</strong><small>'+esc(f.purpose)+' · '+esc(f.visibility==='public'?'Intended for public release':'Reviewers only')+' · '+(f.size/1024).toFixed(1)+' KB</small></div><div class="cw-actions"><button type="button" class="cw-link" data-download="'+esc(f.id)+'">Download</button>'+(editable?'<button type="button" class="cw-link" data-remove="'+esc(f.id)+'">Remove</button>':'')+'</div></li>').join('')+'</ul>';
}

function attachmentPanel() {
  return '<h2>Files & access</h2><p>Attach inputs, protocols or evaluation material. Reviewers can download the actual files. Describe restricted resources and how reviewers can access them in the task fields.</p><div class="cw-upload"><div class="cw-field"><label for="file-purpose">Material type</label><select id="file-purpose"><option value="input">Input data</option><option value="protocol">Task / experimental protocol</option><option value="evaluation">Evaluation / reference material</option><option value="reference">Supporting reference</option></select></div><div class="cw-field"><label for="file-visibility">Intended visibility</label><select id="file-visibility"><option value="reviewers">Reviewers only</option><option value="public">Public after release confirmation</option></select></div><div class="cw-field cw-wide"><label for="file-upload">Attach materials</label><input id="file-upload" type="file" multiple><small>Up to 10 MB per file; 30 MB and 20 files per draft. Attachments are saved in this browser. Public visibility describes intended release, not an upload to the web.</small></div></div>'+fileList(active.attachments,true);
}

function recordContent(record, stage, files, folded = true) {
  return groups.filter(g => !g.stage || stage === 'task').map(g => '<details class="cw-read-group"'+(!folded?' open':'')+'><summary>'+esc(g.title)+'</summary><dl>'+g.fields.map(([key,label]) => '<dt>'+esc(label)+'</dt><dd>'+esc(record.fields[key] || 'Not provided')+'</dd>').join('')+'</dl></details>').join('')+'<details class="cw-read-group" open><summary>Attached materials ('+files.length+')</summary>'+fileList(files)+'</details>';
}

function reviewHistory() {
  if (!active.reviews.length) return '';
  return '<section class="cw-feedback"><h2>Review feedback</h2>'+active.reviews.slice().reverse().map(r => '<article><div><strong>'+esc(r.action.replaceAll('_',' '))+'</strong><small>Revision '+esc(active.revisions.find(v=>v.id===r.revisionId)?.number || '?')+' · '+esc(r.reviewer)+' · '+esc(date(r.reviewedAt))+'</small></div><p>'+esc(r.notes)+'</p></article>').join('')+'</section>';
}

function previewPanel() {
  const stage = stageOf(active);
  const missing = validateFields(active.fields, stage, active.attachments);
  if (active.fields.boardConsent&&!active.fields.boardSummary?.trim()) missing.push({field:'boardSummary',message:'Write a short board summary or turn off sharing.'});
  return '<h2>Preview your '+(stage==='proposal'?'proposal':'complete task')+'</h2><p>'+(missing.length ? missing.length+' items need attention before submission. You can still save a draft.' : 'Your required materials are ready for review. Check the contents and confirm below.')+'</p>'+(missing.length?'<ul class="cw-missing">'+missing.map(e=>'<li><button type="button" class="cw-link" data-field="'+esc(e.field)+'">'+esc(labelFor(e.field))+': '+esc(e.message)+'</button></li>').join('')+'</ul>':'')+recordContent(active,stage,active.attachments)+
    '<label class="cw-check"><input type="checkbox" name="reviewConsent"'+(active.fields.reviewConsent?' checked':'')+'>I agree to provide these materials and my contact details for AISLE task review.</label>'+(taskStage()?'<label class="cw-check"><input type="checkbox" name="rightsConfirmed"'+(active.fields.rightsConfirmed?' checked':'')+'>I have permission to provide these materials and have described their usage and sharing restrictions.</label>':'')+
    '<p class="cw-muted">Submitting creates a fixed revision for reviewers. You can edit again if changes are requested. This local submission does not send data to a server.</p><button type="button" class="cw-button primary" data-submit>Confirm & submit '+(stage==='proposal'?'proposal':'complete task')+'</button>';
}

function assistancePanel() {
  const requests = active.assistance || [];
  return '<details class="cw-assistance"><summary>Need help preparing this task?'+(requests.length?' ('+requests.length+')':'')+'</summary><p>Ask for support with inputs, protocols or evaluation. Continue working in this same draft while a reviewer responds.</p>'+requests.map(r=>'<article><strong>'+esc(r.topic)+'</strong><p>'+esc(r.text)+'</p><small>'+esc(date(r.at))+' · '+(r.reply?'Answered':'Awaiting a response')+'</small>'+(r.reply?'<p class="cw-reply">'+esc(r.reply)+'</p>':isReview?'<label class="cw-field">Reply<textarea data-help-reply="'+r.id+'" rows="3"></textarea></label><button type="button" class="cw-button" data-help-send="'+r.id+'">Save reply</button>':'')+'</article>').join('')+(!isReview?'<div class="cw-field"><label for="help-topic">Topic</label><select id="help-topic"><option>Task idea</option><option>Inputs or lab access</option><option>Protocol and feedback</option><option>Evaluation method</option></select></div><div class="cw-field"><label for="help-text">What do you need help with?</label><textarea id="help-text" rows="3" maxlength="4000"></textarea></div><button type="button" class="cw-button" data-help-request>Save support request</button>':'')+'</details>';
}

function lockedPanel() {
  const latest = active.revisions.at(-1);
  return '<h2>'+esc(statusLabel(active.status))+'</h2><p>'+(active.status==='accepted'?'Scientific and technical review is complete. This task is waiting for integration; it has not been published or connected to experiments.':active.status.endsWith('declined')?'Review is complete. The reason is recorded below; your submission and materials remain available.':'This submitted revision is fixed while reviewers assess it. Review feedback and requests for changes appear below.')+'</p>'+recordContent(latest || active,latest?.stage || stageOf(active),latest?.attachments || active.attachments);
}

function contributorPanel() {
  const editable = canEdit(active);
  let content;
  if (!editable) content = lockedPanel();
  else if (section==='attachments') content = attachmentPanel();
  else if (section==='preview') content = previewPanel();
  else {
    const group = groups.find(g=>g.id===section) || groups[0];
    content = '<h2>'+esc(group.title)+'</h2><p>'+esc(group.intro)+'</p><div class="cw-fields">'+group.fields.map(fieldHTML).join('')+'</div>';
    if (section==='proposal') content += '<details class="cw-board-consent"><summary>Optional: share a short proposal-board summary</summary><p>Only the summary below, research field and status appear on the local board. Contact details, full proposal and attachments stay out of the board.</p><div class="cw-field"><label for="board-summary">Board summary</label><textarea id="board-summary" name="boardSummary" rows="3" maxlength="800">'+esc(active.fields.boardSummary||'')+'</textarea></div><label class="cw-check"><input type="checkbox" name="boardConsent"'+(active.fields.boardConsent?' checked':'')+'>I approve this short summary for the proposal board.</label></details>';
  }
  return '<div class="cw-editor">'+(editable?'<nav class="cw-tabs" aria-label="Submission sections">'+tabs().map(([id,title],i)=>'<button type="button" data-section="'+id+'"'+(id===section?' aria-current="step"':'')+'><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(title)+'</button>').join('')+'</nav>':'')+'<div class="cw-content"><form id="contribution-form" novalidate>'+content+'</form>'+(editable?'<div class="cw-form-footer"><button type="button" class="cw-button" data-save>Save draft</button><span id="cw-save-state">'+(dirty?'Unsaved changes':'Saved on this device')+'</span>'+(section!=='preview'?'<button type="button" class="cw-button" data-next>Continue &rarr;</button>':'')+'</div>':'')+reviewHistory()+assistancePanel()+historyPanel()+'</div></div>';
}

function checksHTML(items,prefix) {
  return items.map(([key,text])=>'<label class="cw-check"><input type="checkbox" data-check="'+prefix+'" value="'+key+'">'+esc(text)+'</label>').join('');
}

function reviewPanel() {
  const revision = active.revisions.at(-1);
  const pending = ['proposal_submitted','task_submitted'].includes(active.status);
  const task = revision?.stage === 'task';
  const approvals = new Set(active.reviews.filter(r=>r.revisionId===revision?.id).map(r=>r.action));
  const ready = approvals.has('domain_approve')&&approvals.has('technical_approve');
  let controls = '';
  if (pending) {
    controls = '<section class="cw-decision"><h2>Record a review</h2><p>Reviewing revision '+esc(revision.number)+'. Decisions apply only to this submitted version.</p><div class="cw-field"><label for="reviewer-name">Reviewer name</label><input id="reviewer-name" autocomplete="name" maxlength="200"></div><div class="cw-field"><label for="review-notes">Review notes / requested changes</label><textarea id="review-notes" rows="4" maxlength="12000" placeholder="Explain your assessment and point to the fields or materials that need revision."></textarea></div>';
    if (!task) controls += '<p>Assess scientific value, overlap with existing proposals and basic feasibility. Approval invites preparation of a complete task.</p><div class="cw-actions"><button class="cw-button primary" data-decision="proposal_approve">Approve proposal direction</button><button class="cw-button" data-decision="proposal_changes">Request proposal changes</button><button class="cw-button" data-decision="proposal_decline">Decline with reason</button></div>';
    else controls += '<div class="cw-review-columns"><div><h3>Scientific review'+(approvals.has('domain_approve')?' · Approved':'')+'</h3>'+checksHTML(scientificChecks,'domain')+'<button class="cw-button" data-decision="domain_approve">Approve scientific review</button></div><div><h3>Execution & technical review'+(approvals.has('technical_approve')?' · Approved':'')+'</h3>'+checksHTML(technicalChecks,'technical')+'<button class="cw-button" data-decision="technical_approve">Approve technical review</button></div></div><div class="cw-actions"><button class="cw-button" data-decision="task_changes">Request changes</button><button class="cw-button" data-decision="task_decline">Decline with reason</button></div><div class="cw-final"><h3>Final acceptance</h3><p>'+(ready?'Both reviews passed for this version. Confirm release intentions and material readiness.':'Complete both reviews for this version before final acceptance.')+'</p>'+checksHTML([['publicScope','Intended sharing scope and any embargo are clear.'],['credit','Contributor credit is confirmed.'],['materialsReady','Required materials are ready for the later integration step.']],'final')+'<button class="cw-button primary" data-decision="task_accept"'+(!ready?' disabled':'')+'>Accept · awaiting integration</button></div>';
    controls += '</section>';
  }
  const selector = active.revisions.length>1?'<label class="cw-revision-choice">Inspect submitted version <select id="review-version">'+active.revisions.map(r=>'<option value="'+r.number+'"'+(r===revision?' selected':'')+'>Revision '+r.number+' · '+esc(r.stage)+' · '+esc(date(r.submittedAt))+'</option>').join('')+'</select></label>':'';
  return '<div class="cw-review-content"><h2>Submission package</h2>'+(!revision?'<p>This draft has not been submitted for review. You may respond to a support request.</p>':selector+'<div id="review-package">'+recordContent(revision,revision.stage,revision.attachments)+'</div>')+controls+reviewHistory()+assistancePanel()+historyPanel()+'</div>';
}

function historyPanel() {
  return '<details class="cw-history"><summary>Submission history · '+active.history.length+' events</summary><ol>'+active.history.slice().reverse().map(h=>'<li><strong>'+esc(h.action.replaceAll('_',' '))+'</strong><small>'+esc(date(h.at))+' · '+esc(h.actor)+'</small>'+(h.notes?'<p>'+esc(h.notes)+'</p>':'')+'</li>').join('')+'</ol></details>';
}

function board() {
  const items = records.map(r=>({record:r,snapshot:r.revisions.at(-1)})).filter(x=>x.record.fields.boardConsent===true&&x.snapshot?.fields.boardConsent&&x.snapshot.fields.boardSummary);
  return '<details class="cw-board"><summary>Proposal board · '+items.length+' shared summaries</summary><p>Browse topics and progress before proposing a similar task. This board uses only explicitly shared summaries in this local workspace.</p>'+items.map(({record:r,snapshot:s})=>'<article><strong>'+esc(s.fields.boardSummary)+'</strong><p>'+esc(s.fields.domain)+' · '+esc(statusLabel(r.status))+'</p></article>').join('')+'<a class="cw-link" href="tasks.html">Browse existing AISLE tasks &rarr;</a></details>';
}

function render() {
  const visible = records.filter(r=>(!isReview || r.revisions.length || r.assistance?.length) && (!search || (r.fields.title+' '+r.fields.domain+' '+r.id).toLowerCase().includes(search)) && (reviewFilter==='all' || reviewFilter==='pending'&&r.status.endsWith('_submitted') || reviewFilter==='accepted'&&r.status==='accepted' || reviewFilter==='support'&&r.assistance?.some(a=>!a.reply)));
  app.innerHTML = '<div id="cw-message" class="cw-message" role="status" aria-live="polite">'+esc(notice)+'</div><div class="cw-workspace"><aside class="cw-sidebar"><div class="cw-sidebar-title"><h2>'+(isReview?'Review queue':'Your submissions')+'</h2>'+(!isReview?'<button type="button" class="cw-button" data-new>+ New proposal</button>':'')+'</div><label class="cw-search">Find a task<input id="cw-search" type="search" value="'+esc(search)+'" placeholder="Title, field or ID"></label>'+(isReview?'<label class="cw-search">Show<select id="cw-filter">'+[['all','All submissions'],['pending','Awaiting review'],['support','Support requests'],['accepted','Accepted']].map(([v,t])=>'<option value="'+v+'"'+(v===reviewFilter?' selected':'')+'>'+t+'</option>').join('')+'</select></label>':'')+'<div class="cw-records">'+visible.map(r=>'<button type="button" data-record="'+r.id+'"'+(active?.id===r.id?' aria-current="true"':'')+'><strong>'+esc(r.fields.title || 'Untitled proposal')+'</strong>'+badge(r)+'<small>'+esc(r.fields.domain || 'Research field not yet provided')+'</small></button>').join('')+(!visible.length?'<p class="cw-muted">'+(isReview?'No submissions match this view. Submit a proposal from the contributor workspace first.':'Start a proposal to describe your scientific task.')+'</p>':'')+'</div>'+board()+'</aside><section class="cw-workarea">'+(active?'<header class="cw-record-header"><div><p class="cw-eyebrow">'+esc(active.id)+' · '+active.revisions.length+' submitted versions</p><h2>'+esc(active.fields.title || 'New scientific proposal')+'</h2>'+badge(active)+'</div><button type="button" class="cw-button" data-export>Export package</button></header>'+(isReview?reviewPanel():contributorPanel()):'<div class="cw-empty"><h2>'+(isReview?'Ready for a closer look.':'Start with a scientific question.')+'</h2><p>'+(isReview?'Select a submission to read its materials and record feedback.':'Describe what an AI scientist should decide, what feedback it receives and how to evaluate the outcome.')+'</p>'+(!isReview?'<button class="cw-button primary" data-new>Create a short proposal</button>':'<a class="cw-link" href="contribute.html">Open contributor workspace &rarr;</a>')+'</div>')+'</section></div>';
  app.setAttribute('aria-busy','false');
  const refresh = document.createElement('button');
  refresh.type='button';refresh.className='cw-link';refresh.dataset.refresh='';refresh.textContent='Refresh local records';
  app.querySelector('.cw-sidebar-title').append(refresh);
  const draft=inputDrafts.get(active?.id);
  if (draft) app.querySelectorAll('input,textarea,select').forEach(input=>{const key=auxKey(input);if(key in draft.values) input.value=draft.values[key];});
}

function syncFields(event) {
  const input = event.target;
  if (!active || !canEdit(active) || !input.name || !input.closest('#contribution-form')) return;
  active.fields[input.name] = input.type==='checkbox' ? input.checked : input.value;
  errors = errors.filter(e=>e.field!==input.name);
  setDirty();
}

async function storeNext(next, files = []) {
  const saved = await saveRecord(next, files);
  active = saved;
  records = await listRecords();
  dirty = false;
}

async function createNew() {
  await persist();
  const next = createSubmission();
  const previous = records[0];
  if (previous) for (const [key] of groups[0].fields) next.fields[key] = previous.fields[key] || '';
  await storeNext(next);
  section='profile'; errors=[]; notice='Draft created. Contributor details are reused from your last local submission.';
  render();
}

async function addFiles(input) {
  if (!active || !canEdit(active)) return;
  const files = [...input.files];
  if (!files.length) return;
  const size = active.attachments.reduce((n,f)=>n+f.size,0)+files.reduce((n,f)=>n+f.size,0);
  if (files.some(f=>f.size>10*1024*1024) || size>30*1024*1024 || active.attachments.length+files.length>20) throw new Error('Use files up to 10 MB each, at most 30 MB and 20 attachments per draft. Describe an access link for larger resources.');
  const purpose=app.querySelector('#file-purpose').value, visibility=app.querySelector('#file-visibility').value;
  if (purpose==='evaluation' && visibility==='public') throw new Error('Keep evaluation references reviewer-only. Describe any public evaluation instructions in the task fields.');
  const blobs=[];
  const next=structuredClone(active);
  for (const file of files) {
    const id=crypto.randomUUID();
    next.attachments.push({id,name:file.name,size:file.size,type:file.type,purpose,visibility});
    blobs.push({id,blob:file});
  }
  await storeNext(next,blobs); notice='Materials saved with this draft.'; render();
}

async function execute(action) {
  if (busy) return;
  busy=true; app.setAttribute('aria-busy','true');
  app.querySelectorAll('button,input,select,textarea').forEach(e=>{if(!e.disabled){e.dataset.busyDisabled='1';e.disabled=true;}});
  try { await action(); }
  catch (error) {
    if (error.errors) errors=error.errors;
    message(error.message || 'This action could not be completed. Your current input is still here.',true);
  } finally {
    busy=false; app.setAttribute('aria-busy','false');
    app.querySelectorAll('[data-busy-disabled]').forEach(e=>{e.disabled=false;delete e.dataset.busyDisabled;});
  }
}

async function clickAction(event) {
  const button=event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-download')) {
    const meta=[...active.attachments,...active.revisions.flatMap(r=>r.attachments)].find(f=>f.id===button.dataset.download);
    const file=await readFile(meta.id);
    if (!file) throw new Error('This file is unavailable in local storage.');
    downloadBlob(file.blob,meta.name); return;
  }
  if (button.hasAttribute('data-new')) { await createNew(); return; }
  if (button.hasAttribute('data-refresh')) {
    await persist();records=await listRecords();
    if (active) active=records.find(r=>r.id===active.id);
    notice='Local submissions refreshed.';render();return;
  }
  if (button.dataset.record) {
    await persist(); active=records.find(r=>r.id===button.dataset.record); section='profile'; errors=[]; notice=''; render(); return;
  }
  if (button.dataset.section || button.hasAttribute('data-next')) {
    await persist();
    const options=tabs();
    section=button.dataset.section || options[Math.min(options.findIndex(([id])=>id===section)+1,options.length-1)][0];
    notice='';render();app.querySelector('.cw-content h2')?.scrollIntoView({block:'nearest'});return;
  }
  if (button.dataset.field) {
    const key=button.dataset.field;
    section=key==='boardSummary'?'proposal':key==='attachments'?'attachments':groups.find(g=>g.fields.some(f=>f[0]===key))?.id || 'preview';
    errors=validateFields(active.fields,stageOf(active),active.attachments);render();
    app.querySelector('[name="'+CSS.escape(key)+'"]')?.focus();return;
  }
  if (button.hasAttribute('data-save')) { await persist();notice='Draft saved on this device.';render();return; }
  if (button.dataset.remove) {
    const next=structuredClone(active);next.attachments=next.attachments.filter(f=>f.id!==button.dataset.remove);
    await storeNext(next);notice='Attachment removed from this draft. Earlier submitted versions are preserved.';render();return;
  }
  if (button.hasAttribute('data-submit')) {
    errors=validateFields(active.fields,stageOf(active),active.attachments);
    if (active.fields.boardConsent&&!active.fields.boardSummary?.trim()) errors.push({field:'boardSummary',message:'Write a short board summary or turn off sharing.'});
    if (errors.length) {render();message('Complete the highlighted requirements before submitting.',true);return;}
    await persist();
    const next=submitRecord(active,active.fields.contributorName);
    await storeNext(next);notice='Submission received locally. Revision '+active.revisions.at(-1).number+' is ready in the review workspace.';render();return;
  }
  if (button.hasAttribute('data-export')) {
    const blob=await exportRecord(active,{unsavedDraft:dirty});
    downloadBlob(blob,'AISLE-submission-'+active.id+'.json');message((dirty?'Package includes your current unsaved draft; it has not been submitted. ':'Package exported with submitted versions and attachments. ')+'It includes reviewer-only material; share it only with intended reviewers.');return;
  }
  if (button.dataset.decision) {
    const action=button.dataset.decision;
    const group=action==='domain_approve'?'domain':action==='technical_approve'?'technical':'final';
    const checks=Object.fromEntries([...app.querySelectorAll('[data-check="'+group+'"]')].map(e=>[e.value,e.checked]));
    const next=reviewRecord(active,{reviewer:app.querySelector('#reviewer-name').value.trim(),notes:app.querySelector('#review-notes').value.trim(),action,checks});
    await storeNext(next);clearAux(['review-notes']);inputDrafts.get(active.id)?.dirty.delete('reviewer-name');notice='Review recorded for this submitted version.';render();return;
  }
  if (button.hasAttribute('data-help-request')) {
    const text=app.querySelector('#help-text').value.trim();
    if (!text) throw new Error('Describe the support you need before saving the request.');
    const next=structuredClone(active);
    next.assistance ||= [];
    next.assistance.push({id:crypto.randomUUID(),topic:app.querySelector('#help-topic').value,text,at:new Date().toISOString()});
    await storeNext(next);clearAux(['help-text','help-topic']);notice='Support request saved. Continue in the same draft; replies appear here.';render();return;
  }
  if (button.dataset.helpSend) {
    const reply=app.querySelector('[data-help-reply="'+button.dataset.helpSend+'"]').value.trim();
    if (!reply) throw new Error('Write a support reply before saving.');
    const next=structuredClone(active), request=next.assistance.find(r=>r.id===button.dataset.helpSend);
    request.reply=reply;request.repliedAt=new Date().toISOString();
    await storeNext(next);clearAux(['reply:'+request.id]);notice='Support reply saved to the original draft.';render();return;
  }
}

if (app) {
  app.addEventListener('submit',event=>event.preventDefault());
  app.addEventListener('input',syncFields);
  app.addEventListener('input',rememberAux);
  app.addEventListener('click',event=>{const button=event.target.closest('button');if(button&&!button.disabled) void execute(()=>clickAction(event));});
  app.addEventListener('change',event=>{
    syncFields(event);
    rememberAux(event);
    if (event.target.id==='file-upload') void execute(()=>addFiles(event.target));
    if (event.target.id==='cw-filter') {reviewFilter=event.target.value;render();}
    if (event.target.id==='cw-search') {search=event.target.value.trim().toLowerCase();render();}
    if (event.target.id==='review-version') {
      const revision=active.revisions.find(r=>r.number===Number(event.target.value));
      app.querySelector('#review-package').innerHTML=recordContent(revision,revision.stage,revision.attachments);
      message('Inspecting revision '+revision.number+'. Review actions always apply to the latest submitted version.');
      const ready=['domain_approve','technical_approve'].every(action=>active.reviews.some(r=>r.revisionId===revision.id&&r.action===action));
      app.querySelectorAll('[data-decision]').forEach(e=>{e.disabled=revision!==active.revisions.at(-1) || e.dataset.decision==='task_accept'&&!ready;});
    }
  });
  window.addEventListener('beforeunload',event=>{if(dirty||[...inputDrafts.values()].some(d=>d.dirty.size)){event.preventDefault();event.returnValue='';}});
  try {records=await listRecords();render();}
  catch(error){app.textContent=error.message;app.setAttribute('aria-busy','false');}
}
