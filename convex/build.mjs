import {readFileSync,writeFileSync} from 'node:fs';
import * as k from '/Users/baoren/.agents/skills/anatomy/kit/iso-kit.mjs';
import * as A from '/Users/baoren/.agents/skills/anatomy/kit/audit.mjs';
import * as G from '/Users/baoren/.agents/skills/anatomy/kit/lathe.mjs';
import {kitScript} from '/Users/baoren/.agents/skills/anatomy/scripts/inline-kit.mjs';
// Figure: an optical bench; object and screen carriages slide independently.
// Fixed lens f=20 cm. World x=3 px per cm; principal axis z=90.
// Parts: 4 feet, deck, inlay, 4 screws; 2 rails, 4 stops, 8 stop bolts,
// metre ruler, zero insert; 3 carriages each with bed, 2 bushings,
// 2 fasteners, post and lock knob; lens ring and glass; object housing,
// backplate, aperture and luminous arrow; screen frame, 4 rim strips,
// white face and projected arrow. Model is written before geometry in app.js.
const P=k.fitProjection([[-270,-45,0],[332,47,0],[-270,-40,155],[330,40,155]],850,380,{pad:30,azimuth:62,elevation:25});
const R=A.recorder(P);let count=0;
function box(x,y,w,d,z,h,color='steel',name='part'){
 const plan={x,y,w,d,r:Math.min(2,w/5,d/5)},id=name+count++;
 const svg=`<g class="mat-${color}">${k.solidSvg(k.slabOf(plan,z,h,P,6,.5),{tone:'hi'})}</g>`;
 R.put({name:id,at:[x+w/2,y+d/2,z+h/2],svg,shapes:[R.solid(A.slab(plan,z,h,{name:id,ground:z===0}))]});
}
for(const x of [-251,297])for(const y of [-31,23])box(x,y,20,12,0,7,'rubber','stand.foot');
box(-265,-43,598,86,7,10,'base','deck');box(-260,-38,588,76,17,1,'cream','inlay');
for(const x of [-253,316])for(const y of [-33,30])box(x,y,4,3,18,1,'steel','screw');
for(const y of [-18,12]){
 box(-253,y,574,6,18,7,'steel','rail');
 for(const x of [-258,321]){box(x,y-2,5,10,18,11,'mint','endstop');for(const yy of [y-1,y+4])box(x+1,yy,2,2,29,1,'dark','stop-bolt');}
}
box(0,27,300,8,18,1,'cream','ruler');
box(-1,27,2,8,19,.3,'coral','zero-mark');
function carriage(x,prefix,color){
 box(x-15,-24,30,48,25,5,color,prefix+'-bed');
 for(const y of [-19,11]){box(x-12,y,24,8,30,4,'dark',prefix+'-bushing');box(x-7,y+2,3,3,34,1,'steel',prefix+'-bolt');}
 box(x-3,-3,6,6,30,24,'steel',prefix+'-post');
 box(x+3,-3,6,6,40,5,color,prefix+'-lock');
}
carriage(-180,'object','coral');
box(-185,-16,10,32,54,70,'coral','object-housing');
box(-175,-14,1,28,58,62,'dark','object-aperture');
// Aperture is mounted flush on the housing front.
carriage(0,'lens','lavender');
const F=G.frameAlong([0,0,90],[1,0,0]);
R.put({name:'lens-ring',at:[0,0,90],svg:`<g class="mat-lavender">${k.solidSvg(G.ringBand(-6,0,30,36,F,P,{hole:[0,30]}),{tone:'hi'})}</g>`,shapes:[R.solid(A.ring(F,-6,0,30,36,{name:'lens-ring'}))]});
R.put({name:'lens-glass',at:[0,0,90],svg:`<g class="mat-optic">${k.solidSvg(G.disc(0,1.5,30,F,P),{tone:'hi'})}</g>`,shapes:[R.solid(A.disc(F,0,1.5,30,{name:'lens-glass'}))]});
carriage(90,'screen','mint');
box(88,-34,4,68,54,90,'dark','screen-frame');
// Viewed through the frosted white screen from the rear.
box(92,-30,1,60,58,82,'cream','screen-face');
for(const y of [-34,30])box(92,y,2,4,54,90,'mint','screen-rim');
for(const z of [54,140])box(92,-30,2,60,z,4,'mint','screen-rim');
A.settle(R,P);R.items.sort((a,b)=>a.key-b.key);A.auditOrExit(R,P);
const ruler=R.items.find(i=>i.name.startsWith('ruler'));
let ticks='';for(let x=0,i=0;x<=300;x+=6,i++){ticks+=`<path d="${k.onTop([[x,27],[x,27+(i%5?3:6)],[x+.4,27+(i%5?3:6)],[x+.4,27]],19.1,P,true)}" fill="#687d86"/>`;if(i%5===0)ticks+=k.faceTextSvg(k.topMatrix([x,34],19.2,P,'x'),String(x/3),{size:2.3,anchor:'middle'});}
ruler.svg+=ticks;
const arrowAt=(x,height)=>k.pathOf([[x,-2,90],[x,2,90],[x,2,90+height-5*Math.sign(height)],[x,6,90+height-5*Math.sign(height)],[x,0,90+height],[x,-6,90+height-5*Math.sign(height)],[x,-2,90+height-5*Math.sign(height)]].map(p=>k.iso(p,P)),true);
const base=R.items.filter(i=>!/^object-|^screen-|^lens-/.test(i.name)).map(i=>i.svg).join('');
const group=prefix=>R.items.filter(i=>i.name.startsWith(prefix+'-')).map(i=>i.svg).join('');
const screenClip=k.pathOf([[93,-30,58],[93,30,58],[93,30,140],[93,-30,140]].map(p=>k.iso(p,P)),true);
const body=`<defs><clipPath id="screen-clip"><path d="${screenClip}"/></clipPath><filter id="defocus" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur id="blur-amount" stdDeviation="0"/></filter></defs><path class="iso-halo" d="${k.haloOf({x:-265,y:-43,w:598,d:86,r:5},0,4,P)}"/>${base}<g id="object-carriage">${group('object')}<path d="${arrowAt(-172,20)}" fill="#fff2ba"/></g>${group('lens')}<g id="screen-carriage">${group('screen')}<g clip-path="url(#screen-clip)"><path id="screen-image" d="${arrowAt(93,-10)}" fill="#ef8057" filter="url(#defocus)"/></g></g>`;
const figure=k.figureSvg({width:850,height:380,label:'Optical bench with an illuminated arrow, fixed convex lens in a holder, frosted white screen and metre ruler. Move the object and slide the screen to bring the inverted image into focus.',body});
let html=readFileSync('page.html','utf8').replace('<!--STYLE-->',()=>`<style>${k.ISO_CSS}\n${readFileSync('style.css','utf8')}</style>`).replace('<!--FIGURE-->',()=>figure).replace('<!--SCRIPT-->',()=>`<script type="module">${kitScript()}\n{const P=${JSON.stringify(P)};\n${readFileSync('app.js','utf8')}\n}</script>`);
const start=html.indexOf('<script type="module">')+'<script type="module">'.length,end=html.lastIndexOf('</script>');html=html.slice(0,start)+html.slice(start,end).replaceAll('</script','<\\/script')+html.slice(end);
writeFileSync('index.html',html);writeFileSync('index-dark.html',html.replace('<body class="iso" data-theme="light">','<body class="iso" data-theme="dark">'));
console.log(`Built convex lens lesson · ${count+2} solids`);
