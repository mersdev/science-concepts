import assert from 'node:assert/strict';
import './mechanism.js';
const S=globalThis.Sharpener;
for(const t of [0,.25,1,3,6])for(const e of [0,25,100]){const s=S.model(t,e);assert.equal(s.axleTurns,t);assert.equal(s.cutterTurns,-2*t);assert.equal(s.relativeTurns,-3*t);assert.equal(s.pointLength,46*t/6);assert.equal(s.assembled,e===0);assert.equal(s.progress,t/6);}
assert.equal(S.model(-2,-10).turns,0);assert.equal(S.model(9,200).apart,100);
// Closed involute reference outlines; proper intersections exclude tangencies.
function outline(n,internal){const tooth=S.tooth(n,internal),pitch=S.TAU/n,out=[];for(let t=0;t<n;t++){const a=t*pitch,rot=([x,y])=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];out.push(...tooth.map(rot));const end=Math.atan2(tooth.at(-1)[1],tooth.at(-1)[0]),start=Math.atan2(tooth[0][1],tooth[0][0])+pitch,r=n+(internal?2.5:-2.5);for(let i=1;i<4;i++)out.push([r*Math.cos(a+end+(start-end)*i/4),r*Math.sin(a+end+(start-end)*i/4)]);}return out;}
const ring=outline(36,true),pinion=outline(12,false),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
let crossings=0;
for(let step=0;step<72;step++){const a=step*S.TAU/72,spin=-2*a+Math.PI/12,gear=pinion.map(([x,y])=>[24*Math.cos(a)+x*Math.cos(spin)-y*Math.sin(spin),24*Math.sin(a)+x*Math.sin(spin)+y*Math.cos(spin)]);for(let i=0;i<gear.length;i++){const p=gear[i],q=gear[(i+1)%gear.length];for(let j=0;j<ring.length;j++){const r=ring[j],s=ring[(j+1)%ring.length];if(Math.max(p[0],q[0])<Math.min(r[0],s[0])||Math.max(r[0],s[0])<Math.min(p[0],q[0])||Math.max(p[1],q[1])<Math.min(r[1],s[1])||Math.max(r[1],s[1])<Math.min(p[1],q[1]))continue;if(cross(p,q,r)*cross(p,q,s)<-1e-8&&cross(r,s,p)*cross(r,s,q)<-1e-8)crossings++;}}}
assert.equal(crossings,0,'ring and planet tooth profiles never cross');
console.log('PASS sharpener model/gear audit: 72 mesh poses, tooth crossings 0; exact crank/axle/planet ratios and clamped limits');
