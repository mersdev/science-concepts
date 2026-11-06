// Portable analytic screw geometry. World units are 2 per mm; x is the screw axis.
(() => {
 const TAU=2*Math.PI,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const C={base:'#8eafa1',mat:'#d0e2bf',rubber:'#527569',wood:'#d7ad76',cut:'#ebc995',grain:'#b78b58',bore:'#ad8357',steel:'#99afb2',gold:'#e7bd62',dark:'#4d676a',coral:'#e68e73',blue:'#83b7d2',cream:'#f3e1b4'};
 function model(turns=0,pitch=3){pitch=[2,3,4].includes(+pitch)?+pitch:3;turns=clamp(Number(turns)||0,0,6);return {turns,pitch,angle:turns*TAU,travel:turns*pitch,advance:turns*pitch*2};}
 const spin=([x,y,z],m)=>[x+m.advance,y*Math.cos(m.angle)+(z-50)*Math.sin(m.angle),50-y*Math.sin(m.angle)+(z-50)*Math.cos(m.angle)];
 function mesh(turns,pitch,includeBench=true){const m=model(turns,pitch),lead=m.pitch*2,faces=[],solids=[];
  const face=(points,color,name,part='',moving=false)=>{points=moving?points.map(p=>spin(p,m)):points;if(points.every(p=>p.every(Number.isFinite)))faces.push({points,color,name,part});};
  const patch=(p,c,n,part='',moving=false)=>{face([p[0],p[1],p[2]],c,n,part,moving);face([p[0],p[2],p[3]],c,n,part,moving);};
  function box(x,y,z,w,d,h,c,name,part='',moving=false){const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]];p.push(...p.map(([x,y,z])=>[x,y,z+h]));for(const ids of [[3,2,1,0],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])face(ids.map(i=>p[i]),c,name,part,moving);solids.push({name,part,points:moving?p.map(p=>spin(p,m)):p});}
  function round(profile,y,z,c,name,part='',moving=false,steps=32){const start=faces.length;
   // A closed profile follows the outside from the left cap to the right cap.
   for(let j=0;j<profile.length;j++){const [x,r]=profile[j],[xx,rr]=profile[(j+1)%profile.length];for(let i=0;i<steps;i++){const a=i*TAU/steps,b=(i+1)*TAU/steps,at=(x,r,a)=>[x,y+r*Math.cos(a),z+r*Math.sin(a)];let p=[at(x,r,a),at(x,r,b),at(xx,rr,b),at(xx,rr,a)];if(r===0)p=[p[0],p[2],p[3]];if(rr===0)p=[p[0],p[1],p[2]];face(p,c,name,part,moving);}}
   solids.push({name,part,profile,points:faces.slice(start).flatMap(f=>f.points)});
  }
  const radius=(x,a)=>{let phase=(x+72)/lead+a/TAU;phase-=Math.round(phase);return 4.25+2.5*Math.max(0,1-Math.abs(phase)/.24);};
  if(includeBench){
  for(const x of [-100,80])for(const y of [-37,37]){box(x-6,y-6,-9,12,12,4,C.rubber,'rubber foot');box(x-4,y-4,-5,8,8,3,C.base,'foot riser');}
  box(-112,-49,-2,210,98,5,C.base,'bench');box(-109,-46,3,204,92,1,C.mat,'bench inlay');
  for(const x of [-101,87])for(const y of [-38,38]){box(x-3,y-3,4,6,6,.6,C.cream,'anchor plate');box(x-.8,y-.8,4.6,1.6,1.6,.5,C.dark,'anchor fastener');}
  // One wooden block with its front upper half removed and a half-bore exposed.
  box(0,-32,4,65,64,38,C.wood,'wood lower');box(0,-32,42,65,24,50,C.wood,'wood back');box(0,-8,58,65,8,34,C.cut,'wood upper cut');
  for(const z of [12,19,29,35])box(0,32,z,65,.04,.4,C.grain,'wood grain inlay');
  // Matching stationary female thread: a 0.25-world-unit radial clearance.
  const profile=[[-.5*lead,4.25],[-.24*lead,4.25],[0,6.75],[.24*lead,4.25],[.5*lead,4.25]],start=faces.length;
  const clipX=(poly,bound,greater)=>{let out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],a=greater?p[0]>=bound:p[0]<=bound,b=greater?q[0]>=bound:q[0]<=bound;if(a)out.push(p);if(a!==b){const t=(bound-p[0])/(q[0]-p[0]);out.push(p.map((v,j)=>v+(q[j]-v)*t));}}return out;};
  const boreFace=(p,name='wood bore')=>{p=clipX(clipX(p,0,true),65,false);if(p.length>=3)for(let i=1;i<p.length-1;i++)face([p[0],p[i],p[i+1]],C.bore,name);};
  for(let k=-2;k<=Math.ceil((65+72)/lead)+1;k++)for(let i=0;i<16;i++){
   const a=Math.PI/2+i*Math.PI/16,b=a+Math.PI/16,at=(angle,o,r)=>[-72+lead*(-angle/TAU+k)+o,r*Math.cos(angle),50+r*Math.sin(angle)];
   for(let j=0;j<profile.length-1;j++){const [o,r]=profile[j],[oo,rr]=profile[j+1];boreFace([at(a,o,r),at(a,oo,rr),at(b,oo,rr),at(b,o,r)]);
    if(i===0||i===15){const t=i===0?a:b,sign=i===0?1:-1;let p=[at(t,o,r),at(t,oo,rr),at(t,oo,8),at(t,o,8)];if(sign>0)p=p.reverse();boreFace(p,'wood cut lip');}
   }
  }
  // End-grain half rings join the exposed bore to the rectangular wood block.

  for(const x of [0,65])for(let i=0;i<64;i++){const a=Math.PI/2+i*Math.PI/64,b=a+Math.PI/64,at=(a,r)=>[x,r*Math.cos(a),50+r*Math.sin(a)],outer=a=>8/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));let p=[at(a,radius(x,a)),at(b,radius(x,b)),at(b,outer(b)),at(a,outer(a))];if(x===65)p=p.reverse();patch(p,C.cut,'bore end grain');}
  solids.push({name:'wood bore',points:faces.slice(start).flatMap(f=>f.points)});
  for(const x of [12,53]){box(x-7,36,4,14,12,3,C.base,'clamp base');box(x-3,39,7,6,6,38,C.steel,'clamp pedestal');box(x-4,25,42,8,7,3,C.rubber,'pressure pad');box(x-5,25,45,10,19,3,C.blue,'hold-down bar');box(x-1,39,48,2,2,3,C.gold,'clamp stud');box(x-4,37,51,8,6,2,C.cream,'clamp cap');box(x-.7,38,53,1.4,4,.15,C.dark,'clamp cap slot');}
  }
  // A faceted root shares the thread's angular sampling. Short axial bands avoid painter cycles.
  const core=[[ -78,0],[-78,4]];for(let x=-76;x<-8;x+=lead/4)core.push([x,4]);core.push([-8,4],[-8,0]);round(core,0,50,C.steel,'screw core','screw',true,32);
  round([[-8,0],[-8,4],[0,0]],0,50,C.steel,'point','screw',true,32);
  const count=Math.ceil(64/lead*32),ridgeStart=faces.length;
  for(let i=0;i<count;i++){const a=i*TAU/32,b=Math.min((i+1)*TAU/32,64/lead*TAU),marked=Math.abs((a+b)/2-Math.round(36/lead)*TAU)<TAU/16,color=marked?C.coral:C.gold,name=marked?'thread marker':'helical thread';
   const at=(t,o,r)=>[-72+lead*t/TAU+o*height(t)/2.5,r*Math.cos(t),50-r*Math.sin(t)],height=t=>2.5*clamp((lead*t/TAU)/lead,0,1)*clamp((64-lead*t/TAU)/lead,0,1);
   patch([at(a,-.24*lead,4),at(b,-.24*lead,4),at(b,0,4+height(b)),at(a,0,4+height(a))].reverse(),color,name,'screw',true);
   patch([at(a,0,4+height(a)),at(b,0,4+height(b)),at(b,.24*lead,4),at(a,.24*lead,4)].reverse(),color,name,'screw',true);
  }
  solids.push({name:'helical thread',part:'screw',points:faces.slice(ridgeStart).flatMap(f=>f.points)});
  round([[-86,0],[-86,8.5],[-85,10],[-81,10],[-78,5],[-78,0]],0,50,C.steel,'screw head','screw',true,32);
  box(-86.04,-6,49, .04,12,2,C.dark,'head cross slot','screw',true);box(-86.04,-1,44,.04,2,5,C.dark,'head cross slot','screw',true);box(-86.04,-1,51,.04,2,5,C.dark,'head cross slot','screw',true);
  round([[-86.4,0],[-86.4,1.1],[-86,1.1],[-86,0]],5,55,C.coral,'turn index','screw',true,16);
  return {faces,solids,m,radius};
 }
 globalThis.Screw={TAU,model,spin,mesh};
})();
