const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const P={origin:[360,400],scale:1.5,azimuth:48,elevation:28},reduced=matchMedia('(prefers-reduced-motion: reduce)');
let turns=0,apart=0,target=0,selected='handle',auto=false,frame=0,last=0,visible=true;
const C={mint:'#94c8ad',edge:'#608f80',wood:'#d4a56d',cream:'#f2dfb1',steel:'#8da9ab',dark:'#536e70',blue:'#78add0',gold:'#e6b956',coral:'#e78d73'};
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/Math.hypot(...a));
const cam=cameraOf(P),U=[cam.sinA,-cam.cosA,0],W=[cam.cosA*cam.sinE,cam.sinA*cam.sinE,-cam.cosE],V=[cam.cosA*cam.cosE,cam.sinA*cam.cosE,cam.sinE];
const shade=(c,f)=>'#'+c.slice(1).match(/../g).map(v=>Math.round(Math.min(255,parseInt(v,16)*f)).toString(16).padStart(2,'0')).join('');
let group='fixed',faces=[],solids=[],orderAudit={cycles:0,crossings:0};
function face(points,color,part='',name=''){
 points=points.map(p=>add(p,Sharpener.offset(group,apart)));
 let n=cross(sub(points[1],points[0]),sub(points[2],points[0]));if(Math.hypot(...n)<1e-8||dot(n,V)<=1e-8)return;n=unit(n);
 const screen=points.map(p=>iso(p,P)),bounds={l:Math.min(...screen.map(p=>p[0])),r:Math.max(...screen.map(p=>p[0])),t:Math.min(...screen.map(p=>p[1])),b:Math.max(...screen.map(p=>p[1]))};
 faces.push({points,screen,bounds,n,plane:dot(n,points[0]),color:shade(color,.71+.23*Math.max(0,n[2])+.13*Math.max(0,-n[0])+.08*Math.max(0,n[1])),part,name,assembly:group==='axle-front'?'axle':group});
}
function prism(poly,vector,color,name,part=''){
 const points=[...poly,...poly.map(p=>add(p,vector))],n=poly.length,center=mul(points.reduce((a,b)=>add(a,b),[0,0,0]),1/points.length),start=faces.length;
 for(const ids of [Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i+n),...Array.from({length:n},(_,i)=>[i,(i+1)%n,(i+1)%n+n,i+n])]){
  let p=ids.map(i=>points[i]);const mid=mul(p.reduce((a,b)=>add(a,b),[0,0,0]),1/p.length);if(dot(cross(sub(p[1],p[0]),sub(p[2],p[0])),sub(mid,center))<0)p=p.reverse();face(p,color,part,name);
 }
 solids.push({kind:'prism',poly,vector,name,part,faces:faces.slice(start)});
}
function box(x,y,z,w,d,h,c,name,part=''){prism([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],[0,0,h],c,name,part);}
function turned(profile,origin,color,name,part='',steps=48){
 const start=faces.length;
 for(let j=0;j<profile.length;j++){const [s,r]=profile[j],[t,q]=profile[(j+1)%profile.length];
  for(let i=0;i<steps;i++){const a=i/steps*Math.PI*2,b=(i+1)/steps*Math.PI*2,point=(y,r,a)=>add(origin,[r*Math.cos(a),y,r*Math.sin(a)]);let p=[point(s,r,a),point(s,r,b),point(t,q,b),point(t,q,a)];if(r===0)p=[p[0],p[2],p[3]];if(q===0)p=[p[0],p[1],p[2]];face(p.reverse(),color,part,name);}
 }
 solids.push({kind:'body',profile,origin,name,part,faces:faces.slice(start)});
}
function screw(x,y,z,name,axis='y',part=''){
 if(axis==='y'){const r=2.6,w=3.2;turned([[0,0],[0,r],[1.2,r],[1.2,0]],[x,y,z],C.cream,name,part,16);box(x-w/2,y+1.21,z-.3,w,.15,.6,C.dark,name+' slot',part);}
 else {box(x-2,y-2,z,4,4,1,C.cream,name,part);box(x-1.5,y-.3,z+1,3,.6,.12,C.dark,name+' slot',part);}
}
// Convex face clipping gives actual depth constraints at overlaps, rather than guessed layer keys.
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
const thetaPoint=(r,a,y)=>[r*Math.cos(a),y,85+r*Math.sin(a)];
function discAt(x,y,z,r,d,c,name){turned([[0,0],[0,r],[d,r],[d,0]],[x,y,z],c,name,'',32);}
function annulus(y,d,inner,outer,c,name){turned([[0,inner],[0,outer],[d,outer],[d,inner]],[0,y,85],c,name,'',64);}
function rotorBar(from,to,y,d,half,c,name,angle){const a=angle,u=[Math.cos(a),Math.sin(a)],v=[-u[1],u[0]];prism([[from,-half],[to,-half],[to,half],[from,half]].map(([r,s])=>[r*u[0]+s*v[0],y,85+r*u[1]+s*v[1]]),[0,d,0],c,name);}
function gear(n,center,y,d,angle,internal){const tooth=Sharpener.tooth(n,internal),pitch=Math.PI*2/n,outline=[];
 for(let t=0;t<n;t++){const a=t*pitch+angle;for(const [x,z] of tooth)outline.push([center[0]+x*Math.cos(a)-z*Math.sin(a),center[2]+x*Math.sin(a)+z*Math.cos(a)]);const end=Math.atan2(tooth.at(-1)[1],tooth.at(-1)[0]),start=Math.atan2(tooth[0][1],tooth[0][0])+pitch,root=n+(internal?2.5:-2.5);for(let i=1;i<4;i++){const q=a+end+(start-end)*i/4;outline.push([center[0]+root*Math.cos(q),center[2]+root*Math.sin(q)]);}}
 for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length,p=outline[i],q=outline[j],at=(v,r)=>{const a=Math.atan2(v[1]-center[2],v[0]-center[0]);return [center[0]+r*Math.cos(a),center[2]+r*Math.sin(a)];},aa=at(p,internal?43:2.6),bb=at(q,internal?43:2.6),point=(v,y)=>[v[0],y,v[1]],name=internal?'fixed ring gear':'pinion gear';
  let out=[p,q],inn=[aa,bb];if(internal)[out,inn]=[inn,out];
  const front=[point(inn[0],y+d),point(out[0],y+d),point(out[1],y+d),point(inn[1],y+d)],back=front.map(v=>[v[0],y,v[2]]).reverse();
  const draw=(poly)=>{const c=poly.reduce((s,p)=>add(s,p),[0,0,0]).map(v=>v/poly.length),normal=cross(sub(poly[1],poly[0]),sub(poly[2],poly[0]));if(dot(normal,sub(c,[center[0],y+d/2,center[2]]))<0)poly=poly.reverse();face(poly,internal?C.blue:C.gold,'',name);};
  draw(front);draw(back);face([point(out[0],y),point(out[1],y),point(out[1],y+d),point(out[0],y+d)].reverse(),internal?C.blue:C.gold,'',name);face([point(inn[0],y),point(inn[0],y+d),point(inn[1],y+d),point(inn[1],y)],internal?C.blue:C.gold,'',name);
 }
}

function bench(){group='fixed';
 for(const x of [-78,78])for(const y of [-60,76])box(x-7,y-7,0,14,14,5,C.edge,'foot');
 box(-96,-80,5,208,180,7,C.edge,'base');box(-93,-77,12,202,174,2,'#c6d9b4','mat');
 for(const x of [-84,98])for(const y of [-68,86])screw(x,y,14,'base screw','z');
 for(const x of [-55,47])for(const y of [-32,43]){box(x-3,y-4,14,14,13,5,C.steel,'shoe');box(x,y,19,8,6,16,C.mint,'mounting upright');}
 // Open shavings drawer, built as a floor and four walls rather than a filled box.
 box(-40,-24,14,80,67,3,C.cream,'tray floor');for(const x of [-40,37])box(x,-24,17,3,67,13,C.wood,'tray side');for(const y of [-24,40])box(-37,y,17,74,3,13,C.wood,'tray end');box(-9,43,19,18,4,5,C.coral,'tray pull');
}
function housing(){group='housing';
 box(-60,-36,35,5,88,111,C.mint,'case side');box(-55,-36,140,110,88,6,C.mint,'case roof');
 group='fixed';box(-55,-36,35,110,5,10,C.mint,'case rear sill');box(-55,47,35,110,5,6,C.mint,'case front sill');
 group='housing';for(const x of [-55,51])box(x,47,41,4,5,99,C.edge,'front trim');
 for(const y of [-36,48])box(-55,y,146,110,3,1,C.edge,'roof seam');
 for(const x of [-50,46])for(const y of [-29,42])screw(x,y,147,'case screw','z');
 for(const z of [54,130])screw(-54,52,z,'case screw');
}
function rearBearing(){group='fixed';box(-5,-35,45,10,4,30,C.steel,'bearing stand');
 for(const z of [75,90])box(-10,-35,z,20,4,5,C.steel,'bearing frame');for(const x of [-10,5])box(x,-35,80,5,4,10,C.steel,'bearing frame');
 annulus(-35,4,4.1,5,C.cream,'axle bushing');
}
function crank(a){group='handle';discAt(0,-62,85,9,5,C.coral,'crank hub');rotorBar(9,48,-62,5,4,C.coral,'crank arm',a);
 const p=thetaPoint(55,a,-83);discAt(p[0],p[1],p[2],7,21,C.coral,'crank grip');
 for(let i=0;i<6;i++){const y=-81+i*3;turned([[0,7],[0,7.4],[.5,7.4],[.5,7]],[p[0],y,p[2]],C.cream,'grip ring','',32);}
}
function carrier(a){group='axle';discAt(0,-57,85,4,37,C.gold,'axle');discAt(0,-20,85,9,4,C.gold,'rear hub');rotorBar(9,20,-20,4,3,C.gold,'rear carrier arm',a);
 const p=Sharpener.orbit(a);turned([[0,2.6],[0,4],[4,4],[4,2.6]],[p[0],-20,p[2]],C.gold,'rear journal');
 group='axle-front';annulus(37,4,7,11,C.gold,'front carrier');rotorBar(11,20,37,4,3,C.gold,'front carrier arm',a);turned([[0,2.6],[0,4],[4,4],[4,2.6]],[p[0],37,p[2]],C.gold,'front journal');
}
function gears(a){group='gears';gear(36,[0,0,85],43,5,0,true);gear(12,Sharpener.orbit(a),43,5,-2*a+Math.PI/12,false);
 // A fixed registration tab makes the stationary ring easy to follow.
 for(const sign of [-1,1])box(sign<0?-55:43,43,82,12,4,6,C.blue,'ring mount');
}
function cutter(a){group='cutter';const p=Sharpener.orbit(a),spin=-2*a;
 turned([[0,0],[0,2.5],[64,2.5],[64,0]],[p[0],-16,p[2]],C.steel,'cutter spindle');
 const r=y=>24-(y+12)*.15,point=(y,i,inner=false)=>{const angle=spin+i*Math.PI/24+(y+12)*Math.PI/40,R=inner?2.6:r(y);return [p[0]+R*Math.cos(angle),y,p[2]+R*Math.sin(angle)];};
 for(let i=0;i<48;i++)for(let j=0;j<12;j++){const y=-12+j*40/12,z=y+40/12,quad=[point(y,i),point(z,i),point(z,i+1),point(y,i+1)],c=i%6===0?'#d8e5df':C.steel;
  for(const ids of [[0,1,2],[0,2,3]])face(ids.map(k=>quad[k]),c,'','helical cutter');
  if(j===0)face([point(y,i,true),point(y,i+1,true),point(y,i+1),point(y,i)],C.steel,'','cutter end');
  if(j===11)face([point(z,i,true),point(z,i),point(z,i+1),point(z,i+1,true)],C.steel,'','cutter end');
 }
}

function pencil(m){group='pencil';
 // A hexagonal painted barrel and a conical tip remain stationary about their own axis.
 const poly=Array.from({length:6},(_,i)=>thetaPoint(6,i*Math.PI/3,34));prism(poly,[0,100,0],'#edbf54','pencil barrel');
 if(m.progress>.0001){const end=34-m.pointLength;turned([[end+m.pointLength*.18,0],[end+m.pointLength*.18,1.08],[34,6],[34,0]],[0,0,85],C.wood,'exposed wood','',32);turned([[end,0],[end+m.pointLength*.18,1.08],[end+m.pointLength*.18,0]],[0,0,85],'#4b5552','graphite','',24);}
}
function geometry(){faces=[];solids=[];const m=Sharpener.model(turns,apart);bench();housing();rearBearing();crank(m.angle);carrier(m.angle);gears(m.angle);cutter(m.angle);pencil(m);
 const sorted=orderedFaces();$('#apparatus').innerHTML=sorted.map(f=>`<polygon data-assembly="${f.assembly}" ${f.assembly===selected?'class="chosen"':''} points="${f.screen.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')}" fill="${f.color}"/>`).join('');
 // Include the whole crank and cutter orbit so camera framing never follows a spinning part.
 const points=faces.flatMap(f=>f.screen);
 for(const [part,r,y0,y1] of [['handle',63,-83,-57],['cutter',48,-16,48],['axle',32,-57,-16],['axle-front',32,37,41],['gears',43,43,48]])for(const x of [-r,r])for(const y of [y0,y1])for(const z of [85-r,85+r])points.push(iso(add([x,y,z],Sharpener.offset(part,apart)),P));
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs)-24,top=Math.min(...ys)-24,w=Math.max(...xs)-left+24,h=Math.max(...ys)-top+24;
 $('#stage svg').setAttribute('viewBox',[left,top,w,h].map(v=>v.toFixed(2)).join(' '));

 hints();return {P,faces:sorted,solids,orderAudit};
}
function hints(){const m=Sharpener.model(turns,apart),p=thetaPoint(55,m.angle,-83),offset=Sharpener.offset('handle',apart);
 positionMoveHint($('#handle-hint'),add(p,offset),P);positionMoveHint($('#housing-hint'),add([-40,20,150],Sharpener.offset('housing',apart)),P);
 const a=$('#handle-hint'),b=$('#housing-hint'),x=a.getBoundingClientRect(),y=b.getBoundingClientRect();if(x.width&&x.right>y.left-6&&y.right>x.left-6&&x.bottom>y.top-6&&y.bottom>x.top-6)b.style.top=Math.max(20,parseFloat(b.style.top)-y.height-10)+'px';
}
const roles={housing:['Housing · supports and contains','The case holds parts in place and catches shavings. It is not a simple machine.'],handle:['Handle · wheel and axle','The crank turns the attached axle and carries the cutter around the pencil.'],gears:['Gears · toothed wheels','The fixed ring makes the small gear spin as the crank carries it around the pencil.'],axle:['Axle · transmits rotation','The axle and carrier pass the crank’s rotation to the cutting assembly.'],cutter:['Cutter · wedge-shaped edges','The spinning edges act as wedges, shaving small pieces of wood and graphite.']};
function render(){const m=Sharpener.model(turns,apart);
 for(const [id,v] of [['apart',apart],['turns',turns]]){const el=$('#'+id);el.value=v;el.style.setProperty('--fill',v/+el.max*100+'%');$('#'+id+'-value').textContent=id==='apart'?v.toFixed(0):v.toFixed(2);}
 $('#turns').disabled=!m.assembled;$('#handle-hint').disabled=!m.assembled;
 $('#assemble').textContent=target>0?'↙ Reassemble':'↗ Disassemble';$('#status').textContent=m.assembled?'ASSEMBLED · CUTAWAY VIEW':'APART · REASSEMBLE TO CRANK';
 $('#turn-output').textContent=turns.toFixed(2);$('#spin-output').textContent=Math.abs(m.cutterTurns).toFixed(2);$('#point-output').textContent=`${(m.progress*100).toFixed(0)}% formed`;
 $('#part-title').textContent=roles[selected][0];$('#part-description').textContent=roles[selected][1];
 for(const b of document.querySelectorAll('[data-select]')){b.classList.toggle('selected',b.dataset.select===selected);b.setAttribute('aria-pressed',String(b.dataset.select===selected));}
 for(const [id,v] of [['handle',turns],['housing',apart]]){const b=$('#'+id+'-hint');b.textContent=id==='handle'?`↔ Crank · ${v.toFixed(2)} turns`:`↕ Take apart · ${v.toFixed(0)}%`;b.setAttribute('aria-valuenow',v.toFixed(2));}
 $('[data-readout]').textContent=m.assembled?`Crank ${turns.toFixed(2)} · cutter ${Math.abs(m.cutterTurns).toFixed(2)} turns`:`Apart ${apart.toFixed(0)}% · crank disconnected`;
 $('#finding').textContent=m.assembled?'The gears make the cutting edges spin. Each wedge-shaped edge shaves the wood and graphite.':'The separated parts cannot sharpen. Reassemble them to connect the crank, gears, axle and cutter.';
 const tip=310,shoulder=tip-12-78*m.progress;$('#point-drawing').innerHTML=`<path d="M40 25H${shoulder}V61H40Z" fill="#eabd53" stroke="#a7803c"/><path d="M40 25H${shoulder}V35H40Z" fill="#f3d782"/><path d="M${shoulder} 25L${tip} ${43-17*(1-m.progress)}V${43+17*(1-m.progress)}L${shoulder} 61Z" fill="#d5a878" stroke="#9c7857"/>${m.progress>.01?`<path d="M${tip-18*m.progress} ${43-3*m.progress}L${tip} 43L${tip-18*m.progress} ${43+3*m.progress}Z" fill="#4b5552"/>`:''}`;
 $('#preview').setAttribute('aria-label',`Pencil point ${(100*m.progress).toFixed(0)} percent formed. Illustrative sharpening replay.`);
 const X=v=>43+v*55,Y=v=>130-v*8;let plot='';for(const v of [0,4,8,12])plot+=`<path d="M43 ${Y(v)}H373" stroke="var(--border)"/><text x="34" y="${Y(v)+4}" text-anchor="end">${v}</text>`;for(const v of [0,2,4,6])plot+=`<text x="${X(v)}" y="149" text-anchor="middle">${v}</text>`;
 $('#graph-content').innerHTML=plot+`<text x="43" y="16">Cutter spin magnitude (turns)</text><text x="373" y="169" text-anchor="end">Crank turns</text><path d="M43 130L373 34" stroke="var(--teal)" stroke-width="3"/><circle id="graph-point" cx="${X(turns)}" cy="${Y(Math.abs(m.cutterTurns))}" r="5" fill="var(--coral)"/>`;
 geometry();
}
function stop(){auto=false;$('#play').textContent='▷ Auto explore';$('#play').setAttribute('aria-pressed','false');}
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
function wake(){if(reduced.matches){apart=target;render();return;}if(visible&&!document.hidden&&!frame&&(auto||apart!==target))frame=requestAnimationFrame(tick);}
function setApart(v){stop();target=apart=clamp(v,0,100);selected='housing';render();}
function setTurns(v){stop();if(apart>.001)return;turns=clamp(v,0,6);selected='handle';render();}
function tick(now){frame=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.04):0;last=now;
 if(apart!==target){apart+=(target-apart)*(1-Math.exp(-dt/.22));if(Math.abs(apart-target)<.03)apart=target;}
 else if(auto){if(turns<6)turns=Math.min(6,turns+dt*.32);else stop();}render();if(auto||apart!==target)frame=requestAnimationFrame(tick);else last=0;
}
$('#apart').oninput=e=>setApart(+e.target.value);$('#turns').oninput=e=>setTurns(+e.target.value);
$('#assemble').onclick=()=>{stop();target=target>0?0:100;selected='housing';wake();render();};
$('#play').onclick=()=>{if(auto){stop();pause();target=apart;render();return;}if(reduced.matches){apart=target=0;turns=turns<3?3:6;render();return;}if(turns===6)turns=0;target=0;auto=true;$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-pressed','true');wake();};
$('#reset').onclick=()=>{stop();pause();turns=apart=target=0;selected='handle';render();};
for(const b of document.querySelectorAll('[data-select]'))b.onclick=()=>{selected=b.dataset.select;render();};
function keys(e,control){const v=control==='housing'?apart:turns,step=(control==='housing'?2:.05)*(e.shiftKey?5:1),max=control==='housing'?100:6,values={ArrowRight:v+step,ArrowUp:v+step,ArrowLeft:v-step,ArrowDown:v-step,Home:0,End:max};if(e.key in values){e.preventDefault();(control==='housing'?setApart:setTurns)(values[e.key]);}}
$('#stage').onkeydown=e=>{const control=e.target.id==='housing-hint'?'housing':e.target.id==='handle-hint'?'handle':selected==='housing'?'housing':'handle';keys(e,control);};
let drag=null;$('#stage').onpointerdown=e=>{if(e.button!==0)return;const part=e.target.closest('[data-assembly]')?.dataset.assembly,control=e.target.closest('#housing-hint')?'housing':e.target.closest('#handle-hint')?'handle':part;if(!roles[control])return;e.preventDefault();selected=control;if(control==='housing'||control==='handle'){stop();target=apart;drag={control,x:e.clientX,y:e.clientY,value:control==='housing'?apart:turns};$('#stage').setPointerCapture(e.pointerId);}(e.target.closest('.move-hint')||$('#stage')).focus({preventScroll:true});render();};
$('#stage').onpointermove=e=>{if(!drag)return;(drag.control==='housing'?setApart:setTurns)(drag.value+(drag.control==='housing'?(drag.y-e.clientY)*.6:(e.clientX-drag.x)/100));};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#stage').addEventListener(event,()=>drag=null);
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)wake();else pause();}).observe($('#stage'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else wake();});reduced.addEventListener('change',()=>{stop();pause();apart=target;render();});
const preview=$('#pencil-preview'),home=preview.parentNode,slot=preview.nextSibling;
document.addEventListener('model-fullscreen-change',e=>{if(e.detail){stop();pause();target=apart;$('.stage-wrap').insertBefore(preview,$('.stage-caption'));}else home.insertBefore(preview,slot);render();});new ResizeObserver(hints).observe($('#stage'));
window.sharpener={getState:()=>({...Sharpener.model(turns,apart),current:apart,target,selected,auto}),setApart,setTurns,geometry,model:Sharpener.model};
render();
