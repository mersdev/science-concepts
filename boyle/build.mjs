import {readFileSync,writeFileSync} from 'node:fs';
import * as k from '/Users/baoren/.agents/skills/anatomy/kit/iso-kit.mjs';
import * as A from '/Users/baoren/.agents/skills/anatomy/kit/audit.mjs';
import {kitScript} from '/Users/baoren/.agents/skills/anatomy/scripts/inline-kit.mjs';
// Concept: a sealed, cutaway piston chamber; piston travel changes V and P = 6000/V.
// Parts: 4 feet, deck, inset, 4 screws, 2 rail beds, 2 rails, 4 stops,
// 8 stop bolts, 2 chamber saddles, 4 saddle bolts, chamber floor, back wall,
// 2 end plates, 4 corner seals, piston, rod, handle, 2 handle grips,
// sensor foot, sensor body, bezel, display, 2 keys, ruler, 24 scale ticks.
const P=k.fitProjection([[-150,-68,0],[285,66,0],[-142,-50,112],[280,52,100]],780,440,{pad:27,azimuth:61,elevation:27});
const R=A.recorder(P);let n=0;
function box(x,y,w,d,z,h,color='metal',name='part'){
 const plan={x,y,w,d,r:Math.min(2,w/4,d/4)};
 const svg=`<g class="material-${color}">${k.solidSvg(k.slabOf(plan,z,h,P,5,.65),{tone:'hi'})}</g>`;
 R.put({at:[x+w/2,y+d/2,z+h/2],name:name+(n++),svg,shapes:[R.solid(A.slab(plan,z,h,{name:name+n,ground:z===0}))]});
}
for(const x of [-132,121])for(const y of [-51,40])box(x,y,17,17,0,7,'rubber','stand.foot');
box(-145,-62,300,122,7,9,'base','stand.deck');
box(-140,-57,290,112,16,.8,'base','deck-inlay');
for(const x of [-134,139])for(const y of [-51,47])box(x,y,3,3,16.8,1,'metal','deck-screw');
for(const y of [-39,32]){
 box(-115,y,248,8,16.8,5,'dark','rail-bed');box(-110,y+2,237,4,21.8,3,'metal','rail');
 for(const x of [-119,127]){box(x,y-2,8,12,21.8,7,'teal','stop');for(const yy of [y,y+7])box(x+2,yy,3,2,28.8,1,'metal','bolt');}
}
for(const x of [-99,71]){
 box(x,-30,20,60,16.8,17,'teal','saddle');
 for(const y of [-29,25])box(x+6,y,6,4,33.8,1,'metal','saddle-bolt');
}
box(-101,-24,192,48,33.8,4,'metal','chamber-floor');
box(-101,-27,192,3,37.8,49,'glass','chamber-back');
box(-106,-29,5,58,33.8,57,'teal','sealed-end');
box(91,-29,5,58,33.8,57,'metal','gland');
for(const x of [-106,91])for(const y of [-29,25])box(x,y,5,4,90.8,2,'dark','corner-seal');
box(-128,-17,22,34,37.8,15,'dark','sensor-port');
box(-144,-25,35,50,52.8,32,'teal','sensor');
box(-142,-22,31,44,84.8,2,'dark','bezel');
box(-139,-18,25,27,86.8,.6,'screen','display');
for(const y of [12,18])box(-137,y,8,3,86.8,1,'orange','sensor-key');
box(-100,30,190,10,24.8,1,'cream','scale');
// Closed tick slots touch the ruler's edge, so no texture lines end in space.
let ticks='';for(let x=-98,i=0;x<89;x+=8,i++)ticks+=`<path d="${k.onTop([[x,30],[x,30+(i%5?3:7)],[x+.4,30+(i%5?3:7)],[x+.4,30]],25.9,P,true)}" fill="#527773"/>`;
A.settle(R,P);R.items.sort((a,b)=>a.key-b.key);A.auditOrExit(R,P);
const staticSvg=R.items.map(x=>x.svg).join('');
// The moving assembly is drawn once and translated along its rail.
function solid(x,y,w,d,z,h,color){return `<g class="material-${color}">${k.solidSvg(k.slabOf({x,y,w,d,r:1},z,h,P,5,.6),{tone:'hi'})}</g>`;}
const piston=solid(12,-24,5,48,37.8,49,'orange')+solid(17,-3,180,6,59,7,'metal')+solid(197,-22,7,44,51,23,'teal')+solid(197,-26,7,4,51,23,'dark')+solid(197,22,7,4,51,23,'dark');
const stage=k.figureSvg({width:780,height:440,label:'Isometric cutaway Boyle’s-law apparatus: a sealed gas chamber on rails, an orange piston and an attached absolute-pressure sensor. Drag the piston or change the volume slider.',body:`${staticSvg}${ticks}<g id="sensor-text">${k.faceTextSvg(k.topMatrix([-126.5,-5],87.5,P,"x"),"100 kPa",{size:4,anchor:"middle",tone:"hi"})}</g><g id="gas"></g><g id="piston">${piston}</g><g id="glass-front"></g>`});
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boyle’s Law · The Pressure Lab</title><style>${k.ISO_CSS}\n${readFileSync('style.css','utf8')}</style></head><body class="iso" data-theme="light">
<header><a class="brand" href="./"><span class="brand-icon">◈</span> THE PRESSURE LAB</a><div class="course">PHYSICS / FORM 4 <span>CHAPTER 4</span></div><button id="theme" class="icon-button" aria-label="Switch to dark theme">◐</button></header>
<main><div class="intro"><div><div class="eyebrow"><span></span> GAS LAWS <b>SP 4.4.2</b></div><h1>Less room.<br><em>More pressure.</em></h1><p>A little squeeze explains a big idea.<br>Explore the invisible world behind Boyle’s law.</p></div><div class="formula"><span>BOYLE’S LAW</span><strong>PV = <i>constant</i></strong><p>Same gas. Same temperature.</p><small>Pressure and volume are inversely proportional.</small></div></div>
<div class="workspace"><section class="experiment iso-plate"><div class="card-head"><span><b>01</b> THE EXPERIMENT</span><span class="live-dot">LIVE MODEL</span></div><div class="stage-wrap"><div class="stage-note"><span class="pill">SEALED SYSTEM</span><span class="pill warm">T = 300 K · fixed</span></div><div id="stage" tabindex="0" role="slider" aria-label="Gas volume. Drag piston or use arrow keys." aria-valuemin="20" aria-valuemax="100" aria-valuenow="60">${stage}</div><div class="stage-caption"><span>↔ Drag the orange piston to explore</span><span data-readout>60.0 mL · 100.0 kPa</span></div></div>
<div class="controls"><div class="control-title"><label for="volume">Gas volume <i>V</i></label><strong><span id="volume-label">60.0</span> <small>mL</small></strong></div><input type="range" id="volume" min="20" max="100" step="1" value="60"><div class="range-labels"><span>20 mL · compressed</span><span>100 mL · expanded</span></div><div class="actions"><button id="half">↘ Halve the volume</button><button id="play" class="secondary" aria-pressed="false">▷ Auto explore</button><button id="reset" class="reset" aria-label="Reset experiment">↺ Reset</button></div></div><div class="legend"><span><i class="orange"></i> Moving piston</span><span><i class="teal"></i> Gas molecules</span><span>24 illustrative particles · fixed quantity</span></div></section>
<aside><div class="readings"><div class="metric pressure"><span>ABSOLUTE PRESSURE <i>P</i></span><strong id="pressure">100.0 <small>kPa</small></strong><div><span id="ratio">1.00×</span> reference pressure</div><div class="meter"><i id="pressure-bar"></i></div></div><div class="metric product"><span>THE CONSTANT <i>PV</i></span><strong>6,000 <small>kPa·mL</small></strong><div>Every squeeze. The same product.</div><span class="constant-check">✓ P₁V₁ = P₂V₂</span></div></div>
<section class="graph-card"><div class="graph-heading"><h2>See the relationship</h2><div class="tabs" role="group" aria-label="Graph horizontal axis"><button id="pv" class="selected" aria-pressed="true">P vs V</button><button id="inverse" aria-pressed="false">P vs 1/V</button></div></div><svg id="graph" viewBox="0 0 390 240" role="img" aria-label="Pressure versus volume graph"><g id="plot"></g></svg><p id="graph-caption"><span class="graph-key"></span> An inverse relationship: V goes down, P goes up.</p></section><div class="condition"><span>♧</span><p><b>Keep it fair.</b> Hold gas quantity and temperature constant. Move slowly and let the gas return to 300 K before reading pressure.</p></div></aside></div>
<section class="explanation"><div class="why"><span class="eyebrow">THE MOLECULAR VIEW</span><h2>Why does the pressure rise?</h2><p>Less space means <b>more frequent collisions</b> with the walls. Each collision transfers momentum, producing a force. More force per unit area means higher pressure.</p></div><div class="reason"><span class="step">01</span><h3>Same molecules</h3><p>The chamber is sealed. No gas enters or escapes.</p></div><div class="reason"><span class="step">02</span><h3>Same average speed</h3><p>Constant temperature keeps average kinetic energy unchanged.</p></div><div class="reason"><span class="step">03</span><h3>More wall hits</h3><p>Shorter journeys between walls mean more collisions each second.</p></div></section>
<div class="takeaway"><span>TRY THIS</span><p>Start at <b>60 mL</b>, then halve the volume to <b>30 mL</b>. Pressure doubles from <b>100 kPa</b> to <b>200 kPa</b>.</p><button id="try">Try it ↗</button></div><footer><span>F4 · CH 4 · SP 4.4.2</span><span>Ideal-gas model · Absolute pressure · Particle motion is illustrative</span><span>Made for curious minds.</span></footer><div id="announcement" class="sr-only" aria-live="polite"></div></main><script type="module">${kitScript()}\nconst PROJECTION=${JSON.stringify(P)};\n${readFileSync('app.js','utf8')}</script></body></html>`;
// Escape HTML script terminators inside the inlined kit's template strings.
const start=html.indexOf('<script type="module">')+'<script type="module">'.length;
const end=html.lastIndexOf('</script>');
writeFileSync('index.html',html.slice(0,start)+html.slice(start,end).replaceAll('</script','<\\/script')+html.slice(end));console.log('Built index.html · '+n+' static parts + 5 moving parts');
