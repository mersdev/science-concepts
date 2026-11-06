import assert from 'node:assert/strict';
import './gear.js';
const G=globalThis.Gear,counts=[18,24,36];
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function intersects(a,b,c,d){const p=cross(a,b,c),q=cross(a,b,d),r=cross(c,d,a),s=cross(c,d,b);return p*q< -1e-12&&r*s< -1e-12;}
function edges(points,low,high){return points.flatMap((a,i)=>{const b=points[(i+1)%points.length];return Math.max(a[0],b[0])>=low&&Math.min(a[0],b[0])<=high?[{a,b,min:Math.min(a[1],b[1]),max:Math.max(a[1],b[1])}]:[];});}
let poses=0;
for(const a of counts)for(const b of counts){const centers=G.centers(a,b),pa=G.profile(a),pb=G.profile(b),contact=a-b;
 assert.equal(Math.hypot(centers[1][0]-centers[0][0],centers[1][1]-centers[0][1]),a+b);
 for(let i=0;i<96;i++){const turns=i/(96*a),phases=G.phase(a,b,turns),aa=G.transformed(pa,centers[0],phases[0]),bb=G.transformed(pb,centers[1],phases[1]),ea=edges(aa,contact-2.1,contact+2.1),eb=edges(bb,contact-2.1,contact+2.1);
  for(const x of ea)for(const y of eb)if(x.max>=y.min&&y.max>=x.min)assert(!intersects(x.a,x.b,y.a,y.b),`gear tooth collision: ${a}/${b} phase ${i}`);
  for(const p of [...aa,...bb])assert(p.every(Number.isFinite)&&Math.abs(p[0])<=74.001&&Math.abs(p[1])<=38.001);
  const m=G.model(a,b,turns);assert(Math.abs(m.turns*a+m.driven*b)<1e-10);poses++;
 }
}
console.log(`Gear geometry audit passed: ${poses} mesh poses, no tooth crossings, matching pitch, finite bounds and exact rotation ratios.`);
