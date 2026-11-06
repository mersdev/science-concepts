// Pure teaching model; mm, radians and complete turns. Also loadable by Node.
(()=>{
 const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
 function model(turns,apart){turns=clamp(turns,0,6);apart=clamp(apart,0,100);return {turns,apart,assembled:apart<.001,angle:turns*TAU,axleTurns:turns,cutterTurns:-2*turns,relativeTurns:-3*turns,progress:turns/6,pointLength:46*turns/6};}
 const phase=(e,a,b)=>clamp((e-a)/(b-a),0,1);
 function offset(part,e){const h=phase;return ({housing:[-80*h(e,30,40),20*h(e,15,22),105*h(e,22,32)],handle:[65*h(e,45,55),-65*h(e,35,45),0],gears:[80*h(e,65,75),90*h(e,50,65),0],axle:[-70*h(e,95,100),45*h(e,90,95),0],'axle-front':[-70*h(e,65,75),90*h(e,50,65),0],cutter:[105*h(e,85,95),80*h(e,75,85),0],pencil:[0,175*h(e,0,15),0],fixed:[0,0,0]})[part];}

 const orbit=a=>[24*Math.cos(a),0,85+24*Math.sin(a)];
 const involute=a=>Math.tan(a)-a,pressure=20*Math.PI/180;
 function tooth(n,internal=false){const r=n,base=r*Math.cos(pressure),root=r+(internal?2.5:-2.5),tip=r+(internal?-2:2),half=Math.PI/(2*n)-(internal?.006:.015),at=radius=>half+(internal?1:-1)*(involute(Math.acos(Math.min(1,base/radius)))-involute(pressure)),points=[];
  const point=(radius,a)=>points.push([radius*Math.cos(a),radius*Math.sin(a)]),start=Math.max(base,Math.min(root,tip));
  point(root,-at(Math.max(base,root)));if(root<base)point(base,-at(base));
  for(let i=0;i<=5;i++){const v=(internal?root:start)+(tip-(internal?root:start))*i/5;point(v,-at(v));}
  for(let i=1;i<=4;i++)point(tip,-at(tip)+2*at(tip)*i/4);
  for(let i=4;i>=0;i--){const v=(internal?root:start)+(tip-(internal?root:start))*i/5;point(v,at(v));}
  if(root<base)point(root,at(base));return points;
 }
 globalThis.Sharpener={TAU,model,offset,orbit,tooth,ringTeeth:36,pinionTeeth:12};
})();
