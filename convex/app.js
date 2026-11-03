const P={"origin":[396.00960169056793,258.71231186180796],"scale":0.8652428305178358,"azimuth":62,"elevation":25};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const FOCAL=20,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function model(u){const v=u===FOCAL?Infinity:FOCAL*u/(u-FOCAL),m=-v/u;return {u,v,m,real:u>FOCAL,virtual:u<FOCAL,infinite:u===FOCAL,invU:1/u,invV:1/FOCAL-1/u};}
let u=60,targetU=60,s=30,targetS=30,auto=false,clock=0,reciprocal=true,frame=0,last=0,visible=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const n=v=>v.toFixed(1),format=v=>Number.isFinite(v)?n(v):'∞';
const isSharp=m=>m.real&&Math.abs(s-m.v)<=.35;
function arrowPath(x,h){return pathOf([[x,-2,90],[x,2,90],[x,2,90+h-5*Math.sign(h)],[x,6,90+h-5*Math.sign(h)],[x,0,90+h],[x,-6,90+h-5*Math.sign(h)],[x,-2,90+h-5*Math.sign(h)]].map(p=>iso(p,P)),true);}
function graph(m){
 let out='',X,Y;
 if(reciprocal){X=x=>48+x/.1*337;Y=y=>240-(y+.055)/.115*204;
 for(let i=0;i<=5;i++){const x=i*.02;out+=`<path d="M${X(x)} 36V240" stroke="var(--grid)"/><text x="${X(x)}" y="257" text-anchor="middle">${x.toFixed(2)}</text>`;}
 for(const y of [-.04,-.02,0,.02,.04,.05])out+=`<path d="M48 ${Y(y)}H385" stroke="var(--grid)"/><text x="39" y="${Y(y)+3}" text-anchor="end">${y.toFixed(2)}</text>`;
 out+=`<path d="M48 32V240 M48 ${Y(0)}H390" stroke="var(--muted)" fill="none"/><text x="48" y="17">1/v / cm⁻¹</text><text x="385" y="278" text-anchor="end">1/u / cm⁻¹</text><path d="M${X(0)} ${Y(.05)}L${X(.05)} ${Y(0)}" stroke="var(--graph)" stroke-width="2.5"/><path d="M${X(.05)} ${Y(0)}L${X(.1)} ${Y(-.05)}" stroke="var(--coral)" stroke-width="2.5" stroke-dasharray="5 4"/><circle cx="${X(0)}" cy="${Y(.05)}" r="4" fill="var(--graph)"/><text x="${X(.007)}" y="${Y(.05)-9}" class="intercept">intercept = 1/f</text>`;
 }else{X=x=>48+(x-10)/70*337;Y=y=>240-(y+100)/260*204;
 for(const x of [10,20,40,60,80])out+=`<path d="M${X(x)} 36V240" stroke="var(--grid)"/><text x="${X(x)}" y="257" text-anchor="middle">${x}</text>`;
 for(const y of [-100,-50,0,20,100,150])out+=`<path d="M48 ${Y(y)}H385" stroke="var(--grid)"/><text x="39" y="${Y(y)+3}" text-anchor="end">${y}</text>`;
 out+=`<path d="M48 32V240 M48 ${Y(0)}H390" stroke="var(--muted)" fill="none"/><text x="48" y="17">v / cm</text><text x="385" y="278" text-anchor="end">u / cm</text><path d="M${X(20)} 36V240 M48 ${Y(20)}H385" stroke="var(--muted)" stroke-dasharray="3 5"/><text x="${X(22)}" y="48">u = f</text><text x="365" y="${Y(20)-7}">v = f</text>`;
 for(const real of [true,false]){let d='';for(let x=10;x<=80;x+=.1){const p=model(x);if(p.real!==real||p.v>160||p.v< -100||!Number.isFinite(p.v)){d+=' ';continue;}const prev=d.trim();d+=(prev&&!d.endsWith(' ')?'L':'M')+X(x).toFixed(2)+','+Y(p.v).toFixed(2);}out+=`<path d="${d}" fill="none" stroke="${real?'var(--graph)':'var(--coral)'}" stroke-width="2.5"/>`;}
 }
 const px=X(reciprocal?m.invU:m.u),py=Y(reciprocal?m.invV:m.v);
 if(Number.isFinite(py)&&py>=36&&py<=240)out+=`<circle cx="${px}" cy="${py}" r="6" fill="${m.virtual?'var(--coral)':'var(--graph)'}" stroke="var(--paper)" stroke-width="2.5"/>`;
 $('#plot').innerHTML=out;
 $('#graph').setAttribute('aria-label',reciprocal?'1/v against 1/u: straight line with gradient minus one, vertical intercept 0.050 per cm; f is 20 cm. Negative 1/v corresponds to virtual images.':'Image distance against object distance: real image distance decreases towards 20 cm as object distance increases beyond 20 cm.');
}
function draw(){const m=model(u),sharp=isSharp(m),canFocus=m.real&&m.v>=22&&m.v<=100;
 $('#object-label').innerHTML=`${n(u)} <small>cm</small>`;$('#screen-label').innerHTML=`${n(s)} <small>cm</small>`;
 $('#object').value=u;$('#screen').value=s;$('#object').style.setProperty('--fill',(u-10)/70*100+'%');$('#screen').style.setProperty('--fill',(s-22)/78*100+'%');
 $('#image-distance').innerHTML=`${format(m.v)} <small>cm</small>`;$('#magnification').innerHTML=m.infinite?'—':`${Math.abs(m.m).toFixed(2)}<small>×</small>`;
 $('#distance-note').textContent=m.infinite?'No finite image position':m.virtual?'Negative v · same side as object':'On the opposite side of the lens';
 $('#size-note').textContent=m.infinite?'No finite image size':m.virtual?'Larger · upright':Math.abs(m.m- -1)<.01?'Same size · inverted':Math.abs(m.m)<1?'Smaller · inverted':'Larger · inverted';
 $('#position-tag').textContent=m.infinite?'OBJECT AT f':m.virtual?'VIRTUAL IMAGE':u>40?'BETWEEN f AND 2f':u===40?'IMAGE AT 2f':'BEYOND 2f';
 $('#focus').disabled=!canFocus;
 $('#focus-title').textContent=m.infinite?'No finite screen can focus it':m.virtual?'A virtual image — no screen image':!canFocus?'Real image beyond the screen travel':sharp?'A sharp image!':'Slide the screen to sharpen';
 $('#focus-dot').classList.toggle('sharp',sharp);$('#image-kind').textContent=m.infinite?'IMAGE AT INFINITY':m.virtual?'VIRTUAL · UPRIGHT':'REAL · INVERTED';
 $('#object-carriage').setAttribute('transform',translateAlong(P,[-3*(u-60),0,0]));$('#screen-carriage').setAttribute('transform',translateAlong(P,[3*(s-30),0,0]));
 // ponytail: geometric defocus is illustrative; no wave-optics or exposure model.
 const blur=Math.abs(1-s*m.invV)*9;
 $('#blur-amount').setAttribute('stdDeviation',blur.toFixed(3));$('#screen-image').setAttribute('d',arrowPath(93,-20*s/u));$('#screen-image').setAttribute('opacity',sharp?1:Math.max(.12,.75/(1+blur*.2)));
 $('#screen-image').setAttribute('aria-label',sharp?'Sharp inverted image':'Diffuse out-of-focus light, not a sharp image');
 $('#preview-arrow').setAttribute('transform',`translate(150 30) scale(1 ${s/u})`);
 $('#preview-blur').setAttribute('stdDeviation',(blur*.8).toFixed(3));
 $('#preview-arrow').setAttribute('opacity',sharp?'1':String(Math.max(.12,.75/(1+blur*.2))));
 $('#preview-status').textContent=sharp?'SHARP':m.virtual||m.infinite?'NO SHARP IMAGE':'OUT OF FOCUS';
 $('#preview').setAttribute('aria-label',sharp?'Magnified screen view: a sharp inverted arrow.':'Magnified screen view: diffuse out-of-focus light.');
 $('[data-readout]').textContent=`u = ${n(u)} cm · v = ${format(m.v)} cm`;
 $('#stage').setAttribute('aria-valuenow',n(u));$('#stage').setAttribute('aria-valuetext',`${n(u)} centimetres from lens; ${m.infinite?'image at infinity':m.virtual?'virtual upright image':'real inverted image'}`);
 $$('[data-u]').forEach(b=>{const active=Math.abs(Number(b.dataset.u)-u)<.01;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
 graph(m);
}
function stop(){auto=false;$('#tour').textContent='▷ Auto explore';$('#tour').setAttribute('aria-pressed','false');}
function wake(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
function setObject(value){stop();targetU=clamp(value,10,80);wake();}
function tick(now){frame=0;const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
 if(auto&&!reduced.matches){clock+=dt;targetU=45+35*Math.sin(clock*.35);}
 const ease=reduced.matches?1:1-Math.exp(-dt/.16);u+=(targetU-u)*ease;s+=(targetS-s)*ease;
 if(Math.abs(u-targetU)<.002)u=targetU;if(Math.abs(s-targetS)<.002)s=targetS;draw();
 if(visible&&!document.hidden&&(auto&&!reduced.matches||u!==targetU||s!==targetS))frame=requestAnimationFrame(tick);else last=0;
}
$('#object').oninput=e=>setObject(Number(e.target.value));$('#screen').oninput=e=>{stop();targetS=Number(e.target.value);wake();};
$$('[data-u]').forEach(b=>b.onclick=()=>setObject(Number(b.dataset.u)));
$('#focus').onclick=()=>{stop();u=targetU;const m=model(u);if(m.real&&m.v>=22&&m.v<=100){targetS=m.v;wake();}};
$('#reset').onclick=()=>{stop();chooseGraph(true);targetU=60;targetS=30;wake();};
$('#tour').onclick=()=>{if(auto){stop();return;}auto=true;clock=Math.asin((u-45)/35)/.35;$('#tour').textContent='Ⅱ Pause explore';$('#tour').setAttribute('aria-pressed','true');if(reduced.matches)targetU=u>40?10:60;wake();};
function chooseGraph(value){reciprocal=value;for(const id of ['reciprocal','distance']){const active=(id==='reciprocal')===value;$('#'+id).classList.toggle('selected',active);$('#'+id).setAttribute('aria-pressed',String(active));}graph(model(u));}
$('#reciprocal').onclick=()=>chooseGraph(true);$('#distance').onclick=()=>chooseGraph(false);
$('#stage').addEventListener('keydown',e=>{const step=e.shiftKey?5:.5,keys={ArrowLeft:targetU-step,ArrowRight:targetU+step,ArrowDown:targetU-step,ArrowUp:targetU+step,Home:10,End:80};if(e.key in keys){e.preventDefault();setObject(keys[e.key]);}});
let dragging=false,startX=0,startU=0;$('#stage').addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;startX=e.clientX;startU=targetU;$('#stage').setPointerCapture(e.pointerId);stop();});$('#stage').addEventListener('pointermove',e=>{if(dragging)setObject(startU-(e.clientX-startX)/$('#stage').clientWidth*100);});for(const event of ['pointerup','pointercancel'])$('#stage').addEventListener(event,()=>dragging=false);
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}}).observe($('main'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}});reduced.addEventListener('change',()=>{stop();wake();});
window.convex={model,getState:()=>({u,s,targetU,targetS,auto,reciprocal,sharp:isSharp(model(u))})};draw();
