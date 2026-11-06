import * as T from './three.module.js';
import { RoomEnvironment } from './RoomEnvironment.js';
import { createLab } from './lab.js';
import { box, cylinder, material, mesh, shadow } from './geometry.js';

const vec = (x,y,z) => new T.Vector3(x,y,z);
const lavender = 0x896ca9;
const teal = 0x548a7c;
const targetColour = 0xa48bbc;
const measuredColour = 0xb995b0;
const lineMaterial = colour => new T.MeshStandardMaterial({color:colour,roughness:.54});
const amount = (value,min,max) => T.MathUtils.clamp((value-min)/(max-min),0,1);

function route(scene, points, colour) {
 const curve = new T.CatmullRomCurve3(points);
 const mat = lineMaterial(colour);
 mesh(new T.TubeGeometry(curve,64,.021,10,false),mat,scene);
 const end = curve.getPointAt(1);
 const tip = mesh(new T.ConeGeometry(.073,.19,20),mat,scene,end.x,end.y,end.z);
 tip.quaternion.setFromUnitVectors(vec(0,1,0),curve.getTangentAt(1));
}

function searchSurface(scene) {
 const group = new T.Group();
 group.position.set(-3.03,.65,.18);
 scene.add(group);
 shadow(group,0,0,2.9,2.7,.24);
 const base = material(0xe6d9ef,.24,.38);
 box(group,2.25,.12,1.92,base,0,.10,0,.1);
 function height(x,z) {
  return .2+.73*Math.exp(-((x+.22)**2*2.5+(z+.24)**2*3.3))+.20*Math.exp(-((x-.61)**2*8+(z-.32)**2*8));
 }
 const surface = new T.PlaneGeometry(2.12,1.8,28,24);
 surface.rotateX(-Math.PI/2);
 const vertices = surface.attributes.position;
 const colours = [];
 for(let i=0;i<vertices.count;i++){
  const y = height(vertices.getX(i),vertices.getZ(i));
  vertices.setY(i,y);
  const tint = new T.Color(0xe5d5ee).lerp(new T.Color(0x7952a4),amount(y,.18,.94));
  colours.push(tint.r,tint.g,tint.b);
 }
 surface.setAttribute('color',new T.Float32BufferAttribute(colours,3));
 surface.computeVertexNormals();
 mesh(surface,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.51}),group);
 const grid = new T.LineBasicMaterial({color:0x947bab,opacity:.35,transparent:true});
 for(let i=0;i<=8;i++){
  const horizontal=[],vertical=[];
  for(let j=0;j<=36;j++){
   const x=-1.06+2.12*j/36,z=-.9+1.8*j/36;
   const gx=-1.06+2.12*i/8,gz=-.9+1.8*i/8;
   horizontal.push(vec(x,height(x,gz)+.008,gz));
   vertical.push(vec(gx,height(gx,z)+.008,z));
  }
  for(const points of [horizontal,vertical]) group.add(new T.Line(new T.BufferGeometry().setFromPoints(points),grid));
 }
 const markers = [[-.65,.46,measuredColour],[.59,.28,lavender]];
 const dots = markers.map(([x,z,colour])=>
  mesh(new T.SphereGeometry(.097,24,16),material(colour,.12,.27),group,x,height(x,z)+.04,z)
 );
 const selected = new T.TorusGeometry(.142,.012,10,48);
 const halo = mesh(selected,lineMaterial(teal),group,dots[1].position.x,dots[1].position.y-.026,dots[1].position.z);
 halo.rotation.x=-Math.PI/2;
 halo.visible=false;
 return halo;
}

function makeDisplay(scene) {
 const screen = new T.Group();
 screen.position.set(3.17,1.39,-.12);
 screen.rotation.y=-.14;
 scene.add(screen);
 const frame = box(screen,2.18,.14,1.39,material(0xb6aacb,.39,.33),0,0,0,.095);
 frame.rotation.x=Math.PI/2;
 const canvas=document.createElement('canvas');
 canvas.width=720;
 canvas.height=450;
 const ctx=canvas.getContext('2d');
 const texture=new T.CanvasTexture(canvas);
 texture.colorSpace=T.SRGBColorSpace;
 mesh(new T.PlaneGeometry(2.05,1.26),new T.MeshBasicMaterial({map:texture}),screen,0,0,.08);
 cylinder(scene,.44,.09,material(0xd9cee7),3.17,.34,-.12);
 box(scene,.14,.54,.14,material(0xb6aacb),3.17,.62,-.12);
 function draw(progress) {
  ctx.fillStyle='#fdfaff';ctx.fillRect(0,0,720,450);
  ctx.fillStyle='#564466';ctx.font='600 28px system-ui';ctx.fillText('Sample spectrum',54,53);
  ctx.font='18px system-ui';ctx.fillStyle='#736581';ctx.fillText('Reflectance · illustrative',54,84);
  ctx.strokeStyle='#e5dcea';ctx.lineWidth=1.5;
  for(let i=0;i<5;i++){const y=116+i*48;ctx.beginPath();ctx.moveTo(68,y);ctx.lineTo(662,y);ctx.stroke();}
  ctx.fillStyle='#736581';ctx.font='19px system-ui';
  for(let i=0;i<4;i++) ctx.fillText(400+i*100,55+192*i,335);
  ctx.fillText('Wavelength (nm)',278,371);
  function plot(colour,shift,end,dash) {
   ctx.strokeStyle=colour;ctx.lineWidth=4;ctx.setLineDash(dash);ctx.beginPath();
   for(let i=0;i<=120*end;i++){
    const t=i/120;
    const y=288-92*Math.exp(-((t-.14-shift)**2)/.021)-55*Math.exp(-((t-.77+shift)**2)/.048)-34*t;
    if(i===0)ctx.moveTo(68,y);else ctx.lineTo(68+576*t,y);
   }
   ctx.stroke();ctx.setLineDash([]);
  }
  plot('#9f86b6',0,1,[10,8]);plot('#548578',.08,progress,[]);
  ctx.fillStyle='#9b7db1';ctx.fillText('— Fixed target',72,418);
  ctx.fillStyle='#4d786c';ctx.fillText('— Sample 01',271,418);
  texture.needsUpdate=true;
 }
 draw(1);
 return draw;
}

function feedbackPanel(scene) {
 const panel = new T.Group();
 panel.position.set(.65,.27,1.82);
 scene.add(panel);
 shadow(panel,0,0,2.6,1.2,.22);
 box(panel,2.32,.12,.9,material(0xe4eee8,.16,.45),0,.10,0,.12);
 for(const [x,colour] of [[-.75,measuredColour],[.75,targetColour]]){
  cylinder(panel,.28,.075,material(0xeae3f0),x,.20,0);
  cylinder(panel,.23,.055,material(colour,.05,.29),x,.26,0);
 }
 const bars=[.13,.23,.34,.25];
 bars.forEach((height,i)=>box(panel,.09,height,.12,material([0xc1748c,0xc5a16e,0x6b9da0,0x8c7eac][i]),-.2+i*.135,.18+height/2,0,.023));
}

const views = [
 {at:vec(.10,1.05,.24),offset:vec(1.55,3.40,8.9),width:8.90},
 {at:vec(-2.84,.98,.26),offset:vec(1.10,3.40,8.9),width:4.45},
 {at:vec(-.05,1.02,.07),offset:vec(2.35,3.50,8.5),width:4.65},
 {at:vec(2.03,1.10,.09),offset:vec(.78,2.15,8.9),width:4.30},
 {at:vec(-.73,.62,1.27),offset:vec(1.05,4.30,8.3),width:5.75},
];

export function mountColourScene(canvas, onReady) {
 const scene = new T.Scene();
 const camera = new T.OrthographicCamera(1,1,1,1,.1,50);
 const renderer = new T.WebGLRenderer({canvas,alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
 renderer.toneMapping = T.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1.14;
 const env = new RoomEnvironment();
 const pmrem = new T.PMREMGenerator(renderer);
 scene.environment = pmrem.fromScene(env,.04).texture;
 env.dispose();
 pmrem.dispose();
 scene.add(new T.HemisphereLight(0xffffff,0xcebfdd,1.95));
 const key = new T.DirectionalLight(0xfff8f6,2.6);
 key.position.set(-3,7,6);
 scene.add(key);
 const fill = new T.DirectionalLight(0xe6e7ff,1.35);
 fill.position.set(2,3,-4);
 scene.add(fill);

 const nextCandidate=searchSurface(scene);
 const lab = createLab(scene);
 const drawSpectrum = makeDisplay(scene);
 feedbackPanel(scene);
 route(scene,[vec(-2.03,.83,-.36),vec(-1.76,1.05,-.65),vec(-1.24,1.16,-.60)],lavender);
 route(scene,[vec(.64,1.19,.01),vec(1.70,1.51,-.39),vec(2.11,1.52,-.17)],lavender);
 route(scene,[vec(3.13,.74,.11),vec(3.05,.48,1.56),vec(2.51,.38,1.93),vec(1.88,.39,1.94)],teal);
 route(scene,[vec(-.52,.39,1.94),vec(-1.49,.40,2.07),vec(-2.70,.47,1.86),vec(-3.05,.78,1.21)],teal);

 let phase=0,goal=0,operation=0,spectrumProgress=1,frame=0,yaw=0,pitch=0,drag=null;
 let previous=0;
 function draw(now) {
  frame=0;
  const elapsed=Math.min(60,now-previous);
  previous=now;
  phase=T.MathUtils.lerp(phase,goal,1-Math.exp(-elapsed/150));
  if(Math.abs(phase-goal)<.002) phase=goal;
  const left=Math.floor(phase),right=Math.min(left+1,4),blend=phase-left;
  const at=views[left].at.clone().lerp(views[right].at,blend);
  const offset=views[left].offset.clone().lerp(views[right].offset,blend);
  const spherical=new T.Spherical().setFromVector3(offset);
  spherical.theta+=yaw;
  spherical.phi=T.MathUtils.clamp(spherical.phi+pitch,.65,1.46);
  camera.position.copy(at).add(new T.Vector3().setFromSpherical(spherical));
  camera.lookAt(at);
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h)return;
  const span=T.MathUtils.lerp(views[left].width,views[right].width,blend)*Math.max(1,1.23/(w/h));
  camera.left=-span/2;camera.right=span/2;
  camera.top=span*h/w/2;camera.bottom=-camera.top;
  camera.updateProjectionMatrix();
  if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
  const stockTime=operation*4;
  const i=Math.min(3,Math.floor(stockTime));
  const cycle=stockTime-i;
  const sourceZ=-.515+i*.38;
  const dispensing=goal>=2&&goal<3;
  const approach=dispensing?amount(cycle,.20,.52):1;
  lab.carriage.position.x=T.MathUtils.lerp(-1.12,lab.sampleX,approach);
  lab.carriage.position.z=T.MathUtils.lerp(sourceZ-1.02,lab.sampleZ-1.02,approach);
  nextCandidate.visible=goal===4;
 const descend=dispensing?amount(cycle,.52,.72)*(1-amount(cycle,.80,1)):0;
  lab.head.position.y=-.10-.14*descend;
  lab.drop.visible=dispensing&&cycle>=.65&&cycle<=.85;
  lab.drop.position.y=T.MathUtils.lerp(.76,.62,amount(cycle,.65,.85));
  lab.drop.material.color.set([0xc1748c,0xc5a16e,0x6b9da0,0x8c7eac][i]);
  lab.sample.scale.y=dispensing?.38+.62*operation:1;
  lab.sample.material.color.set(dispensing?0xc1748c:measuredColour);
 if(dispensing) lab.sample.material.color.lerp(new T.Color(measuredColour),operation);
  const observing=goal>=3&&goal<4;
  lab.beam.material.opacity=observing?.21:0;
  lab.scan.material.opacity=observing?.82:0;
  renderer.render(scene,camera);
  if(phase!==goal) frame=requestAnimationFrame(draw);
 }
 function invalidate(){
  if(!frame){
   previous=performance.now()-16;
   frame=requestAnimationFrame(draw);
  }
 }
 const observer=new ResizeObserver(invalidate);
 observer.observe(canvas);
 canvas.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch')return;
  drag={x:event.clientX,y:event.clientY};
  canvas.setPointerCapture(event.pointerId);
 });
 canvas.addEventListener('pointermove',event=>{
  if(!drag)return;
  yaw=T.MathUtils.clamp(yaw-(event.clientX-drag.x)*.004,-.72,.72);
  pitch=T.MathUtils.clamp(pitch+(event.clientY-drag.y)*.003,-.27,.28);
  drag={x:event.clientX,y:event.clientY};
  invalidate();
 });
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{drag=null;});
 invalidate();
 onReady();
 return {
  seek(value,playback=false){
   const stage=Math.min(4,Math.floor(value));
   if(Math.floor(goal)!==stage){yaw=0;pitch=0;}
   goal=stage;
   operation=stage===2?(playback?value-2:.68):0;
   const progress=stage===3&&playback?Math.max(.015,value-3):1;
   if(Math.abs(progress-spectrumProgress)>.008){spectrumProgress=progress;drawSpectrum(progress);}
   invalidate();
  }
 };
}
