import {readFileSync,writeFileSync} from 'node:fs';
import * as k from '/Users/baoren/.agents/skills/anatomy/kit/iso-kit.mjs';
import * as A from '/Users/baoren/.agents/skills/anatomy/kit/audit.mjs';
import * as G from '/Users/baoren/.agents/skills/anatomy/kit/lathe.mjs';
import {kitScript} from '/Users/baoren/.agents/skills/anatomy/scripts/inline-kit.mjs';
// Figure: rheostat travel changes the p.d. across a swappable conductor.
// Parts: 4 feet, deck, inlay, 4 screws, copper board traces; supply case,
// lid, LCD, 5 vents, knob, switch; rheostat bed, 2 brackets, core,
// 24 winding turns, 2 rails, contact and grip; two meter cases,
// bezels, dials, four terminals; cartridge, 2 leads, 2 contacts,
// resistor base, body and 3 bands; alternate bulb socket and envelope.
const P=k.fitProjection([[-160,-105,0],[160,102,0],[-145,-94,90],[150,90,80]],800,440,{pad:35,azimuth:48,elevation:38});
const R=A.recorder(P);let count=0;
const at=p=>k.iso(p,P);
function box(x,y,w,d,z,h,color='steel',name='part'){
 const plan={x,y,w,d,r:Math.min(3,w/5,d/5)},id=name+count++;
 const svg=`<g class="mat-${color}" ${['resistor','resistor-band'].includes(name)?'data-conductor="resistor"':''}>${k.solidSvg(k.slabOf(plan,z,h,P,6,.5),{tone:'hi'})}</g>`;
 R.put({name:id,at:[x+w/2,y+d/2,z+h/2],svg,shapes:[R.solid(A.slab(plan,z,h,{name:id,ground:z===0}))]});
}
function disc(x,y,r,z,h,color,name){const id=name+count++;R.put({name:id,at:[x,y,z+h/2],svg:`<g class="mat-${color}">${k.solidSvg(k.cylinder(x,y,r,z,h,P,48,.4),{tone:'hi'})}</g>`,shapes:[R.solid(A.cylinder(x,y,r,z,h,{name:id}))]});}
for(const x of [-148,128])for(const y of [-91,78])box(x,y,20,16,0,7,'rubber','stand.foot');
box(-160,-105,320,210,7,10,'base','deck');box(-155,-100,310,200,17,1,'cream','inlay');
for(const x of [-149,144])for(const y of [-94,89])box(x,y,4,4,18,1,'steel','screw');
// Flat board traces keep the apparatus compact; the circuit key shows topology.
const traces=[[-113,-32,15,94],[-108,55,64,3],[-47,21,3,37],[-45,18,120,3],[72,-64,3,85],[-102,-67,179,3],[-102,-67,3,28],[70,-64,57,3],[124,-64,3,120],[63,53,64,3],[63,24,3,32],[-26,21,3,54],[-26,72,91,3],[63,54,3,21]];
// Traces are printed surface details, not raised solids.
let traceSvg=traces.map(([x,y,w,d])=>`<path d="${k.planOutline({x,y,w,d,r:.6},18.05,P)}" fill="#ccaa79" opacity=".75"/>`).join('');
box(-140,-91,69,59,18,34,'mint','supply');box(-138,-89,65,55,52,2,'mint','supply-lid');box(-130,-80,45,23,54,1,'screen','lcd');
for(let y=-51;y<-36;y+=3)box(-132,y,27,1,54,.5,'dark','vent');
disc(-88,-45,7,54,4,'dark','supply-knob');box(-130,-40,9,5,54,2,'coral','power-switch');
box(15,-89,119,44,18,5,'mint','rheostat-bed');
for(const x of [20,122])box(x,-84,7,34,23,20,'cream','bracket');
box(27,-78,95,22,23,10,'sand','winding-core');
for(let x=29;x<121;x+=4)box(x,-78,1,22,33,1.5,'copper','winding-turn');
box(24,-84,102,2,43,3,'steel','rear-rail');box(24,-52,102,2,43,3,'steel','front-rail');
for(const [x,y,c] of [[-139,34,'mint'],[62,34,'lavender']]){
 box(x,y,65,53,18,18,c,'meter');box(x+4,y+4,57,39,36,2,'dark','bezel');box(x+6,y+6,53,35,38,.5,'cream','dial');
 for(const xx of [x+9,x+50])box(xx,y-5,6,5,18,5,'coral','terminal');
}
box(-48,-18,94,45,18,5,'lavender','cartridge');
for(const x of [-42,31]){box(x,-8,9,24,23,4,'steel','lead');box(x+1,18,7,7,23,4,'coral','contact');}
box(-33,-6,64,20,23,3,'sand','resistor-base');
box(-27,-5,52,18,26,10,'sand','resistor');
for(const x of [-19,-9,12])box(x,-5,3,18,36,.4,x===12?'copper':'dark','resistor-band');
box(65,-84,10,34,46,4,'coral','slider-contact');box(66,-74,8,14,50,6,'coral','slider-grip');
// A buffered voltage indicator on the front trace; it draws no test current.
box(-22,60,44,26,18,4,'dark','led-module');
disc(0,73,10,22,3,'steel','led-bezel');
const ledShape=G.sphereOf([0,73,34],9,P);
R.put({name:'voltage-led',at:[0,73,34],svg:`<g id="voltage-led" role="img" aria-label="Voltage indicator LED"><g class="mat-led-off">${k.solidSvg(ledShape,{tone:'hi'})}</g><g id="led-emitter" class="mat-led-on" opacity="0">${k.solidSvg(ledShape,{tone:'hi'})}</g></g>`,shapes:[R.solid(A.ball([0,73,34],9,{name:'voltage-led'}))]});
A.settle(R,P);R.items.sort((a,b)=>a.key-b.key);A.auditOrExit(R,P);
// Print the traces on the deck before the instruments hide them.
const deckIndex=R.items.findIndex(i=>i.name.startsWith('inlay'));
R.items[deckIndex].svg+=traceSvg+`<defs><radialGradient id="led-pool"><stop stop-color="#ffd878" stop-opacity=".9"/><stop offset=".45" stop-color="#ffb842" stop-opacity=".4"/><stop offset="1" stop-color="#ffb842" stop-opacity="0"/></radialGradient></defs><circle id="led-glow" transform="${k.topMatrix([0,73],18.1,P,'x')}" r="36" fill="url(#led-pool)" opacity="0"/>`;
const text=(x,y,z,str,size=6)=>k.faceTextSvg(k.topMatrix([x,y],z,P,'x'),str,{size,anchor:'middle',tone:'hi'});
let details='<g class="lcd-readout">'+text(-108,-66,55.1,'12.0 V',7)+'</g>'+text(-106,69,39,'A',6)+text(95,69,39,'V',6);
for(const [x,y] of [[-106,62],[95,62]]){let d='';for(let i=0;i<=12;i++){const t=Math.PI*(1+i/12);d+=k.lineOnTop([x+Math.cos(t)*22,y+Math.sin(t)*22],[x+Math.cos(t)*19,y+Math.sin(t)*19],39,P);}details+=k.lineSvg(k.onTop(Array.from({length:65},(_,i)=>[x+22*Math.cos(Math.PI*(1+i/64)),y+22*Math.sin(Math.PI*(1+i/64))]),39,P),{tone:'mid'})+k.lineSvg(d,{tone:'mid'});}
const needles=[[-106,62],[95,62]].map(([x,y],i)=>`<path id="needle-${i}" class="iso-line" data-free="both" d="${k.lineOnTop([x,y],[x-20,y],39.2,P)}" style="stroke:#de7157;stroke-width:1.7"/>${k.dotsSvg([at([x,y,39.2])],{size:1.7,tone:'hi'})}`).join('');
const slider=R.items.filter(i=>i.name.startsWith('slider-')).map(i=>i.svg).join('');
const bulbAt=at([0,3,59]);
const socketSvg=`<g class="mat-steel">${k.solidSvg(k.cylinder(0,3,12,26,16,P,48,.3),{tone:'hi'})}</g>`;
const glassSvg=`<g class="mat-glass">${k.solidSvg(G.sphereOf([0,3,59],17,P),{tone:'hi'})}</g>`;
const bulb=`<g id="bulb" style="display:none">${socketSvg}${glassSvg}<ellipse id="bulb-light" cx="${bulbAt[0]}" cy="${bulbAt[1]}" rx="18" ry="22" fill="#ffd77a" opacity="0"/><path d="M${bulbAt[0]-7},${bulbAt[1]+7} l4,-13 5,10 5,-13" stroke="#ad7443" stroke-width="2" fill="none"/></g>`;
// Audit the true alternate cartridge without the removed resistor body.
const B=A.recorder(P);
B.items=R.items.filter(i=>!/^resistor\d|^resistor-band/.test(i.name));
B.solids=B.items.flatMap(i=>i.shapes);
B.put({name:'bulb-socket',at:[0,3,34],svg:socketSvg,shapes:[B.solid(A.cylinder(0,3,12,26,16,{name:'bulb-socket'}))]});
B.put({name:'bulb-glass',at:[0,3,59],svg:glassSvg,shapes:[B.solid(A.ball([0,3,59],17,{name:'bulb-glass'}))]});
A.settle(B,P);A.auditOrExit(B,P);
const figure=k.figureSvg({width:800,height:440,label:'Isometric school circuit bench: DC supply, rheostat, swappable conductor, series ammeter and parallel voltmeter. The contact and needles follow voltage.',body:`<path class="iso-halo" d="${k.haloOf({x:-160,y:-105,w:320,d:210,r:5},0,4,P)}"/>${R.items.filter(i=>!i.name.startsWith('slider-')).map(i=>i.svg).join('')}${details}${needles}<g id="rheostat-slider" class="mat-coral">${slider}</g>${bulb}`});
let html=readFileSync('page.html','utf8').replace('<!--STYLE-->',`<style>${k.ISO_CSS}\n${readFileSync('style.css','utf8')}</style>`).replace('<!--FIGURE-->',figure).replace('<!--SCRIPT-->',()=>`<script type="module">${kitScript()}\n{ const P=${JSON.stringify(P)};\n${readFileSync('app.js','utf8')}\n}</script>`);
const start=html.indexOf('<script type="module">')+'<script type="module">'.length,end=html.lastIndexOf('</script>');html=html.slice(0,start)+html.slice(start,end).replaceAll('</script','<\\/script')+html.slice(end);
writeFileSync('index.html',html);writeFileSync('index-dark.html',html.replace('<body class="iso" data-theme="light">','<body class="iso" data-theme="dark">'));
console.log(`Built Ohm lesson · ${count} static parts`);
