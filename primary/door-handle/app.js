const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rad=Math.PI/180;
const P={origin:[340,391],scale:1.6,azimuth:45,elevation:24};
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),stage=$('#stage');
// Teaching cam: a quarter-turn crank above the axle drives a vertical slot.
function model(angle){const knob=clamp(Number(angle)||0,0,90),theta=knob*rad,s=6*(1-Math.cos(theta)+Math.sin(theta));return {knob,axle:knob,retraction:s,extension:12-s,pin:[-32-s,4,120+6*(Math.sin(theta)+Math.cos(theta))],rimTravel:30*theta};}
let current=0,target=0,cover=75,coverTarget=75,selected='knob',auto=false,time=0,visible=true,frame=0,last=0;
const C={mint:'#94c8ad',edge:'#608f80',wood:'#d4a56d',cream:'#f2dfb1',steel:'#8da9ab',dark:'#536e70',blue:'#78add0',gold:'#e6b956',coral:'#e78d73'};
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/Math.hypot(...a));
const cam=cameraOf(P),U=[cam.sinA,-cam.cosA,0],W=[cam.cosA*cam.sinE,cam.sinA*cam.sinE,-cam.cosE],V=[cam.cosA*cam.cosE,cam.sinA*cam.cosE,cam.sinE];
const shade=(c,f)=>'#'+c.slice(1).match(/../g).map(v=>Math.round(Math.min(255,parseInt(v,16)*f)).toString(16).padStart(2,'0')).join('');
let faces=[],solids=[],orderAudit={cycles:0,crossings:0};
function face(points,color,part='',name=''){
 let n=cross(sub(points[1],points[0]),sub(points[2],points[0]));if(Math.hypot(...n)<1e-8||dot(n,V)<=1e-8)return;n=unit(n);
 const screen=points.map(p=>iso(p,P)),bounds={l:Math.min(...screen.map(p=>p[0])),r:Math.max(...screen.map(p=>p[0])),t:Math.min(...screen.map(p=>p[1])),b:Math.max(...screen.map(p=>p[1]))};
 faces.push({points,screen,bounds,n,plane:dot(n,points[0]),color:shade(color,.71+.23*Math.max(0,n[2])+.13*Math.max(0,-n[0])+.08*Math.max(0,n[1])),part,name});
}
function prism(poly,vector,color,name,part=''){
 const points=[...poly,...poly.map(p=>add(p,vector))],n=poly.length,center=mul(points.reduce((a,b)=>add(a,b),[0,0,0]),1/points.length),start=faces.length;
 for(const ids of [Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i+n),...Array.from({length:n},(_,i)=>[i,(i+1)%n,(i+1)%n+n,i+n])]){
  let p=ids.map(i=>points[i]);const mid=mul(p.reduce((a,b)=>add(a,b),[0,0,0]),1/p.length);if(dot(cross(sub(p[1],p[0]),sub(p[2],p[0])),sub(mid,center))<0)p=p.reverse();face(p,color,part,name);
 }
 solids.push({kind:'prism',poly,vector,name,part,faces:faces.slice(start)});
}
function box(x,y,z,w,d,h,c,name,part=''){prism([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],[0,0,h],c,name,part);}
function turned(profile,origin,color,name,part='',steps=48){
 const start=faces.length;
 for(let j=0;j<profile.length;j++){const [s,r]=profile[j],[t,q]=profile[(j+1)%profile.length];
  for(let i=0;i<steps;i++){if(name.startsWith('rose')&&i<steps/2)continue;const a=i/steps*Math.PI*2,b=(i+1)/steps*Math.PI*2,point=(y,r,a)=>add(origin,[r*Math.cos(a),y,r*Math.sin(a)]);let p=[point(s,r,a),point(s,r,b),point(t,q,b),point(t,q,a)];if(r===0)p=[p[0],p[2],p[3]];if(q===0)p=[p[0],p[1],p[2]];face(p.reverse(),color,part,name);}
 }
 if(name.startsWith('rose'))for(const sign of [-1,1]){let cap=profile.map(([s,r])=>add(origin,[sign*r,s,0]));if(cross(sub(cap[1],cap[0]),sub(cap[2],cap[0]))[2]<0)cap.reverse();face(cap,color,part,name);}
 solids.push({kind:'body',profile,origin,name,part,faces:faces.slice(start)});
}
function ring(y0,y1,rin,rout,c,name,origin=[-38,0,120],part=''){turned([[y0,rin],[y0,rout],[y1,rout],[y1,rin]],origin,c,name,part);}
function screw(x,y,z,name,axis='y',part=''){
 if(axis==='y'){const r=name==='rail screw'?1.3:2.6,w=Math.min(3.2,r*1.5);turned([[0,0],[0,r],[1.2,r],[1.2,0]],[x,y,z],C.cream,name,part,16);box(x-w/2,y+1.21,z-.3,w,.15,.6,C.dark,name+' slot',part);}
 else if(axis==='x'){box(x,y-2,z-2,1,4,4,C.cream,name,part);box(x+1,y-1.5,z-.3,.12,3,.6,C.dark,name+' slot',part);}
 else {box(x-2,y-2,z,4,4,1,C.cream,name,part);box(x-1.5,y-.3,z+1,3,.6,.12,C.dark,name+' slot',part);}
}
function rotated([x,y,z],angle=current){const a=angle*rad;return [-38+(x+38)*Math.cos(a)-(z-120)*Math.sin(a),y,120+(x+38)*Math.sin(a)+(z-120)*Math.cos(a)];}
function rotorBox(x,y,z,w,d,h,c,name,part='knob'){const p=[[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]].map(p=>rotated(p));prism(p,[0,d,0],c,name,part);}
function foundation(){
 for(const x of [-80,140])for(const y of [-44,45])box(x-7,y-7,57,14,14,5,C.edge,'stand.foot');
 box(-94,-59,62,254,126,10.5,C.edge,'stand.base');box(-91,-56,72.5,248,120,1.5,'#c2d8b3','stand.inlay');
 for(const x of [-87,147])for(const y of [-49,56])screw(x,y,74,'base screw','z');
 box(-78,-32,74,18,21,84,C.wood,'left door edge');box(140,-32,74,15,21,84,C.wood,'right door edge');
 box(-60,-32,74,200,21,23,C.mint,'lower door');box(-60,-32,143,200,21,15,C.mint,'upper door');
 for(const z of [78,89,147,153])box(-60,-10.9,z,200,.6,2,C.edge,'door trim');
 for(const z of [97,127])box(-60,-15,z,200,4,16,C.dark,'latch backplate');
 box(-60,-15,113,15,4,14,C.dark,'latch backplate');box(-31,-15,113,171,4,14,C.dark,'latch backplate');
 for(const z of [99,138])box(-57,-11,z,196,27,3,C.steel,'guide rail');
 for(const x of [-56,130])for(const z of [100.5,139.5])screw(x,16,z,'rail screw');
 // The faceplate is a real frame around an opening, not a solid through the bolt.
 for(const z of [90,132])box(140,-11,z,3,27,18,C.cream,'faceplate end');
 for(const y of [-11,13])box(140,y,108,3,3,24,C.cream,'faceplate side');
 for(const z of [98,142])screw(143,4,z,'faceplate screw','x');
 for(const y of [-18,21])ring(y,y+3,6,10,C.gold,'spindle bearing');
 // Split rose at the axle opening; the square spindle is visible through it.
 ring(24,28,7,34,C.steel,'rose rim');ring(28,30,7,31,C.cream,'rose inset');
 for(const x of [-56,-20])screw(x,30,105,'rose screw');
 ring(30,34,7,12,C.gold,'neck collar');ring(34,58,7,10,C.coral,'knob neck',[-38,0,120],'knob');
 const profile=[[58,0],[58,13.08]];
 for(let y=60;y<=94;y+=2)profile.push([y,30*Math.sqrt(1-((y-76)/20)**2)]);
 profile.push([95,30*Math.sqrt(1-(19/20)**2)],[95,0]);turned(profile,[-38,0,120],C.coral,'knob body','knob',64);
 ring(95,96,0,9.3675,'#f4b69a','knob face',[-38,0,120],'knob');
}
foundation();const fixedFaces=faces.slice(),fixedSolids=solids.slice();
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
function geometry(){faces=fixedFaces.slice();solids=fixedSolids.slice();const m=model(current),s=m.retraction,lift=cover/100*56;
 // Four square socket sides, split into angular wedges, fit the square axle exactly.
 for(let i=0;i<64;i++){const a=i*Math.PI/32,b=(i+1)*Math.PI/32,inner=t=>4/Math.max(Math.abs(Math.cos(t)),Math.abs(Math.sin(t))),point=(r,t)=>rotated([-38+r*Math.cos(t),-6,120+r*Math.sin(t)]);
  const start=faces.length;prism([point(inner(a),a),point(17,a),point(17,b),point(inner(b),b)],[0,10,0],C.blue,'cam');
  // Adjacent wedges are one cam: their internal radial walls are never exposed.
  faces=faces.filter((f,j)=>j<start||Math.abs(f.n[1])>.99||f.points.every(p=>Math.hypot(p[0]+38,p[2]-120)>16.99)||f.points.every(p=>Math.hypot(p[0]+38,p[2]-120)<5.67));solids.at(-1).faces=faces.slice(start);}
 // Split visible shaft faces at the housing planes to resolve partial occlusion.
 // These are contiguous intervals of one axle, with no internal caps or outlines.
 for(let y=-18;y<58;y+=4){const start=faces.length;rotorBox(-42,y,116,8,4,8,C.gold,'square spindle');faces=faces.filter((f,i)=>i<start||Math.abs(f.n[1])<.99||f.points[0][1]===-18||f.points[0][1]===58);solids.at(-1).faces=faces.slice(start);}
 // Vertical yoke slot receives the rotating pin; the follower translates only along x.
 for(const x of [-35.5-s,-30.5-s])box(x,4,125.8,2,5,4.4,C.gold,'follower cheek');
 box(-35.5-s,4,130.2,7,5,1.8,C.gold,'follower bridge');
 turned([[0,0],[0,1.5],[5,1.5],[5,0]],m.pin,C.cream,'crank pin');
 box(-28.5-s,5,127,157.5,4,3,C.gold,'connecting bar');
 // Beveled bolt retracts through the faceplate without crossing its rim.
 prism([[129-s,-7,110],[155-s,-7,110],[155-s,2,110],[151-s,12,110],[129-s,12,110]],[0,0,20],C.gold,'latch bolt');
 for(const x of [60,115-s]){for(const z of [122,132])box(x,0,z,2,14,3,C.steel,'spring seat');for(const y of [0,11])box(x,y,125,2,3,7,C.steel,'spring seat');}
 box(60,-11,122,2,11,3,C.steel,'fixed spring bracket');for(const y of [3,9])box(115-s,y,127,2,2,3,C.steel,'moving spring collar');
 const spring=[[62,12,128.5]];for(let i=0;i<=112;i++){const t=i/112,a=t*7*Math.PI*2;spring.push([64+(49-s)*t,7+5*Math.cos(a),128.5+5*Math.sin(a)]);}spring.push([115-s,12,128.5]);
 // Shared rings at each wire joint make one continuous tube, with no overlapping caps.
 const start=faces.length,rings=spring.map((p,i)=>{const axis=i===0||i===spring.length-1?[1,0,0]:unit(sub(spring[i+1],spring[i-1])),u=unit(cross(axis,[0,0,1])),v=cross(axis,u);return Array.from({length:6},(_,j)=>add(p,add(mul(u,.7*Math.cos(j*Math.PI/3)),mul(v,.7*Math.sin(j*Math.PI/3)))));});
 for(let i=0;i<spring.length-1;i++)for(let j=0;j<6;j++){const k=(j+1)%6,p=[rings[i][j],rings[i][k],rings[i+1][k],rings[i+1][j]],mid=mul(add(spring[i],spring[i+1]),.5);if(dot(cross(sub(p[1],p[0]),sub(p[2],p[0])),sub(p[0],mid))<0)p.reverse();face([p[0],p[1],p[2]],C.dark,'','spring wire');face([p[0],p[2],p[3]],C.dark,'','spring wire');}
 solids.push({kind:'tube',points:spring,radius:.7,name:'return spring',faces:faces.slice(start)});
 // Flush grip inlays follow the curved knob surface, instead of floating above it.
 for(let i=0;i<12;i++)for(let y=74;y<78;y++){const a=i*Math.PI/6,b=a+.07,point=(y,a)=>{const r=30*Math.sqrt(1-((y-76)/20)**2)+.025;return rotated([-38+r*Math.cos(a),y,120+r*Math.sin(a)]);};face([point(y,a),point(y+1,a),point(y+1,b),point(y,b)],'#b56c57','knob','grip inlay');}
 rotorBox(-39,96,122,2,.25,6,C.cream,'wheel marker');rotorBox(-40,13,124,4,8,.25,'#fff0bd','axle marker');
 box(-12,-11,141+lift,151,29,2.5,C.blue,'inspection cover','cover');box(-12,18,139+lift,151,2,2,C.steel,'cover lip','cover');
 for(const x of [-6,131])for(const y of [-6,10])screw(x,y,143.5+lift,'cover screw','z','cover');
 const sorted=orderedFaces();$('#apparatus').innerHTML=sorted.map(f=>`<polygon ${f.part?`data-part="${f.part}"`:''} points="${f.screen.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')}" fill="${f.color}"/>`).join('');
 positionHints();return {solids,faces:sorted,orderAudit};
}
function positionHints(){positionMoveHint($('#knob-hint'),rotated([-38,76,150]),P);positionMoveHint($('#cover-hint'),[85,7,147+cover/100*56],P);}
function graph(){const X=a=>48+a/90*323,Y=a=>170-a/90*140;let out='';for(const a of [0,30,60,90])out+=`<path d="M${X(a)} 30V170M48 ${Y(a)}H371" stroke="var(--grid)"/><text x="${X(a)}" y="188" text-anchor="middle">${a}°</text><text x="37" y="${Y(a)+4}" text-anchor="end">${a}°</text>`;
 out+='<path d="M48 28V170H374" stroke="var(--muted)" fill="none"/><text x="48" y="17">Axle turn</text><text x="371" y="207" text-anchor="end">Knob turn</text><path d="M48 170L371 30" stroke="var(--graph)" stroke-width="3"/>';
 out+=`<circle id="graph-point" cx="${X(current)}" cy="${Y(current)}" r="6" fill="var(--coral)" stroke="var(--paper)" stroke-width="2"/>`;$('#plot').innerHTML=out;
}
function render(){const m=model(current),angle=Math.round(current),lift=Math.round(cover),state=m.extension<.01?'Latch in':m.retraction<.01?'Latch out':'Latch moving';
 for(const [id,value,max] of [['angle',current,90],['cover',cover,100]]){$('#'+id).value=value;$('#'+id).style.setProperty('--fill',value/max*100+'%');$('#'+id+'-value').textContent=Math.round(value);}
 for(const id of ['knob','axle']){$('#'+id+'-output').innerHTML=`${angle}<small>°</small>`;$('#'+id+'-bar').style.width=current/90*100+'%';}
 $('#latch-output').textContent=`${m.retraction.toFixed(1)} mm inward`;$('#status').textContent=state.toUpperCase();
 $('#finding').textContent=m.extension<.01?'The latch is flush with the door edge. Release the knob to let it slide out.':m.retraction<.01?'The latch sticks out. Turn the knob to draw it inward.':'The turning axle moves the cam. Its pin pulls the follower and latch inward.';
 $('[data-readout]').textContent=`Knob ${angle}° · axle ${angle}° · ${state.toLowerCase()}`;
 for(const [id,value,max] of [['knob',angle,90],['cover',lift,100]]){const hint=$('#'+id+'-hint');hint.textContent=`${id==='knob'?'↔ Turn knob':'↕ Lift cover'} · ${value}${id==='knob'?'°':'%'}`;hint.setAttribute('aria-valuenow',value);hint.setAttribute('aria-valuetext',id==='knob'?`${value} degrees; axle also ${value} degrees`:`${value} percent lifted`);hint.classList.toggle('selected',selected===id);}
 $('#turn').textContent=target>45?'↶ Release knob':'↻ Turn knob';geometry();graph();
}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
function wake(){if(reduced.matches||!visible||document.hidden){pause();current=target;cover=coverTarget;render();return;}if(!frame)frame=requestAnimationFrame(tick);}
function set(part,value){stop();selected=part;if(part==='knob')target=clamp(value,0,90);else coverTarget=clamp(value,0,100);wake();}
function tick(now){frame=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.04):1/60;last=now;
 if(auto){time+=dt;target=45-45*Math.cos(time*.9);}current+=(target-current)*(1-Math.exp(-dt/.14));cover+=(coverTarget-cover)*(1-Math.exp(-dt/.14));if(Math.abs(target-current)<.02)current=target;if(Math.abs(coverTarget-cover)<.02)cover=coverTarget;render();
 if(auto||current!==target||cover!==coverTarget)frame=requestAnimationFrame(tick);else last=0;
}
$('#angle').oninput=e=>set('knob',+e.target.value);$('#cover').oninput=e=>set('cover',+e.target.value);
$('#turn').onclick=()=>set('knob',target>45?0:90);
$('#reset').onclick=()=>{stop();pause();current=target=0;cover=coverTarget=75;selected='knob';time=0;render();};
$('#play').onclick=()=>{if(auto){stop();return;}if(reduced.matches){set('knob',target>45?0:90);return;}auto=true;time=Math.acos(1-current/45)/.9;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
function keys(e,part){const value=part==='knob'?target:coverTarget,max=part==='knob'?90:100,step=e.shiftKey?15:5,values={ArrowRight:value+step,ArrowUp:value+step,ArrowLeft:value-step,ArrowDown:value-step,Home:0,End:max};if(e.key in values){e.preventDefault();set(part,values[e.key]);}}
stage.onkeydown=e=>{if(e.target===stage)keys(e,selected);};for(const part of ['knob','cover'])$('#'+part+'-hint').onkeydown=e=>keys(e,part);
let drag=null;
stage.onpointerdown=e=>{if(e.button!==0)return;const part=e.target.closest('[data-part]')?.dataset.part||(e.target.closest('#cover-hint')?'cover':e.target.closest('#knob-hint')?'knob':null);if(!['knob','cover'].includes(part))return;stop();selected=part;drag={part,x:e.clientX,y:e.clientY,value:part==='knob'?target:coverTarget};stage.setPointerCapture(e.pointerId);if(!e.target.closest('.move-hint'))stage.focus({preventScroll:true});};
stage.onpointermove=e=>{if(!drag)return;const svg=stage.querySelector('svg').getBoundingClientRect();set(drag.part,drag.value+(drag.part==='knob'?(e.clientX-drag.x)/svg.width*240:(drag.y-e.clientY)/svg.height*230));};
for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>drag=null);
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)wake();else pause();}).observe(stage);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else wake();});
reduced.addEventListener('change',()=>{if(reduced.matches)stop();wake();});new ResizeObserver(positionHints).observe(stage);document.addEventListener('model-fullscreen-change',positionHints);
window.doorHandle={model,P,getState:()=>({current,target,cover,coverTarget,auto,selected,visible,frame,...model(current)}),geometry:()=>({solids,faces,orderAudit}),set};
render();
