(() => {
  const $ = selector => document.querySelector(selector);
  const G = 9.81, INTERVAL = .10, PLAYBACK = .25, FLOOR = 20, SCALE = 100;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = $('#stage'), svg = stage.querySelector('svg');
  const model = (height, time = 0, mass = 100) => {
    const duration = Math.sqrt(2 * height / G), t = clamp(time, 0, duration);
    const h = Math.min(height, G * t * t / 2);
    return {height, mass, duration, t, h, v: G * t, g: t > 0 ? 2*h/(t*t) : null};
  };
  let height = 1.5, mass = 100, time = 0, phase = 'held', running = false, auto = false;
  let frame = 0, last = null, visible = true, dwell = 0, tourIndex = 0, drag = null;
  let trials = [], markerKey = '';

  // Anatomy Figure: a base with four feet, two post mounts, rail, ruler, stops,
  // moving collar and arm, coil, pole, two end caps, six windings, steel ball,
  // detector housing/pad/LED, timer case/bezel/display, three keys and screws.
  const P = {origin: [0, 0], scale: 1, azimuth: 60, elevation: 18};
  const fitPoints = [[-145,-65,-18],[-145,60,0],[170,-65,0],[170,60,0],[-75,-20,300],[16,-10,285]];
  const raw = fitPoints.map(point => iso(point, P));
  const min = [0,1].map(i => Math.min(...raw.map(p => p[i]))), max = [0,1].map(i => Math.max(...raw.map(p => p[i])));
  const fit = Math.min(704 / (max[0]-min[0]), 374 / (max[1]-min[1]));
  P.scale = fit;
  P.origin = [(760-(max[0]-min[0])*fit)/2-min[0]*fit, (430-(max[1]-min[1])*fit)/2-min[1]*fit];
  const camera = cameraOf(P), k = camera.k;
  const at = point => iso(point, P), polygon = points => pathOf(points.map(at), true);
  const solids = [];
  function box(name, lo, hi, color, moving = false) {
    solids.push({name, kind:'box', lo, hi, moving});
    const [x,y,z]=lo, [xx,yy,zz]=hi;
    const markup = `<g class="part" style="--part:${color}"><path class="part-side" d="${polygon([[xx,y,z],[xx,yy,z],[xx,yy,zz],[xx,y,zz]])}"/><path class="part-front" d="${polygon([[x,yy,z],[xx,yy,z],[xx,yy,zz],[x,yy,zz]])}"/><path class="part-top" d="${polygon([[x,y,zz],[xx,y,zz],[xx,yy,zz],[x,yy,zz]])}"/></g>`;
    solids.at(-1).svg = markup;return markup;
  }
  function cylinder(name, x, y, radius, z, length, color, moving = false) {
    solids.push({name,kind:'cylinder',x,y,radius,z,length,moving});
    const [cx,cy]=at([x,y,z+length]), [,bottom]=at([x,y,z]), rx=radius*k, ry=rx*camera.sinE;
    const body=`M${cx-rx} ${cy}V${bottom}C${cx-rx} ${bottom+ry*1.33} ${cx+rx} ${bottom+ry*1.33} ${cx+rx} ${bottom}V${cy}Z`;
    const markup = `<g class="part" style="--part:${color}"><path class="part-front" d="${body}"/><path d="M${cx} ${cy}H${cx+rx}V${bottom}Q${cx+rx} ${bottom+ry} ${cx} ${bottom+ry}Z" fill="#183a50" opacity=".13"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="part-top"/></g>`;
    solids.at(-1).svg = markup;return markup;
  }
  function screw(point) {
    const [x,y]=at(point);
    return `<circle cx="${x}" cy="${y}" r="2.3" fill="#e7f1f5" stroke="#829eae" stroke-width=".7"/><path d="M${x-1.2} ${y}h2.4" stroke="#829eae" stroke-width=".6"/>`;
  }
  const blue='#9abfce', metal='#c6dbe4', dark='#607e95', mint='#8dbfb2', violet='#ae9bd0', copper='#e8a46b';
  let art=`<ellipse cx="382" cy="389" rx="200" ry="20" fill="#c2d6df" opacity=".28"/>`;
  for (const x of [-128,145]) for(const y of [-48,43]) art+=cylinder(`foot-${x}-${y}`,x,y,9,-18,8,dark);
  art+=box('base',[-145,-65,-10],[170,60,0],blue);
  for(const x of [-132,157]) for(const y of [-53,48]) art+=screw([x,y,.1]);
  art+=box('ruler',[-101,-5,0],[-86,-3,276],'#f4eddb');
  for(let n=0;n<=20;n++){
    const z=FLOOR+n*12.5;
    art+=`<path class="iso-line" data-tone="mid" d="${pathOf([[-101,-3,z],[-101+(n%4?5:15),-3,z]].map(at))}"/>`;
    if(n%8===0){const [x,y]=at([-106,-3,z]);art+=`<text x="${x}" y="${y+3}" text-anchor="end" font-size="8">${n/8} m</text>`;}
  }
  art+=box('post-mount',[-83,-27,0],[-49,5,10],dark);
  art+=box('post',[-74,-20,10],[-60,-6,290],metal);
  art+=box('rail-face',[-60,-17,10],[-57,-9,290],dark);
  art+=box('post-cap',[-78,-24,290],[-56,-2,296],blue);
  art+=box('detector',[-30,-35,0],[30,15,15],violet);
  art+=box('detector-rim',[-28,-33,15],[28,13,18],'#d6c9e8');
  art+=box('contact-pad',[-20,-29,18],[20,9,FLOOR],'#7985a0');
  for(const x of [-25,25])for(const y of [-30,10])art+=screw([x,y,18]);
  const [ledX,ledY]=at([25,10,19]);
  art+=`<circle id="detector-led" cx="${ledX}" cy="${ledY}" r="3.1" fill="#c9badb"/>`;
  art+=box('timer-foot',[76,-25,0],[150,25,5],dark);
  art+=box('timer-case',[70,-30,5],[156,30,77],mint);
  art+=box('timer-bezel',[75,30,18],[151,32,70],'#daeae4');
  const o=at([75,32.1,70]), ax=axisVector(P,[1,0,0]), ay=axisVector(P,[0,0,-1]);
  const face=`matrix(${ax[0]} ${ax[1]} ${ay[0]} ${ay[1]} ${o[0]} ${o[1]})`;
  art+=`<g transform="${face}"><rect x="5" y="5" width="66" height="32" rx="3" fill="#e9faf0" stroke="#8db5a7" stroke-width=".5"/><text class="timer-label" x="10" y="13">ELAPSED / s</text><text id="timer-digits" class="timer-digits" x="10" y="30">0.000</text><text id="timer-phase" class="timer-label" x="5" y="47">ARMED</text>`;
  for(const x of [48,59,70])art+=`<circle cx="${x}" cy="45" r="3" fill="${x===48?'#eb9b6b':'#94b8aa'}" stroke="#709a8f" stroke-width=".5"/>`;
  art+='</g>';
  for(const x of [75,151])for(const z of [10,73])art+=screw([x,30,z]);
  art+='<g id="markers"></g><g id="ball" data-part="time"><circle id="ball-body" fill="url(#steel)" stroke="#516c80" stroke-width=".8"/></g><g id="magnet" data-part="height">';
  art+=cylinder('pole',0,-10,5,0,3,dark,true);
  art+=cylinder('magnet-base',0,-10,13,3,3,'#e9bd8a',true);
  art+=cylinder('coil',0,-10,12,6,18,copper,true);
  for(let z=8;z<=23;z+=3){const [x,y]=at([0,-10,z]),rx=12*k,ry=rx*camera.sinE;art+=`<path class="iso-line" data-tone="lo" d="M${x-rx} ${y}C${x-rx} ${y+ry*1.33} ${x+rx} ${y+ry*1.33} ${x+rx} ${y}"/>`;}
  art+=cylinder('magnet-top',0,-10,14,24,4,dark,true);
  art+=box('carriage',[-57,-17,22],[-49,-9,42],blue,true);
  art+=box('arm',[-49,-16,28],[0,-4,35],metal,true);
  art+=screw([-53,-8,38])+screw([-53,-8,25]);
  const [knobX,knobY]=at([-53,-7,31]);
  art+=`<circle cx="${knobX}" cy="${knobY}" r="5" fill="#df9359" stroke="#af6e3b"/><circle cx="${knobX}" cy="${knobY}" r="2" fill="#f8ce99"/></g>`;
  const labels=[['ELECTROMAGNET',[-38,-6,300]],['IMPACT DETECTOR',[-3,36,1]],['DIGITAL TIMER',[113,32,90]]];
  for(const [label,point] of labels){const [x,y]=at(point);art+=`<text class="apparatus-label" x="${x}" y="${y}" text-anchor="middle">${label}</text>`;}
  $('#apparatus').innerHTML=art;
  const hints=[...stage.querySelectorAll('.move-hint')];
  const radius = () => 8*Math.cbrt(mass/100);
  const magnetZ = () => FLOOR+2*radius()+height*SCALE;
  const ballPoint = () => [0,-10,FLOOR+radius()+(height-model(height,time,mass).h)*SCALE];
  function positionHints(){
    positionMoveHint(hints[0],[-12,-10,magnetZ()+32],P);
    // Offset the ball label to the right so it never covers the coil label.
    const [x,y,z]=ballPoint();positionMoveHint(hints[1],[x+55,y,z-15],P);
  }
  const px=t2=>48+t2/.45*340, py=h=>211-h/2.2*180;
  function initGraph(){
    let out='';for(const h of [0,.5,1,1.5,2])out+=`<path d="M48 ${py(h)}H388" stroke="#dde7ea"/><text x="38" y="${py(h)+4}" text-anchor="end">${h}</text>`;
    for(const t2 of [0,.1,.2,.3,.4])out+=`<text x="${px(t2)}" y="233" text-anchor="middle">${t2.toFixed(1)}</text>`;
    out+=`<text x="48" y="18">h (m)</text><text x="388" y="253" text-anchor="end">t² (s²)</text><path d="M48 211L${px(2.2/(G/2))} ${py(2.2)}" fill="none" stroke="#2d8fac" stroke-width="2.5"/><g id="trial-points"></g><path id="crosshair" fill="none" stroke="#e38b4e" stroke-dasharray="3 4"/><circle id="graph-point" r="5.5" fill="#e58f4d" stroke="white" stroke-width="1.5"/>`;
    $('#plot').innerHTML=out;
  }
  function draw(){
    const state=model(height,time,mass), point=ballPoint(), [ballX,ballY]=at(point), r=radius();
    $('#magnet').setAttribute('transform',translateAlong(P,[0,0,magnetZ()]));
    $('#ball-body').setAttribute('cx',ballX);$('#ball-body').setAttribute('cy',ballY);$('#ball-body').setAttribute('r',r*k);
    const count=phase==='held'?0:Math.floor((state.t+1e-9)/INTERVAL)+1;
    const key=`${count}/${height}/${mass}`;
    if(key!==markerKey){markerKey=key;$('#markers').innerHTML=Array.from({length:count},(_,i)=>{
      const sample=model(height,i*INTERVAL,mass),[x,y]=at([0,-10,FLOOR+r+(height-sample.h)*SCALE]);
      return `<circle data-sample="${(i*INTERVAL).toFixed(1)}" cx="${x}" cy="${y}" r="${r*k*.5}" fill="#e6a05f" fill-opacity=".22" stroke="#d99558" stroke-width=".7"/>`;
    }).join('');}
    $('#timer-digits').textContent=state.t.toFixed(3);
    const status=phase==='held'?'ARMED':phase==='landed'?'STOPPED':running?'RUNNING':'PAUSED';
    $('#timer-phase').textContent=status;
    $('#detector-led').setAttribute('fill',phase==='landed'?'#ec7aa0':'#c9badb');
    $('#phase').textContent=phase==='held'?'MAGNET ON · HELD':phase==='landed'?'DETECTED · TIMER STOPPED':'MAGNET OFF · '+(running?'FALLING':'INSPECTING');
    $('#height').value=height;$('#mass').value=mass;$('#time').max=state.duration;$('#time').value=state.t;
    $('#height-value').textContent=height.toFixed(2);$('#mass-value').textContent=mass;$('#time-value').textContent=state.t.toFixed(3);
    $('#impact-time').textContent=`Detector · ${state.duration.toFixed(3)} s`;
    $('#distance').innerHTML=state.h.toFixed(3)+' <small>m</small>';$('#elapsed').innerHTML=state.t.toFixed(3)+' <small>s</small>';
    $('#speed').innerHTML=state.v.toFixed(2)+' <small>m/s</small>';$('#gravity').innerHTML=(state.g===null?'—':state.g.toFixed(2))+' <small>m/s²</small>';
    $('#speed-note').textContent=phase==='landed'?'Speed just before detection':'v = gt during the fall';
    $('#timer-status').textContent=phase==='held'?'Timer armed · starts at zero':phase==='landed'?'Stopped at first contact':running?'Running from release':'Paused · inspect or resume';
    $('#calculation').textContent=state.t>0?`2 × ${state.h.toPrecision(4)} / ${state.t.toPrecision(4)}² ≈ 9.81 m/s²`:'At t = 0, 2h/t² is undefined.';
    $('[data-readout]').textContent=`H ${height.toFixed(2)} m · h ${state.h.toFixed(2)} m · t ${state.t.toFixed(3)} s`;
    $('#release').textContent=phase==='held'||phase==='landed'?'Release ball':reduced.matches?'Step 0.10 s':running?'Pause fall':'Resume fall';
    $('#tour').disabled=reduced.matches;$('#tour').textContent=reduced.matches?'Motion reduced':auto?'Ⅱ Pause tour':'▷ Auto explore';$('#tour').setAttribute('aria-pressed',String(auto));
    hints[0].textContent=`↕ Magnet · ${height.toFixed(2)} m`;hints[0].setAttribute('aria-valuenow',height.toFixed(2));hints[0].setAttribute('aria-valuetext',`${height.toFixed(2)} metres release height`);
    hints[1].setAttribute('aria-valuemax',state.duration);hints[1].setAttribute('aria-valuenow',state.t);hints[1].setAttribute('aria-valuetext',`${state.t.toFixed(3)} seconds, ${state.h.toFixed(3)} metres fallen`);
    for(const id of ['height','mass','time']){const el=$('#'+id);el.style.setProperty('--fill',100*(el.value-el.min)/(el.max-el.min)+'%');}
    const x=px(state.t**2),y=py(state.h);$('#graph-point').setAttribute('cx',x);$('#graph-point').setAttribute('cy',y);$('#crosshair').setAttribute('d',`M48 ${y}H${x}V211`);
    positionHints();
  }
  function stop(){running=false;auto=false;last=null;if(frame)cancelAnimationFrame(frame);frame=0;}
  function announce(){$('#announcement').textContent=$('[data-readout]').textContent;}
  function updateTrials(){$('#trial-points').innerHTML=trials.map(t=>`<circle cx="${px(t.duration**2)}" cy="${py(t.height)}" r="4" fill="#51a28c" stroke="#fff" stroke-width="1"/>`).join('');}
  function landed(record){
    time=model(height).duration;phase='landed';running=false;dwell=0;
    if(record){trials=trials.filter(trial=>trial.height!==height);trials.push({height,mass,duration:time});trials=trials.slice(-8);updateTrials();}
    $('#announcement').textContent=`Detected after ${time.toFixed(3)} seconds, ${height.toFixed(2)} metres fallen.`;
  }
  function release(){time=0;phase=reduced.matches?'paused':'falling';running=!reduced.matches;last=null;markerKey='';draw();announce();resume();}
  function tick(now){
    frame=0;if(document.hidden||!visible||reduced.matches){last=null;return;}
    const dt=last===null?0:Math.min((now-last)/1000,.1);last=now;
    if(running){time+=dt*PLAYBACK;if(time>=model(height).duration)landed(true);}
    else if(auto){dwell+=dt;if(dwell>=.9){tourIndex=(tourIndex+1)%4;height=[.5,1,1.5,2][tourIndex];release();return;}}
    draw();if(running||auto)frame=requestAnimationFrame(tick);
  }
  function resume(){if((running||auto)&&visible&&!document.hidden&&!reduced.matches&&!frame){last=null;frame=requestAnimationFrame(tick);}}
  function setHeight(value){stop();height=clamp(value,.25,2);time=0;phase='held';draw();announce();}
  function setMass(value){stop();mass=clamp(Math.round(value),50,250);time=0;phase='held';draw();announce();}
  function setTime(value){stop();time=clamp(value,0,model(height).duration);phase=time===0?'held':time>=model(height).duration?'landed':'paused';draw();announce();}
  $('#height').addEventListener('input',e=>setHeight(+e.target.value));$('#mass').addEventListener('input',e=>setMass(+e.target.value));$('#time').addEventListener('input',e=>setTime(+e.target.value));
  $('#release').onclick=()=>{
    if(phase==='held'||phase==='landed'){stop();release();}
    else if(reduced.matches){time+=INTERVAL;if(time>=model(height).duration)landed(true);draw();announce();}
    else if(running){stop();phase='paused';draw();}
    else{auto=false;running=true;phase='falling';draw();resume();}
  };
  $('#tour').onclick=()=>{if(auto){stop();phase=time>0&&phase!=='landed'?'paused':phase;draw();}else{stop();auto=true;tourIndex=0;height=.5;release();}};
  $('#reset').onclick=()=>{stop();height=1.5;mass=100;time=0;phase='held';trials=[];updateTrials();draw();announce();};
  stage.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#release').click();return;}
    const part=e.target.closest('[data-move]')?.dataset.move||'height';
    const max=part==='height'?2:model(height).duration,min=part==='height'?.25:0,value=part==='height'?height:time,step=part==='height'?.05:.01;
    let next;if(['ArrowUp','ArrowRight'].includes(e.key))next=value+step;if(['ArrowDown','ArrowLeft'].includes(e.key))next=value-step;if(e.key==='Home')next=min;if(e.key==='End')next=max;
    if(next!==undefined){e.preventDefault();(part==='height'?setHeight:setTime)(next);}
  });
  const local=e=>new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;const part=e.target.closest('[data-move]')?.dataset.move||e.target.closest('[data-part]')?.dataset.part||'height';const wasRunning=running;stop();if(phase==='falling')phase='paused';drag={part,y:local(e).y,height,h:model(height,time).h,x0:e.clientX,y0:e.clientY,moved:false,wasRunning};stage.setPointerCapture(e.pointerId);e.preventDefault();draw();});
  stage.addEventListener('pointermove',e=>{if(!drag)return;drag.moved ||= Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>3;const dy=(local(e).y-drag.y)/(k*camera.cosE*SCALE);if(drag.part==='height')setHeight(drag.height-dy);else setTime(Math.sqrt(2*clamp(drag.h+dy,0,height)/G));});
  for(const type of ['pointerup','pointercancel'])stage.addEventListener(type,e=>{const gesture=drag;drag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(type==='pointerup'&&gesture?.part==='time'&&!gesture.moved&&!gesture.wasRunning)$('#release').click();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)last=null;resume();}).observe(stage);
  document.addEventListener('visibilitychange',()=>{last=null;resume();});document.addEventListener('model-fullscreen-change',positionHints);new ResizeObserver(positionHints).observe(stage);
  reduced.addEventListener('change',()=>{stop();if(phase==='falling')phase='paused';draw();});
  window.freeFall={model,setHeight,setMass,setTime,release,getState:()=>({...model(height,time,mass),phase,running,auto,trials:[...trials],current:height,target:height}),geometry:{P,solids,ballPoint,magnetZ,radius}};
  initGraph();draw();
})();
