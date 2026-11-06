/* Run without a browser or preview: exercises the real DOM controller and IndexedDB repository.
   npm install --prefix .qa --no-save --ignore-scripts jsdom fake-indexeddb */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
const require=createRequire(new URL('../.qa/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const {indexedDB}=require('fake-indexeddb');
const root=new URL('../',import.meta.url);
const source=await fs.readFile(new URL('src/scripts/contribution.js',root),'utf8');
const urls={};
for(const name of ['contribution-model','contribution-fields','contribution-store']) {
  urls[name]='data:text/javascript;base64,'+Buffer.from(await fs.readFile(new URL('src/scripts/'+name+'.js',root),'utf8')).toString('base64');
}
let dom, sequence=0;
async function mount(mode) {
  dom?.window.close();
  dom=new JSDOM('<main id="contribution-app" data-mode="'+mode+'"></main>',{url:'http://127.0.0.1:4173/'+mode+'.html'});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,indexedDB,CSS:{escape:s=>s},FileReader:class {
    async readAsDataURL(blob){try{this.result='data:'+blob.type+';base64,'+Buffer.from(await blob.arrayBuffer()).toString('base64');this.onload();}catch(e){this.onerror(e);}}
  }});
  Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
  dom.window.HTMLElement.prototype.scrollIntoView=function(){};
  dom.window.HTMLAnchorElement.prototype.click=function(){};
  let code=source;
  for(const [name,url] of Object.entries(urls)) code=code.replace('./'+name+'.js?v=__ASSET_VERSION__',url);
  await import('data:text/javascript;base64,'+Buffer.from(code+'\n// mount '+(++sequence)).toString('base64'));
  assert.equal(document.querySelector('#contribution-app').getAttribute('aria-busy'),'false');
}
async function settle() {
  for(let i=0;i<100&&document.querySelector('#contribution-app').getAttribute('aria-busy')==='true';i++) await new Promise(r=>setTimeout(r,5));
  assert.equal(document.querySelector('#contribution-app').getAttribute('aria-busy'),'false','UI action did not settle');
}
async function click(selector) {
  const button=document.querySelector(selector);assert(button,'Missing control '+selector);assert(!button.disabled,'Disabled control '+selector);button.click();await settle();
}
function input(name,value) {
  const field=name.startsWith('#')||name.startsWith('[')?document.querySelector(name):document.querySelector('[name="'+name+'"]');
  assert(field,'Missing field '+name);
  if(field.type==='checkbox') field.checked=value;else field.value=value;
  field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
}
const store=await import(urls['contribution-store']);
const model=await import(urls['contribution-model']);
const proposal={contributorName:'A. Researcher',email:'author@example.org',affiliation:'Independent researcher',expertise:'Materials science',title:'Feedback-driven formulation',domain:'Chemistry',summary:'<img src=x onerror=alert(1)> Scientific task',scientificValue:'Test scientific decisions',aiDecisions:'Choose next condition',feedback:'Measured observations',evaluationIdea:'Threshold and process quality',resources:'Accessible input data and laboratory protocol',boardSummary:'A formulation decision task',boardConsent:true};
const taskFields={taskInstructions:'Choose experiment conditions from available actions.',initialInputs:'See attached inputs and protocol.',allowedActions:'Choose next formulation',feedbackRules:'Return measured value after each action',stoppingRules:'Five rounds or the published threshold',executionMode:'self',executionRequirements:'A documented simulator',outputRequirements:'Result plus decision history',evaluationRules:'Published metric; missing is not zero',referenceNotes:'Clear evaluation rules without a unique answer',materialSources:'Self-authored inputs',licence:'CC BY 4.0 for inputs',publicSummary:'A scientific formulation task',visibilityNotes:'Inputs public; reference evaluation private',credit:'A. Researcher'};

await mount('contributor');
await click('[data-new]');
for(const key of ['contributorName','email','affiliation','expertise']) input(key,proposal[key]);
await click('[data-section="proposal"]');
for(const [key,value] of Object.entries(proposal).filter(([k])=>!['contributorName','email','affiliation','expertise'].includes(k))) input(key,value);
await click('[data-section="preview"]');
await click('[data-submit]');
assert.match(document.querySelector('#cw-message').textContent,/Complete/);
assert.equal((await store.listRecords())[0].revisions.length,0);
input('reviewConsent',true);
await click('[data-submit]');
let record=(await store.listRecords())[0];
assert.equal(record.status,'proposal_submitted');assert.equal(record.revisions.length,1);
assert.equal(document.querySelectorAll('.cw-content img').length,0,'User HTML was interpreted');
assert(!document.querySelector('.cw-board').textContent.includes('author@example.org'));
const id=record.id;

await mount('review');await click('[data-record="'+id+'"]');
input('#reviewer-name','Reviewer One');input('#review-notes','Please clarify the resource access.');
await click('[data-refresh]');
assert.equal(document.querySelector('#review-notes').value,'Please clarify the resource access.');
await click('[data-decision="proposal_changes"]');
assert.equal((await store.listRecords())[0].status,'proposal_changes');
await mount('contributor');await click('[data-record="'+id+'"]');
assert.match(document.querySelector('.cw-feedback').textContent,/clarify/);
input('#help-text','Help checking the evaluation method');await click('[data-help-request]');
await click('[data-section="proposal"]');input('resources','Input data and protocol supplied by the author.');
await click('[data-section="preview"]');await click('[data-submit]');
await mount('review');await click('[data-record="'+id+'"]');
const request=(await store.listRecords())[0].assistance[0];
input('[data-help-reply="'+request.id+'"]','Define a threshold before evaluation.');await click('[data-help-send="'+request.id+'"]');
input('#reviewer-name','Reviewer One');await click('[data-decision="proposal_approve"]');
record=(await store.listRecords())[0];assert.equal(record.status,'task_draft');assert.equal(record.revisions.length,2);

await mount('contributor');await click('[data-record="'+id+'"]');
assert.match(document.querySelector('.cw-assistance').textContent,/Define a threshold/);
await click('[data-section="proposal"]');input('boardConsent',false);await click('[data-save]');
assert.match(document.querySelector('.cw-board').textContent,/0 shared summaries/);
const fieldsModule=await import(urls['contribution-fields']);
for(const group of fieldsModule.groups.filter(g=>g.stage)) {
  await click('[data-section="'+group.id+'"]');
  for(const [key] of group.fields) if(key in taskFields) input(key,taskFields[key]);
}
await click('[data-section="attachments"]');
const upload=document.querySelector('#file-upload');
const file=new Blob(['initial,value\na,1\n'],{type:'text/csv'});Object.defineProperty(file,'name',{value:'inputs.csv'});
Object.defineProperty(upload,'files',{value:[file]});upload.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await settle();
record=(await store.listRecords())[0];assert.equal(record.attachments.length,1);
assert.equal(await (await store.readFile(record.attachments[0].id)).blob.text(),'initial,value\na,1\n');
await click('[data-section="preview"]');input('rightsConfirmed',true);await click('[data-submit]');
record=(await store.listRecords())[0];assert.equal(record.status,'task_submitted');assert.equal(record.revisions.length,3);
await mount('review');await click('[data-record="'+id+'"]');
assert(document.querySelector('[data-decision="task_accept"]').disabled);
input('#reviewer-name','Science reviewer');input('#review-notes','Science is sound.');
await click('[data-decision="domain_approve"]');assert.match(document.querySelector('#cw-message').textContent,/Confirm/i);
document.querySelectorAll('[data-check="domain"]').forEach(e=>e.checked=true);
await click('[data-decision="domain_approve"]');
assert(document.querySelector('[data-decision="task_accept"]').disabled);
input('#reviewer-name','Technical reviewer');input('#review-notes','Please clarify the feedback units.');
await click('[data-decision="task_changes"]');
await mount('contributor');await click('[data-record="'+id+'"]');
await click('[data-section="execution"]');input('feedbackRules','Return concentration in mol/L and uncertainty after each action.');
await click('[data-section="preview"]');await click('[data-submit]');
record=(await store.listRecords())[0];assert.equal(record.revisions.length,4);
assert.equal(record.revisions[2].fields.feedbackRules,taskFields.feedbackRules);
await mount('review');await click('[data-record="'+id+'"]');
assert(document.querySelector('[data-decision="task_accept"]').disabled,'Old approval should not carry forward');
for(const [kind,name] of [['domain','Science reviewer'],['technical','Technical reviewer']]) {
  input('#reviewer-name',name);input('#review-notes','Checked the revised package.');
  document.querySelectorAll('[data-check="'+kind+'"]').forEach(e=>e.checked=true);
  await click('[data-decision="'+kind+'_approve"]');
}
assert(!document.querySelector('[data-decision="task_accept"]').disabled);
input('#reviewer-name','Review coordinator');input('#review-notes','Ready for later integration.');
document.querySelectorAll('[data-check="final"]').forEach(e=>e.checked=true);
await click('[data-decision="task_accept"]');
record=(await store.listRecords())[0];assert.equal(record.status,'accepted');
assert(!model.canEdit(record));
await mount('contributor');await click('[data-record="'+id+'"]');
assert.match(document.querySelector('.cw-content').textContent,/waiting for integration/);
assert.equal(document.querySelector('[data-submit]'),null);
const exported=JSON.parse(await (await store.exportRecord(record)).text());
assert.equal(exported.record.revisions.length,4);assert.equal(exported.files.length,1);
assert.equal(Buffer.from(exported.files[0].dataUrl.split(',')[1],'base64').toString(),'initial,value\na,1\n');
const stale=structuredClone(record);
await store.saveRecord(record);
await assert.rejects(()=>store.saveRecord(stale),/another tab/);
const unsavedPackage=JSON.parse(await (await store.exportRecord(stale,{unsavedDraft:true})).text());
assert.equal(unsavedPackage.unsavedDraft,true);
dom.window.close();
console.log('PASS: actual UI + IndexedDB proposal, changes, help, materials, revisions, dual review, acceptance, export and stale-save protection.');
