import assert from 'node:assert/strict';
import './screw.js';
const S=globalThis.Screw;
let poses=0,points=0;
for(const pitch of [2,3,4])for(const n of [0,.0625,.125,.25,.375,.5,.625,.75,.875,1,2.37,4.2,6,39/pitch/2,39/pitch-.25,39/pitch]){
 const mesh=S.mesh(n,pitch),m=mesh.m;
 assert.equal(m.travel,n*pitch);assert.equal(m.advance,2*m.travel);assert(m.advance<=78&&m.advance>=0);
 assert(-78+m.advance<=0&&m.advance<90,'head underside stays outside; tip stays within wood');assert.equal(m.maxTurns,39/pitch);assert.equal(m.remaining,m.maxTurns-n);assert.equal(m.progress,m.travel/39);if(m.seated)assert(m.travel===39&&m.advance===78&&m.remaining===0&&m.progress===1,'full seating: shank inside, bearing face flush');
 assert(mesh.solids.length>=40&&mesh.faces.length>1000);
 for(const f of mesh.faces)for(const p of f.points){assert(p.every(Number.isFinite));points++;
  if(f.name==='helical thread'||f.name==='thread marker')assert(p[0]>=-72+m.advance-1e-8&&p[0]<=-8+m.advance+1e-8,'thread ends taper into the supported core');
  if(f.part==='screw'&&p[0]>1e-7&&p[0]<=90){const a=Math.atan2(p[2]-50,p[1]),r=Math.hypot(p[1],p[2]-50);assert(r<=mesh.radius(p[0],a)-.20,'screw remains clear of the prepared groove');}
 }
 // Test the true helical identity at material points, including partial turns.
 for(let t=.4;t<60/(pitch*2)*S.TAU;t+=.23){const local=[-72+pitch*2*t/S.TAU,6.5*Math.cos(t),50-6.5*Math.sin(t)],world=S.spin(local,m),angle=t+m.angle;
  assert(Math.abs(world[0]-pitch*2*angle/S.TAU+72)<1e-10,'advance and angle preserve the engaged helix');
  assert(Math.abs(Math.hypot(world[1],world[2]-50)-6.5)<1e-10);assert(Math.abs(world[1]-6.5*Math.cos(angle))<1e-10&&Math.abs(world[2]-50+6.5*Math.sin(angle))<1e-10);
 }
 assert(pitch*2*(1-.48)>0,'neighboring thread flanks do not intersect');poses++;
}
assert.equal(S.model(-1,3).turns,0);assert.equal(S.model(99,3).turns,13);assert.equal(S.model(2,99).pitch,3);
console.log(`Screw geometry audit passed: ${poses} poses, ${points} finite mesh vertices, exact helical engagement, positive groove clearance and bounded travel.`);
