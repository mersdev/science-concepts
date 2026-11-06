const $=s=>document.querySelector(s), shapes=['rectangle','triangle','arch'];
const colors={rectangle:'#b66b54',triangle:'#397f73',arch:'#6f65a0'};
const P={origin:[400,305],scale:2.3,azimuth:65,elevation:25};
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Effective stiffness is illustrative, not a material property or failure rating.
function model(shape,span,force){const k={rectangle:20,triangle:100,arch:80}[shape]*(120/span)**3;return {shape,span,force,k,delta:force/k,reaction:force/2,thrust:shape==='arch'?force*span/(4*24):0};}
let shape='rectangle',span=120,load=60,current=0,target=0,auto=false,frame=0,last=0,time=0,visible=true;
const state=()=>model(shape,span,current),faces=[];
const view=[.383,.821,.423];
function warped([x,y,z]){return [x,y,z-state().delta/10*6*Math.max(0,1-(2*x/span)**2)];}
function solid(points,color,deform=false){const pts=deform?points.map(warped):points,center=pts[0].map((_,i)=>pts.reduce((s,p)=>s+p[i],0)/8),parts=[];
 for(const indices of [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){const p=indices.map(i=>pts[i]),c=p[0].map((_,i)=>p.reduce((s,v)=>s+v[i],0)/4),u=p[1].map((v,i)=>v-p[0][i]),v=p[2].map((v,i)=>v-p[0][i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n);if(!len)continue;if(n.reduce((s,v,i)=>s+v*(c[i]-center[i]),0)<0)n=n.map(v=>-v);if(n.reduce((s,v,i)=>s+v*view[i],0)<=0)continue;const light=.70+.28*Math.max(0,n[2]/len)+.09*Math.max(0,n[0]/len);parts.push({points:p,color:shade(color,light),depth:c.reduce((s,v,i)=>s+v*view[i],0)});}
 parts.sort((a,b)=>a.depth-b.depth);faces.push(...parts);
}
function shade(hex,f){return '#'+hex.slice(1).match(/../g).map(x=>Math.min(255,Math.round(parseInt(x,16)*f)).toString(16).padStart(2,'0')).join('');}
function block(x,y,z,w,d,h,c,deform=false){const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]];solid([...p,...p.map(([x,y,z])=>[x,y,z+h])],c,deform);}
function member(a,b,y,c,r=1.5){const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=-dz/l*r,nz=dx/l*r,p=[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];solid([...p.map(([x,z])=>[x,y-1.5,z]),...p.map(([x,z])=>[x,y+1.5,z])],c,true);}
function supports(y){const a=span/2,c=shape==='arch'?'#9c91c5':'#70b7a6';
 if(shape==='arch'){
  for(let i=0;i<12;i++){const x=-a+span*i/12,xx=-a+span*(i+1)/12,z=22+24*(1-(x/a)**2),zz=22+24*(1-(xx/a)**2),p=[[x,z-2],[xx,zz-2],[xx,zz+2],[x,z+2]];solid([...p.map(([x,z])=>[x,y-1.5,z]),...p.map(([x,z])=>[x,y+1.5,z])],i%2?'#a99bce':'#beb1da',true);}
  for(const x of [-a,-a/2,a/2,a])member([x,22+24*(1-(x/a)**2)],[x,46.5],y,'#dfb976',1);
 }else{
  for(const z of [21.5,46.5])for(const [l,r] of [[-a,0],[0,a]])member([l,z],[r,z],y,c);
  for(const x of [-a,0,a])member([x,21.5],[x,46.5],y,c);
  if(shape==='triangle'){member([-a,21.5],[0,46.5],y,'#e5b258');member([0,46.5],[a,21.5],y,'#e5b258');}
 }
 // Flush plates cover the structural joints; fasteners sit on those plates.
 const joints=shape==='arch'?[-a,-a/2,0,a/2,a].map(x=>[x,22+24*(1-(x/a)**2)]):[-a,0,a].flatMap(x=>[[x,22],[x,46]]);
 for(const [x,z] of joints){block(x-2,y+1.5,z-2,4,.7,4,'#dce5d7',true);block(x-.5,y+2.2,z-.5,1,.25,1,'#657d74',true);}
}
function render(){const m=state();faces.length=0;
 for(const x of [-91,91])for(const y of [-26,26])block(x-4,y-4,-9,8,8,4,'#526b64');
 block(-102,-36,-5,204,72,4,'#91aea4');block(-100,-34,-1,200,68,1,'#d4e4cf');
 block(-83,28,.05,166,3,.1,'#f8efcf');for(let i=0;i<=32;i++)block(-81+i*5,28,.15,.25,i%4?1.5:2.8,.05,'#6d897c');
 for(const x of [-span/2,span/2]){block(x-9,-24,0,18,48,3,'#92a8a2');block(x-7,-21,3,14,42,15,'#b2c7b8');block(x-10,-24,18,20,48,2,'#f0d18b');}
 supports(-16);
 for(let i=0;i<9;i++)block(-span/2+i*span/9,-18,48,span/9-.3,36,2,'#c6d9b9',true);
 supports(16);
 block(-9,-12,50,18,24,2,'#e69b69',true);
 for(let i=0;i<10;i++){const h=clamp(current/10-i,0,1)*1.4;if(h>.0001)block(-7,-10,52+i*1.4,14,20,h,['#e5b258','#8db6cb','#e29b81'][i%3],true);}
 $('#apparatus').innerHTML=faces.map(f=>`<polygon points="${f.points.map(p=>iso(p,P).join(',')).join(' ')}" fill="${f.color}"/>`).join('');
 for(const [id,value] of [['load',load],['span',span]]){const slider=$('#'+id);slider.value=value;slider.style.setProperty('--fill',(value-Number(slider.min))/(Number(slider.max)-Number(slider.min))*100+'%');$('#'+id+'-value').textContent=value;}
 $('#force').innerHTML=`${current.toFixed(1)} <small>N</small>`;$('#deflection').innerHTML=`${m.delta.toFixed(2)} <small>mm</small>`;$('#reaction').textContent=`Each end supports ${m.reaction.toFixed(1)} N`;
 $('#comparison').textContent=current===0?'Apply the same load to compare':shape==='rectangle'?'Largest bending in this model':`${(100*(1-m.delta/model('rectangle',span,current).delta)).toFixed(0)}% less than the frame`;
 $('#finding').textContent={rectangle:'Without diagonal braces, the frame relies on its beams and joints resisting bending.',triangle:'Diagonal braces form triangles. Changing their shape requires the members to stretch, shorten or bend.',arch:'The arch carries compression toward the ends. Firm abutments resist its outward push.'}[shape];
 $('#stiffness').textContent=shape==='arch'?`Outward push at each end: ${m.thrust.toFixed(1)} N · firm ends held fixed`:`Model stiffness: ${m.k.toFixed(1)} N/mm · same span and load for comparison`;
 $('[data-readout]').textContent=`${current.toFixed(1)} N · ${m.delta.toFixed(2)} mm bending`;
 $('#test').textContent=target>0?'↑ Remove load':`↓ Apply ${load} N`;
 for(const [id,value,point] of [['load',current,warped([0,0,53+current*.14])],['span',span,[span/2,19,18]]]){const hint=$('#'+id+'-hint');hint.setAttribute('aria-valuenow',value.toFixed(1));hint.textContent=id==='load'?`↕ Load ${value.toFixed(0)} N`:`↔ Span ${value} cm`;positionMoveHint(hint,point,P);}
 graph();
}
function graph(){const X=f=>44+f/100*330,Y=d=>180-d/13*150;let out='';for(const d of [0,4,8,12])out+=`<path d="M44 ${Y(d)}H374" stroke="var(--border)"/><text x="33" y="${Y(d)+4}" text-anchor="end">${d}</text>`;for(const f of [0,50,100])out+=`<text x="${X(f)}" y="201" text-anchor="middle">${f}</text>`;out+='<text x="44" y="16">Deflection (mm)</text><text x="374" y="222" text-anchor="end">Load (N)</text>';
 for(const mode of shapes)out+=`<path d="M44 180L374 ${Y(model(mode,span,100).delta)}" stroke="${colors[mode]}" stroke-width="${mode===shape?3:1.7}" fill="none"/><circle cx="${X(current)}" cy="${Y(model(mode,span,current).delta)}" r="${mode===shape?5:3}" fill="${colors[mode]}"/>`;
 $('#graph').innerHTML=out;$('#graph').setAttribute('aria-label',`Deflection versus load at span ${span} cm. Selected ${shape}: ${current.toFixed(1)} N gives ${state().delta.toFixed(2)} mm.`);
}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function change(id,value){stop();if(id==='load'){load=clamp(Math.round(value),0,100);target=load;}else span=clamp(Math.round(value),80,160);wake();render();}
function select(mode){shape=mode;document.querySelectorAll('[data-shape]').forEach(b=>{b.classList.toggle('selected',b.dataset.shape===shape);b.setAttribute('aria-pressed',b.dataset.shape===shape);});render();}
function wake(){if(reduced.matches){current=target;render();return;}if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
function tick(now){frame=0;const dt=last?Math.min((now-last)/1000,.04):0;last=now;if(auto){time+=dt;target=load*(1-Math.cos(time*1.5))/2;}
 current+=(target-current)*(1-Math.exp(-dt/.18));if(Math.abs(current-target)<.001)current=target;render();if(visible&&!document.hidden&&(auto||current!==target))frame=requestAnimationFrame(tick);else last=0;
}
for(const id of ['load','span'])$('#'+id).oninput=e=>change(id,+e.target.value);
for(const b of document.querySelectorAll('[data-shape]'))b.onclick=()=>{stop();select(b.dataset.shape);};
$('#test').onclick=()=>{stop();target=target>0?0:load;wake();render();};
$('#reset').onclick=()=>{stop();load=60;span=120;target=current=0;select('rectangle');render();};
$('#play').onclick=()=>{if(auto){stop();return;}if(reduced.matches){target=target>0?0:load;wake();return;}auto=true;time=0;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
function keys(e,id){const old=id==='load'?load:span,step=e.shiftKey?10:1,values={ArrowUp:old+step,ArrowRight:old+step,ArrowDown:old-step,ArrowLeft:old-step,Home:id==='load'?0:80,End:id==='load'?100:160};if(e.key in values){e.preventDefault();change(id,values[e.key]);}}
$('#stage').onkeydown=e=>{if(e.target===$('#stage'))keys(e,'load');};for(const id of ['load','span'])$('#'+id+'-hint').onkeydown=e=>keys(e,id);
let drag=null;$('#stage').onpointerdown=e=>{if(e.button!==0)return;const id=e.target.closest('#span-hint')?'span':e.target.closest('#load-hint')?'load':e.clientX>$('#stage').getBoundingClientRect().left+$('#stage').clientWidth*.7?'span':'load';drag={id,x:e.clientX,y:e.clientY,value:id==='load'?load:span};$('#stage').setPointerCapture(e.pointerId);stop();};$('#stage').onpointermove=e=>{if(drag)change(drag.id,drag.value+(drag.id==='load'?e.clientY-drag.y:e.clientX-drag.x)*180/$('#stage').clientWidth);};for(const event of ['pointerup','pointercancel'])$('#stage').addEventListener(event,()=>drag=null);
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;visible?wake():pause();}).observe($('#stage'));document.addEventListener('visibilitychange',()=>document.hidden?pause():wake());reduced.addEventListener('change',()=>{stop();pause();wake();});
const test=$('#test'),parent=test.parentNode,next=test.nextSibling;document.addEventListener('model-fullscreen-change',e=>{e.detail?$('.fullscreen-actions').append(test):parent.insertBefore(test,next);render();});new ResizeObserver(render).observe($('#stage'));
window.bridges={model,getState:()=>({...state(),load,current,target,auto}),geometry:()=>faces};render();
