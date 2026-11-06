import * as T from 'three';
import {RoomEnvironment} from '../colour-scene/RoomEnvironment.js';
import {createLab} from './lab.js';
import {dark,steel,edge,gold,blue,box,material} from './geometry.js';
import {drawSearchSurface} from './search-surface.js';
import {prepareAnimation} from './animation.js';
await document.fonts.ready;
const artboard=document.getElementById('artboard');
const viewport=document.getElementById('scene-viewport');
function resizeArtboard(){
 viewport.style.transform='scale('+innerWidth/1920+','+innerHeight/1200+')';
}
window.addEventListener('resize',resizeArtboard);
resizeArtboard();
const others=[['claude','Claude'],['gemini','Gemini'],['openai','GPT'],['deepseek','DeepSeek'],['qwen','Qwen'],['kimi','Kimi'],['glm','GLM']];
document.getElementById('alternatives').innerHTML=others.map(([icon,name])=>'<span class="agent-option" title="'+name+'"><img src="icons/'+icon+'.svg" alt="'+name+'"></span>').join('');
const recipe = [.43,.65,.39,.72];
const componentColours = ['#a986b1','#b783a3','#7f9db6','#ad9679'];
const bars = recipe.map((amount,i)=>{
 const x=14+i*69, height=amount*31;
 return `<rect x="${x}" y="${29-height}" width="26" height="${height}" rx="3" fill="${componentColours[i]}"/>
 <text x="${x+13}" y="45" text-anchor="middle" font-size="12" font-weight="700" fill="#624c71">${'ABCD'[i]}</text>`;
});
document.getElementById('formulation-chart').innerHTML='<svg viewBox="0 0 280 49" role="img" aria-label="Illustrative relative component volumes for formulation 02"><path d="M0 29H280" stroke="#e9dfef"/>'+bars.join('')+'</svg>';
const candidates = drawSearchSurface();
function setOutbound(point) {
 const x = 38+point.x+8, y = 33+275+point.y;
 document.getElementById('search-outbound').setAttribute('d',
  `M${x} ${y}H424C471 ${y} 487 ${y-23} 487 ${y-68}V207C487 183 504 164 528 164`);
}
setOutbound(candidates.selected);

// The apparatus is an abstract setup; colours and geometry explain the workflow.
dark.color.set('#626077');dark.metalness=.5;dark.roughness=.37;
steel.color.set('#bec3cf');steel.roughness=.29;edge.color.set('#9892aa');gold.color.set('#b5a1bf');blue.color.set('#b4bfcb');
const canvas=document.getElementById('lab-canvas'),renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1695,825,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),pmrem=new T.PMREMGenerator(renderer),environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.05).texture;scene.environmentIntensity=.65;
scene.add(new T.HemisphereLight(0xf5f1ff,0x8d899d,2.2));
const key=new T.DirectionalLight(0xf5f1ff,3.1);key.position.set(-4,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;key.shadow.bias=-.0001;scene.add(key);
const rim=new T.DirectionalLight(0xdddff7,1.7);rim.position.set(4,5,-5);scene.add(rim);
const lab=createLab(scene);
lab.carriage.position.x=.22;lab.head.position.set(0,-.24,1.02);lab.zGuide.position.z=1.02;lab.camera.position.x=1.13;
lab.sample.material.color.set('#b197b4');lab.sample.scale.y=.8;lab.sample.position.y=.571;lab.meniscus.position.y=.595;lab.meniscus.material.opacity=.45;
lab.drop.visible=true;lab.drop.position.set(.22,.664,.13);lab.drop.material.color.set('#b197b4');lab.drop.scale.set(.8,1.05,.8);
const floor=new T.Mesh(new T.PlaneGeometry(16,16),new T.ShadowMaterial({color:0x665277,opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=.04;floor.receiveShadow=true;scene.add(floor);
// Small physical details make the large equipment readable without extra labels.
box(lab.lab,.31,.1,.22,material(0x5e5d71,.3,.4),1.17,.44,.57,.02);
for(let i=0;i<3;i++)box(lab.lab,.12,.02,.03,steel,-1.1+i*.2,.281,1.04,.008);
const camera=new T.OrthographicCamera(-2.99,2.99,1.455,-1.455,.1,50);camera.position.set(3.9,3.55,6.7);camera.lookAt(.12,1.1,.04);camera.updateMatrixWorld();
renderer.render(scene,camera);
function project(v){const p=v.clone().project(camera);return{x:(p.x*.5+.5)*1130,y:(-.5*p.y+.5)*623}}
function updateLabLabels(){
 const labels=[];
 const vialPoints=lab.stocks.map(s=>project(s.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.42,0))));
 vialPoints.forEach((p,i)=>labels.push('<circle cx="'+p.x+'" cy="'+(p.y-15)+'" r="9" fill="#fffdfede" stroke="#c2afcf99"/><text class="component-letter" x="'+p.x+'" y="'+(p.y-11.5)+'" text-anchor="middle">'+'ABCD'[i]+'</text>'));
 const tips=[{v:new T.Vector3(-1.12,lab.lab.position.y+.65,.05),dx:-112,dy:60,text:'Four components'},{v:new T.Vector3(.92,lab.lab.position.y+.985,.13),dx:103,dy:52,text:'Colour reader'}];
 for(const tip of tips){const p=project(tip.v),end={x:p.x+tip.dx,y:p.y+tip.dy};labels.push('<path d="M'+p.x+' '+p.y+'L'+(end.x-tip.dx*.12)+' '+end.y+'H'+end.x+'" fill="none" stroke="#b49ec5" stroke-width=".8"/><circle cx="'+p.x+'" cy="'+p.y+'" r="2.3" fill="#a58aba"/><text x="'+end.x+'" y="'+(end.y+15)+'" text-anchor="'+(tip.dx<0?'end':'start')+'">'+tip.text+'</text>')}
 document.getElementById('lab-labels').innerHTML=labels.join('');
 const p=project(new T.Vector3(.22,lab.lab.position.y+.64,.13));
 const sx=475+p.x*1072/1130, sy=118+p.y*514/623;
 document.getElementById('detail-leader').setAttribute('d',`M${sx} ${sy}C${sx+174} ${sy-12} 1290 330 1394 330`);
}
updateLabLabels();
const zoomRenderer=new T.WebGLRenderer({canvas:document.getElementById('sample-canvas'),alpha:true,antialias:true,preserveDrawingBuffer:true});zoomRenderer.setSize(525,357,false);zoomRenderer.outputColorSpace=T.SRGBColorSpace;zoomRenderer.toneMapping=T.ACESFilmicToneMapping;zoomRenderer.toneMappingExposure=1.22;
const zoomCamera=new T.OrthographicCamera(-.3,.3,.204,-.204,.02,10);zoomCamera.position.set(.65,1.05,1.12);zoomCamera.lookAt(.22,.81,.13);zoomRenderer.render(scene,zoomCamera);
renderer.setSize(1000,490,false);
zoomRenderer.setSize(410,260,false);
renderer.transmissionResolutionScale=.5;
zoomRenderer.transmissionResolutionScale=.65;
renderer.shadowMap.autoUpdate=false;
const views = [
 {x:960,y:600,zoom:1,angle:0},
 {x:615,y:580,zoom:1.47,angle:-.055},
 {x:1088,y:655,zoom:1.36,angle:.095},
 {x:1420,y:634,zoom:1.67,angle:-.12},
 {x:660,y:698,zoom:1.4,angle:-.048}
];
const cameraTarget=new T.Vector3(.12,1.1,.04);
const labOffset=new T.Vector3().subVectors(camera.position,cameraTarget);
const axis=new T.Vector3(0,1,0);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let stage=-1, cameraAngle=0, goalAngle=0, lastDraw=0, frame=0, labDirty=true;

function paint(now){
 frame=0;
 const elapsed=lastDraw?Math.min(now-lastDraw,80):16;
 lastDraw=now;
 if(cameraAngle!==goalAngle){
  cameraAngle=reducedMotion?goalAngle:T.MathUtils.lerp(cameraAngle,goalAngle,1-Math.exp(-elapsed/155));
  if(Math.abs(cameraAngle-goalAngle)<.0006) cameraAngle=goalAngle;
  camera.position.copy(labOffset).applyAxisAngle(axis,cameraAngle).add(cameraTarget);
  camera.lookAt(cameraTarget);
  camera.updateMatrixWorld();
  updateLabLabels();
  labDirty=true;
 }
 if(labDirty) renderer.render(scene,camera);
 labDirty=false;
 if(cameraAngle!==goalAngle) schedulePaint();
}
function schedulePaint(){
 if(!frame) frame=requestAnimationFrame(paint);
}
function focusStage(index){
 if(index===stage) return;
 stage=index;
 artboard.dataset.stage=index;
 const {x,y,zoom,angle}=views[index];
 const left=T.MathUtils.clamp(x-960/zoom,0,1920-1920/zoom);
 const top=T.MathUtils.clamp(y-600/zoom,0,1200-1200/zoom);
 artboard.style.transform=`translate(${-left*zoom}px,${-top*zoom}px) scale(${zoom})`;
 goalAngle=angle;
 schedulePaint();
}
prepareAnimation({lab,candidates,setOutbound,recipe,draw:()=>{
 labDirty=true;
 schedulePaint();
 zoomRenderer.render(scene,zoomCamera);
}});
window.addEventListener('message',event=>{
 if(event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='aisle-workflow-seek') return;
 const {time,index}=event.data;
 if(!Number.isFinite(time)||!Number.isInteger(index)||!views[index]) return;
 focusStage(index);
 window.renderAt(T.MathUtils.clamp(time,0,36));
});
focusStage(0);
window.parent.postMessage({type:'aisle-workflow-ready'},location.origin);
