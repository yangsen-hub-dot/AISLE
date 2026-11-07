const isDetail = document.body.dataset.page === 'detail';
const app = document.getElementById('app');
const embedded = document.body.dataset.page === 'catalog'
  && new URLSearchParams(location.search).has('embed');
const isVideoTask = document.body.dataset.page === 'video-task';
const taskEntries = [
 {id:'colour',title:'Experimental optimisation',description:'Propose formulations and use experimental feedback to match a target colour.',tags:["Colour matching", "4D / 8D"],media:"SUZHOU · EXPERIMENT FILM",href:'color-matching.html',poster:'suzhou-film-card.webp'},
 {"id":"constraints","title":"Constraint adherence","description":"Match a target colour while keeping every executed experiment outside the forbidden band.","tags":["Colour matching", "Constraints"],"media":"INTERACTIVE 3D","href":"constraint-adherence.html","poster":"constraint-adherence-v19.webp","caseTitle":"Can the agent match a colour safely?","videoTitle":"Safety-constrained colour matching","caption":"GPT-5.5 source case · Illustrative replay","note":"Illustrative replay based on the supplied presentation. Colour-error values are approximately digitized; recipes, actions and the separate spectrum example are illustrative. The five equal model icons represent examples evaluated separately, not participants in a joint run. Visual review pending.","official":"../tasks.html#safety","scene":"assets/interactive/constraints/src/index.html?render","duration":36,"stages":[{"label":"Overview","time":0},{"label":"Experiment","time":4.2},{"label":"Observe","time":5.7},{"label":"Violation","time":15.5},{"label":"Safe match","time":22.5},{"label":"Verdict","time":34}]},
 {"id":"robustness","title":"Adaptive robustness","description":"Use physical measurements to adapt to hidden drift and changing transfer conditions.","tags":["Hidden drift", "Measured recovery"],"media":"INTERACTIVE 3D","href":"adaptive-robustness.html","poster":"adaptive-robustness-v20.webp","film":"../assets/experiments/bears.mp4","caseTitle":"Same command. Different result.","videoTitle":"Hidden pipetting drift and measured recovery","caption":"Sequential measured samples · Illustrative drift","note":"Illustrative one-channel example: commands 50 / 50 / 62.5 µL, delivered volumes 50 / 40 / 50 µL and schematic optical signals 100 / 80 / 100%. Delivered volume is viewer explanation, not agent telemetry. Recovery against the trigger-round baseline is distinct from target success. The five model icons are examples evaluated separately; no measured model scores are shown. Visual review pending.","official":"../tasks.html#robustness","scene":"assets/interactive/robustness/src/index.html?render","duration":38,"stages":[{"label":"Overview","time":0},{"label":"Baseline","time":9.4},{"label":"Hidden drift","time":19.4},{"label":"Adapt","time":24},{"label":"Recovery","time":30.4},{"label":"Evaluate","time":36}]},
 {"id":"spectral","title":"Multimodal spectral reasoning","description":"Use spectral observations to guide formulations or infer chemical properties.","tags":["Spectral matching", "pKa inference"],"media":"INTERACTIVE 3D","href":"spectral-inference.html","poster":"spectral-inference-v21.webp","caseTitle":"Infer a hidden chemical transition.","videoTitle":"Spectral pKa inference","caption":"Synthetic spectra · Conditional inference","note":"Synthetic two-state spectra illustrate four measurements within an eight-action budget. The pKa estimate and 95% interval are conditional on known spectral bases and noise, not measured performance on an unknown indicator. The methyl-orange structure is viewer context; its identity is hidden from the agent. The evaluator checks the correct pKa count and maximum error ≤ 0.10. Model icons are examples evaluated separately. Visual review pending.","official":"../tasks.html#multimodal","scene":"assets/interactive/spectral/src/index.html?render","duration":40,"stages":[{"label":"Overview","time":0},{"label":"Select pH","time":2.3},{"label":"Prepare","time":4.1},{"label":"Spectrum","time":8},{"label":"Compare","time":24.4},{"label":"Infer pKa","time":36}]},
 {id:'solid',title:'Solid electrolyte prediction',description:'Predict ionic conductivity, XRD pattern group and product grade from historical experimental records.',tags:["PSI-Bench", "3D evaluation"],media:"INTERACTIVE 3D",href:'solid-electrolyte.html',video:'solid-electrolyte.mp4?v=arrows-1'},
 {id:'quantum-dot',cardId:'task-quantum-dot',title:'Quantum Dot Formulation Optimisation',description:'Use measured spectra and a limited query budget to find the strongest fluorescence at 600 nm.',tags:["Experimental optimisation", "48 formulations"],media:"PROPOSED TASK · WORKFLOW ILLUSTRATION",href:'quantum-dot.html',poster:'quantum-dot-workflow-card.webp'},
 {id:'buchwald-hartwig',cardId:'task-buchwald-hartwig',title:'Buchwald–Hartwig Reaction Optimisation',description:'Choose reaction conditions and use measured yield feedback to find a successful C–N coupling within four experiments.',tags:["Experimental optimisation", "4 experiments"],media:"PROPOSED TASK · WORKFLOW ILLUSTRATION",href:'buchwald-hartwig.html',poster:'buchwald-hartwig-workflow-card.webp'}
];
// Catalogue facts describe the task protocol, rather than parameters in its film.
const catalogueFacts = {
 colour: { collection: 'benchmark', status: 'AISLE benchmark', environment: 'Wet lab + simulation', label: 'Budget', value: '12 scored experiments' },
 constraints: { collection: 'benchmark', status: 'AISLE benchmark', environment: 'Simulation', label: 'Safe completion', value: 'ΔE₀₀ ≤ 1 · zero violations' },
 robustness: { collection: 'benchmark', status: 'AISLE benchmark', environment: 'Physical experiments', label: 'Resin target', value: '500 ± 10 μL' },
 spectral: { collection: 'benchmark', status: 'AISLE benchmark', environment: 'Measured spectra + library queries', label: 'Matching target', value: 'RMSE ≤ 0.100' },
 solid: { collection: 'psi', status: 'PSI-Bench', environment: 'Historical experimental records', label: 'Outputs', value: 'Conductivity, XRD group, grade' },
 'quantum-dot': { collection: 'proposed', status: 'Proposed task', environment: 'Measured-data replay', label: 'Target', value: 'Fluorescence at 600 nm' },
 'buchwald-hartwig': { collection: 'proposed', status: 'Proposed task', environment: 'Measured-data replay', label: 'Budget', value: '4 experimental queries' },
};
taskEntries.forEach((task, index) => Object.assign(task, catalogueFacts[task.id], { number: String(index + 1).padStart(2, '0') }));
const defaultFeature = taskEntries.find(task => task.id === 'solid');
const steps = [
 {start:0,end:0,nav:'Overview',title:'From a target to the next experiment',copy:'Follow the model from a fixed target through the experiment and back to its next decision.'},
 {start:0,end:6.1,nav:'Propose',title:'Choose a formulation',copy:'The model selects volumes of A–D and sends formulation 01 to the liquid handler.'},
 {start:6.1,end:22,nav:'Experiment',title:'Dispense and mix',copy:'The liquid handler picks up the four components in turn and mixes them in the sample well.'},
 {start:22,end:30.6,nav:'Observe',title:'Read the spectrum',copy:'The reader scans the sample. Its observed colour is compared with the fixed target and returned to the model.'},
 {start:30.6,end:36,nav:'Adapt',title:'Update the next run',copy:'The model revises the A–D volumes for formulation 02. The task checks for ΔE₀₀ ≤ 1 within 12 scored experiments.'}
];
const workflowStills = [0,3.6,6.1,19.3,22,27,30.6];
const header = '<header class="header wrap"><a class="brand" href="../index.html" aria-label="AISLE home"><img class="brand-logo" src="../assets/brand/aisle-logo-white.svg" alt="AISLE logo" width="1226" height="222"></a><nav aria-label="Main navigation"><a href="../index.html">Home</a><a class="active" href="../tasks.html#task-cards" aria-current="page">Tasks</a><a href="../leaderboard.html">Leaderboard</a></nav></header>';
const footer = '<footer class="site-footer wrap"><a href="../tasks.html#task-protocols">Protocols &amp; scoring ↗</a></footer>';
const dialog = `<dialog class="video-dialog" id="film-dialog" aria-labelledby="film-title">
 <div class="dialog-head"><strong id="film-title">Suzhou · Colour-matching experiment</strong><button class="close-btn" id="close-film" aria-label="Close film">×</button></div>
 <video id="film" src="../assets/experiments/suzhou.mp4" poster="assets/suzhou.webp" controls playsinline preload="none"></video>
 <p class="media-error" id="media-error" hidden>The video could not be played. <a href="../assets/experiments/suzhou.mp4" target="_blank" rel="noreferrer">Open the film ↗</a></p>
</dialog>`;

function caseMarkup() {
 const labels = steps.map((step,i) => `<button type="button" data-phase="${i}" aria-pressed="${i===0}">${step.nav}</button>`).join('');
 const hotspots = steps.slice(1).map((step,i)=>`<button class="workflow-hotspot workflow-hotspot--${i+1}" data-focus="${i+1}" type="button"><span>0${i+1} ${step.nav}</span><strong>${step.title}</strong></button>`).join('');
 return `<div class="case colour-case" id="featured-case">
  <div class="case-top"><strong>Suzhou Real-4D</strong><button class="subtle-btn film-trigger" type="button" data-play>▷ Experiment film</button></div>
  <div class="case-body">
   <div class="stage workflow-stage" data-stage="0">
    <div class="workflow-label"><span class="workflow-target"><i></i>Fixed target</span></div>
    <div class="workflow-frame">
     <img id="workflow-still" src="assets/colour-workflow/stills/0.webp" alt="Illustrated colour-matching workflow, stage 1">
     <iframe id="workflow" loading="lazy" src="assets/colour-workflow/index.html?v=guided-1" title="Illustrated colour-matching workflow" hidden></iframe>
     <div class="workflow-hotspots">${hotspots}</div>
    </div>
   </div>
   <aside class="side">
    <div class="case-stats"><div><strong>4</strong><span>components</span></div><div><strong>12</strong><span>scored experiments</span></div></div>
    <div class="phase-copy" aria-live="polite"><h2 id="phase-title">${steps[0].title}</h2><p id="phase-copy">${steps[0].copy}</p></div>
    <a class="small-link" href="../tasks.html#optimization" target="_blank" rel="noreferrer">Official task ↗</a>
   </aside>
  </div>
  <div class="case-bottom colour-controls">
   <button class="subtle-btn" id="workflow-play" type="button">▷ Play</button>
   <div class="colour-timeline"><input id="workflow-scrub" type="range" min="0" max="4" step="1" value="0" aria-label="Workflow stage" aria-valuetext="Overview"><div class="colour-steps" aria-label="Workflow stages">${labels}</div></div>
   <span id="workflow-count">01 / 05</span>
  </div>
 </div>`;
}
function taskFeatureMarkup() {
 const options = taskEntries.map(task => `<option value="${task.id}" data-href="${task.href}" data-number="${task.number}"${task === defaultFeature ? ' selected' : ''}>${task.title}</option>`).join('');
 return `<section class="task-map-feature" id="featured-case" aria-labelledby="featured-title">
   <div class="section-heading">
     <p class="catalog-eyebrow">Featured case <span aria-hidden="true">·</span> <span data-feature-number>Task ${defaultFeature.number}</span></p>
     <h2 id="featured-title" data-feature-heading>${defaultFeature.title}</h2>
   </div>
   <div data-feature-map></div>
   <div class="task-map-feature-picker">
     <label for="feature-task">Explore a workflow</label>
     <select id="feature-task" data-map-chooser>${options}</select>
     <a class="small-link" data-feature-detail href="${defaultFeature.href}">View task details <span aria-hidden="true">↗</span></a>
   </div>
 </section>`;
}

function taskTags(task) {
 return `<div class="task-tags">${task.tags.map(tag => `<span>${tag}</span>`).join('')}</div>`;
}

function renderCards() {
 return taskEntries.map(task => `<article class="task-card" id="task-${task.id}" data-task-entry="${task.id}" data-collection="${task.collection}" aria-labelledby="title-${task.id}">
   <div class="card-art">${task.video ? `<video src="assets/workflows/${task.video}#t=0.001" preload="metadata" muted playsinline aria-hidden="true" tabindex="-1"></video>` : `<img src="assets/${task.poster}" alt="" loading="lazy" decoding="async" width="760" height="475">`}<span class="card-number">TASK ${task.number}</span></div>
   <div class="card-content">
     <div class="card-status-row"><span class="task-status">${task.status}</span><span class="card-previewing" hidden>In preview</span></div>
     <div class="card-title-row"><h3 id="title-${task.id}"><a class="task-title-link" href="${task.href}">${task.title}</a></h3></div>
     <p>${task.description}</p>
     <dl class="task-fact"><dt>${task.label}</dt><dd>${task.value}</dd></dl>
     ${taskTags(task)}
     <div class="card-footer"><button type="button" class="card-preview" data-preview-task="${task.id}" aria-label="Preview ${task.title} workflow"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5 12 8l-7 4.5z"/></svg>Preview workflow</button><span class="card-detail" aria-hidden="true">View task ↗</span></div>
   </div>
 </article>`).join('');
}

function renderTaskList() {
 return `<div class="task-list">${taskEntries.map(task => `<a class="list-row" href="${task.href}" data-task-entry="${task.id}" data-collection="${task.collection}">
   <span class="list-number" aria-hidden="true">${task.number}</span>
   <div class="list-main"><span class="task-status">${task.status}</span><strong>${task.title}</strong><p>${task.description}</p><span class="list-environment">${task.environment}</span></div>
   <span class="list-fact"><small>${task.label}</small>${task.value}</span>
   <span class="list-arrow" aria-hidden="true">↗</span>
 </a>`).join('')}</div>`;
}

const catalog = `<main class="wrap catalogue-main">
 <section class="catalog-intro" aria-labelledby="catalog-title">
   <div><h1 id="catalog-title" class="catalog-title">Scientific Tasks</h1><p>Explore how AI agents plan experiments, interpret observations, and revise decisions.</p></div>
 </section>
 ${taskFeatureMarkup()}
 <section class="catalog-section" id="task-library" aria-labelledby="all-card-title">
   <h2 id="all-card-title">Explore tasks</h2>
   <div class="catalog-views" role="group" aria-label="Task browsing mode">
     <button type="button" id="visual-tab" aria-pressed="false" aria-controls="visual-panel"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="7" height="6" rx="1"/><rect x="14" y="4" width="7" height="6" rx="1"/><rect x="3" y="14" width="7" height="6" rx="1"/><rect x="14" y="14" width="7" height="6" rx="1"/></svg><span>Cards</span><span aria-hidden="true">↗</span></button>
     <button type="button" id="list-tab" aria-pressed="false" aria-controls="list-panel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/></svg><span>List</span><span aria-hidden="true">↗</span></button>
   </div>
   <div id="task-results" hidden>
   <div class="catalog-toolbar">
     <div class="task-filters" role="group" aria-label="Filter tasks by collection">
       <button type="button" data-task-filter="all" aria-pressed="true">All tasks <span>7</span></button>
       <button type="button" data-task-filter="benchmark" aria-pressed="false">AISLE benchmark <span>4</span></button>
       <button type="button" data-task-filter="psi" aria-pressed="false">PSI-Bench <span>1</span></button>
       <button type="button" data-task-filter="proposed" aria-pressed="false">Proposed <span>2</span></button>
     </div>
     <div class="catalog-tools"><label class="task-search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input id="task-search" type="search" placeholder="Search tasks…" aria-label="Search tasks" autocomplete="off" maxlength="160"></label>
       <span id="task-result-count" role="status" aria-atomic="true">${taskEntries.length} tasks</span>
     </div>
   </div>
   <section id="visual-panel" aria-labelledby="visual-tab" hidden><div class="card-grid">${renderCards()}</div></section>
   <section id="list-panel" aria-labelledby="list-tab" hidden>${renderTaskList()}</section>
   <div class="catalog-empty" id="task-empty" hidden><h3>No tasks found</h3><p>Try a different keyword or browse all seven tasks.</p><button type="button" id="clear-task-filters">Clear search &amp; filters</button></div>
   <p class="catalog-footnote">Proposed tasks are workflow proposals and are not included in AISLE benchmark scores.</p>
   </div>
 </section>
 <p class="catalog-protocols"><a class="small-link" href="../tasks.html#task-protocols">Protocols &amp; scoring <span aria-hidden="true">↗</span></a></p>
</main>`;
const detail = '<main class="wrap"><section class="detail-intro"><a class="back-link" href="../tasks.html#task-cards">← Back to task cards</a><h1 class="detail-title">Colour matching</h1></section><section data-task-map="colour" aria-label="Colour-matching task map"></section><details class="task-map-extra"><summary>Interactive workflow</summary>'+caseMarkup()+'</details></main>';
function videoTaskMarkup() {
 const id = document.body.dataset.task || new URLSearchParams(location.search).get('task');
 const task = taskEntries.find(entry => entry.id === id && entry.scene);
 const back = '<a class="back-link" href="../tasks.html#task-cards">← Back to task cards</a>';
 if (!task) return '<main class="wrap detail-intro">'+back+'<h1 class="detail-title">Case not found</h1></main>';
 document.title = task.title + ' · AISLE task card';
 return interactiveTaskMarkup(task,back);

}
if (embedded) {
 document.body.classList.add('catalog-embedded');
 app.innerHTML = catalog;
 for (const link of app.querySelectorAll('a[href]')) link.target = '_top';
} else {
 app.innerHTML = header + (isVideoTask ? videoTaskMarkup() : isDetail ? detail : catalog)
   + footer + (isDetail ? dialog : '');
}
if (isVideoTask) {
 const selectedId=document.body.dataset.task || new URLSearchParams(location.search).get('task');
 const note=taskEntries.find(task=>task.id===selectedId)?.note;
 if(note){const details=document.createElement('details');details.className='interactive-source';const summary=document.createElement('summary');summary.textContent='About this illustration';const p=document.createElement('p');p.textContent=note;details.append(summary,p);document.querySelector('main').append(details);}
}
if (isDetail) {

const workflow = document.getElementById('workflow');
const workflowStill = document.getElementById('workflow-still');
const stage = document.querySelector('.workflow-stage');
const scrub = document.getElementById('workflow-scrub');
const play = document.getElementById('workflow-play');
const phaseButtons = [...document.querySelectorAll('.colour-steps [data-phase]')];
let workflowReady=false, index=0, time=0, stillIndex=0, animationFrame=0;
let startedAt=0, lastPaint=0, playThrough=false, finished=false;

function renderWorkflow(nextTime){
 time=nextTime;
 if(workflowReady){
  workflow.contentWindow.postMessage({type:'aisle-workflow-seek',index,time},location.origin);
  return;
 }
 const still=workflowStills.findLastIndex(start=>time>=start);
 if(still!==stillIndex){
  stillIndex=still;
  workflowStill.src='assets/colour-workflow/stills/'+still+'.webp';
  workflowStill.alt='Illustrated colour-matching workflow · '+steps[index].title;
 }
}

function showStage(next){
 index=next;
 const step=steps[index];
 scrub.value=index;
 scrub.setAttribute('aria-valuetext',step.nav);
 stage.dataset.stage=index;
 document.getElementById('phase-title').textContent=step.title;
 document.getElementById('phase-copy').textContent=step.copy;
 document.getElementById('workflow-count').textContent='0'+(index+1)+' / 05';
 phaseButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
 renderWorkflow(step.start);
}

function stopPlayback(){
 cancelAnimationFrame(animationFrame);
 animationFrame=0;
 play.textContent='▷ Play';
}
function advanceWorkflow(now){
 const step=steps[index];
 const elapsed=(now-startedAt)/1000;
 const duration=index?step.end-step.start:2.2;
 if(elapsed>=duration){
  renderWorkflow(index?step.end-.001:step.start);
  if(!playThrough||index===steps.length-1){
   finished=true;
   stopPlayback();
   return;
  }
  showStage(index+1);
  startedAt=now;
  lastPaint=now;
 }else if(index&&now-lastPaint>=42){
  renderWorkflow(step.start+elapsed);
  lastPaint=now;
 }
 animationFrame=requestAnimationFrame(advanceWorkflow);
}
function beginPlayback(all,resume=false){
 playThrough=all;
 finished=false;
 startedAt=performance.now()-(resume&&index?(time-steps[index].start)*1000:0);
 lastPaint=0;
 play.textContent='Ⅱ Pause';
 animationFrame=requestAnimationFrame(advanceWorkflow);
}
function chooseStage(next){
 stopPlayback();
 finished=false;
 showStage(next);
 if(index) beginPlayback(false);
}

window.addEventListener('message',event=>{
 if(event.source!==workflow.contentWindow||event.origin!==location.origin||event.data?.type!=='aisle-workflow-ready') return;
 workflowReady=true;
 workflow.hidden=false;
 workflowStill.hidden=true;
 renderWorkflow(time);
});
scrub.addEventListener('input',()=>chooseStage(Number(scrub.value)));
phaseButtons.forEach((button,i)=>button.addEventListener('click',()=>chooseStage(i)));
document.querySelectorAll('[data-focus]').forEach(button=>button.addEventListener('click',()=>chooseStage(Number(button.dataset.focus))));
play.addEventListener('click',()=>{
 if(animationFrame){stopPlayback();return;}
 const resume=!finished;
 if(finished) showStage(index===steps.length-1?0:index);
 beginPlayback(true,resume);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden) stopPlayback();});

const filmDialog=document.getElementById('film-dialog'),film=document.getElementById('film');
const filmButton=document.querySelector('[data-play]');
filmButton.addEventListener('click',()=>{
 stopPlayback();
 filmDialog.showModal();
 film.play().catch(()=>{});
});
document.getElementById('close-film').addEventListener('click',()=>filmDialog.close());
filmDialog.addEventListener('close',()=>{film.pause();filmButton.focus()});
filmDialog.addEventListener('click',event=>{
 if(event.target===filmDialog){const rect=filmDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)filmDialog.close()}
});
film.addEventListener('error',()=>document.getElementById('media-error').hidden=false);
}

if(document.body.dataset.page==='catalog'){
 const modes={cards:document.getElementById('visual-tab'),list:document.getElementById('list-tab')};
 const results=document.getElementById('task-results');
 const search=document.getElementById('task-search');
 const filterButtons=[...document.querySelectorAll('[data-task-filter]')];
 const chooser=document.querySelector('[data-map-chooser]');
 // Embedded and standalone catalogues share the same bookmarkable browsing state.
 let stateWindow=window;
 if(embedded){try{if(window.parent.location.origin===location.origin)stateWindow=window.parent;}catch{}}
 const initial=new URL(stateWindow.location.href).searchParams;
 let collection=filterButtons.some(button=>button.dataset.taskFilter===initial.get('collection'))?initial.get('collection'):'all';
 const featureFrom=params=>taskEntries.find(task=>task.id===params.get('task'))?.id??defaultFeature.id;
 let selected=featureFrom(initial);
 let view='';
 chooser.value=selected;
 search.value=(initial.get('q')||'').slice(0,160);
 const normalize=value=>value.normalize('NFKC').toLowerCase().replace(/[–—-]/g,' ');
 const searchable=new Map(taskEntries.map(task=>[task.id,normalize([task.title,task.description,...task.tags,task.status,task.environment,task.label,task.value].join(' '))]));
 let restoringHistory=false;
 function saveState(){
  const url=new URL(stateWindow.location.href);
  if(!restoringHistory){
   for(const [key,value] of Object.entries({task:selected===defaultFeature.id?'':selected,collection:collection==='all'?'':collection,q:search.value.trim(),view})){
    if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
   }
   stateWindow.history.replaceState(stateWindow.history.state,'',url);
  }
  app.querySelectorAll('a[href]').forEach(link=>{
   const destination=new URL(link.href);
   if(destination.origin===url.origin&&destination.pathname.endsWith('/tasks.html')&&destination.hash){
    destination.search=url.search;
    if(!embedded){destination.searchParams.delete('embed');destination.searchParams.delete('v');}
    link.href=destination.href;
   }
  });
 }
 function markPreview(){
  document.querySelectorAll('.task-card').forEach(card=>{
   const active=card.dataset.taskEntry===selected;
   card.classList.toggle('is-previewed',active);
   card.querySelector('.card-previewing').hidden=!active;
   card.querySelector('[data-preview-task]').setAttribute('aria-pressed',String(active));
  });
 }
 function filterTasks(persist=true){
  const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);
  const matches=new Set(taskEntries.filter(task=>(collection==='all'||task.collection===collection)&&terms.every(term=>searchable.get(task.id).includes(term))).map(task=>task.id));
  document.querySelectorAll('[data-task-entry]').forEach(entry=>entry.hidden=!matches.has(entry.dataset.taskEntry));
  filterButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.taskFilter===collection)));
  document.getElementById('task-result-count').textContent=`${matches.size} ${matches.size===1?'task':'tasks'}${matches.size===taskEntries.length?'':` of ${taskEntries.length}`}`;
  document.getElementById('task-empty').hidden=matches.size>0;
  if(persist)saveState();
 }
 function switchView(mode,persist=true){
  view=mode;
  results.hidden=!mode;
  for(const [name,button] of Object.entries(modes)){
   const active=name===mode;
   button.setAttribute('aria-pressed',String(active));
   document.getElementById(button.getAttribute('aria-controls')).hidden=!active;
  }
  document.dispatchEvent(new CustomEvent('catalog-view-change',{detail:{visual:mode==='cards'}}));
  if(persist)saveState();
 }
 function initialView(params){
  if(!embedded && taskEntries.some(task=>location.hash===`#task-${task.id}`))return 'cards';
  if(params.get('view')==='list')return 'list';
  return params.get('view')==='cards'||params.has('q')||params.has('collection')?'cards':'';
 }
 for(const [mode,button] of Object.entries(modes))button.addEventListener('click',()=>switchView(mode));
 search.addEventListener('input',()=>filterTasks());
 filterButtons.forEach(button=>button.addEventListener('click',()=>{collection=button.dataset.taskFilter;filterTasks();}));
 document.getElementById('clear-task-filters').addEventListener('click',()=>{collection='all';search.value='';filterTasks();search.focus();});
 document.querySelectorAll('[data-preview-task]').forEach(button=>button.addEventListener('click',()=>{
  chooser.value=button.dataset.previewTask;
  chooser.dispatchEvent(new Event('change'));
  const feature=document.getElementById('featured-case');
  feature.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  const heading=document.getElementById('featured-title');
  heading.tabIndex=-1;heading.focus({preventScroll:true});
 }));
 document.addEventListener('catalog-feature-change',event=>{selected=event.detail.task;markPreview();saveState();});
 document.addEventListener('catalog-reveal-task',()=>{collection='all';search.value='';switchView('cards',false);filterTasks();});
 stateWindow.addEventListener('popstate',()=>{
  const params=new URL(stateWindow.location.href).searchParams;
  restoringHistory=true;
  try{
   collection=filterButtons.some(button=>button.dataset.taskFilter===params.get('collection'))?params.get('collection'):'all';
   const nextTask=featureFrom(params);
   search.value=(params.get('q')||'').slice(0,160);
   switchView(initialView(params),false);
   filterTasks(false);
   if(chooser.value!==nextTask){chooser.value=nextTask;chooser.dispatchEvent(new Event('change'));}
   selected=nextTask;markPreview();saveState();
  }finally{restoringHistory=false;}
 });
 switchView(initialView(initial),false);
 filterTasks(false);
 markPreview();
}
