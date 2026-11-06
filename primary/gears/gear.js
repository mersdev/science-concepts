// Shared pure geometry and kinematics. Units: mm, radians and complete turns.
(() => {
 const TAU=Math.PI*2,pressure=20*Math.PI/180,module=2;
 const involute=a=>Math.tan(a)-a;
 function dimensions(n){return {n,r:n*module/2,base:n*module/2*Math.cos(pressure),root:n*module/2-1.25*module,tip:n*module/2+module};}
 function profile(n){const {r,base,root,tip}=dimensions(n),half=Math.PI/(2*n),halfBase=half+involute(pressure),angle=radius=>halfBase-involute(Math.acos(base/radius)),out=[];
  const point=(radius,a)=>out.push([radius*Math.cos(a),radius*Math.sin(a)]);
  for(let tooth=0;tooth<n;tooth++){const c=tooth*TAU/n;point(root,c-halfBase);point(base,c-halfBase);
   for(let i=1;i<=16;i++){const radius=base+(tip-base)*i/16;point(radius,c-angle(radius));}
   const top=angle(tip);for(let i=1;i<=6;i++)point(tip,c-top+2*top*i/6);
   for(let i=15;i>=0;i--){const radius=base+(tip-base)*i/16;point(radius,c+angle(radius));}
   point(root,c+halfBase);const end=(tooth+1)*TAU/n-halfBase;for(let i=1;i<=5;i++)point(root,c+halfBase+(end-c-halfBase)*i/6);
  }return out;
 }
 function model(input,output,turns,direction=1){return {input,output,turns,driven:-turns*input/output,ratio:input/output,driverDirection:direction,drivenDirection:-direction,distance:dimensions(input).r+dimensions(output).r};}
 const centers=(a,b)=>[[-dimensions(b).r,0],[dimensions(a).r,0]];
 const transformed=(points,c,angle)=>{const co=Math.cos(angle),si=Math.sin(angle);return points.map(([x,y])=>[c[0]+x*co-y*si,c[1]+x*si+y*co]);};
 const phase=(a,b,turns)=>[turns*TAU,Math.PI+Math.PI/b-turns*TAU*a/b];
 globalThis.Gear={TAU,module,pressure,dimensions,profile,model,centers,transformed,phase};
})();
