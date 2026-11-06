import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const context={};
runInNewContext(readFileSync(new URL('app.js',import.meta.url),'utf8'),context);
const {model}=context.pulleyPhysics;
// Exact planar routes: straight strands meet semicircles at vertical tangents.
// Check every permitted pose, including minimum clearance at full stroke.
for(const mode of ['fixed','movable','combined'])for(let h=0;h<=30;h+=.25){
  const s=model(mode,h,40),initial=model(mode,0,40);
  assert(Math.abs(s.ropeLength-initial.ropeLength)<1e-9,`${mode}: rope length at ${h}`);
  assert.equal(s.force*s.s,s.w*s.h,'ideal work conservation');
  assert(s.loadY+51<389,'load clears bench');
  assert(s.handleY>=80&&s.handleY+39<389,'handle stays within frame');
  assert(s.movingY-33>140,'moving wheel clears fixed wheel');
  if(mode==='movable')assert(s.movingY-s.handleY>30,'free strand stays above moving wheel');
  if(mode==='combined')assert(s.movingY-110>60,'two wheel flanges never intersect');
  assert.equal(Math.abs(s.handleX-(mode==='fixed'?355:mode==='movable'?290:350)),30,'free strand tangent');
}
console.log('Pulley geometry audit passed: conserved rope, tangency, work, clearance and complete travel.');
