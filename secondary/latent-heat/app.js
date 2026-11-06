const $ = selector => document.querySelector(selector);
const P = {"origin":[375.1265273881827,301.6336287032546],"scale":1.2165598552254169,"azimuth":55,"elevation":30};
const LF = 334000; // J/kg, latent heat of fusion of water at atmospheric pressure.
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
function model(energy, mass = 100) {
  mass = clamp(mass, 50, 200);
  const limit = mass / 1000 * LF;
  const q = clamp(energy, 0, limit), melted = q / LF * 1000;
  return {q, mass, melted, remaining: mass - melted, fraction:q / limit, limit, temperature:0};
}
let mass = 100, power = 500, q = 0, running = false, auto = false;
let frame = 0, last = 0, visible = true, motion = 0, restart = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const stage = $('#stage'), hint = $('.move-hint');
const ice = [...document.querySelectorAll('[data-ice]')];
function positionHint() {
  const angle=(-135+(power-100)/900*270)*Math.PI/180;
  positionMoveHint(hint, [-102+6*Math.sin(angle),25-6*Math.cos(angle),42], P);
}
function graph(m) {
  const x = 65 + 345 * m.fraction;
  $('#curve').setAttribute('d',`M65 115H${x}`);
  $('#graph-point').setAttribute('cx',x);
  $('#graph-end').textContent = (m.limit / 1000).toFixed(1);
  $('#graph').setAttribute('aria-label',`Heating curve: temperature stays at 0 degrees Celsius as supplied energy increases from 0 to ${(m.limit/1000).toFixed(1)} kilojoules. Current energy ${(m.q/1000).toFixed(2)} kilojoules.`);
}
function draw() {
  const m = model(q,mass), active = running && m.fraction < 1;
  $('#power-label').innerHTML = `${power} <small>W</small>`;
  $('#mass-label').innerHTML = `${mass} <small>g</small>`;
  $('#energy-label').innerHTML = `${(m.q/1000).toFixed(2)} <small>kJ</small>`;
  $('#melted').innerHTML = `${m.melted.toFixed(1)} <small>g</small>`;
  $('#remaining').textContent = `${m.remaining.toFixed(1)} g of ice left`;
  $('#energy-max').textContent = `${(m.limit/1000).toFixed(1)} kJ`;
  $('#substitution').textContent = `${(m.q/1000).toFixed(2)} kJ ≈ ${(m.melted/1000).toFixed(5)} kg × 334 kJ/kg`;
  $('[data-readout]').textContent = `0.0°C · ${m.melted.toFixed(1)} g melted · ${(m.q/1000).toFixed(2)} kJ`;
  $('#scale-reading').textContent = `${m.melted.toFixed(1)} g`;
  $('#phase').textContent = m.fraction === 1 ? '04 · ALL ICE MELTED' : active ? (m.q < m.limit*.025 ? '02 · ENERGY ENTERS' : '03 · ICE → WATER') : m.q === 0 ? '01 · CRUSHED ICE' : '03 · MELTING PAUSED';
  $('#status').textContent = m.fraction === 1 ? 'All ice melted · heater cut off at 0°C' : active ? 'Energy changes the phase · temperature stays at 0°C' : m.q === 0 ? 'Switch on the heater to begin.' : 'Heat paused · drag the dial to set power.';
  $('#heater').textContent = active ? 'Ⅱ Heater off' : m.fraction === 1 ? 'Melting complete' : '● Heater on';
  $('#heater').setAttribute('aria-pressed',String(active));
  $('#heater').disabled = m.fraction === 1;
  $('#tour').textContent = auto ? 'Ⅱ Pause' : '▷ Auto explore';
  $('#tour').setAttribute('aria-pressed',String(auto));
  for(const [id,value,min,max] of [['power',power,100,1000],['mass',mass,50,200],['energy',m.q,0,m.limit]]) {
    const el = $('#'+id); el.max = max; el.value = value;
    el.style.setProperty('--fill',`${(value-min)/(max-min)*100}%`);
  }
  hint.setAttribute('aria-valuenow',power);
  hint.setAttribute('aria-valuetext',`${power} watts. Drag or use arrow keys to turn the heater dial.`);
  const angle = -135+(power-100)/900*270;
  $('#dial-pointer').setAttribute('transform',`rotate(${angle} 0 0)`);
  const s = Math.cbrt(m.remaining/200);
  ice.forEach(el => { const [x,y] = el.dataset.anchor.split(',').map(Number); el.setAttribute('transform',`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`);el.style.visibility=s<.001?'hidden':'visible'; });
  const level = 22 + m.melted/200*47;
  // Reproject the liquid surface so its base stays seated in the beaker.
  const face = (points,fill) => `<path d="${pathOf(points.map(p=>iso(p,P)),true)}" fill="${fill}"/>`;
  $('#water').innerHTML = face([[95,-11,22],[95,18,22],[95,18,level],[95,-11,level]],'#3c9cc9')
    + face([[66,18,22],[95,18,22],[95,18,level],[66,18,level]],'#5eb5d4')
    + face([[66,-11,level],[95,-11,level],[95,18,level],[66,18,level]],'#97dcf0');
  $('#water').style.visibility=m.melted>0?'visible':'hidden';
  $('#heat-arrows').setAttribute('opacity',active?'1':'0');
  $('#heater-led').setAttribute('fill',active?'#ff9251':'#bac6c4');
  $('#heater-strip').setAttribute('stroke',active?'#ff9251':'#bc9d88');
  $('#droplet').setAttribute('opacity',active&&m.q>0?'1':'0');
  const dropZ = 102 - (motion%1) * (102-level);
  const drop = iso([80,3,dropZ],P);
  $('#droplet').setAttribute('transform',`translate(${drop[0]} ${drop[1]})`);
  $('#heat-arrows').setAttribute('transform',`translate(0 ${reduced.matches?0:-Math.sin(motion*Math.PI*2)*3})`);
  graph(m);positionHint();
}
function stop() {running=false;auto=false;restart=0;}
function setEnergy(value) {stop();q=model(value,mass).q;draw();}
function setPower(value) {power=Math.round(clamp(value,100,1000)/10)*10;draw();}
function tick(now) {
  frame=0;const dt=last?Math.min((now-last)/1000,.1):0;last=now;
  if(running) {
    // 10× physical time; energy remains Q = P × elapsed simulation time.
    const limit=model(0,mass).limit;
    if(q<limit) {q=Math.min(limit,q+power*dt*10);if(!reduced.matches)motion+=dt*2;}
    else if(auto) {restart+=dt;if(restart>=1.4){q=0;restart=0;}}
    else running=false;
    draw();
  }
  if(running&&visible&&!document.hidden)frame=requestAnimationFrame(tick);else last=0;
}
function wake(){if(running&&visible&&!document.hidden&&!frame){last=0;frame=requestAnimationFrame(tick);}}
function reset(){stop();q=0;mass=100;power=500;motion=0;draw();}
$('#power').addEventListener('input',e=>setPower(Number(e.target.value)));
$('#mass').addEventListener('input',e=>{stop();mass=Number(e.target.value);q=0;draw();});
$('#energy').addEventListener('input',e=>setEnergy(Number(e.target.value)));
$('#heater').onclick=()=>{auto=false;running=!running;draw();wake();};
$('#tour').onclick=()=>{if(auto)stop();else{auto=true;running=true;if(q===model(0,mass).limit)q=0;}draw();wake();};
$('#reset').onclick=reset;
stage.addEventListener('keydown',e=>{
  const step=e.shiftKey?100:10;
  const values={ArrowRight:power+step,ArrowUp:power+step,ArrowLeft:power-step,ArrowDown:power-step,Home:100,End:1000};
  if(e.key in values){e.preventDefault();setPower(values[e.key]);}
});
let drag=null;
stage.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.target.closest('#power-dial,[data-power-dial],.move-hint'))return;
  drag={x:e.clientX,power};stage.setPointerCapture(e.pointerId);e.preventDefault();
});
stage.addEventListener('pointermove',e=>{if(drag)setPower(drag.power+(e.clientX-drag.x)/stage.clientWidth*1800);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>drag=null);
document.addEventListener('model-fullscreen-change',positionHint);
new ResizeObserver(positionHint).observe(stage);
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}}).observe($('.stage-wrap'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else wake();});
reduced.addEventListener('change',()=>{stop();draw();});
window.latentHeat={model,getState:()=>({mass,power,q,running,auto,current:power,target:power})};
draw();
