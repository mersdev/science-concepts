const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const P={origin:[405,272],scale:1.4,azimuth:75,elevation:28},S=65,H=1,MASS=10,G=9.8;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),stage=$('#stage');
let lengths={a:1.5,b:3},current=0,target=0,selected='a-load',auto=false,time=0,visible=true,frame=0,last=0;
// ponytail: ideal steady motion; friction and inertia are outside this comparison.
function model(length,progress=0){const L=clamp(Number(length)||1.5,1.5,4),p=clamp(Number(progress)||0,0,100)/100,run=Math.sqrt(L*L-H*H),sin=H/L,cos=run/L;return {length:L,run,angle:Math.asin(sin)*180/Math.PI,sin,cos,force:MASS*G*H/L,distance:p*L,height:p*H,work:MASS*G*H,p};}
const C={a:'#e58e73',b:'#78add0',base:'#8fab97',mat:'#c3d9af',dark:'#5d7a71',steel:'#94b1aa',wood:'#dcb27d',light:'#f2dfb3',gold:'#e8c064'};
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/Math.hypot(...a));
const cam=cameraOf(P),U=[cam.sinA,-cam.cosA,0],W=[cam.cosA*cam.sinE,cam.sinA*cam.sinE,-cam.cosE],V=[cam.cosA*cam.cosE,cam.sinA*cam.cosE,cam.sinE];
const shade=(c,f)=>'#'+c.slice(1).match(/../g).map(v=>Math.round(Math.min(255,parseInt(v,16)*f)).toString(16).padStart(2,'0')).join('');
let faces=[],solids=[],orderAudit={cycles:0,crossings:0};
function face(points,color,part='',name=''){let n=cross(sub(points[1],points[0]),sub(points[2],points[0]));if(Math.hypot(...n)<1e-8||dot(n,V)<=1e-8)return;n=unit(n);const screen=points.map(p=>iso(p,P)),bounds={l:Math.min(...screen.map(p=>p[0])),r:Math.max(...screen.map(p=>p[0])),t:Math.min(...screen.map(p=>p[1])),b:Math.max(...screen.map(p=>p[1]))};faces.push({points,screen,bounds,n,plane:dot(n,points[0]),color:shade(color,.7+.24*Math.max(0,n[2])+.12*Math.max(0,n[0])+.07*Math.max(0,n[1])),part,name});}
function prism(poly,vector,color,name,part=''){const points=[...poly,...poly.map(p=>add(p,vector))],n=poly.length,center=mul(points.reduce((a,b)=>add(a,b),[0,0,0]),1/points.length),start=faces.length;
 for(const ids of [Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i+n),...Array.from({length:n},(_,i)=>[i,(i+1)%n,(i+1)%n+n,i+n])]){let p=ids.map(i=>points[i]);const mid=mul(p.reduce((a,b)=>add(a,b),[0,0,0]),1/p.length);if(dot(cross(sub(p[1],p[0]),sub(p[2],p[0])),sub(mid,center))<0)p=p.reverse();face(p,color,part,name);}
 solids.push({poly,vector,name,part,faces:faces.slice(start)});
}
function box(x,y,z,w,d,h,c,name,part=''){prism([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],[0,0,h],c,name,part);}
function screw(x,y,z,name,part=''){box(x-1.7,y-1.7,z,3.4,3.4,.6,C.light,name,part);box(x-1,y-.2,z+.6,2,.4,.08,C.dark,name+' slot',part);}
function foundation(){
 for(const x of [-185,135])for(const y of [-110,110])box(x-7,y-7,0,14,14,6,C.dark,'stand.foot');
 box(-200,-125,6,350,250,8,C.base,'stand.bench');box(-197,-122,14,344,244,2,C.mat,'stand.inlay');
 for(const x of [-188,138])for(const y of [-113,113])screw(x,y,16,'bench screw');
 for(const y of [-51,39])box(86,y,16,12,12,3,C.steel,'height post foot');
 for(const y of [-51,47])box(90,y,19,4,4,78,C.dark,'height post');
 box(90,-51,97,4,102,3,C.gold,'height crossbar');
 box(94,47,32,.2,4,65,C.light,'height scale');for(let i=0;i<=10;i++)box(94.2,47,32+i*6.45,.15,i%5?2:3.8,.4,C.dark,'height tick');
}
foundation();const fixedFaces=faces.slice(),fixedSolids=solids.slice();
function lane(side){const m=model(lengths[side],current),y=side==='a'?-75:75;return {...m,y,start:90-m.run*S,T:[m.cos,0,m.sin],N:[-m.sin,0,m.cos]};}
function point(side,t,y=0){const m=lane(side);return [m.start+t*S*m.cos,m.y+y,32+t*S*m.sin];}
function strip(side,t0,t1,y,d,z,h,c,name){const a=add(point(side,t0,y),[0,0,z]),b=add(point(side,t1,y),[0,0,z]);prism([a,b,add(b,[0,0,h]),add(a,[0,0,h])],[0,d,0],c,name);}
function ramp(side){const m=lane(side),L=m.length,c=C[side],low=point(side,-.23),high=point(side,L+.23),part=side+'-length';
 strip(side,-.23,L+.23,-24,48,-3,3,c,'ramp deck');
 for(const y of [-24,21]){box(low[0],m.y+y,16,high[0]-low[0],3,2,C.dark,'bottom runner');prism([[low[0],m.y+y,18],[high[0],m.y+y,18],[high[0],m.y+y,high[2]-3],[low[0],m.y+y,low[2]-3]],[0,3,0],shade(c,.87),'supporting cheek');}
 for(const x of [low[0]+4,high[0]-7])box(x,m.y-21,16,3,42,2,C.steel,'cross tie');
 // The colored toe is the adjustable end, separate from the crates' travel control.
 box(low[0]-18,m.y+24,16,35,8,4,c,'toe shoe',part);for(const x of [low[0]-12,low[0]+12])screw(x,m.y+28,20,'toe screw',part);
 strip(side,0,L,21,3,0,.15,C.light,'distance strip');
 for(let t=0;t<L-.001;t+=.25){const end=Math.min(L,t+.012),y=t%1<.001?21:22.4;strip(side,t,end,y,24-y,.15,.07,C.dark,'distance tick');}
 for(const t of [-.17,L+.17]){const base=point(side,t,-20),p=(u,y,n)=>add(base,add(mul(m.T,u),add([0,y,0],mul(m.N,n))));prism([p(-1.5,-1.5,0),p(1.5,-1.5,0),p(1.5,1.5,0),p(-1.5,1.5,0)],mul(m.N,.6),C.light,'deck screw');prism([p(-1,-.2,.6),p(1,-.2,.6),p(1,.2,.6),p(-1,.2,.6)],mul(m.N,.08),C.dark,'deck screw slot');}
 // External battens reinforce the near side, with flush top edges under the deck.
 for(const f of [.2,.5,.8]){const p=point(side,L*f),x=p[0],z=p[2]-3;prism([[x-1,m.y+24,18],[x+1,m.y+24,18],[x+1,m.y+24,z+m.sin/m.cos],[x-1,m.y+24,z-m.sin/m.cos]],[0,.6,0],C.light,'side batten');for(const zz of [21,z-4])box(x-.6,m.y+24.6,zz,1.2,.3,1.2,C.gold,'batten rivet');}
}
function crate(side){const m=lane(side),base=point(side,m.p*m.length),part=side+'-load';
 const B=(u,y,n,w,d,h,c,name)=>{const p=(u,y)=>add(base,add(mul(m.T,u),add([0,y,0],mul(m.N,n))));prism([p(u,y),p(u+w,y),p(u+w,y+d),p(u,y+d)],mul(m.N,h),c,name,part);};
 for(const y of [-11,8])B(-11,y,0,22,3,2,C.dark,'crate runner');
 B(-11,-12,2,22,24,18,C.wood,'crate');
 for(const y of [-9,7])B(-11,y,20,22,2,1,C[side],'crate strap');B(-9,-6,20,18,12,.35,C.light,'crate top panel');
 for(const u of [-11,8]){B(u,12,2,3,.4,16,C.steel,'crate corner guard');for(const n of [5,15]){B(u+.6,12.4,n,1.5,.3,1.5,C.gold,'crate fastener');B(u+.9,12.7,n+.6,.9,.05,.25,C.dark,'crate fastener slot');}}
}
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

function geometry(){faces=fixedFaces.slice();solids=fixedSolids.slice();for(const side of ['a','b']){ramp(side);crate(side);}const sorted=orderedFaces();$('#apparatus').innerHTML=sorted.map(f=>`<polygon ${f.part?`data-part="${f.part}"`:''} points="${f.screen.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')}" fill="${f.color}"/>`).join('');positionHints();return {faces:sorted,solids,orderAudit};}
function positionHints(){for(const side of ['a','b']){const m=lane(side),toe=[point(side,-.23)[0]-10,m.y+28,21],load=add(point(side,m.p*m.length),mul(m.N,22));positionMoveHint($('#'+side+'-length-hint'),toe,P);positionMoveHint($('#'+side+'-load-hint'),load,P);}
 // Separate overlapping labels on small screens while retaining their x anchors.
 const hints=['a-length','b-length','a-load','b-load'].map(id=>$('#'+id+'-hint'));if(!hints[0].offsetWidth)return;
 for(let i=0;i<hints.length;i++)for(let j=0;j<i;j++){const a=hints[i].getBoundingClientRect(),b=hints[j].getBoundingClientRect();if(a.left<b.right+5&&a.right>b.left-5&&a.top<b.bottom+5&&a.bottom>b.top-5){const stageBox=stage.getBoundingClientRect();hints[i].style.top=clamp(b.bottom-stageBox.top+a.height/2+6,18,stageBox.height-20)+'px';}}
}
function graph(){const X=L=>46+(L-1.5)/2.5*324,Y=F=>171-F/75*142;let out='';for(const L of [1.5,2,2.5,3,3.5,4])out+=`<path d="M${X(L)} 29V171" stroke="var(--grid)"/><text x="${X(L)}" y="188" text-anchor="middle">${L.toFixed(1)}</text>`;for(const F of [0,25,50,75])out+=`<path d="M46 ${Y(F)}H370" stroke="var(--grid)"/><text x="36" y="${Y(F)+4}" text-anchor="end">${F}</text>`;
 out+='<path d="M46 27V171H374" stroke="var(--muted)" fill="none"/><text x="46" y="17">Uphill force / N</text><text x="370" y="208" text-anchor="end">Ramp length / m</text>';let d='';for(let i=0;i<=100;i++){const L=1.5+i*.025;d+=`${i?'L':'M'}${X(L)} ${Y(model(L).force)}`;}out+=`<path d="${d}" fill="none" stroke="var(--graph)" stroke-width="2.5"/>`;
 for(const side of ['a','b']){const m=model(lengths[side]);out+=`<circle id="${side}-point" cx="${X(m.length)}" cy="${Y(m.force)}" r="${side==='a'?6:4}" fill="${C[side]}" stroke="var(--paper)" stroke-width="2"/>`;}
 $('#plot').innerHTML=out;$('#graph').setAttribute('aria-label',`Required uphill force decreases as ramp length increases. Ramp A ${model(lengths.a).force.toFixed(1)} newtons; ramp B ${model(lengths.b).force.toFixed(1)} newtons.`);
}
function render(){const a=model(lengths.a,current),b=model(lengths.b,current);for(const side of ['a','b']){const m=side==='a'?a:b,id=side+'-length';$('#'+id).value=m.length;$('#'+id).style.setProperty('--fill',(m.length-1.5)/2.5*100+'%');$('#'+id+'-value').textContent=m.length.toFixed(2);$('#'+side+'-force').innerHTML=`${m.force.toFixed(1)} <small>N</small>`;$('#'+side+'-detail').textContent=`${m.length.toFixed(2)} m ramp · ${m.angle.toFixed(1)}° slope`;$('#'+side+'-force-bar').style.width=m.force/75*100+'%';$('#'+side+'-distance').textContent=m.distance.toFixed(2)+' m';
  for(const kind of ['length','load']){const hint=$('#'+side+'-'+kind+'-hint'),value=kind==='length'?m.length:Math.round(current);hint.textContent=`${kind==='length'?'↔':'↗'} ${side.toUpperCase()} ${kind==='length'?'ramp':'load'} · ${kind==='length'?value.toFixed(2)+' m':value+'%'}`;hint.setAttribute('aria-valuenow',value);hint.setAttribute('aria-valuetext',kind==='length'?`${value.toFixed(2)} metres; ${m.angle.toFixed(1)} degrees`:`Both loads ${value} percent up; ${m.height.toFixed(2)} metres risen`);hint.classList.toggle('selected',selected===side+'-'+kind);}}
 $('#progress').value=current;$('#progress').style.setProperty('--fill',current+'%');$('#progress-value').textContent=Math.round(current);$('#height-output').textContent=a.height.toFixed(2)+' / 1.00 m';
 const equal=Math.abs(a.length-b.length)<1e-8,long=a.length>b.length?'A':'B',ratio=Math.max(a.length,b.length)/Math.min(a.length,b.length),less=(1-1/ratio)*100;
 $('#finding').textContent=equal?'Equal lengths give equal slopes, forces and travel distances.':`${long} is gentler: ${less.toFixed(0)}% less force, but ${ratio.toFixed(2)}× the travel distance for the same rise.`;
 $('[data-readout]').textContent=`Rise ${a.height.toFixed(2)} m · A ${a.force.toFixed(1)} N · B ${b.force.toFixed(1)} N`;$('#move').textContent=target>50?'↙ Return loads':'↗ Move loads';geometry();graph();
}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
function wake(){if(reduced.matches||!visible||document.hidden){pause();current=target;render();return;}if(!frame)frame=requestAnimationFrame(tick);}
function set(part,value){stop();selected=part;if(part.endsWith('length'))lengths[part[0]]=clamp(value,1.5,4);else target=clamp(value,0,100);wake();}
function tick(now){frame=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.04):1/60;last=now;if(auto){time+=dt;target=50-50*Math.cos(time*.8);}current+=(target-current)*(1-Math.exp(-dt/.23));if(Math.abs(current-target)<.02)current=target;render();if(auto||current!==target)frame=requestAnimationFrame(tick);else last=0;}
for(const side of ['a','b'])$('#'+side+'-length').oninput=e=>set(side+'-length',+e.target.value);$('#progress').oninput=e=>set('a-load',+e.target.value);
$('#move').onclick=()=>set('a-load',target>50?0:100);$('#reset').onclick=()=>{stop();pause();lengths={a:1.5,b:3};current=target=0;selected='a-load';time=0;render();};
$('#play').onclick=()=>{if(auto){stop();return;}if(reduced.matches){set('a-load',target>50?0:100);return;}auto=true;time=Math.acos(1-current/50)/.8;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
function keys(e,part){const length=part.endsWith('length'),v=length?lengths[part[0]]:target,step=length?(e.shiftKey?.5:.1):(e.shiftKey?20:5),values={ArrowRight:v+step,ArrowUp:v+step,ArrowLeft:v-step,ArrowDown:v-step,Home:length?1.5:0,End:length?4:100};if(e.key in values){e.preventDefault();set(part,values[e.key]);}}
stage.onkeydown=e=>{if(e.target===stage)keys(e,selected);};for(const side of ['a','b'])for(const kind of ['length','load'])$('#'+side+'-'+kind+'-hint').onkeydown=e=>keys(e,side+'-'+kind);
let drag=null;stage.onpointerdown=e=>{if(e.button!==0)return;const part=e.target.closest('[data-part]')?.dataset.part||e.target.closest('.move-hint')?.id.replace('-hint','');if(!part)return;stop();selected=part;const m=lane(part[0]);drag={part,x:e.clientX,y:e.clientY,value:part.endsWith('length')?m.run:target,vector:part.endsWith('length')?[S,0,0]:[m.run*S,0,H*S]};stage.setPointerCapture(e.pointerId);if(!e.target.closest('.move-hint'))stage.focus({preventScroll:true});};
stage.onpointermove=e=>{if(!drag)return;const matrix=stage.querySelector('svg').getScreenCTM(),a=axisVector(P,drag.vector),dx=a[0]*matrix.a+a[1]*matrix.c,dy=a[0]*matrix.b+a[1]*matrix.d,delta=((e.clientX-drag.x)*dx+(e.clientY-drag.y)*dy)/(dx*dx+dy*dy);set(drag.part,drag.part.endsWith('length')?Math.sqrt(Math.max(Math.sqrt(1.25),drag.value-delta)**2+H*H):drag.value+delta*100);};
for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>drag=null);
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)wake();else pause();}).observe(stage);document.addEventListener('visibilitychange',()=>document.hidden?pause():wake());reduced.addEventListener('change',()=>{if(reduced.matches)stop();wake();});new ResizeObserver(positionHints).observe(stage);document.addEventListener('model-fullscreen-change',positionHints);
window.inclinedPlane={model,P,set,point,lane,geometry:()=>({faces,solids,orderAudit}),getState:()=>({lengths:{...lengths},current,target,auto,selected,frame,visible,a:model(lengths.a,current),b:model(lengths.b,current)})};render();
