const $=s=>document.querySelector(s),P={origin:[400,240],scale:3.4,azimuth:90,elevation:60};
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let input=18,output=36,current=0,target=0,direction=1,motion=1,auto=false,frame=0,last=0,visible=true;
const state=()=>Gear.model(input,output,current,motion),circle=(x,y,r,n=32)=>Array.from({length:n},(_,i)=>[x+r*Math.cos(i*Gear.TAU/n),y+r*Math.sin(i*Gear.TAU/n)]);
const poly=(p,c)=>`<polygon points="${p.map(v=>iso(v,P).map(x=>x.toFixed(2)).join(',')).join(' ')}" fill="${c}"/>`;
function extrusion(plan,z,h,c,side='#719487'){const lower=plan.map(([x,y])=>[x,y,z]),top=plan.map(([x,y])=>[x,y,z+h]);let svg='';for(let i=0;i<plan.length;i++){const j=(i+1)%plan.length;if(plan[j][0]<plan[i][0])svg+=poly([lower[i],lower[j],top[j],top[i]],side);}return svg+poly(top,c);}
const box=(x,y,w,d,z,h,c,side)=>extrusion([[x,y],[x+w,y],[x+w,y+d],[x,y+d]],z,h,c,side);
let profiles=[],centers=[],bounds=[];
function setup(){profiles=[Gear.profile(input),Gear.profile(output)];centers=Gear.centers(input,output);let svg='';
 for(const x of [-77,77])for(const y of [-36,36])svg+=box(x-4,y-4,8,8,-9,5,'#5a756d','#455d56');
 svg+=box(-86,-46,172,92,-4,4,'#b9d3ba','#8ea89c')+box(-84,-44,168,88,0,1,'#deead5','#b0c6b0');
 for(const y of [-32,30])svg+=box(-77,y,154,2,1,.7,'#8cb1a3','#65867a');
 for(const x of [-79,79])for(const y of [-38,38])svg+=extrusion(circle(x,y,1.5,12),1,.5,'#faf1ce','#9eaa91');
 for(let i=0;i<2;i++){const [x,y]=centers[i];svg+=box(x-9,-12,18,24,1,2,'#a7beb0','#78978b')+box(x-7,-9,14,18,3,3,'#c7d9c9','#8da89b')+extrusion(circle(x,y,6,32),6,3,'#e9dfb9','#a69d7b')+extrusion(circle(x,y,3.5,24),9,3,'#9aaea8','#627c73');
  for(const xx of [x-5,x+5])svg+=extrusion(circle(xx,7,1,12),6,.5,'#fff3cf','#8fa58c');
  svg+=box(x-11,38,22,4,1,.3,i?'#78bda9':'#e9b564');
  for(let n=0;n<3;n++)svg+=box(x-8+n*5,39,3,.4,1.3,.1,'#739080');
 }
 $('#bench').innerHTML=svg;render();
}
function wheel(i,angle){const n=i?output:input,r=n,[cx,cy]=centers[i],plan=Gear.transformed(profiles[i],centers[i],angle),low=plan.map(([x,y])=>[x,y,11]),top=plan.map(([x,y])=>[x,y,15]);let side='';
 const edges=plan.map((p,j)=>({p,q:plan[(j+1)%plan.length],j})).filter(e=>e.q[0]<e.p[0]).sort((a,b)=>a.p[1]+a.q[1]-b.p[1]-b.q[1]);for(const {j} of edges){const k=(j+1)%plan.length;side+=poly([low[j],low[k],top[k],top[j]],i?'#48947f':'#b67f40');}
 let svg=poly(top,i?'#7ac6ad':'#efbb64');
 const at=(radius,a)=>[cx+radius*Math.cos(a+angle),cy+radius*Math.sin(a+angle)];
 for(let j=0;j<3;j++){const a=j*Gear.TAU/3,p=[at(r*.35,a-.18),at(r*.72,a-.12),at(r*.72,a+.12),at(r*.35,a+.18)];svg+=poly(p.map(([x,y])=>[x,y,15.03]),i?'#60a890':'#d69c4f');const [x,y]=at(r*.52,a);svg+=extrusion(circle(x,y,.85,12),15.05,.25,'#fff1cc','#929d85');}
 // A bright index stud is attached to the wheel's top face.
 const marker=at(r*.82,0);svg+=extrusion(circle(...marker,1.4,16),15,.4,i?'#f9e9a7':'#e2794e','#846c4d');
 svg+=extrusion(circle(cx,cy,4.6,28),15,2,'#e0d8b6','#9a9d82')+extrusion(circle(cx,cy,2,20),17,2,'#718f84','#4b6d61');
 if(i===0){const tip=at(r*.60,Math.PI),a=at(2,Math.PI),v=[tip[0]-a[0],tip[1]-a[1]],len=Math.hypot(...v),p=[-v[1]/len*1.5,v[0]/len*1.5];svg+=extrusion([[a[0]+p[0],a[1]+p[1]],[tip[0]+p[0],tip[1]+p[1]],[tip[0]-p[0],tip[1]-p[1]],[a[0]-p[0],a[1]-p[1]]],19,1.5,'#f2dcaa','#ae9468')+extrusion(circle(...tip,2.2,20),20.5,5,'#e88b61','#a76145');}
 bounds.push(...low,...top);return {side,svg};
}
function render(){if(!profiles.length)return;const m=state(),phases=Gear.phase(input,output,current);bounds=[];const wheels=phases.map((a,i)=>wheel(i,a));$('#gear-sides').innerHTML=wheels.map(w=>w.side).join('');$('#driver').innerHTML=wheels[0].svg;$('#driven').innerHTML=wheels[1].svg;
 $('#input').value=input;$('#output').value=output;$('#rotation').value=clamp(current*360,-720,720);$('#rotation').style.setProperty('--fill',(current+2)/4*100+'%');$('#rotation-value').textContent=(current*360).toFixed(0);
 $('#driver-turns').innerHTML=`${current.toFixed(2)} <small>turns</small>`;$('#driven-turns').innerHTML=`${m.driven.toFixed(2)} <small>turns</small>`;
 $('#driver-direction').textContent=motion>0?'↻ Clockwise':'↺ Counterclockwise';$('#driven-direction').textContent=motion>0?'↺ Counterclockwise':'↻ Clockwise';
 $('#finding').textContent=output===input?'Equal tooth counts give equal rotation speeds, in opposite directions.':output>input?'The larger driven gear turns more slowly: more teeth must pass the contact point.':'The smaller driven gear turns faster: fewer teeth make one complete turn.';
 $('#prediction').textContent=`For 1 driver turn: ${m.ratio.toFixed(2)} driven turns, the opposite way.`;
 $('[data-readout]').textContent=`Driver ${current.toFixed(2)} · driven ${m.driven.toFixed(2)} turns`;
 $('#turn').textContent=direction>0?'↻ Turn ½':'↺ Turn ½';$('#turn').disabled=direction>0?target>=2:target<=-2;$('#reverse').textContent=direction>0?'⇄ Use ↺':'⇄ Use ↻';
 const hint=$('#crank-hint');hint.setAttribute('aria-valuenow',(current*360).toFixed(1));hint.textContent=`↻ Crank ${(current*360).toFixed(0)}°`;const a=phases[0]+Math.PI;positionMoveHint(hint,[centers[0][0]+input*.6*Math.cos(a),input*.6*Math.sin(a),26],P);graph();
}
function graph(){const X=t=>44+(t+2)/4*320,Y=t=>112-t/4*78,m=state();let out='';for(const y of [-4,-2,0,2,4])out+=`<path d="M44 ${Y(y)}H364" stroke="var(--border)"/><text x="32" y="${Y(y)+4}" text-anchor="end">${y}</text>`;for(const x of [-2,-1,0,1,2])out+=`<text x="${X(x)}" y="207" text-anchor="middle">${x}</text>`;out+='<text x="44" y="16">Driven turns</text><text x="364" y="228" text-anchor="end">Driver turns</text>';out+=`<path d="M${X(-2)} ${Y(2*m.ratio)}L${X(2)} ${Y(-2*m.ratio)}" fill="none" stroke="var(--teal)" stroke-width="3"/><circle cx="${X(current)}" cy="${Y(m.driven)}" r="5" fill="var(--coral)"/>`;$('#graph').innerHTML=out;}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function set(turns){stop();target=clamp(turns,-2,2);if(Math.abs(target-current)>.00001)motion=Math.sign(target-current);if(!visible||reduced.matches)current=target;wake();render();}
function wake(){if(reduced.matches){current=target;render();return;}if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
function tick(now){frame=0;const dt=last?Math.min((now-last)/1000,.04):0;last=now;if(auto){target+=direction*dt*.25;if(target>=2||target<=-2){target=clamp(target,-2,2);direction*=-1;}}if(Math.abs(target-current)>.000001)motion=Math.sign(target-current);current+=(target-current)*(1-Math.exp(-dt/.14));if(Math.abs(current-target)<.00001)current=target;render();if(visible&&!document.hidden&&(auto||current!==target))frame=requestAnimationFrame(tick);else last=0;}
for(const id of ['input','output'])$('#'+id).onchange=e=>{stop();if(id==='input')input=+e.target.value;else output=+e.target.value;current=target=0;setup();};
$('#rotation').oninput=e=>set(+e.target.value/360);$('#turn').onclick=()=>set(target+direction*.5);$('#reverse').onclick=()=>{stop();direction*=-1;motion=direction;render();};$('#reset').onclick=()=>{stop();input=18;output=36;current=target=0;direction=motion=1;setup();};
$('#play').onclick=()=>{if(auto){stop();return;}if(reduced.matches){set(target+direction*.5);return;}auto=true;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
function keys(e){const step=(e.shiftKey?45:5)/360,values={ArrowRight:target+step,ArrowUp:target+step,ArrowLeft:target-step,ArrowDown:target-step,Home:-2,End:2};if(e.key in values){e.preventDefault();set(values[e.key]);}}
$('#stage').onkeydown=e=>{if(e.target===$('#stage')||e.target===$('#crank-hint'))keys(e);};
function pointerAngle(e){const svg=$('#stage svg'),p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse()),c=iso([...centers[0],0],P),k=3.4*Math.sqrt(1.6);return Math.atan2((p.y-c[1]+25.5*Math.cos(Math.PI/3)*k)/Math.sin(Math.PI/3),(p.x-c[0]));}
let drag=null;$('#stage').onpointerdown=e=>{if(e.button!==0)return;stop();drag={angle:pointerAngle(e),turns:target};$('#stage').setPointerCapture(e.pointerId);};$('#stage').onpointermove=e=>{if(!drag)return;const a=pointerAngle(e),delta=Math.atan2(Math.sin(a-drag.angle),Math.cos(a-drag.angle));drag.turns=clamp(drag.turns+delta/Gear.TAU,-2,2);drag.angle=a;set(drag.turns);};for(const event of ['pointerup','pointercancel'])$('#stage').addEventListener(event,()=>drag=null);
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;visible?wake():pause();}).observe($('#stage'));document.addEventListener('visibilitychange',()=>document.hidden?pause():wake());reduced.addEventListener('change',()=>{stop();pause();wake();});
const turn=$('#turn'),reverse=$('#reverse'),parent=turn.parentNode,next=reverse.nextSibling;document.addEventListener('model-fullscreen-change',e=>{if(e.detail)$('.fullscreen-actions').append(turn,reverse);else{parent.insertBefore(turn,next);parent.insertBefore(reverse,next);}render();});new ResizeObserver(render).observe($('#stage'));
window.gears={getState:()=>({...state(),current,target,direction,auto}),geometry:()=>bounds};setup();
