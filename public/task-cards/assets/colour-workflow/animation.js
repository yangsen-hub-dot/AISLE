import * as T from 'three';

const $ = selector => document.querySelector(selector);
const clamp = value => Math.min(1,Math.max(0,value));
function ease(value) {
 const u = clamp(value);
 return u*u*(3-2*u);
}
const blend = (a,b,t) => a+(b-a)*ease(t);
const runOne = [.71,.32,.63,.49];
const stockColours = ['#c1748c','#c5a16e','#6b9da0','#8c7eac'];
const liquidColours = ['#e3dce8','#c591a8','#be9fac','#a2a8ad','#b197b4'].map(colour=>new T.Color(colour));
const observation = '#b197b4';
const start = 2.9, cycle = 1.55, mixed = 10.08, captured = 11.35, returned = 13.45;
const dispenseEnd = start+cycle*4;
const beats = [
 [0,0], [1.6,.88], [3.6,1.85], [6.1,start], [19.3,dispenseEnd],
 [22,mixed], [27,captured], [30.6,returned], [36,15.8]
];
const cards = [
 {title:'Select a candidate',name:'SEARCH',x:38,y:514,line:'M365 556H406Q425 556 425 534V492'},
 {title:'Send formulation 01',name:'HANDOFF',x:1022,y:99,line:'M1022 144H975Q954 144 940 153L926 164'},
 {title:'Add components A–D',name:'DISPENSE',x:1113,y:566,line:'M1113 599H1088Q1068 599 1053 576L1020 520'},
 {title:'Mix the sample',name:'MIX',x:1113,y:566,line:'M1113 599H1088Q1068 599 1053 576L1020 520'},
 {title:'Read the spectrum',name:'MEASUREMENT',x:1394,y:565,line:'M1693 565V544Q1693 528 1667 528H1650'},
 {title:'Return the observed colour',name:'FEEDBACK',x:1153,y:560,line:'M1474 624H1506Q1532 624 1551 646'},
 {title:'Update the next formulation',name:'NEXT RUN',x:38,y:604,line:'M365 644H390Q412 644 412 620V580'}
];

function sceneTime(seconds) {
 const next = beats.findIndex(([at])=>at>seconds);
 if (seconds<=0) return 0;
 if (next<0) return beats.at(-1)[1];
 const [from,begin] = beats[next-1], [to,end] = beats[next];
 return begin+(end-begin)*(seconds-from)/(to-from);
}

function renderLab(lab,t) {
 let x = .22, z = .13, head = .24, fill = 0, scan = 0, active = -1;
 let colour = liquidColours[0].clone(), action = 'Sample well ready';
 lab.drop.visible = false;
 if (t>=start && t<dispenseEnd) {
  active = Math.floor((t-start)/cycle);
  const u = (t-start)/cycle-active;
  const stockZ = lab.stocks[active].position.z;
  const overStock = ease(u/.22)*(1-ease((u-.49)/.22));
  x = .22+(-1.12-.22)*overStock;
  z = .13+(stockZ-.13)*overStock;
  head -= .37*ease((u-.22)/.09)*(1-ease((u-.40)/.09));
  head -= .48*ease((u-.71)/.10)*(1-ease((u-.93)/.07));
  const amount = ease((u-.81)/.12);
  fill = (runOne.slice(0,active).reduce((sum,value)=>sum+value,0)+amount*runOne[active])/2.15;
  colour.copy(liquidColours[active]).lerp(liquidColours[active+1],amount);
  if (u>=.81 && u<.93) {
   lab.drop.visible = true;
   lab.drop.position.y = blend(.704,.548+.064*fill,(u-.81)/.12);
   lab.drop.material.color.set(stockColours[active]);
   lab.drop.scale.set(.82,1.22,.82);
  }
  const component = 'ABCD'[active];
  action = u<.49?'Pick up component '+component:
   u<.81?'Move '+component+' to the sample well':'Dispense component '+component;
 } else if (t>=dispenseEnd) {
  fill = 1;
  colour.copy(liquidColours[4]);
  if (t<mixed) {
   const u = (t-dispenseEnd)/(mixed-dispenseEnd);
   const reach = Math.sin(Math.PI*u);
   head -= .60*reach;
   x += .038*reach*Math.sin(u*Math.PI*5);
   z += .038*reach*Math.cos(u*Math.PI*5);
   action = 'Mix the sample';
  } else {
   x = blend(.22,-1.1,(t-mixed)/.36);
   scan = ease((t-mixed-.2)/.25)*(1-ease((t-captured)/.24));
   action = t<captured?'Scan the mixed sample':'Spectrum → observed colour';
  }
 }
 const h = .005+.059*fill;
 lab.carriage.position.x = x;
 lab.head.position.set(0,head,z+.89);
 lab.zGuide.position.z = z+.89;
 lab.camera.position.x = blend(1.13,.43,(t-mixed-.08)/.52);
 lab.scan.material.opacity = scan*.58;
 lab.scan.scale.setScalar(1+scan*.13*Math.sin(t*11));
 lab.beam.material.opacity = scan*.12;
 lab.sample.scale.y = h/.06;
 lab.sample.position.y = .547+h/2;
 lab.sample.material.color.copy(colour);
 lab.meniscus.position.y = .547+h;
 lab.meniscus.material.color.copy(colour).lerp(new T.Color('#ffffff'),.35);
 return {active,action};
}

export function prepareAnimation({lab,candidates,setOutbound,recipe,draw}) {
 const field = $('.field');
 field.classList.add('is-animated');
 const tokens = document.createElement('div');
 tokens.innerHTML = '<div class="flow-dot"></div><div class="flow-observation"><i></i><b>Obs. 01</b></div>';
 field.append(tokens);
 const purple = $('.flow-dot'), green = $('.flow-observation');
 const recipeCard = $('.recipe'), recipeName = $('.recipe strong'), recipeTag = $('.recipe span');
 const bars = [...document.querySelectorAll('#formulation-chart rect')];
 const receiver = $('.receiver'), first = $('#first-candidate'), next = $('#next-candidate');
 const firstLabel = first.querySelector('text'), current = $('.field-foot span:last-child');
 const callout = document.createElement('aside');
 callout.className = 'action-callout';
 callout.innerHTML = '<div><span></span><b aria-hidden="true">↗</b></div><strong></strong><p></p>';
 field.append(callout);
 const pointer = document.createElementNS('http://www.w3.org/2000/svg','path');
 pointer.setAttribute('class','callout-leader');
 $('.connectors').append(pointer);
 const calloutKicker = callout.querySelector('span'), calloutTitle = callout.querySelector('strong');
 const calloutBody = callout.querySelector('p');
 const comparison = $('.comparison>div:first-child'), sampleChip = comparison.querySelector('i');
 const sampleLabel = comparison.querySelector('span'), returnCaption = $('.return-caption');
 const sampleStep = $('.sample .step');
 sampleStep.innerHTML = '<b>03</b><span>OBSERVE THE COLOUR</span>';
 const measurementName = sampleStep.querySelector('span');
 const spectrum = document.createElement('div');
 spectrum.className = 'spectrum-panel';
 spectrum.innerHTML = `<svg viewBox="0 0 273 171" role="img" aria-label="Schematic spectral measurement">
  <defs><linearGradient id="visible-range"><stop stop-color="#957ac7"/><stop offset=".25" stop-color="#7099d2"/>
  <stop offset=".5" stop-color="#72b69c"/><stop offset=".72" stop-color="#d3b66e"/><stop offset="1" stop-color="#c6848d"/></linearGradient></defs>
  <text x="15" y="21" class="spectrum-title">SCHEMATIC SPECTRUM</text>
  <text x="15" y="41">Relative signal</text>
  <path d="M38 48V123H252 M38 72H252 M38 97H252" class="spectrum-axes"/>
  <rect x="38" y="124" width="214" height="5" rx="2" fill="url(#visible-range)"/>
  <path class="spectrum-trace" d="M38 102C52 96 62 74 83 70S113 78 129 92 148 110 162 97 180 66 195 57 228 60 252 72"/>
  <text x="38" y="146">400</text><text x="136" y="146">550</text><text x="218" y="146">700 nm</text>
  <text x="145" y="163" text-anchor="middle">Wavelength</text></svg>`;
 $('.sample').append(spectrum);
 const trace = spectrum.querySelector('.spectrum-trace');
 const traceLength = trace.getTotalLength();
 trace.style.strokeDasharray = String(traceLength);
 const route = $('#search-outbound'), bench = $('#bench-route'), feedback = $('#feedback-route');
 const operations = [...document.querySelectorAll('.procedure span')];
 let poseTime = null;
 let operationText = '';

 function track(token,path,t,from,to) {
  const shown = t>=from && t<to;
  token.style.opacity = shown?'1':'0';
  if (shown) {
   const p = path.getPointAtLength(ease((t-from)/(to-from))*path.getTotalLength());
   token.style.left = p.x+'px';
   token.style.top = p.y+'px';
  }
 }

 window.renderAt = seconds => {
  const t = sceneTime(seconds);
  const revised = ease((t-returned-.22)/.75);
  const updated = revised>0;
  const hasReading = t>=captured;
  const received = t>=returned;
  const chemistry=document.querySelector('.chemistry-detail');
  if(chemistry) chemistry.style.visibility=t>=1.85&&t<returned?'visible':'hidden';
  setOutbound(updated?candidates.selected:candidates.tested);
  firstLabel.textContent = hasReading?'01 tested':'01 selected';
  first.style.opacity = String(.4+.6*ease(t/.75)-revised*.24);
  next.style.opacity = String(.16+.84*revised);
  next.querySelector('text').style.opacity = String(revised);
  recipeCard.style.opacity = String(.32+.68*ease((t-1.48)/.38));
  recipeName.textContent = updated?'Formulation 02':'Formulation 01';
  recipeTag.textContent = updated?'NEXT RUN ↗':'RUN 01 ↗';
  bars.forEach((bar,i)=>{
   const amount = (runOne[i]+(recipe[i]-runOne[i])*revised)*ease((t-1.45)/.42);
   bar.setAttribute('height',String(amount*31));
   bar.setAttribute('y',String(29-amount*31));
  });
  track(purple,route,t,.88,1.85);
  if (t>=1.85&&t<2.9) track(purple,bench,t,1.92,2.85);
  if (updated) track(purple,route,t,13.73,14.75);
  track(green,feedback,t,captured,returned);
  receiver.classList.toggle('received',received);
  receiver.style.visibility = t<1.85?'hidden':'visible';
  receiver.querySelector('small').textContent = received?'Use observation 01 to select formulation 02.':'Waiting for the observed sample colour.';
  sampleChip.style.background = hasReading?observation:'#eee8f2';
  sampleLabel.textContent = hasReading?'Observation 01':'Awaiting reading';
  measurementName.textContent = t<mixed?'OBSERVE THE COLOUR':'MEASURE THE SPECTRUM';
  const spectrumProgress = ease((t-mixed-.25)/.85);
  spectrum.style.opacity = String(ease((t-mixed-.22)/.20));
  trace.style.strokeDashoffset = String(traceLength*(1-spectrumProgress));
  returnCaption.style.opacity = received?'1':'0';
  const apparatusTime = t<start?0:Math.min(t,captured+.3);
  if (poseTime!==apparatusTime) {
   const {active,action} = renderLab(lab,apparatusTime);
   operationText = action;
   $('.inset-label').textContent = action;
   operations.forEach((operation,i)=>operation.classList.toggle('running',
    i===0&&active>=0&&action.startsWith('Pick') ||
    i===1&&t>=start&&t<mixed&&!action.startsWith('Pick') ||
    i===2&&t>=mixed));
   draw();
   poseTime = apparatusTime;
  }
  let step, explanation;
  if (t<1.85) {step=0;explanation='Choose the volumes of the four components to test.';}
  else if (t<start) {step=1;explanation='Send the A–D volumes to the liquid handler.';}
  else if (t<dispenseEnd) {
   step=2;
   explanation=operationText.startsWith('Pick')?'The pipette draws the volume specified by the formulation.':
    operationText.startsWith('Move')?'The pipette travels from the stock vial to the sample well.':
    'The liquid joins the components already in the well.';
  }
  else if (t<mixed) {step=3;explanation='Combine the four liquids in the same well.';}
  else if (t<captured) {
   step=4;
   explanation=t<mixed+.48?'Scan the mixed sample across visible wavelengths.':'Use the spectrum to derive the observed colour.';
  } else if (!received) {step=5;explanation='Send the observed colour back to the optimiser.';}
  else {step=6;explanation='Use the result to choose candidate 02 and revise A–D volumes.';}
  const card = cards[step], number = String(step+1).padStart(2,'0');
  callout.style.left = card.x+'px';
  callout.style.top = card.y+'px';
  callout.classList.toggle('feedback-callout',step>=5);
  calloutKicker.textContent = number+'  '+card.name;
  calloutTitle.textContent = card.title;
  calloutBody.textContent = explanation;
  pointer.setAttribute('d',card.line);
  current.textContent = 'STEP '+number+' / 07';
 };
 window.renderAt(0);
}
