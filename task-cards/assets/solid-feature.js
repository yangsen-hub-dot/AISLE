// Reuse the complete same-origin scene without changing its standalone page.
const solidFrame=document.getElementById('solid-feature-frame');
if(solidFrame){
 const holder=solidFrame.parentElement;
 let attached=false;
 const pause=()=>{
  try{const button=solidFrame.contentDocument?.getElementById('play');if(button?.getAttribute('aria-label')==='Pause evaluation stages')button.click();}catch{}
 };
 async function attach(){
  if(attached)return;
  try{
   const doc=solidFrame.contentDocument;
   if(!doc?.querySelector('.frame'))return;
   attached=true;
   const style=doc.createElement('style');
   style.textContent='body{background:#f3ecdf;min-height:0}main{width:100%;margin:0}main>.eyebrow,main>h1,main>.intro,main>footer,.frame>.bar{display:none}.frame{border:0;border-radius:0;box-shadow:none}.body{height:560px;min-height:560px;grid-template-columns:minmax(0,1fr) 280px}.aside{padding:22px 20px}.aside h2{font-size:27px}.aside p{font-size:13px}.controls{background:#faf6ee}.stage .scene-head strong{font-size:23px}.caption{font-size:10px}@media(max-width:850px){.body{height:auto;min-height:0;display:block}.stage{height:clamp(340px,65vw,490px)}.aside{padding:20px;min-height:0}.aside h2{font-size:25px}.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.facts b{font-size:12px}.facts span{font-size:11px}.note{margin-top:12px}.controls{grid-template-columns:61px minmax(0,1fr) 47px}.scene-head strong{max-width:280px}}@media(max-width:480px){.facts{grid-template-columns:1fr;gap:0}.facts li{padding:8px 0}.facts b{display:inline;margin-right:8px}.facts span{display:inline}.aside p{margin-bottom:10px}.caption{left:12px;right:12px}.steps button{font-size:8px}}';
   doc.head.append(style);
   const resize=()=>{const height=Math.ceil(doc.querySelector('main').getBoundingClientRect().height);if(height>100)solidFrame.style.height=height+'px';};
   new solidFrame.contentWindow.ResizeObserver(resize).observe(doc.querySelector('main'));
   resize();
   const start=performance.now();
   const ready=()=>{if(solidFrame.contentWindow.demoReady){holder.classList.add('ready');resize();}else if(performance.now()-start<30000)setTimeout(ready,100);else holder.classList.add('fallback');};
   ready();
  }catch{holder.classList.add('fallback');}
 }
 solidFrame.addEventListener('load',attach);
 attach();
 document.addEventListener('catalog-view-change',e=>{if(!e.detail.visual)pause();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();},{threshold:.05}).observe(holder);
}
