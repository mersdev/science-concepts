const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=v=>Math.max(0,Math.min(12,v));
// ponytail: a qualitative steady-state bulb, not a particular commercial lamp.
// V = 10 I + 30 I³, so V/I = 10 + 30 I² increases as the filament heats.
function model(v,kind='resistor'){
 v=clamp(v);let i=v/10;
 if(kind==='lamp'){let lo=0,hi=1.2;for(let n=0;n<45;n++){const mid=(lo+hi)/2;if(10*mid+30*mid**3>v)hi=mid;else lo=mid;}i=v===0?0:(lo+hi)/2;}
 return {v,i,r:v===0?null:v/i};
}
let kind='resistor',target=6,current=6,auto=false,compare=false,visible=true,frame=0,last=0,tourTime=0,rows=[],trial=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function graph(){
 const ox=43,oy=229,w=350,h=196,X=i=>ox+i/1.2*w,Y=v=>oy-v/12*h,m=model(current,kind);
 let out='';
 for(let n=0;n<=6;n++){let x=X(n*.2),y=Y(n*2);out+=`<path d="M${x} 33V229 M43 ${y}H393" stroke="var(--grid)" stroke-width="1"/><text x="${x}" y="247" text-anchor="middle">${(n*.2).toFixed(1)}</text><text x="32" y="${y+4}" text-anchor="end">${n*2}</text>`;}
 out+='<path d="M43 30V229H397" fill="none" stroke="var(--muted)" stroke-width="1"/><text x="43" y="17">Voltage, V / V</text><text x="393" y="270" text-anchor="end">Current, I / A</text>';
 for(const mode of ['resistor','lamp']){if(mode!==kind&&!compare)continue;let d='';for(let n=0;n<=120;n++){const p=model(n/10,mode);d+=`${n?'L':'M'}${X(p.i).toFixed(2)},${Y(p.v).toFixed(2)}`;}out+=`<path d="${d}" fill="none" stroke="${mode==='resistor'?'var(--graph)':'var(--coral)'}" stroke-width="2.8" ${mode!==kind?'stroke-dasharray="5 5" opacity=".6"':''}/>`;}
 out+=`<path d="M43 ${Y(m.v)}H${X(m.i)}V229" fill="none" stroke="var(--muted)" opacity=".5" stroke-dasharray="3 4"/><circle cx="${X(m.i)}" cy="${Y(m.v)}" r="6" fill="${kind==='resistor'?'var(--graph)':'var(--coral)'}" stroke="var(--paper)" stroke-width="3"/>`;
 $('#plot').innerHTML=out;
 $('#graph').setAttribute('aria-label',`Voltage on vertical axis, current on horizontal axis. ${kind==='resistor'?'Straight line through origin, gradient 10 ohms.':'Upward-curving bulb characteristic; resistance increases.'} Current point: ${m.v.toFixed(1)} volts, ${m.i.toFixed(3)} amperes.`);
}
function draw(){
 const m=model(current,kind);$('#voltage-label').innerHTML=`${m.v.toFixed(1)} <small>V</small>`;
 $('#current').innerHTML=`${m.i.toFixed(3)} <small>A</small>`;
 $('#resistance').innerHTML=m.r===null?'— <small>Ω</small>':`${m.r.toFixed(1)} <small>Ω</small>`;
 $('#resistance-note').textContent=m.r===null?'V / I is undefined at 0 / 0':kind==='resistor'?'Constant · V / I':'Increases as filament heats';
 $('#current-bar').style.width=m.i/1.2*100+'%';
 $('[data-readout]').textContent=`${m.v.toFixed(1)} V · ${m.i.toFixed(3)} A`;
 $('#stage').setAttribute('aria-valuenow',m.v.toFixed(1));$('#stage').setAttribute('aria-valuetext',`${m.v.toFixed(1)} volts; ${m.i.toFixed(3)} amperes; ${kind==='lamp'?'filament bulb':'fixed resistor'}`);
 $('#voltage').value=current;$('#voltage').style.setProperty('--fill',current/12*100+'%');
 $('#double').disabled=target>6||target===0;
 for(const [n,x,y,f] of [[0,-106,62,m.i/1.2],[1,95,62,m.v/12]]){const angle=Math.PI*(1+f);$(`#needle-${n}`).setAttribute('d',lineOnTop([x,y],[x+Math.cos(angle)*20,y+Math.sin(angle)*15],39.2,P));}
 $('#rheostat-slider').setAttribute('transform',translateAlong(P,[(m.v/12-.5)*80,0,0]));
 $('#bulb-light').setAttribute('opacity',kind==='lamp'?(m.v/12*.85).toFixed(3):0);
 // ponytail: a buffered teaching indicator scales brightness with V, not a bare LED I–V model.
 const brightness=m.v/12,ledState=m.v===0?'Off':m.v<4?'Dim':m.v<8?'Glowing':'Bright';
 $('#led-emitter').setAttribute('opacity',brightness.toFixed(4));
 $('#led-glow').setAttribute('opacity',brightness.toFixed(4));
 $('#voltage-led').setAttribute('aria-label',`Voltage indicator LED: ${ledState.toLowerCase()} at ${m.v.toFixed(1)} volts`);
 $('#led-state').textContent=ledState;
 $('#led-key').style.setProperty('--led-level',brightness.toFixed(4));
 graph();
}
function stopTour(){auto=false;$('#tour').textContent='▷ Auto sweep';$('#tour').setAttribute('aria-pressed','false');}
function set(v){target=clamp(v);stopTour();trial=false;wake();}
function tick(now){frame=0;const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
 if(auto&&!reduced.matches){tourTime+=dt;target=6-6*Math.cos(tourTime*.6);}
 if(trial){tourTime+=dt;if(tourTime>2.2){target=6;trial=false;}}
 current=reduced.matches?target:current+(target-current)*(1-Math.exp(-dt/0.13));if(Math.abs(target-current)<.001)current=target;draw();
 if(visible&&!document.hidden&&(auto&&!reduced.matches||trial||current!==target))frame=requestAnimationFrame(tick);else last=0;
}
function wake(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
function conductor(next){kind=next;stopTour();trial=false;
 for(const mode of ['resistor','lamp']){$('#'+mode).classList.toggle('selected',mode===kind);$('#'+mode).setAttribute('aria-pressed',String(mode===kind));}
 $('#bulb').style.display=kind==='lamp'?'':'none';
 $$('[data-conductor="resistor"]').forEach(el=>el.style.display=kind==='resistor'?'':'none');
 $('#condition').textContent=kind==='resistor'?'TEMPERATURE HELD CONSTANT':'FILAMENT TEMPERATURE CHANGES';
 $('#type-tag').textContent=kind==='resistor'?'↗ OHMIC CONDUCTOR':'⌁ NON-OHMIC CONDUCTOR';
 $('#graph-caption').innerHTML=kind==='resistor'?'A straight line through the origin.<br><b>Gradient = resistance = 10 Ω.</b>':'An upward curve on this V–I graph.<br><b>V / I increases as the filament warms.</b>';
 $('#insight').innerHTML=kind==='resistor'?'<b>Double the push, double the flow.</b> At constant temperature, doubling V doubles I. Their ratio stays the same.':'<b>More voltage, more heat.</b> Filament resistance rises, so doubling V gives less than double I. This model shows steady-state readings.';
 draw();
}
$('#voltage').addEventListener('input',e=>set(Number(e.target.value)));
$('#resistor').onclick=()=>conductor('resistor');$('#lamp').onclick=()=>conductor('lamp');
$('#double').onclick=()=>set(target*2);
$('#reset').onclick=()=>{conductor('resistor');compare=false;$('#compare').setAttribute('aria-pressed','false');set(6);};
$('#compare').onclick=()=>{compare=!compare;$('#compare').setAttribute('aria-pressed',String(compare));graph();};
$('#tour').onclick=()=>{if(auto){stopTour();return;}auto=true;trial=false;tourTime=Math.acos(1-current/6)/.6;$('#tour').textContent='Ⅱ Pause sweep';$('#tour').setAttribute('aria-pressed','true');if(reduced.matches){target=current<6?12:0;}wake();};
$('#theme').onclick=()=>{document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';};
$('#circuit-toggle').onclick=()=>{const expanded=$('#circuit-key').hidden;$('#circuit-key').hidden=!expanded;$('#circuit-toggle').setAttribute('aria-expanded',String(expanded));};
function renderRows(){
 $('#readings').innerHTML=rows.length?rows.map(r=>`<tr><td>${r.kind==='resistor'?'Fixed resistor':'Filament bulb'}</td><td>${r.v.toFixed(1)}</td><td>${r.i.toFixed(3)}</td><td>${r.r===null?'—':r.r.toFixed(1)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Your first discovery starts with a reading.<br><span>Adjust the voltage, then press “Record reading”.</span></td></tr>';
 $('#record-status').textContent=`${rows.length} reading${rows.length===1?'':'s'} recorded`;
}
$('#record').onclick=()=>{stopTour();trial=false;current=target;draw();const m=model(current,kind);if(rows.some(r=>r.kind===kind&&Math.abs(r.v-m.v)<.05)){$('#record-status').textContent='That reading is already in your notebook. Try another voltage.';return;}rows.push({...m,kind});renderRows();$('#announce').textContent=`Recorded ${m.v.toFixed(1)} volts and ${m.i.toFixed(3)} amperes.`;};
$('#clear').onclick=()=>{rows=[];renderRows();};
$$('[data-answer]').forEach(b=>b.onclick=()=>{$$('[data-answer]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#feedback').textContent=b.dataset.answer==='0.60'?'Exactly! I = V / R = 6.0 / 10 = 0.60 A. Double V, double I.':'Try I = V / R. With R = 10 Ω and V = 6.0 V, divide 6.0 by 10.';});
$('#try').onclick=()=>{conductor('resistor');current=3;target=3;stopTour();tourTime=0;if(reduced.matches){target=6;trial=false;}else trial=true;draw();wake();$('#experiment').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});};
$('#stage').addEventListener('keydown',e=>{const step=e.shiftKey?1:.1;const keys={ArrowRight:target+step,ArrowUp:target+step,ArrowLeft:target-step,ArrowDown:target-step,Home:0,End:12};if(e.key in keys){e.preventDefault();set(keys[e.key]);}});
let dragging=false,px=0,pv=0;
$('#stage').addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;px=e.clientX;pv=target;$('#stage').setPointerCapture(e.pointerId);stopTour();});
$('#stage').addEventListener('pointermove',e=>{if(dragging)set(pv+(e.clientX-px)/$('#stage').clientWidth*18);});
for(const event of ['pointerup','pointercancel'])$('#stage').addEventListener(event,()=>dragging=false);
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}}).observe($('#experiment'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}});
reduced.addEventListener('change',()=>{if(reduced.matches)stopTour();wake();});
window.ohm={model,getState:()=>({kind,current,target,auto,compare,rows:[...rows]})};
draw();
