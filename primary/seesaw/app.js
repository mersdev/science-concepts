const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const P={origin:[400,340],scale:1.4,azimuth:85,elevation:20},reduced=matchMedia('(prefers-reduced-motion: reduce)');
const defaults=()=>({left:{mass:60,distance:1.5},right:{mass:40,distance:1.5}});
let riders=defaults(),selected='left',current=0,target=0,auto=false,frame=0,last=0,time=0,visible=true;
// Reference moments at horizontal; cos(theta) multiplies both actual moments equally.
function model(left,right){const a=left.mass*left.distance,b=right.mass*right.distance,difference=a-b;return {left:a*9.8,right:b*9.8,difference,balanced:Math.abs(difference)<1e-7,angle:Math.abs(difference)<1e-7?0:12*Math.PI/180*Math.tanh(difference/30)};}
const state=()=>model(riders.left,riders.right),view=[Math.cos(85*Math.PI/180)*Math.cos(20*Math.PI/180),Math.sin(85*Math.PI/180)*Math.cos(20*Math.PI/180),Math.sin(20*Math.PI/180)];
let faces=[],solids=[],layer=0;
const shade=(hex,f)=>'#'+hex.slice(1).match(/../g).map(v=>Math.min(255,Math.round(parseInt(v,16)*f)).toString(16).padStart(2,'0')).join('');
function rotate([x,y,z]){return [x*Math.cos(current)-(z-75)*Math.sin(current),y,75+x*Math.sin(current)+(z-75)*Math.cos(current)];}
function solid(points,color,moving=false,rider='',part=''){
 const pts=moving?points.map(rotate):points,n=pts.length/2,center=pts[0].map((_,i)=>pts.reduce((s,p)=>s+p[i],0)/pts.length);
 solids.push({points:pts,rider,part,layer});
 const sides=[Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i+n),...Array.from({length:n},(_,i)=>[i,(i+1)%n,(i+1)%n+n,i+n])];
 for(const ids of sides){const p=ids.map(i=>pts[i]),c=p[0].map((_,i)=>p.reduce((s,v)=>s+v[i],0)/p.length),u=p[1].map((v,i)=>v-p[0][i]),v=p[2].map((v,i)=>v-p[0][i]);let normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...normal);if(!len)continue;if(normal.reduce((s,v,i)=>s+v*(c[i]-center[i]),0)<0)normal=normal.map(v=>-v);if(normal.reduce((s,v,i)=>s+v*view[i],0)<=0)continue;faces.push({points:p,color:shade(color,.68+.28*Math.max(0,normal[2]/len)+.12*Math.max(0,normal[0]/len)),depth:c.reduce((s,v,i)=>s+v*view[i],0),rider,part,layer});}
}
function block(x,y,z,w,d,h,c,m=false,r='',part=''){const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]];solid([...p,...p.map(([x,y,z])=>[x,y,z+h])],c,m,r,part);}
function prismXZ(outline,y,d,c,m=false,r=''){solid([...outline.map(([x,z])=>[x,y,z]),...outline.map(([x,z])=>[x,y+d,z])],c,m,r);}
function rider(side){const outward=side==='left'?-1:1,inward=-outward,x=outward*riders[side].distance*60,c=side==='left'?'#ed9277':'#78b6da',hair=side==='left'?'#785247':'#594e48';
 // Mirror the complete seated pose: +local x always points toward the other rider.
 const B=(a,y,z,w,d,h,color,part='')=>block(x+inward*(a+(inward<0?w:0)),y,z,w,d,h,color,true,side,part);
 const leg=y=>{B(-6,y,87,15,4,6,'#697a91','thigh');B(5,y,73,4,4,14,'#697a91','shin');B(4,y-1,70,9,6,3,'#f5e2b4','shoe');};
 // Far legs sit behind the beam; seats and near legs sit on/in front of it.
 layer=1;leg(-16);layer=3;
 B(-12,-14,80,24,28,3,'#526b69','seat-shoe');B(-14,-16,83,28,32,4,c,'seat');
 for(const xx of [-10,10])for(const y of [-12,12])B(xx-.7,y-.7,87,1.4,1.4,.5,'#f8e5aa');
 for(const y of [-10,10])B(8,y-1,87,2,2,15,'#efd179','handle');
 B(7,-11,102,4,22,3,'#648d84','grip');leg(12);
 B(-8,-16,90,13,32,6,'#697a91');B(-9,-10,96,15,20,20,c);
 B(-5,-5,116,8,10,3,'#efc49a');
 for(const y of [-12,9])solid([0,3].flatMap(d=>[[-7,112],[-3,115],[10,105],[8,102]].map(([a,z])=>[x+inward*a,y+d,z])),c,true,side,'arm');
 const outline=[[-8,-7],[-5,-10],[5,-10],[8,-7],[8,6],[5,9],[-5,9],[-8,6]].map(([a,b])=>[x+inward*a,128+b]);
 solid([...outline.map(([x,z])=>[x,-7,z]),...outline.map(([x,z])=>[x,7,z])],'#efc49a',true,side,'head');
 B(-8,-7,134,16,14,4,hair);B(-8,-7,128,3,14,6,hair);
 B(8,-2,127,3,4,4,'#efc49a','nose');B(4.5,7,130,1.6,.4,1.8,'#504f4b','eye');B(-3,7,125,3,.8,4,'#dca980','ear');
}
// ponytail: static parts are cached; only the rocking assembly is rebuilt per pose.
function foundation(){
 for(const x of [-153,153])for(const y of [-34,34])block(x-7,y-7,-8,14,14,5,'#64817a');
 block(-176,-47,-3,352,94,5,'#97b59d');block(-173,-44,2,346,88,1,'#c8ddaf');
 for(const x of [-162,162])for(const y of [-34,34]){block(x-4,y-4,3,8,8,.7,'#e2d7ad');block(x-.8,y-.8,3.7,1.6,1.6,.6,'#65796e');}
 for(const y of [-23,15]){block(-31,y-4,3,62,16,4,'#88a79c');prismXZ([[-27,7],[27,7],[6,75],[-6,75]],y,8,'#e5ba5b');block(-7,y,71,14,8,4,'#f3d285');}
 block(-6,-23,69,12,46,6,'#76968d');
}
foundation();const fixedFaces=faces.slice(),fixedSolids=solids.slice();
function geometry(){faces=fixedFaces.slice();solids=fixedSolids.slice();layer=2;
 block(-164,-12,75,328,24,5,'#74b7a5',true);
 for(const x of [-164,160])block(x,-12,75,4,24,5,'#f0c267',true);
 for(const y of [-10,7])block(-156,y,72,312,3,3,'#5a8e83',true);
 block(-155,8,80,310,3,.2,'#f9eac3',true);
 for(let i=-30;i<=30;i++)block(i*5-.2,8,80.2,.4,i%6?1.2:3,.12,i===0?'#a06439':'#78957e',true);
 rider('left');rider('right');
 // Near axle covers remain in front of the central beam on the fixed cheek.
 for(const y of [-24,23]){layer=y<0?0:4;block(-5,y,70,10,1,10,'#e8d699');block(-1,y+(y>0?1:-.5),74,2,.5,2,'#667f76');}
 faces.sort((a,b)=>a.layer-b.layer||a.depth-b.depth);
 $('#apparatus').innerHTML=faces.map(f=>`<polygon ${f.rider?`data-rider="${f.rider}"`:''} data-part="${f.part}" points="${f.points.map(p=>iso(p,P).join(',')).join(' ')}" fill="${f.color}"/>`).join('');
 for(const side of ['left','right']){const hint=$('#'+side+'-hint'),d=riders[side].distance;hint.textContent=`↔ ${side==='left'?'Left':'Right'} · ${d.toFixed(3)} m`;hint.setAttribute('aria-valuenow',d);hint.setAttribute('aria-valuetext',`${d.toFixed(3)} metres from fulcrum`);hint.classList.toggle('selected',selected===side);positionMoveHint(hint,rotate([(side==='left'?-1:1)*d*60,0,141]),P);}
 const left=$('#left-hint'),right=$('#right-hint'),a=left.getBoundingClientRect(),b=right.getBoundingClientRect();
 if(a.width&&a.right>b.left-6&&b.right>a.left-6&&a.bottom>b.top-6&&b.bottom>a.top-6)left.style.top=Math.max(18,parseFloat(left.style.top)-a.height-8)+'px';
}
function graph(){const m=state(),X=d=>44+d/2.5*330,Y=t=>175-t/2500*145;let out='';for(const t of [0,1000,2000])out+=`<path d="M44 ${Y(t)}H374" stroke="var(--border)"/><text x="35" y="${Y(t)+4}" text-anchor="end">${t}</text>`;for(const d of [0,1,2,2.5])out+=`<text x="${X(d)}" y="196" text-anchor="middle">${d}</text>`;out+='<text x="44" y="16">Turning effect (N·m)</text><text x="374" y="217" text-anchor="end">Left distance (m)</text>';
 out+=`<path d="M${X(.5)} ${Y(riders.left.mass*9.8*.5)}L374 ${Y(riders.left.mass*9.8*2.5)}" fill="none" stroke="#ae553d" stroke-width="3"/><path d="M44 ${Y(m.right)}H374" stroke="#326d98" stroke-width="2"/><circle id="graph-point" cx="${X(riders.left.distance)}" cy="${Y(m.left)}" r="5" fill="#ae553d"/>`;$('#graph-content').innerHTML=out;$('#graph').setAttribute('aria-label',`Left turning effect ${m.left.toFixed(1)} newton metres at ${riders.left.distance.toFixed(3)} metres. Right reference ${m.right.toFixed(1)} newton metres.`);
}
function render(){const m=state(),status=m.balanced?'Balanced':m.difference>0?'Left side down':'Right side down';
 for(const side of ['left','right']){for(const prop of ['mass','distance']){const e=$('#'+side+'-'+prop),v=riders[side][prop];e.value=v;e.style.setProperty('--fill',(v-Number(e.min))/(Number(e.max)-Number(e.min))*100+'%');$('#'+side+'-'+prop+'-value').textContent=prop==='mass'?v.toFixed(0):v.toFixed(3);}
 $('#'+side+'-effect').innerHTML=`${m[side].toFixed(1)} <small>N·m</small>`;$('#'+side+'-product').textContent=`${riders[side].mass.toFixed(0)} kg × ${riders[side].distance.toFixed(3)} m × 9.8`;$('#'+side+'-bar').style.width=m[side]/2450*100+'%';}
 $('#condition').textContent=status.toUpperCase();$('#balance-state').textContent=status;$('#finding').textContent=m.balanced?'Equal turning effects balance the beam. The fulcrum is the fixed point it turns around.':`${m.difference>0?'Left':'Right'} has the stronger turning effect. Move that rider nearer the fulcrum, or the other rider farther away.`;
 $('[data-readout]').textContent=`${status} · L ${m.left.toFixed(1)} / R ${m.right.toFixed(1)} N·m`;
 for(const b of document.querySelectorAll('.selector [data-rider]')){b.classList.toggle('selected',b.dataset.rider===selected);b.setAttribute('aria-pressed',b.dataset.rider===selected);}
 geometry();graph();
}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
function wake(){target=state().angle;if(reduced.matches||!visible||document.hidden){current=target;render();return;}if(!frame)frame=requestAnimationFrame(tick);}
function change(side,prop,value){stop();riders[side][prop]=clamp(value,prop==='mass'?40:.5,prop==='mass'?100:2.5);selected=side;wake();render();}
function balance(){stop();const a=riders.left.mass,b=riders.right.mass,product=clamp(a*riders.left.distance,Math.max(a,b)*.5,Math.min(a,b)*2.5);riders.left.distance=product/a;riders.right.distance=product/b;wake();render();}
function tick(now){frame=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.04):0;last=now;
 if(auto){time+=dt;riders.left.mass=60;riders.right.mass=40;riders.left.distance=1.5+Math.sin(time*.7)*.8;riders.right.distance=1.5+Math.sin(time*.7+2)*.8;target=state().angle;}
 current+=(target-current)*(1-Math.exp(-dt/.2));if(Math.abs(target-current)<.00001)current=target;render();if(auto||current!==target)frame=requestAnimationFrame(tick);else last=0;
}
for(const side of ['left','right'])for(const prop of ['mass','distance'])$('#'+side+'-'+prop).oninput=e=>change(side,prop,+e.target.value);
for(const b of document.querySelectorAll('.selector [data-rider]'))b.onclick=()=>{stop();selected=b.dataset.rider;render();};
$('#balance').onclick=balance;$('#reset').onclick=()=>{stop();pause();riders=defaults();selected='left';current=target=state().angle;time=0;render();};
$('#play').onclick=()=>{if(auto){stop();return;}if(reduced.matches){change('left','distance',riders.left.distance>1.5?.5:2.5);return;}auto=true;time=0;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
function keys(e,side){const v=riders[side].distance,step=e.shiftKey?.5:.1,values={ArrowRight:v+step,ArrowUp:v+step,ArrowLeft:v-step,ArrowDown:v-step,Home:.5,End:2.5};if(e.key in values){e.preventDefault();change(side,'distance',values[e.key]);}}
$('#stage').onkeydown=e=>{if(e.target===$('#stage'))keys(e,selected);};for(const side of ['left','right'])$('#'+side+'-hint').onkeydown=e=>keys(e,side);
let drag=null;
$('#stage').onpointerdown=e=>{if(e.button!==0)return;const side=e.target.closest('[data-rider]')?.dataset.rider|| (e.target.closest('#left-hint')?'left':e.target.closest('#right-hint')?'right':null);if(!side)return;e.preventDefault();stop();selected=side;drag={side,x:e.clientX,y:e.clientY,value:riders[side].distance};(e.target.closest('.move-hint')||$('#stage')).focus({preventScroll:true});render();$('#stage').setPointerCapture(e.pointerId);};
$('#stage').onpointermove=e=>{if(!drag)return;const matrix=$('#stage svg').getScreenCTM(),a=axisVector(P,[60*Math.cos(current),0,60*Math.sin(current)]),dx=a[0]*matrix.a+a[1]*matrix.c,dy=a[0]*matrix.b+a[1]*matrix.d;change(drag.side,'distance',drag.value+(drag.side==='left'?-1:1)*((e.clientX-drag.x)*dx+(e.clientY-drag.y)*dy)/(dx*dx+dy*dy));};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#stage').addEventListener(event,()=>drag=null);
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)wake();else pause();}).observe($('#stage'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else wake();});reduced.addEventListener('change',()=>{stop();pause();wake();});
document.addEventListener('model-fullscreen-change',render);new ResizeObserver(()=>geometry()).observe($('#stage'));
window.seesaw={model,getState:()=>({riders:structuredClone(riders),...state(),selected,current,target,auto}),geometry:()=>({P,faces,solids}),set:(side,prop,value)=>change(side,prop,value)};
current=target=state().angle;render();
