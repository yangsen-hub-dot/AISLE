import * as T from 'three';

const width = 420, height = 205;
const spanX = 5.9, spanZ = 2.6;
const surfaceHeight = (x,z) => {
 const border = Math.cos(Math.PI*x/spanX) * Math.cos(Math.PI*z/spanZ);
 const peak = 1.62*Math.exp(-((x+.73)**2/.91+(z+.16)**2/.48));
 const shoulder = .98*Math.exp(-((x-1.23)**2/1.25+(z+.25)**2/.47));
 return .075 + Math.max(0,border)*(.17+peak+shoulder);
};

export function drawSearchSurface() {
 const canvas = document.getElementById('search-canvas');
 const renderer = new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.setSize(width*2,height*2,false);
 const scene = new T.Scene();
 const camera = new T.OrthographicCamera(-3.78,3.78,1.845,-1.845,.1,40);
 camera.position.set(3.25,5.25,8.5);
 camera.lookAt(0,.52,0);
 camera.updateMatrixWorld();
 scene.add(new T.HemisphereLight(0xfff9ff,0x807096,2.15));
 const light = new T.DirectionalLight(0xfff7ff,2.7);
 light.position.set(-4,7,3);
 scene.add(light);

 const plinth = new T.Mesh(new T.BoxGeometry(spanX+.13,.12,spanZ+.13),
  new T.MeshStandardMaterial({color:0xcebedf,roughness:.82}));
 scene.add(plinth);
 const baseEdges = new T.LineSegments(new T.EdgesGeometry(plinth.geometry),
  new T.LineBasicMaterial({color:0x8a72a6,transparent:true,opacity:.38}));
 scene.add(baseEdges);

 const geometry = new T.PlaneGeometry(spanX,spanZ,72,36);
 geometry.rotateX(-Math.PI/2);
 const vertices = geometry.getAttribute('position'), colours = [];
 const low = new T.Color('#dfd1ee'), high = new T.Color('#7854a3');
 for (let i=0;i<vertices.count;i++) {
  const y = surfaceHeight(vertices.getX(i),vertices.getZ(i));
  vertices.setY(i,y);
  const colour = low.clone().lerp(high,Math.min(1,(y-.075)/1.45));
  colours.push(colour.r,colour.g,colour.b);
 }
 geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));
 geometry.computeVertexNormals();
 scene.add(new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.78})));

 const gridMaterial = new T.LineBasicMaterial({color:0x6e518e,transparent:true,opacity:.27});
 const majorGrid = new T.LineBasicMaterial({color:0x6e518e,transparent:true,opacity:.48});
 function line(sample,material) {
  const points = Array.from({length:49},(_,i)=>{
   const [x,z] = sample(i/48);
   return new T.Vector3(x,surfaceHeight(x,z)+.008,z);
  });
  scene.add(new T.Line(new T.BufferGeometry().setFromPoints(points),material));
 }
 for (let i=1;i<16;i++) line(t=>[(i/16-.5)*spanX,(t-.5)*spanZ],i%4===0?majorGrid:gridMaterial);
 for (let i=1;i<8;i++) line(t=>[(t-.5)*spanX,(i/8-.5)*spanZ],i%2===0?majorGrid:gridMaterial);
 renderer.render(scene,camera);

 function project(x,z) {
  const p = new T.Vector3(x,surfaceHeight(x,z)+.02,z).project(camera);
  return {x:(p.x+1)*width/2,y:(1-p.y)*height/2};
 }
 const tested = project(-1.65,.55), selected = project(1.73,.43);
 const dots = [[-2.35,-.22],[-.36,1.02],[.54,.14],[2.28,.76]].map(([x,z])=>{
  const p = project(x,z);
  return `<circle cx="${p.x}" cy="${p.y}" r="3.6" fill="#8869a6" stroke="#fff" stroke-width="1.2"/>`;
 }).join('');
 const label = (p,caption,active) => {
  const dx = active ? 8 : -14, y = p.y-24;
  return `<g id="${active?'next-candidate':'first-candidate'}"><path d="M${p.x} ${p.y-6}l${dx} -13" fill="none" stroke="#755b91" stroke-width="1.2"/>
    <circle cx="${p.x}" cy="${p.y}" r="7" fill="${active?'#70469c':'#b49bc9'}" stroke="#fff" stroke-width="2.5"/>
    <text x="${p.x+dx}" y="${y}" text-anchor="${active?'start':'end'}" class="${active?'selected-text':''}"
      stroke="#faf8fc" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${caption}</text></g>`;
 };
 document.getElementById('search-labels').innerHTML = dots+
  label(tested,'01 tested',false)+label(selected,'02 selected',true);
 return {tested,selected};
}
