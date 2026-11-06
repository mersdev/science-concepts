const PROJECTION={"origin":[293.6525729250011,269.8648520935587],"scale":1.2723739219375128,"azimuth":61,"elevation":27};
const $=s=>document.querySelector(s);
const clamp=(v,min=20,max=100)=>Math.max(min,Math.min(max,v));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const model=v=>({v,p:6000/v,product:6000});
let current=60,target=60,auto=false,visible=true,frame=0,last=0,time=0,inverse=false,announceTimer;
const volume=$('#volume'),stage=$('#stage'),gas=$('#gas'),piston=$('#piston');
stage.setAttribute('role','group');
for(const attr of ['aria-valuemin','aria-valuemax','aria-valuenow'])stage.removeAttribute(attr);
stage.insertAdjacentHTML('beforeend','<button type="button" class="move-hint" role="slider" aria-label="Piston: change gas volume. Drag or use arrow keys." aria-valuemin="20" aria-valuemax="100" aria-valuenow="60">↔ Drag piston</button>');
const pistonHint=stage.querySelector('.move-hint');
const positionHint=()=>positionMoveHint(pistonHint,[-101+current*1.9,0,102],PROJECTION);
document.addEventListener('model-fullscreen-change',positionHint);
new ResizeObserver(positionHint).observe(stage);
const pt=p=>iso(p,PROJECTION),polygon=pts=>pts.map(p=>pt(p).join(',')).join(' ');
const particles=Array.from({length:24},(_,i)=>({phase:(i*.6180339)%1,y:(i*.381966)%1,z:(i*.754877)%1,speed:15+(i%5)*2}));
gas.innerHTML=`<polygon id="gas-body" fill="#8bc9ae" opacity=".27"/><g>${particles.map(()=>'<circle r="2.4" fill="#167e70" stroke="#c0e2bf" stroke-width=".6"/>').join('')}</g>`;
const dots=[...gas.querySelectorAll('circle')];
$('#glass-front').innerHTML=`<polygon points="${polygon([[-101,24,37.8],[91,24,37.8],[91,24,86.8],[-101,24,86.8]])}" fill="#c0e6d0" fill-opacity=".13" stroke="#82aa94" stroke-width=".65"/>`;
function graph(){
 const left=45,right=367,top=22,bottom=198;
 const px=v=>left+(inverse?((1/v)/.05):((v-20)/80))*(right-left);
 const py=p=>bottom-(p-0)/320*(bottom-top);
 const plot=$('#plot'),mode=String(inverse),x=px(current),y=py(model(current).p);
 if(plot.dataset.mode===mode){
  $('#crosshair').setAttribute('d',`M${left},${y}H${x}V${bottom}`);
  for(const circle of plot.querySelectorAll('circle')){circle.setAttribute('cx',x);circle.setAttribute('cy',y);}
  return;
 }
 plot.dataset.mode=mode;
 let html='';
 for(const p of [0,100,200,300]){const y=py(p);html+=`<path d="M${left},${y}H${right}" stroke="var(--border)" stroke-width=".7"/><text x="${left-10}" y="${y+3}" text-anchor="end">${p}</text>`;}
 const ticks=inverse?[0,.01,.02,.03,.04,.05]:[20,40,60,80,100];
 for(const value of ticks){const x=inverse?left+value/.05*(right-left):px(value);html+=`<text x="${x}" y="${bottom+17}" text-anchor="middle">${inverse?value.toFixed(2):value}</text>`;}
 html+=`<text class="axis-title" x="${left}" y="11">P (kPa)</text><text class="axis-title" x="${right}" y="237" text-anchor="end">${inverse?'1/V (mL⁻¹)':'V (mL)'}</text>`;
 const curve=inverse?`M${left},${bottom}L${right},${py(300)}`:Array.from({length:161},(_,i)=>{const v=20+i*.5;return `${i?'L':'M'}${px(v)},${py(model(v).p)}`;}).join('');
 html+=`<path d="${curve}" fill="none" stroke="#318b73" stroke-width="2.5"/><path id="crosshair" d="M${left},${y}H${x}V${bottom}" fill="none" stroke="#db9b65" stroke-width="1" stroke-dasharray="3 4"/><circle cx="${x}" cy="${y}" r="8" fill="#e7a26b" opacity=".15"/><circle cx="${x}" cy="${y}" r="4" fill="#df8954" stroke="var(--paper)" stroke-width="1.5"/>`;
 $('#plot').innerHTML=html;
 $('#graph').setAttribute('aria-label',inverse?'Pressure versus reciprocal volume, a straight line through the origin':'Pressure versus volume, a decreasing curve');
}
function draw(){
 const {v,p}=model(current),end=-101+v*1.9;
 piston.setAttribute('transform',translateAlong(PROJECTION,[end-12,0,0]));
 $('#gas-body').setAttribute('points',polygon([[-101,24,37.8],[end,24,37.8],[end,24,86.8],[-101,24,86.8]]));
 particles.forEach((d,i)=>{
  // Constant speed, shorter flight: the reflecting boundary increases collision frequency.
  const length=v*1.9-8,u=((d.phase*360+time*d.speed)%(2*length)+2*length)%(2*length),x=-97+(u>length?2*length-u:u);
  const yy=-19+38*d.y,zz=43+38*d.z;
  const [cx,cy]=pt([x,yy,zz]);dots[i].setAttribute('cx',cx);dots[i].setAttribute('cy',cy);
 });
 $('#volume-label').textContent=v.toFixed(1);$('#pressure').firstChild.textContent=p.toFixed(1)+' ';
 $('#sensor-text text').textContent=p.toFixed(0)+' kPa';
 $('#ratio').textContent=(p/100).toFixed(2)+'×';$('#pressure-bar').style.width=(p/300*100)+'%';
 $('[data-readout]').textContent=`${v.toFixed(1)} mL · ${p.toFixed(1)} kPa`;
 pistonHint.setAttribute('aria-valuenow',v.toFixed(1));pistonHint.setAttribute('aria-valuetext',`${v.toFixed(1)} millilitres, ${p.toFixed(1)} kilopascals absolute pressure`);positionHint();
 volume.value=String(Math.round(v));volume.style.background=`linear-gradient(to right,var(--teal) ${(v-20)/80*100}%,var(--border) ${(v-20)/80*100}%)`;
 $('#half').disabled=target<40;$('#half').style.opacity=target<40?'.45':'1';$('#half').title=target<40?'Halving would go below the apparatus minimum of 20 mL':'Halve the current volume';
 graph();
}
function describe(){clearTimeout(announceTimer);announceTimer=setTimeout(()=>{$('#announcement').textContent=pistonHint.getAttribute('aria-valuetext');},700);}
function playState(){const paused=reduced.matches||!auto;$('#play').disabled=reduced.matches;$('#play').textContent=reduced.matches?'Motion reduced':paused?'▷ Auto explore':'Ⅱ Pause tour';$('#play').setAttribute('aria-pressed',String(!paused));}
function steer(value){auto=false;target=clamp(value);playState();describe();if(reduced.matches){current=target;draw();}run();}
function tick(now){const dt=last?Math.min((now-last)/1000,.033):0;last=now;if(!reduced.matches){time+=dt;if(auto)target=60+35*Math.sin(time*.35);current+=(target-current)*(1-Math.exp(-dt/0.18));if(Math.abs(target-current)<.015)current=target;}else current=target;draw();frame=visible&&!document.hidden&&!reduced.matches?requestAnimationFrame(tick):0;}
function run(){if(!frame&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
volume.addEventListener('input',()=>steer(+volume.value));
$('#half').onclick=()=>steer(target/2);$('#reset').onclick=()=>{graphMode(false);steer(60);};
$('#play').onclick=()=>{if(reduced.matches){steer(target>40?30:60);return;}auto=!auto;time=0;playState();run();};
function graphMode(value){inverse=value;$('#pv').classList.toggle('selected',!value);$('#inverse').classList.toggle('selected',value);$('#pv').setAttribute('aria-pressed',String(!value));$('#inverse').setAttribute('aria-pressed',String(value));graph();}
$('#pv').onclick=()=>graphMode(false);$('#inverse').onclick=()=>graphMode(true);
stage.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowUp')next=current+(e.shiftKey?10:1);if(e.key==='ArrowLeft'||e.key==='ArrowDown')next=current-(e.shiftKey?10:1);if(e.key==='Home')next=20;if(e.key==='End')next=100;if(next!==undefined){e.preventDefault();steer(Math.round(next));}});
let drag=null;
stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;auto=false;playState();const matrix=stage.querySelector('svg').getScreenCTM(),[a,b]=[pt([0,0,0]),pt([1,0,0])];drag={x:e.clientX,y:e.clientY,v:current,ax:matrix.a*(b[0]-a[0])+matrix.c*(b[1]-a[1]),ay:matrix.b*(b[0]-a[0])+matrix.d*(b[1]-a[1])};stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{if(!drag)return;const shift=((e.clientX-drag.x)*drag.ax+(e.clientY-drag.y)*drag.ay)/(drag.ax**2+drag.ay**2);steer(drag.v+shift/1.9);});
for(const type of ['pointerup','pointercancel'])stage.addEventListener(type,e=>{drag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)run();}).observe(stage);
document.addEventListener('visibilitychange',run);reduced.addEventListener('change',()=>{auto=false;playState();run();});
window.boyle={model,setVolume:steer,getState:()=>({current,target,inverse,auto,particles:dots.length})};
playState();draw();run();
