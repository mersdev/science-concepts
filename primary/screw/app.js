const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const P={origin:[400,325],scale:1.9,azimuth:120,elevation:20},reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fmt=n=>Number(n.toFixed(2)).toString();
let pitch=3,current=0,target=0,zoom=2,auto=false,direction=1,frame=0,last=0,visible=true;
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/Math.hypot(...a));
const cam=cameraOf(P),U=[cam.sinA,-cam.cosA,0],W=[cam.cosA*cam.sinE,cam.sinA*cam.sinE,-cam.cosE],V=[cam.cosA*cam.cosE,cam.sinA*cam.cosE,cam.sinE];
const shade=(c,f)=>'#'+c.slice(1).match(/../g).map(v=>Math.round(Math.min(255,parseInt(v,16)*f)).toString(16).padStart(2,'0')).join('');
let faces=[],solids=[],orderAudit={cycles:0,crossings:0};
function face(points,color,part='',name=''){
 let n=cross(sub(points[1],points[0]),sub(points[2],points[0]));if(Math.hypot(...n)<1e-8||dot(n,V)<=1e-8)return;n=unit(n);
 const screen=points.map(p=>iso(p,P)),bounds={l:Math.min(...screen.map(p=>p[0])),r:Math.max(...screen.map(p=>p[0])),t:Math.min(...screen.map(p=>p[1])),b:Math.max(...screen.map(p=>p[1]))};
 faces.push({points,screen,bounds,n,plane:dot(n,points[0]),color:shade(color,.71+.23*Math.max(0,n[2])+.13*Math.max(0,-n[0])+.08*Math.max(0,n[1])),part,name});
}
// Convex face clipping gives actual depth constraints at overlaps, rather than guessed layer keys.
function overlap(a,b){let out=a;const area=b.reduce((s,p,i)=>s+p[0]*b[(i+1)%b.length][1]-p[1]*b[(i+1)%b.length][0],0),sign=area<0?-1:1;
 for(let i=0;i<b.length&&out.length;i++){const p=b[i],q=b[(i+1)%b.length],side=v=>sign*((q[0]-p[0])*(v[1]-p[1])-(q[1]-p[1])*(v[0]-p[0])),input=out;out=[];
  for(let j=0;j<input.length;j++){const x=input[j],y=input[(j+1)%input.length],sx=side(x),sy=side(y);if(sx>=0)out.push(x);if((sx>=0)!==(sy>=0)){const t=sx/(sx-sy);out.push([x[0]+(y[0]-x[0])*t,x[1]+(y[1]-x[1])*t]);}}
 }return out;
}
function orderedFaces(){
 const count=faces.length,after=Array.from({length:count},()=>[]),degree=new Uint16Array(count),depth=(f,p)=>(f.plane-dot(f.n,U)*(p[0]-P.origin[0])/cam.k-dot(f.n,W)*(p[1]-P.origin[1])/cam.k)/dot(f.n,V);let crossings=fixedAudit?.crossings||0;const crossingPairs=[...(fixedAudit?.crossingPairs||[])],crossingCounts={...fixedAudit?.crossingCounts};for(const [i,j] of fixedEdges){after[i].push(j);degree[j]++;}
 const indices=Array.from({length:count},(_,i)=>i).sort((a,b)=>faces[a].bounds.l-faces[b].bounds.l);
 for(let ai=0;ai<count;ai++){const i=indices[ai],a=faces[i];for(let bi=ai+1;bi<count;bi++){const j=indices[bi],b=faces[j];if(b.bounds.l>=a.bounds.r-.02)break;if(a.bounds.b<=b.bounds.t+.02||b.bounds.b<=a.bounds.t+.02)continue;
  if(fixedAudit&&i<fixedFaces.length&&j<fixedFaces.length)continue;const poly=overlap(a.screen,b.screen);if(poly.length<3)continue;const area=Math.abs(poly.reduce((s,p,k)=>s+p[0]*poly[(k+1)%poly.length][1]-p[1]*poly[(k+1)%poly.length][0],0))/2;if(area<.03)continue;
  const differences=poly.map(p=>depth(a,p)-depth(b,p));if(Math.min(...differences)<-.02&&Math.max(...differences)>.02){crossings++;const pair=[a.name,b.name].sort().join(" / ");crossingCounts[pair]=(crossingCounts[pair]||0)+1;if(crossingPairs.length<15)crossingPairs.push([a.name,b.name,Math.min(...differences),Math.max(...differences)]);continue;}const difference=differences.reduce((a,b)=>a+b,0)/poly.length;if(Math.abs(difference)<.001)continue;
  const back=difference<0?i:j,front=difference<0?j:i;after[back].push(front);degree[front]++;
 }}
 if(!fixedAudit)fixedEdges=after.flatMap((to,i)=>to.map(j=>[i,j]));
 const ready=indices.filter(i=>degree[i]===0),out=[];for(let k=0;k<ready.length;k++){const i=ready[k];out.push(faces[i]);for(const j of after[i])if(--degree[j]===0)ready.push(j);}
 let cycle=[];if(out.length!==count){const marks=new Uint8Array(count),stack=[];const visit=i=>{marks[i]=1;stack.push(i);for(const j of after[i]){if(!degree[j])continue;if(marks[j]===1){cycle=stack.slice(stack.indexOf(j)).map(k=>({name:faces[k].name,points:faces[k].points}));return true;}if(!marks[j]&&visit(j))return true;}stack.pop();marks[i]=2;return false;};for(let i=0;i<count&&!cycle.length;i++)if(degree[i]&&!marks[i])visit(i);}
 orderAudit={cycles:count-out.length,crossings,crossingPairs,crossingCounts,cycle};if(out.length!==count){const seen=new Set(out);out.push(...faces.filter(f=>!seen.has(f)).sort((a,b)=>dot(a.points[0],V)-dot(b.points[0],V)));}return out;
}
let fixedFaces=[],fixedSolids=[],lastMesh,fixedEdges=[],fixedAudit=null;
function setup(){faces=[];fixedEdges=[];fixedAudit=null;const mesh=Screw.mesh(0,pitch);for(const f of mesh.faces)if(f.part!=='screw')face(f.points,f.color,f.part,f.name);fixedFaces=faces.slice();fixedSolids=mesh.solids.filter(s=>s.part!=='screw');orderedFaces();fixedAudit=orderAudit;render();}
function render(){const m=Screw.model(current,pitch),percent=m.seated?100:Math.floor(m.progress*100),mesh=Screw.mesh(current,pitch,false);faces=fixedFaces.slice();for(const f of mesh.faces)face(f.points,f.color,f.part,f.name);const ordered=orderedFaces();lastMesh={P,faces:ordered,solids:[...fixedSolids,...mesh.solids],orderAudit};
 $('#apparatus').innerHTML=ordered.map(f=>`<polygon data-part="${f.part}" data-name="${f.name}" points="${f.screen.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')}" fill="${f.color}"/>`).join('');
 $('#rotation').max=m.maxTurns;$('#rotation').value=current;$('#rotation').style.setProperty('--fill',m.progress*100+'%');$('#turns-limit').textContent=fmt(m.maxTurns)+' turns · fully seated';$('#rotation-value').textContent=current.toFixed(2);
 $('#turns-output').innerHTML=`${current.toFixed(2)} <small>/ ${fmt(m.maxTurns)}</small>`;$('#travel-output').innerHTML=`${m.travel.toFixed(1)} <small>/ ${m.length} mm</small>`;
 $('#direction-output').textContent=m.seated?'Head seated against the wood':m.remaining<.005?'Less than 0.01 turn left':fmt(m.remaining)+' turns left';$('#pitch-output').textContent=`${percent}% inserted · ${pitch} mm per turn`;$('#insertion-fill').style.width=m.progress*100+'%';$('#insertion-progress').setAttribute('aria-valuenow',percent);
 $('[data-readout]').textContent=`${current.toFixed(2)} / ${fmt(m.maxTurns)} turns · ${m.seated?'Fully seated':percent+'% inserted'}`;
 $('#turn').disabled=target>=m.maxTurns;$('#turn').textContent=m.seated?'✓ Fully seated':m.maxTurns-target<1?'↻ Finish turn':'↻ Turn once';$('#play').disabled=m.seated&&!auto;for(const b of document.querySelectorAll('[data-pitch]')){b.classList.toggle('selected',+b.dataset.pitch===pitch);b.setAttribute('aria-pressed',+b.dataset.pitch===pitch);}
 for(const b of document.querySelectorAll('[data-zoom]')){b.classList.toggle('selected',+b.dataset.zoom===zoom);b.setAttribute('aria-pressed',+b.dataset.zoom===zoom);}
 const focus=iso([Math.min(24,-14+m.advance*.5),0,50],P),w=220/zoom,h=80/zoom;$('#thread-detail').setAttribute('viewBox',`${focus[0]-w/2} ${focus[1]-h/2} ${w} ${h}`);
 $('#thread-detail').setAttribute('aria-label',`${zoom} times thread close-up of the same screw: ${current.toFixed(2)} turns and ${m.travel.toFixed(2)} millimetres forward`);
 $('#finding').textContent=m.seated?`${fmt(m.maxTurns)} turns: the 39 mm shank is fully inside and the head is seated.`:`This ${pitch} mm pitch needs ${fmt(m.maxTurns)} turns to insert the entire 39 mm shank.`;
 const hint=$('#turn-hint');hint.textContent=`↻ ${current.toFixed(2)} / ${fmt(m.maxTurns)} turns`;positionMoveHint(hint,Screw.spin([-86,0,61],m),P);
 graph();
}
function describe(){for(const e of [$('#stage'),$('#turn-hint')]){e.setAttribute('aria-valuemax',Screw.model(0,pitch).maxTurns);e.setAttribute('aria-valuenow',target.toFixed(2));e.setAttribute('aria-valuetext',`${target.toFixed(2)} turns, ${(target*pitch).toFixed(2)} millimetres forward`);}}
function graph(){const X=n=>42+n/20*330,Y=x=>170-x/39*140;let out='';for(const x of [0,13,26,39])out+=`<path d="M42 ${Y(x)}H372" stroke="var(--border)"/><text x="34" y="${Y(x)+4}" text-anchor="end">${x}</text>`;for(const n of [0,5,10,15,20])out+=`<text x="${X(n)}" y="191" text-anchor="middle">${n}</text>`;out+='<text x="42" y="16">Inserted (mm)</text><text x="372" y="208" text-anchor="end">Turns</text>';
 for(const p of [2,3,4]){const n=Screw.model(0,p).maxTurns,c={2:'#a18d5f',3:'var(--teal)',4:'var(--coral)'}[p];out+=`<path d="M42 170L${X(n)} 30" fill="none" stroke="${c}" stroke-width="${p===pitch?3:1.4}"/><text x="${X(n)}" y="25" text-anchor="middle">${p} mm</text>`;}
 out+=`<circle id="graph-point" cx="${X(current)}" cy="${Y(current*pitch)}" r="5" fill="var(--coral)"/>`;$('#graph').innerHTML=out;$('#graph').setAttribute('aria-label',`Same 39 millimetre screw: fine pitch needs 19.5 turns, medium 13, coarse 9.75. Current ${current.toFixed(2)} turns, ${(current*pitch).toFixed(2)} millimetres inserted.`);
}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
function wake(){if(reduced.matches||!visible||document.hidden){current=target;render();return;}if(!frame)frame=requestAnimationFrame(tick);}
function set(turns){stop();const next=Screw.model(turns,pitch).turns;if(next!==current)direction=Math.sign(next-current);target=next;describe();wake();if(!reduced.matches&&visible&&!document.hidden)render();}
function tick(now){frame=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.04):0;last=now;if(auto){target=Screw.model(target+dt*.65,pitch).turns;}
 current+=(target-current)*(1-Math.exp(-dt/.2));if(Math.abs(current-target)<.00001)current=target;if(auto&&Screw.model(current,pitch).seated){stop();describe();}render();if(auto||current!==target)frame=requestAnimationFrame(tick);else last=0;
}
for(const b of document.querySelectorAll('[data-pitch]'))b.onclick=()=>{stop();pause();pitch=+b.dataset.pitch;current=target=0;direction=1;describe();setup();};
for(const b of document.querySelectorAll('[data-zoom]'))b.onclick=()=>{zoom=+b.dataset.zoom;render();};
$('#rotation').oninput=e=>set(+e.target.value);$('#turn').onclick=()=>set(target+1);
$('#reset').onclick=()=>{stop();pause();pitch=3;current=target=0;zoom=2;direction=1;describe();setup();};
$('#play').onclick=()=>{if(auto){stop();describe();return;}if(reduced.matches){set(target+1);return;}auto=true;direction=1;target=current;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
function keys(e){const step=e.shiftKey?.25:.05,values={ArrowRight:target+step,ArrowUp:target+step,ArrowLeft:target-step,ArrowDown:target-step,Home:0,End:Screw.model(0,pitch).maxTurns};if(e.key in values){e.preventDefault();set(values[e.key]);}}
$('#stage').onkeydown=e=>{if(e.target===$('#stage')||e.target===$('#turn-hint'))keys(e);};
let drag=null;$('#stage').onpointerdown=e=>{if(e.button!==0)return;const movable=e.target.closest('[data-part="screw"],#turn-hint');if(!movable)return;e.preventDefault();stop();drag={x:e.clientX,turns:target};(e.target.closest('.move-hint')||$('#stage')).focus({preventScroll:true});$('#stage').setPointerCapture(e.pointerId);};$('#stage').onpointermove=e=>{if(drag)set(drag.turns+(e.clientX-drag.x)/$('#stage').clientWidth*Screw.model(0,pitch).maxTurns);};for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#stage').addEventListener(event,()=>drag=null);
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)wake();else pause();}).observe($('#stage'));document.addEventListener('visibilitychange',()=>document.hidden?pause():wake());reduced.addEventListener('change',()=>{stop();pause();wake();});
const preview=$('#thread-preview'),parent=preview.parentNode,next=preview.nextSibling;document.addEventListener('model-fullscreen-change',e=>{if(e.detail)$('.stage-wrap').insertBefore(preview,$('.stage-caption'));else parent.insertBefore(preview,next);render();});new ResizeObserver(render).observe($('#stage'));
window.screw={model:Screw.model,getState:()=>({...Screw.model(current,pitch),current,target,zoom,direction,auto}),geometry:()=>lastMesh,set};describe();setup();
