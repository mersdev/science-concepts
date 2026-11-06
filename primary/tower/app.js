const $=s=>document.querySelector(s), P={origin:[330,294],scale:2.6,azimuth:55,elevation:25};
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Lengths are cm; b/hc is unitless. Disturbance is equivalent acceleration in m/s².
function model(h,w,shape,push=4){const b=(shape==='rectangle'?w/2:w)/2,hc=h/2,critical=9.81*b/hc;return {h,w,shape,push,b,hc,area:shape==='circle'?Math.PI*w*w/4:shape==='rectangle'?w*w/2:w*w,critical,tips:push>critical,boundary:Math.abs(push-critical)<1e-8};}
let height=60,width=24,shape='square',push=4,angle=0,tested=false,auto=false,visible=true,frame=0,last=0,elapsed=0,phase=0;
const state=()=>model(height,width,shape,push),faces=[];
function face(points,color){faces.push({points,color});}
function tx([x,y,z]){const a=angle*Math.PI/180,b=state().b;return [b+(x-b)*Math.cos(a)+z*Math.sin(a),y,-(x-b)*Math.sin(a)+z*Math.cos(a)];}
function shade(hex,f){return '#'+hex.slice(1).match(/../g).map(x=>Math.round(parseInt(x,16)*f).toString(16).padStart(2,'0')).join('');}
function prism(plan,z,h,color,rotate=false){const transform=p=>rotate?tx(p):p,low=plan.map(([x,y])=>transform([x,y,z])),top=plan.map(([x,y])=>transform([x,y,z+h]));for(let i=0;i<plan.length;i++){const j=(i+1)%plan.length;const u=low[j].map((v,k)=>v-low[i][k]),v=top[i].map((v,k)=>v-low[i][k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(n[0]*.520+n[1]*.742+n[2]*.423>0)face([low[i],low[j],top[j],top[i]],shade(color,.68+.125*(1+Math.sin(i/plan.length*Math.PI*2))));}face(top,color);}
const rect=(x,y,w,d)=>[[x,y],[x+w,y],[x+w,y+d],[x,y+d]];
function render(){const m=state();faces.length=0;
 for(const x of [-42,94])for(const y of [-32,32]){prism(rect(x-4,y-4,8,8),-12,4,'#526d68');prism(rect(x-3,y-3,6,6),-8,3,'#b1c8c3');}
 prism(rect(-52,-42,158,84),-5,4,'#8daaa2');prism(rect(-50,-40,154,80),-1,1,'#d5e5cf');
 for(const y of [-37,35])prism(rect(-47,y,148,2),0,.6,'#729b96');
 for(const x of [-46,98])for(const y of [-33,33])prism(rect(x-1,y-1,2,2),0,.7,'#f4d68a');
 prism(rect(-42,28,130,4),0,.25,'#faf1cd');for(let i=0;i<=26;i++)prism(rect(-41+i*4.8,28,.2,i%5===0?3.6:1.8),.25,.05,'#53796d');
 face([[-40,-9,.1],[-29,-9,.1],[-29,-13,.1],[-20,0,.1],[-29,13,.1],[-29,9,.1],[-40,9,.1]],tested?'#eb9c63':'#a5c7b6');
 const plan=shape==='circle'?Array.from({length:32},(_,i)=>[Math.cos(i*Math.PI/16)*width/2,Math.sin(i*Math.PI/16)*width/2]):rect(-m.b,-width/2,m.b*2,width),colors=['#6dbbaa','#efb75e','#8cb8d2','#e99b7f'];
 for(let i=0;i<8;i++){const z=i*height/8,hh=height/8;prism(plan,z,hh,colors[i%4],true);
  if(shape!=='circle')for(const side of [0,1])for(const t of [.22,.66]){if(side&&Math.cos(angle*Math.PI/180)*.520-Math.sin(angle*Math.PI/180)*.423<=0)continue;const y=width/2+.02,x=m.b+.02,w=m.b*2;
   const pts=side?[[x,-width/2+width*t,z+hh*.23],[x,-width/2+width*(t+.12),z+hh*.23],[x,-width/2+width*(t+.12),z+hh*.69],[x,-width/2+width*t,z+hh*.69]]:[[-m.b+w*t,y,z+hh*.23],[-m.b+w*(t+.12),y,z+hh*.23],[-m.b+w*(t+.12),y,z+hh*.69],[-m.b+w*t,y,z+hh*.69]];face(pts.map(tx),'#f5f1d8');}
 }
 // Supported parts are painted from the feet upward; each course hides the one behind it.
 $('#apparatus').innerHTML=faces.map(f=>`<polygon points="${f.points.map(p=>iso(p,P).join(',')).join(' ')}" fill="${f.color}"/>`).join('');
 const pt=iso(tx([0,width/2+.1,m.hc]),P);$('#apparatus').insertAdjacentHTML('beforeend',`<circle cx="${pt[0]}" cy="${pt[1]}" r="7" fill="#e77842" stroke="#fff9e7" stroke-width="2.5"/><circle cx="${pt[0]}" cy="${pt[1]}" r="2" fill="#fff9e7"/>`);
 for(const [id,value] of [['height',height],['width',width],['push',push]]){const slider=$('#'+id);slider.value=value;slider.style.setProperty('--fill',((value-Number(slider.min))/(Number(slider.max)-Number(slider.min))*100)+'%');$('#'+id+'-value').textContent=id==='push'?value.toFixed(1):Math.round(value);}
 $('#area').innerHTML=`${m.area.toFixed(0)} <small>cm²</small>`;$('#com').innerHTML=`${m.hc.toFixed(0)} <small>cm</small>`;$('#shape-note').textContent=shape==='rectangle'?'Narrow side faces the disturbance':shape==='circle'?'Diameter equals base size':'Side length equals base size';
 const status=!tested?'Ready to test':m.boundary?'At tipping limit':m.tips?'Toppled':'Still standing';$('#test').textContent=document.body.classList.contains('model-fullscreen')?`→ Test tower · ${push.toFixed(1)} m/s²`:'→ Test tower';$('#status').textContent=status.toUpperCase();$('[data-readout]').textContent=`${height} cm tall · ${status}`;
 $('#result').textContent=!tested?'Press Test tower to try this design.':m.boundary?'At the tipping limit: there is no spare stability margin.':m.tips?'It toppled! Try a wider base or a shorter tower.':'It stays upright! This base supports the tower during this disturbance.';$('#threshold').textContent=`Tipping limit: ${m.critical.toFixed(2)} m/s² · test: ${push.toFixed(1)} m/s²`;
 for(const [id,value,point] of [['height',height,tx([0,0,height])],['width',width,[m.b,0,0]]]){const hint=$('#'+id+'-hint');hint.setAttribute('aria-valuenow',value);hint.textContent=`${id==='height'?'↕ Height':'↔ Base'} ${value} cm`;positionMoveHint(hint,point,P);}graph(m);
}
function graph(m){const X=h=>42+(h-20)/60*330,Y=a=>178-a/26*150;let html='';for(const v of [0,10,20])html+=`<path d="M42 ${Y(v)}H372" stroke="var(--border)"/><text x="32" y="${Y(v)+4}" text-anchor="end">${v}</text>`;for(const h of [20,40,60,80])html+=`<text x="${X(h)}" y="197" text-anchor="middle">${h}</text>`;const curve=Array.from({length:61},(_,i)=>`${i?'L':'M'}${X(20+i)} ${Y(model(20+i,width,shape).critical)}`).join('');$('#graph').innerHTML=html+`<text x="42" y="16">Tipping limit (m/s²)</text><text x="372" y="213" text-anchor="end">Height (cm)</text><path d="${curve}" stroke="var(--teal)" stroke-width="3" fill="none"/><path d="M42 ${Y(push)}H372" stroke="var(--coral)" stroke-dasharray="4 4"/><circle cx="${X(height)}" cy="${Y(m.critical)}" r="5" fill="var(--coral)"/>`;}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function change(id,value){stop();if(id==='height')height=clamp(Math.round(value),20,80);else if(id==='width')width=clamp(Math.round(value),10,50);else push=clamp(Number(value),0,10);angle=0;tested=false;phase=0;render();}
function test(){tested=true;phase=0;elapsed=0;if(reduced.matches)angle=state().tips?90:0;else{phase=1;wake();}render();}
function tick(now){frame=0;const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed+=dt;if(auto&&phase===0&&elapsed>1){height=height>=75?25:height+10;angle=0;test();}if(phase){const m=state();angle=m.tips?90*Math.min(1,elapsed/1.2)**2:Math.abs(Math.sin(elapsed*9))*Math.exp(-elapsed*2.5)*Math.min(4,push);if(elapsed>=1.4){angle=m.tips?90:0;phase=0;elapsed=0;}render();}if((auto||phase)&&visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);else last=0;}
function wake(){if(!frame&&visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
for(const id of ['height','width','push'])$('#'+id).oninput=e=>change(id,+e.target.value);
for(const button of document.querySelectorAll('[data-shape]'))button.onclick=()=>{shape=button.dataset.shape;document.querySelectorAll('[data-shape]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',b===button);});change('height',height);};
$('#test').onclick=()=>{stop();test();};$('#reset').onclick=()=>{document.querySelector('[data-shape="square"]').click();width=24;push=4;change('height',60);};
$('#play').onclick=()=>{if(auto){stop();return;}if(reduced.matches){change('height',height>=60?30:70);test();return;}auto=true;elapsed=1.1;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
function keys(e,id){const old=id==='height'?height:width,delta=e.shiftKey?5:1,values={ArrowUp:old+delta,ArrowRight:old+delta,ArrowDown:old-delta,ArrowLeft:old-delta,Home:id==='height'?20:10,End:id==='height'?80:50};if(e.key in values){e.preventDefault();change(id,values[e.key]);}}
$('#stage').onkeydown=e=>{if(e.target===$('#stage'))keys(e,'height');};for(const id of ['height','width'])$('#'+id+'-hint').onkeydown=e=>keys(e,id);
let drag=null;$('#stage').onpointerdown=e=>{if(e.button!==0)return;const id=e.target.closest('#width-hint')?'width':e.target.closest('#height-hint')?'height':e.clientY>$('#stage').getBoundingClientRect().top+$('#stage').clientHeight*.7?'width':'height';drag={id,x:e.clientX,y:e.clientY,value:id==='height'?height:width};$('#stage').setPointerCapture(e.pointerId);stop();};$('#stage').onpointermove=e=>{if(drag)change(drag.id,drag.value+(drag.id==='height'?drag.y-e.clientY:e.clientX-drag.x)*100/$('#stage').clientWidth);};for(const event of ['pointerup','pointercancel'])$('#stage').addEventListener(event,()=>drag=null);
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake();else pause();}).observe($('#stage'));document.addEventListener('visibilitychange',()=>document.hidden?pause():wake());reduced.addEventListener('change',()=>{stop();pause();phase=0;angle=tested&&state().tips?90:0;render();});const testButton=$('#test'),testParent=testButton.parentNode,testNext=testButton.nextSibling;
document.addEventListener('model-fullscreen-change',e=>{if(e.detail) $('.fullscreen-actions').append(testButton);else testParent.insertBefore(testButton,testNext);render();});new ResizeObserver(render).observe($('#stage'));
window.tower={model,getState:()=>({...state(),angle,tested,auto,phase}),geometry:()=>faces};render();
