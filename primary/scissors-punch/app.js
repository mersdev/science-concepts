const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rad=Math.PI/180;
const P={origin:[410,225],scale:1.8,azimuth:75,elevation:36},stage=$('#stage'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const C={base:'#8eac99',mat:'#c6d8ae',dark:'#5c796f',steel:'#a4b8b6',light:'#e6e9d8',blue:'#78b1d5',coral:'#e78d73',mint:'#85bda8',gold:'#e8bf61'};
let mode='scissors',current=0,target=0,apart=0,apartTarget=0,selected='operate',auto=false,time=0,visible=true,frame=0,last=0;
let papers={scissors:false,punch:false};
// ponytail: geometric coupling and persistent paper results, without fracture/force simulation.
function model(kind,q=0,e=0){q=clamp(Number(q)||0,0,100);e=clamp(Number(e)||0,0,100)/100;const op=e>0?0:q;
 if(kind==='scissors'){const angle=(25-.27*op)*rad,gap=Math.max(0,100*Math.sin(angle));return {q:op,e,angle,gap,cut:angle<=0,stroke:100*Math.sin(25*rad)-gap};}
 const angle=(18-.18*op)*rad,roller=80+55*Math.tan(angle)-10/Math.cos(angle),head=roller-6,tip=head-42,f=clamp((e-.4)/.6,0,1);return {q:op,e,angle,roller,head,tip,gap:Math.max(0,tip-26),stroke:modelPunchRest()-tip,cut:tip<=25.5,f,pinY:110*Math.min(e,.4),pinZ:55*f};
}
function modelPunchRest(){return 80+55*Math.tan(18*rad)-10/Math.cos(18*rad)-48;}
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/Math.hypot(...a));
const cam=cameraOf(P),U=[cam.sinA,-cam.cosA,0],W=[cam.cosA*cam.sinE,cam.sinA*cam.sinE,-cam.cosE],V=[cam.cosA*cam.cosE,cam.sinA*cam.cosE,cam.sinE];
const shade=(c,f)=>'#'+c.slice(1).match(/../g).map(v=>Math.round(Math.min(255,parseInt(v,16)*f)).toString(16).padStart(2,'0')).join('');
let faces=[],solids=[],orderAudit={cycles:0,crossings:0};
function face(points,color,part='',name=''){let n=cross(sub(points[1],points[0]),sub(points[2],points[0]));if(Math.hypot(...n)<1e-8||dot(n,V)<=1e-8)return;n=unit(n);const screen=points.map(p=>iso(p,P)),bounds={l:Math.min(...screen.map(p=>p[0])),r:Math.max(...screen.map(p=>p[0])),t:Math.min(...screen.map(p=>p[1])),b:Math.max(...screen.map(p=>p[1]))};faces.push({points,screen,bounds,n,plane:dot(n,points[0]),color:shade(color,.7+.24*Math.max(0,n[2])+.12*Math.max(0,n[0])+.07*Math.max(0,n[1])),part,name});}
function prism(poly,vector,color,name,part='',omit=[]){const points=[...poly,...poly.map(p=>add(p,vector))],n=poly.length,center=mul(points.reduce((a,b)=>add(a,b),[0,0,0]),1/points.length),start=faces.length;
 let faceIndex=0;for(const ids of [Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i+n),...Array.from({length:n},(_,i)=>[i,(i+1)%n,(i+1)%n+n,i+n])]){if(omit.includes(faceIndex++))continue;let p=ids.map(i=>points[i]);const mid=mul(p.reduce((a,b)=>add(a,b),[0,0,0]),1/p.length);if(dot(cross(sub(p[1],p[0]),sub(p[2],p[0])),sub(mid,center))<0)p=p.reverse();face(p,color,part,name);}
 solids.push({poly,vector,name,part,faces:faces.slice(start)});
}
function box(x,y,z,w,d,h,c,name,part=''){prism([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],[0,0,h],c,name,part);}
function screw(x,y,z,name,part=''){box(x-1.7,y-1.7,z,3.4,3.4,.6,C.light,name,part);box(x-1,y-.2,z+.6,2,.4,.08,C.dark,name+' slot',part);}

function disc(x,y,z,r,h,c,name,part='',n=32,omit=[]){prism(Array.from({length:n},(_,i)=>[x+r*Math.cos(i*2*Math.PI/n),y+r*Math.sin(i*2*Math.PI/n),z]),[0,0,h],c,name,part,omit);}
function ringXY(cx,cy,rx,ry,width,z,h,c,name,part='',transform=p=>p,clip=false){for(let i=0;i<48;i++){const a=i*Math.PI/24,b=(i+1)*Math.PI/24,point=(r,s,t)=>transform([cx+(clip?Math.min(r*Math.cos(t),rx*.88):r*Math.cos(t)),cy+s*Math.sin(t),z]);prism([point(rx-width,ry-width,a),point(rx,ry,a),point(rx,ry,b),point(rx-width,ry-width,b)],[0,0,h],c,name,part,[2,4]);}}
function ring(x,y,z,rin,rout,h,c,name,part=''){ringXY(x,y,rout,rout,rout-rin,z,h,c,name,part);}
function pinY(x,y,z,r,d,c,name,part='',omit=[]){prism(Array.from({length:24},(_,i)=>[x+r*Math.cos(i*Math.PI/12),y,z+r*Math.sin(i*Math.PI/12)]),[0,d,0],c,name,part,omit);}
function squareRing(outer,inner,point,vector,c,name,part=''){for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4,p=(r,t)=>{const k=r/Math.max(Math.abs(Math.cos(t)),Math.abs(Math.sin(t)));return point(k*Math.cos(t),k*Math.sin(t));};prism([p(inner,a),p(outer,a),p(outer,b),p(inner,b)],vector,c,name,part,[2,4]);}}
function foundation(){for(const x of [-110,110])for(const y of [-54,54])box(x-6,y-6,0,12,12,6,C.dark,'stand.foot');box(-125,-65,6,250,130,4,C.base,'stand.bench');box(-122,-62,10,244,124,2,C.mat,'stand.inlay');for(const x of [-114,114])for(const y of [-55,55])screw(x,y,12,'bench screw');}
function scissors(){const m=model(mode,current,apart),e=m.e;box(-13,-13,12,26,26,22,C.mint,'pivot pedestal');
 ring(0,0,34+8*e,3,8,2,C.gold,'lower washer');
 for(const sign of [-1,1]){const z=sign===1?40+35*e:36+12*e,a=sign*m.angle,T=([x,y,zz])=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),zz],B=(x,y,zz,w,d,h,c,name)=>prism([[x,y,zz],[x+w,y,zz],[x+w,y+d,zz],[x,y+d,zz]].map(T),[0,0,h],c,name,'operate');
  const centerY=-sign*14;
  ringXY(-65,centerY,25,11.5,4.5,z-2,8,sign===1?C.coral:C.mint,'handle grip','operate',T,true);ringXY(-65,centerY,23,9.5,1.5,z+6,.3,C.light,'grip inner inlay','operate',T,true);
  prism([[-43,-17*sign,z],[-43,-9*sign,z],[-10,4*sign,z],[-10,-4*sign,z]].map(T),[0,0,4],C.steel,'metal shank','operate');
  squareRing(10,3,(x,y)=>T([x,y,z]),[0,0,4],C.steel,'pivot eye','operate');
  B(10,sign>0?3:-12,z,85,9,4,C.steel,'blade spine');B(10,sign>0?11:-12,z+4,85,1,.25,C.light,'blade back inlay');
  const edgeZ=40+(sign>0?35:12)*e;prism([[10,0,edgeZ],[10,3*sign,edgeZ],[10,3*sign,edgeZ+4*sign]].map(T),[85*Math.cos(a),85*Math.sin(a),0],C.blue,'cutting bevel','operate');
 }
 ring(0,0,44+40*e,3,8,2,C.gold,'upper washer');for(let z=34;z<46;z+=2)disc(0,0,z+55*e,2.7,2,C.gold,'pivot screw shaft','apart',32,[...(z>34?[0]:[]),...(z<44?[1]:[])]);disc(0,0,46+55*e,6,3,C.gold,'pivot screw head','apart',6);box(-3,-.6,49+55*e,6,1.2,.15,C.dark,'pivot screw slot','apart');
}
function tube(points,r,c,name){const start=faces.length,rings=points.map((p,i)=>{const axis=i===0||i===points.length-1?[0,0,1]:unit(sub(points[i+1],points[i-1])),u=unit(cross(axis,[1,0,0])),v=cross(axis,u);return Array.from({length:6},(_,j)=>add(p,add(mul(u,r*Math.cos(j*Math.PI/3)),mul(v,r*Math.sin(j*Math.PI/3)))));});
 for(let i=0;i<points.length-1;i++)for(let j=0;j<6;j++){const k=(j+1)%6,p=[rings[i][j],rings[i][k],rings[i+1][k],rings[i+1][j]],mid=mul(add(points[i],points[i+1]),.5);if(dot(cross(sub(p[1],p[0]),sub(p[2],p[0])),sub(p[0],mid))<0)p.reverse();face([p[0],p[1],p[2]],c,'',name);face([p[0],p[2],p[3]],c,'',name);}solids.push({kind:'tube',points,radius:r,name,faces:faces.slice(start)});
}
function punch(){const m=model(mode,current,apart),f=m.f,guide=12*f,cutter=25*f,lever=38*f,pin=m.pinY;
 box(-84,-43,12,190,86,6,C.mint,'punch base');for(const x of [-73,94])for(const y of [-33,33])screw(x,y,18,'base fastener');
 for(const y of [-20,15]){box(-61,y,18,12,5,52,C.steel,'pivot cheek stem');squareRing(10,3,(x,z)=>[-55+x,y,80+z],[0,5,0],C.steel,'pivot cheek');}
 // A single headed pin withdraws along y before lifting clear of the fixed cheeks.
 for(let y=-20;y<20;y+=2)pinY(-55,y+pin,80+m.pinZ,2.7,2,C.gold,'pivot pin','apart',[...(y>-20?[0]:[]),...(y<18?[1]:[])]);pinY(-55,20+pin,80+m.pinZ,6,3,C.gold,'pivot pin head','apart');box(-58,23+pin,79.5+m.pinZ,6,.15,1,C.dark,'pin head slot','apart');
 const T=[Math.cos(m.angle),0,Math.sin(m.angle)],N=[-Math.sin(m.angle),0,Math.cos(m.angle)],base=[-55,0,80+lever];
 const B=(u,y,n,w,d,h,c,name)=>{const p=(u,y)=>add(base,add(mul(T,u),add([0,y,0],mul(N,n))));prism([p(u,y),p(u+w,y),p(u+w,y+d),p(u,y+d)],mul(N,h),c,name,'operate');};
 squareRing(8,3,(u,n)=>add(base,add(mul(T,u),add([0,-12,0],mul(N,n)))),[0,24,0],C.coral,'handle pivot eye','operate');B(8,-12,-4,132,24,8,C.coral,'lever arm');B(105,-13,4,35,26,4,C.mint,'handle grip');for(const u of [111,133]){B(u,-3,8,3,6,.5,C.light,'grip fastener');B(u+.5,-.4,8.5,2,.8,.08,C.dark,'grip fastener slot');}
 for(const x of [-22,16])box(x,-18,18+guide,6,8,25,C.steel,'guide post');
 // Four rails form a true opening around the moving cutter.
 squareRing(18,6,(x,y)=>[x,y,43+guide],[0,0,7],C.steel,'guide frame');
 ring(0,0,18+12*f,5.6,12,7,C.gold,'die');
 const tip=m.tip+cutter,head=m.head+cutter;pinY(0,-8,m.roller+cutter,6,16,C.gold,'follower roller');
 for(let z=tip+3;z<head-4-.001;z+=3){const h=Math.min(3,head-4-z);disc(0,0,z,5,h,C.blue,'punch shaft','',32,[...(z>tip+3+.001?[0]:[]),...(z+h<head-4-.001?[1]:[])]);}disc(0,0,head-4,10,4,C.blue,'punch head');
 // A thin annular bevel is a wedge around the cutter's circular edge.
 const bevelStart=faces.length;for(let i=0;i<48;i++){const a=i*Math.PI/24,b=(i+1)*Math.PI/24,lo=t=>[4.6*Math.cos(t),4.6*Math.sin(t),tip],outer=t=>[5*Math.cos(t),5*Math.sin(t),tip+3],inner=t=>[4.6*Math.cos(t),4.6*Math.sin(t),tip+3];face([lo(a),lo(b),outer(b),outer(a)],C.blue,'','punch bevel');face([lo(a),inner(a),inner(b),lo(b)],C.blue,'','punch bevel');}solids.push({kind:'body',axis:[0,0,1],profile:[[tip,4.6],[tip+3,5],[tip+3,4.6]],name:'punch bevel',faces:faces.slice(bevelStart)});
 const bottom=50+guide,top=m.head-4+guide,points=[[8,0,bottom]];for(let i=0;i<=70;i++){const t=i/70,a=t*10*Math.PI;points.push([8*Math.cos(a),8*Math.sin(a),bottom+1.5+(top-bottom-3)*t]);}points.push([8,0,top]);tube(points,.65,C.gold,'return spring');
}
function overlap(a,b){let out=a;const area=b.reduce((s,p,i)=>s+p[0]*b[(i+1)%b.length][1]-p[1]*b[(i+1)%b.length][0],0),sign=area<0?-1:1;
 for(let i=0;i<b.length&&out.length;i++){const p=b[i],q=b[(i+1)%b.length],side=v=>sign*((q[0]-p[0])*(v[1]-p[1])-(q[1]-p[1])*(v[0]-p[0])),input=out;out=[];
  for(let j=0;j<input.length;j++){const x=input[j],y=input[(j+1)%input.length],sx=side(x),sy=side(y);if(sx>=0)out.push(x);if((sx>=0)!==(sy>=0)){const t=sx/(sx-sy);out.push([x[0]+(y[0]-x[0])*t,x[1]+(y[1]-x[1])*t]);}}
 }return out;
}
function orderedFaces(){
 const count=faces.length,after=Array.from({length:count},()=>[]),degree=new Uint16Array(count),depth=(f,p)=>(f.plane-dot(f.n,U)*(p[0]-P.origin[0])/cam.k-dot(f.n,W)*(p[1]-P.origin[1])/cam.k)/dot(f.n,V);let crossings=0;const crossingPairs=[];
 const indices=Array.from({length:count},(_,i)=>i).sort((a,b)=>faces[a].bounds.l-faces[b].bounds.l);
 for(let ai=0;ai<count;ai++){const i=indices[ai],a=faces[i];for(let bi=ai+1;bi<count;bi++){const j=indices[bi],b=faces[j];if(b.bounds.l>=a.bounds.r-.02)break;if(a.bounds.b<=b.bounds.t+.02||b.bounds.b<=a.bounds.t+.02)continue;
  const poly=overlap(a.screen,b.screen);if(poly.length<3)continue;const area=Math.abs(poly.reduce((s,p,k)=>s+p[0]*poly[(k+1)%poly.length][1]-p[1]*poly[(k+1)%poly.length][0],0))/2;if(area<.03)continue;
  const differences=poly.map(p=>depth(a,p)-depth(b,p));if(Math.min(...differences)<-.02&&Math.max(...differences)>.02){crossings++;if(crossingPairs.length<15)crossingPairs.push([a.name,b.name,Math.min(...differences),Math.max(...differences)]);continue;}const difference=differences.reduce((a,b)=>a+b,0)/poly.length;if(Math.abs(difference)<.001)continue;
  const back=difference<0?i:j,front=difference<0?j:i;after[back].push(front);degree[front]++;
 }}
 const ready=indices.filter(i=>degree[i]===0),out=[];for(let k=0;k<ready.length;k++){const i=ready[k];out.push(faces[i]);for(const j of after[i])if(--degree[j]===0)ready.push(j);}
 let cycle=[];if(out.length!==count){const marks=new Uint8Array(count),stack=[];const visit=i=>{marks[i]=1;stack.push(i);for(const j of after[i]){if(!degree[j])continue;if(marks[j]===1){cycle=stack.slice(stack.indexOf(j)).map(k=>({name:faces[k].name,points:faces[k].points}));return true;}if(!marks[j]&&visit(j))return true;}stack.pop();marks[i]=2;return false;};for(let i=0;i<count&&!cycle.length;i++)if(degree[i]&&!marks[i])visit(i);}
 orderAudit={cycles:count-out.length,crossings,crossingPairs,cycle};if(out.length!==count){const seen=new Set(out);out.push(...faces.filter(f=>!seen.has(f)).sort((a,b)=>dot(a.points[0],V)-dot(b.points[0],V)));}return out;
}


function geometry(){P.origin[1]=mode==='scissors'?258:305;faces=[];solids=[];foundation();if(mode==='scissors')scissors();else punch();const sorted=orderedFaces();$('#apparatus').innerHTML=sorted.map(f=>`<polygon ${f.part?`data-part="${f.part}"`:''} points="${f.screen.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')}" fill="${f.color}"/>`).join('');positionHints();return {faces:sorted,solids,orderAudit};}
function positionHints(){const m=model(mode,current,apart),handle=mode==='scissors'?[-65*Math.cos(m.angle)+14*Math.sin(m.angle),-65*Math.sin(m.angle)-14*Math.cos(m.angle),46+35*m.e]:[-55+125*Math.cos(m.angle),0,80+125*Math.sin(m.angle)+9+38*m.f],pin=mode==='scissors'?[0,0,50+55*m.e]:[-55,23+m.pinY,80+m.pinZ];positionMoveHint($('#operate-hint'),handle,P);positionMoveHint($('#apart-hint'),pin,P);const a=$('#operate-hint').getBoundingClientRect(),b=$('#apart-hint').getBoundingClientRect();if(a.width&&a.left<b.right+6&&a.right>b.left-6&&a.top<b.bottom+6&&a.bottom>b.top-6)$('#apart-hint').style.top=clamp(parseFloat($('#apart-hint').style.top)+a.height+10,18,stage.clientHeight-20)+'px';}
function preview(){const cut=papers[mode];$('#paper-status').textContent=cut?(mode==='scissors'?'Paper cut':'Hole punched'):'Intact paper';let art='';if(mode==='scissors'){art=cut?'<path d="M75 7H325V39H75Z M75 49H325V82H75Z" fill="#f1dfaf" stroke="#b6a36f" stroke-width="1.2"/>':'<rect x="75" y="7" width="250" height="75" fill="#f1dfaf" stroke="#b6a36f" stroke-width="1.2"/>';}
 else{art=`<defs><mask id="paper-hole"><rect width="400" height="90" fill="white"/>${cut?'<circle cx="200" cy="40" r="13" fill="black"/>':''}</mask></defs><rect x="75" y="7" width="250" height="65" rx="2" fill="#f1dfaf" stroke="#b6a36f" stroke-width="1.2" mask="url(#paper-hole)"/>${cut?'<circle cx="348" cy="75" r="10" fill="#f1dfaf" stroke="#b6a36f"/>':''}`;}
 $('#paper-art').innerHTML=art;$('#paper-svg').setAttribute('aria-label',mode==='scissors'?(cut?'Paper separated into two pieces':'Uncut paper sample'):(cut?'Paper with a round punched hole and a separated disc':'Paper without a hole'));
}
function graph(){const max=mode==='scissors'?45:15,X=q=>46+q/100*324,Y=g=>171-g/max*142;let art='';for(const q of [0,25,50,75,100])art+=`<path d="M${X(q)} 29V171" stroke="var(--grid)"/><text x="${X(q)}" y="188" text-anchor="middle">${q}</text>`;for(const g of [0,max/3,max*2/3,max])art+=`<path d="M46 ${Y(g)}H370" stroke="var(--grid)"/><text x="36" y="${Y(g)+4}" text-anchor="end">${g}</text>`;art+='<path d="M46 27V171H373" stroke="var(--muted)" fill="none"/><text x="46" y="17">Clearance / mm</text><text x="370" y="207" text-anchor="end">Handle motion / %</text>';let d='';for(let q=0;q<=100;q++)d+=`${q?'L':'M'}${X(q)} ${Y(model(mode,q).gap)}`;const m=model(mode,current,apart);art+=`<path d="${d}" fill="none" stroke="var(--graph)" stroke-width="2.6"/><circle id="graph-point" cx="${X(m.q)}" cy="${Y(m.gap)}" r="5" fill="var(--coral)" stroke="var(--paper)" stroke-width="2"/>`;$('#plot').innerHTML=art;}
function render(){const m=model(mode,current,apart);if(apart===0&&m.cut)papers[mode]=true;
 for(const [id,value] of [['operate',m.q],['apart',apart]]){$('#'+id).value=value;$('#'+id).style.setProperty('--fill',value+'%');$('#'+id+'-value').textContent=Math.round(value);const hint=$('#'+id+'-hint');hint.textContent=`${id==='operate'?(mode==='scissors'?'↔ Squeeze handles':'↕ Press handle'):(mode==='scissors'?'↕ Lift pivot screw':'↕ Remove pivot pin')} · ${Math.round(value)}%`;hint.setAttribute('aria-valuenow',Math.round(value));hint.setAttribute('aria-valuetext',id==='operate'?`${Math.round(value)} percent; ${m.gap.toFixed(1)} millimetres clearance`:`${Math.round(value)} percent separated`);hint.classList.toggle('selected',selected===id);}
 $('#motion-output').innerHTML=`${Math.round(m.q)}<small>%</small>`;$('#gap-output').innerHTML=`${m.gap.toFixed(1)} <small>mm</small>`;$('#status').textContent=apart>0?'PARTS SEPARATED':m.cut?'CUTTING EDGES THROUGH':'ASSEMBLED · '+(m.q>0?'OPERATING':'OPEN');
 $('[data-readout]').textContent=apart>0?`${mode==='scissors'?'Scissors':'Punch'} · ${Math.round(apart)}% separated`:`${mode==='scissors'?'Scissors':'Punch'} · ${Math.round(m.q)}% · ${m.gap.toFixed(1)} mm gap`;
 $('#action').textContent=apart>0||apartTarget>0?'↧ Assemble & operate':target>50?'↶ Release tool':mode==='scissors'?'✂ Close scissors':'↓ Press punch';
 $('#finding').textContent=apart>0?'Inspect the handles, pivot and cutting parts. Operate the tool to reassemble it first.':mode==='scissors'?'The handles are levers. They turn the beveled blades past one another to cut.':'The handle is a lever. It pushes a beveled cutter through paper against the die.';preview();graph();geometry();
}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
function settleNow(){if(apartTarget>0){current=target=0;apart=apartTarget;}else{apart=0;current=target;}}
function wake(){if(reduced.matches||!visible||document.hidden){pause();settleNow();render();return;}if(!frame)frame=requestAnimationFrame(tick);}
function set(part,value){stop();selected=part;if(part==='apart'){apartTarget=clamp(value,0,100);if(apartTarget>0)target=0;}else{target=clamp(value,0,100);apartTarget=0;}wake();}
function tick(now){frame=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.04):1/60;last=now;const follow=(a,b)=>Math.abs(a-b)<.03?b:a+(b-a)*(1-Math.exp(-dt/.16));
 if(apartTarget>0&&current>0)current=follow(current,0);else if(apart>0||apartTarget>0){current=0;apart=follow(apart,apartTarget);}else{if(auto){time+=dt;target=50-50*Math.cos(time*.85);}current=follow(current,target);}render();if(auto||current!==target||apart!==apartTarget)frame=requestAnimationFrame(tick);else last=0;
}
function choose(next){stop();pause();mode=next;current=target=apart=apartTarget=0;selected='operate';for(const b of document.querySelectorAll('[data-tool]')){b.classList.toggle('selected',b.dataset.tool===mode);b.setAttribute('aria-pressed',b.dataset.tool===mode);}$('#relationship').textContent=mode==='scissors'?'Turn handles → close cutting edges':'Press lever → lower cutting punch';$('#condition').textContent=mode==='scissors'?'Scissors · two levers about one pivot':'Hole-punch teardown · extension';$('#motion-note').textContent=mode==='scissors'?'Two rigid lever arms turn':'A lever presses a vertical follower';$('#gap-title').textContent=mode==='scissors'?'CUTTING-EDGE GAP':'PUNCH–PAPER GAP';$('#gap-note').textContent=mode==='scissors'?'50 mm from the pivot':'Vertical clearance above paper';$('#open-label').textContent=mode==='scissors'?'Open':'Released';$('#closed-label').textContent=mode==='scissors'?'Closed':'Pressed';stage.querySelector('svg').setAttribute('aria-label',mode==='scissors'?'Scissors: colored lever handles, golden pivot and blue cutting bevels':'Hole punch: lever handle, removable pivot pin, guided cutter, return spring and die');render();}
for(const b of document.querySelectorAll('[data-tool]'))b.onclick=()=>choose(b.dataset.tool);for(const id of ['operate','apart'])$('#'+id).oninput=e=>set(id,+e.target.value);
$('#action').onclick=()=>set('operate',apart>0||apartTarget>0?100:target>50?0:100);$('#reset').onclick=()=>{papers={scissors:false,punch:false};choose('scissors');};$('#play').onclick=()=>{if(auto){stop();return;}if(reduced.matches){set('operate',target>50?0:100);return;}apartTarget=0;target=0;auto=true;time=Math.acos(1-current/50)/.85;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
function keys(e,part){const v=part==='apart'?apartTarget:target,step=e.shiftKey?20:5,values={ArrowRight:v+step,ArrowUp:v+step,ArrowLeft:v-step,ArrowDown:v-step,Home:0,End:100};if(e.key in values){e.preventDefault();set(part,values[e.key]);}}
stage.onkeydown=e=>{if(e.target===stage)keys(e,selected);};for(const id of ['operate','apart'])$('#'+id+'-hint').onkeydown=e=>keys(e,id);
let drag=null;stage.onpointerdown=e=>{if(e.button!==0)return;const part=e.target.closest('[data-part]')?.dataset.part||e.target.closest('.move-hint')?.id.replace('-hint','');if(!part)return;stop();selected=part;drag={part,x:e.clientX,y:e.clientY,value:part==='apart'?apartTarget:target};stage.setPointerCapture(e.pointerId);if(!e.target.closest('.move-hint'))stage.focus({preventScroll:true});};stage.onpointermove=e=>{if(!drag)return;const rect=stage.querySelector('svg').getBoundingClientRect(),delta=drag.part==='apart'||mode==='punch'?(drag.y-e.clientY)/rect.height*200:(e.clientX-drag.x)/rect.width*240;set(drag.part,drag.value+delta);};for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>drag=null);
const previewNode=$('#paper-preview');document.addEventListener('model-fullscreen-change',e=>{if(e.detail)document.querySelector('.fullscreen-preview-slot').append(previewNode);else $('#preview-home').after(previewNode);positionHints();});new ResizeObserver(positionHints).observe(stage);new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)wake();else pause();}).observe(stage);document.addEventListener('visibilitychange',()=>document.hidden?pause():wake());reduced.addEventListener('change',()=>{if(reduced.matches)stop();wake();});
window.toolsLesson={model,P,set,choose,getState:()=>({mode,current,target,apart,apartTarget,auto,selected,papers:{...papers},visible,frame,...model(mode,current,apart)}),geometry:()=>({faces,solids,orderAudit})};render();
