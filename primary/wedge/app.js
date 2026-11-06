const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const P={origin:[400,400],scale:1.25,azimuth:72,elevation:25},cam=cameraOf(P);
const U=[cam.sinA,-cam.cosA,0],W=[cam.cosA*cam.sinE,cam.sinA*cam.sinE,-cam.cosE],V=[cam.cosA*cam.cosE,cam.sinA*cam.cosE,cam.sinE];
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let push=0,width=30,target=0,auto=false,frame=0,last=0,time=0,visible=true,faces=[],solids=[],orderAudit={};
// ponytail: geometry only; the rigid halves illustrate separation, not fracture mechanics.
function model(p,w){p=clamp(p,0,100);w=clamp(w,20,50);const tip=120-.8*p,entry=Math.max(0,100-tip);return {tip,entry,opening:w*entry/80,push:p,width:w};}
const shade=(hex,f)=>'#'+hex.slice(1).match(/../g).map(v=>Math.min(255,Math.round(parseInt(v,16)*f)).toString(16).padStart(2,'0')).join('');
function prism(poly,vector,color,name,part=''){
 const points=[...poly,...poly.map(p=>add(p,vector))],n=poly.length,center=points[0].map((_,i)=>points.reduce((s,p)=>s+p[i],0)/points.length),start=faces.length;
 const sides=[Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i+n),...Array.from({length:n},(_,i)=>[i,(i+1)%n,(i+1)%n+n,i+n])];
 for(const ids of sides){let p=ids.map(i=>points[i]),c=p[0].map((_,i)=>p.reduce((s,v)=>s+v[i],0)/p.length),normal=cross(sub(p[1],p[0]),sub(p[2],p[0]));if(dot(normal,sub(c,center))<0){normal=normal.map(v=>-v);p=p.reverse();}const length=Math.hypot(...normal);if(!length||dot(normal,V)<=0)continue;const screen=p.map(p=>iso(p,P)),xs=screen.map(p=>p[0]),ys=screen.map(p=>p[1]);faces.push({points:p,n:normal,plane:dot(normal,p[0]),screen,bounds:{l:Math.min(...xs),r:Math.max(...xs),t:Math.min(...ys),b:Math.max(...ys)},color:shade(color,.68+.28*Math.max(0,normal[2]/length)+.12*Math.max(0,normal[0]/length)),name,part});}
 solids.push({points,name,part,faces:faces.slice(start)});
}
function box(x,y,z,w,d,h,c,name,part=''){prism([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],[0,0,h],c,name,part);}
function foundation(){
 for(const x of [-110,98])for(const y of [-45,33]){box(x,y,0,12,12,6,'#526f69','foot');box(x-1,y-1,6,14,14,4,'#74988c','foot pad');}
 box(-135,-64,10,270,128,8,'#80a99a','base');box(-132,-61,18,264,122,2,'#c4d7b0','mat');
 for(const x of [-124,118])for(const y of [-54,48]){box(x,y,20,6,6,1,'#e9d3a1','washer');box(x+2,y+2,21,2,2,.6,'#607e73','screw');}
 for(const x of [-101,89]){box(x-5,-55,20,22,22,6,'#88acba','guide shoe');box(x,-50,26,12,12,204,'#82b2c9','guide');box(x-2,-52,230,16,16,5,'#e6c778','post cap');}
 box(-89,-50,218,178,12,12,'#86b1c3','bridge');
 for(const x of [-96,90])for(const z of [220,226])box(x,-38,z,3,.6,3,'#ead19a','bridge fastener');
 box(110,-47,20,17,10,4,'#88acba','ruler foot');box(114,-43,24,9,2,6,'#f3e3b9','ruler stem');
 box(114,-43,30,9,2,180,'#f3e3b9','ruler');
 for(let i=0;i<=20;i++)box(114,-40.9,33+i*8.4,i%5?4:8,.3,.6,'#748e7f','ruler inlay');
 for(const y of [-28,22])box(-115,y,20,230,6,1,'#608e88','sample support');
}
foundation();const fixedFaces=faces.slice(),fixedSolids=solids.slice();
function geometry(){faces=fixedFaces.slice();solids=fixedSolids.slice();const m=model(push,width),h=m.tip+80,gap=m.opening/2;
 for(const sign of [-1,1]){const x=sign<0?-65-gap:gap;box(x,-32,21,65,64,79,'#ecc46b','sample');for(const y of [-26,-10,6,22])box(x+.3,y,100,64.4,1.1,.15,'#f5d991','sample surface');}
 prism([[-width/2,-30,h],[width/2,-30,h],[0,-30,m.tip]],[0,60,0],'#f4b08a','wedge','blade');
 box(-27,-32,h,54,64,7,'#e68569','blade clamp','handle');
 for(const x of [-22,19])for(const y of [-26,23])box(x,y,h+7,3,3,1,'#f5d69d','clamp screw','handle');
 // Guide sleeves fit around the square posts: four walls, with an open bore.
 for(const x of [-101,89]){for(const dx of [-4,12])box(x+dx,-54,h+7,4,20,10,'#648f9e','sleeve','handle');for(const y of [-54,-38])box(x,y,h+7,12,4,10,'#648f9e','sleeve','handle');}
 box(-101,-34,h+7,202,8,10,'#80acbc','crosshead','handle');
 for(const x of [-20,14])box(x,-22,h+7,6,6,18,'#d68162','handle stem','handle');
 box(-30,-24,h+25,60,10,10,'#eb9577','handle','handle');
 for(let x=-24;x<=24;x+=8)box(x,-14,h+26,1,.4,8,'#a66351','grip rib','handle');
 const sorted=orderedFaces();$('#apparatus').innerHTML=sorted.map(f=>`<polygon data-part="${f.part}" points="${f.screen.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')}" fill="${f.color}"/>`).join('');
 positionMoveHint($('#blade-hint'),[0,-19,h+35],P);return {P,faces:sorted,solids,orderAudit};
}
// Convex face clipping gives actual depth constraints at overlaps, rather than guessed layer keys.
function overlap(a,b){let out=a;const area=b.reduce((s,p,i)=>s+p[0]*b[(i+1)%b.length][1]-p[1]*b[(i+1)%b.length][0],0),sign=area<0?-1:1;
 for(let i=0;i<b.length&&out.length;i++){const p=b[i],q=b[(i+1)%b.length],side=v=>sign*((q[0]-p[0])*(v[1]-p[1])-(q[1]-p[1])*(v[0]-p[0])),input=out;out=[];
  for(let j=0;j<input.length;j++){const x=input[j],y=input[(j+1)%input.length],sx=side(x),sy=side(y);if(sx>=0)out.push(x);if((sx>=0)!==(sy>=0)){const t=sx/(sx-sy);out.push([x[0]+(y[0]-x[0])*t,x[1]+(y[1]-x[1])*t]);}}
 }return out;
}
function orderedFaces(){
 const count=faces.length,after=Array.from({length:count},()=>[]),degree=new Uint16Array(count),depth=(f,p)=>(f.plane-dot(f.n,U)*(p[0]-P.origin[0])/cam.k-dot(f.n,W)*(p[1]-P.origin[1])/cam.k)/dot(f.n,V);let crossings=0;const crossingPairs=[];
 const indices=Array.from({length:count},(_,i)=>i).sort((a,b)=>faces[a].bounds.l-faces[b].bounds.l);
 for(let ai=0;ai<count;ai++){const i=indices[ai],a=faces[i];for(let bi=ai+1;bi<count;bi++){const j=indices[bi],b=faces[j];if(b.bounds.l>=a.bounds.r-.02)break;if(a.bounds.b<=b.bounds.t+.02||b.bounds.b<=a.bounds.t+.02)continue;
  const poly=overlap(a.screen,b.screen);if(poly.length<3)continue;const area=Math.abs(poly.reduce((s,p,k)=>s+p[0]*poly[(k+1)%poly.length][1]-p[1]*poly[(k+1)%poly.length][0],0))/2;if(area<.03)continue;
  const differences=poly.map(p=>depth(a,p)-depth(b,p));if(Math.min(...differences)<-.02&&Math.max(...differences)>.02){crossings++;if(crossingPairs.length<15)crossingPairs.push([a.name,b.name,Math.min(...differences),Math.max(...differences)]);continue;}const difference=differences.reduce((a,b)=>a+b,0)/poly.length;if(Math.abs(difference)<.001)continue;
  const back=difference<0?i:j,front=difference<0?j:i;after[back].push(front);degree[front]++;
 }}
 const ready=indices.filter(i=>degree[i]===0),out=[];for(let k=0;k<ready.length;k++){const i=ready[k];out.push(faces[i]);for(const j of after[i])if(--degree[j]===0)ready.push(j);}
 let cycle=[];if(out.length!==count){const marks=new Uint8Array(count),stack=[];const visit=i=>{marks[i]=1;stack.push(i);for(const j of after[i]){if(!degree[j])continue;if(marks[j]===1){cycle=stack.slice(stack.indexOf(j)).map(k=>({name:faces[k].name,points:faces[k].points}));return true;}if(!marks[j]&&visit(j))return true;}stack.pop();marks[i]=2;return false;};for(let i=0;i<count&&!cycle.length;i++)if(degree[i]&&!marks[i])visit(i);}
 orderAudit={cycles:count-out.length,crossings,crossingPairs,cycle};if(out.length!==count){const seen=new Set(out);out.push(...faces.filter(f=>!seen.has(f)).sort((a,b)=>dot(a.points[0],V)-dot(b.points[0],V)));}return out;
}
function graph(m){const X=p=>45+p*3.3,Y=o=>170-o*3.5;let out='';for(const o of [0,10,20,30,40])out+=`<path d="M45 ${Y(o)}H375" stroke="var(--border)"/><text x="36" y="${Y(o)+4}" text-anchor="end">${o}</text>`;for(const p of [0,25,50,75,100])out+=`<text x="${X(p)}" y="188" text-anchor="middle">${p}</text>`;out+='<text x="45" y="16">Opening (mm)</text><text x="375" y="207" text-anchor="end">Push depth (%)</text>';out+=`<path d="M45 170H${X(25)}L375 ${Y(model(100,width).opening)}" fill="none" stroke="var(--teal)" stroke-width="3"/><circle id="graph-point" cx="${X(push)}" cy="${Y(m.opening)}" r="5" fill="var(--coral)"/>`;$('#graph-content').innerHTML=out;}
function render(){const m=model(push,width),status=m.entry>0?'Splitting apart':push>=25?'Tip touching':'Above the sample';
 for(const id of ['push','width']){const v=id==='push'?push:width,e=$('#'+id);e.value=v;e.style.setProperty('--fill',(v-e.min)/(e.max-e.min)*100+'%');$('#'+id+'-value').textContent=v.toFixed(0);}
 $('#entry-value').innerHTML=`${m.entry.toFixed(1)} <small>mm</small>`;$('#opening-value').innerHTML=`${m.opening.toFixed(1)} <small>mm</small>`;
 $('#condition').textContent=status.toUpperCase();$('#preview-state').textContent=status;$('#finding').textContent=m.entry>0?'The two sloping faces push the sides apart as the wedge moves down. A wedge helps us split or cut materials.':'The pointed tip enters first. Push down to bring the sloping faces into the sample.';
 $('[data-readout]').textContent=`Push ${push.toFixed(0)}% · opening ${m.opening.toFixed(1)} mm`;
 const hint=$('#blade-hint');hint.textContent=`↕ Push blade · ${push.toFixed(0)}%`;hint.setAttribute('aria-valuenow',push.toFixed(1));hint.setAttribute('aria-valuetext',`${push.toFixed(0)} percent pushed; opening ${m.opening.toFixed(1)} millimetres`);
 $('#push-action').textContent=target===100?'↑ Lift wedge':'↓ Push wedge';
 const gap=m.opening*.55/2,tip=114-m.tip*.55,top=tip-44,w=width*.55;
 $('#preview-content').innerHTML=`<path d="M${200-gap-82} 59h82v44h-82Z" fill="#e8bb58" stroke="#a48045"/><path d="M${200+gap} 59h82v44h-82Z" fill="#f0cf7c" stroke="#a48045"/><path d="M${200-w/2} ${top}H${200+w/2}L200 ${tip}Z" fill="#ee9677" stroke="#ad634b"/><text x="110" y="124">← sides move apart →</text>`;
 $('#preview').setAttribute('aria-label',`Conceptual cross-section: entry ${m.entry.toFixed(1)} mm, opening ${m.opening.toFixed(1)} mm`);geometry();graph(m);
}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
function wake(){if(reduced.matches){push=target;render();return;}if(visible&&!document.hidden&&!frame&&(auto||push!==target))frame=requestAnimationFrame(tick);}
function change(p){stop();target=push=clamp(p,0,100);render();}
function tick(now){frame=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.04):0;last=now;if(auto){time+=dt;target=(1-Math.cos(time*.85))*50;push=target;}else{push+=(target-push)*(1-Math.exp(-dt/.28));if(Math.abs(target-push)<.03)push=target;}render();if(auto||push!==target)frame=requestAnimationFrame(tick);else last=0;}
$('#push').oninput=e=>change(+e.target.value);$('#width').oninput=e=>{stop();target=push;width=clamp(+e.target.value,20,50);render();};
$('#push-action').onclick=()=>{stop();target=target===100?0:100;wake();render();};
$('#play').onclick=()=>{if(auto){stop();target=push;render();return;}if(reduced.matches){change(push>50?0:100);return;}auto=true;time=Math.acos(1-push/50)/.85;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
$('#reset').onclick=()=>{stop();pause();push=target=time=0;width=30;render();};
function keys(e){const d=e.shiftKey?10:2,values={ArrowDown:push+d,ArrowRight:push+d,ArrowUp:push-d,ArrowLeft:push-d,Home:0,End:100};if(e.key in values){e.preventDefault();change(values[e.key]);}}
$('#stage').onkeydown=keys;
let drag=null;$('#stage').onpointerdown=e=>{if(e.button!==0||!e.target.closest('[data-part=blade],[data-part=handle],#blade-hint'))return;e.preventDefault();stop();target=push;drag={y:e.clientY,push};(e.target.closest('.move-hint')||$('#stage')).focus({preventScroll:true});$('#stage').setPointerCapture(e.pointerId);};
$('#stage').onpointermove=e=>{if(!drag)return;const matrix=$('#stage svg').getScreenCTM(),dy=axisVector(P,[0,0,-.8])[1]*matrix.d;change(drag.push+(e.clientY-drag.y)/dy);};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#stage').addEventListener(event,()=>drag=null);
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)wake();else pause();}).observe($('#stage'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else wake();});reduced.addEventListener('change',()=>{stop();pause();push=target;render();});
const preview=$('#section-preview'),home=preview.parentNode,slot=preview.nextSibling;
document.addEventListener('model-fullscreen-change',e=>{if(e.detail){stop();pause();target=push;$('.stage-wrap').insertBefore(preview,$('.stage-caption'));}else home.insertBefore(preview,slot);render();});
new ResizeObserver(()=>positionMoveHint($('#blade-hint'),[0,-19,model(push,width).tip+115],P)).observe($('#stage'));
window.wedge={model,getState:()=>({...model(push,width),current:push,target,auto}),geometry,set:(p,w=width)=>{width=clamp(w,20,50);change(p);}};
render();
