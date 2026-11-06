(() => {
  const configurations = {fixed:{n:1,direction:1},movable:{n:2,direction:-1},combined:{n:2,direction:1}};
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function model(mode='fixed',height=0,weight=20) {
    const c=configurations[mode],h=clamp(height,0,30),w=clamp(weight,10,40),lift=2.5*h;
    const movingY=285-lift,loadX=mode==='fixed'?325:290,loadY=325-lift;
    const handleX=mode==='fixed'?385:mode==='movable'?320:380;
    const handleY=(mode==='movable'?250:170)+c.direction*c.n*lift;
    const rope=mode==='fixed'?`M325 ${loadY}V110 A30 30 0 0 1 385 110 V${handleY}`:
      mode==='movable'?`M260 80V${movingY} A30 30 0 0 0 320 ${movingY} V${handleY}`:
      `M260 80V${movingY} A30 30 0 0 0 320 ${movingY} V110 A30 30 0 0 1 380 110 V${handleY}`;
    const ropeLength=mode==='fixed'?loadY-110+handleY-110+Math.PI*30:
      mode==='movable'?movingY-80+movingY-handleY+Math.PI*30:
      movingY-80+movingY-110+handleY-110+Math.PI*60;
    return {mode,n:c.n,direction:c.direction,h,w,s:c.n*h,force:w/c.n,loadX,loadY,handleX,handleY,movingY,rope,ropeLength,
      fixedAngle:(mode==='combined'?2:1)*lift/30*180/Math.PI,movingAngle:-lift/30*180/Math.PI};
  }
  globalThis.pulleyPhysics={model};
  if(typeof document==='undefined')return;
  const $=s=>document.querySelector(s),stage=$('#stage'),svg=stage.querySelector('svg'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const words={fixed:['轮子固定，改变方向','向下拉绳，重物向上。拉 10 cm，重物就升高 10 cm。','Fixed pulley changes direction','Pull down 10 cm; the load rises 10 cm.'],movable:['轮子跟着重物一起上升','两段绳子分担重量。拉力减半，但拉 20 cm，重物只上升 10 cm。','The wheel rises with the load','Two rope sections share the load. Pull 20 cm to raise it 10 cm, with half the force.'],combined:['一样省力，换个方向拉','增加的定滑轮让你向下拉；仍由两段绳子承重，拉力和动滑轮一样。','Same force advantage, pull a different way','The added fixed pulley lets you pull down. Two rope sections still share the load.']};
  const english=()=>window.primaryLanguage?.get()==='en';
  const put=(s,zh,en)=>{const el=$(s);if(el)el.textContent=english()?en:zh;};
  const labelText=(s,zh,en)=>{const el=$(s);if(el?.firstChild)el.firstChild.nodeValue=english()?en:zh;};
  const P={origin:[0,0],scale:1/Math.sqrt(1.6),azimuth:90,elevation:0};
  let mode='fixed',weight=20,current=0,target=0,auto=false,visible=true,frame=0,last=0,clock=0,drag=null;
  const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const rect=(x,y,w,h,fill,r=2)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
  const bolt=(x,y)=>circle(x,y,3.3,'#e4eee7')+circle(x,y,1,'#52756c');
  function wheel(id,x,y,moving){
    return `<g id="${id}" ${moving?'class="grabbable" data-drag="load"':''} transform="translate(${x} ${y})">`+
      circle(3,3,33,moving?'#c6784f':'#3c7d73')+circle(0,0,33,moving?'#f2ba89':'#85bdb0')+circle(0,0,27,moving?'url(#moving-fill)':'url(#wheel)')+
      `<g class="spokes">${[0,120,240].map(a=>`<path d="M-4 -6L-5 -23Q0 -27 5 -23L4 -6Z" fill="${moving?'#ffe2bd':'#d8eee3'}" transform="rotate(${a})"/>`).join('')}</g>`+
      circle(0,0,9,'#f9f3de')+circle(0,0,5,'#607d73')+circle(-1,-1,1.8,'#dfe9e0')+'</g>';
  }
  function build(){
    let art='<ellipse cx="349" cy="413" rx="218" ry="12" fill="#466f5a" opacity=".09" stroke="none"/>';
    for(const x of [180,480])for(const y of [398,411])art+=rect(x,y,27,12,'#506b60',4)+rect(x,y-2,27,4,'#b2c5b4',2);
    art+='<path d="M148 389L500 389L548 407L196 407Z" fill="#dbe8c9"/><path d="M196 407H548V419H196Z" fill="#a8bf9d"/><path d="M148 389L196 407V419L148 401Z" fill="#88a784"/>';
    for(const x of [190,490]){
      art+=rect(x-16,377,37,15,'#8bada0',3)+bolt(x-8,384)+bolt(x+12,384);
      art+=rect(x-6,62,14,315,'#d2e2d5',1)+rect(x+8,62,5,315,'#87aa9a',1);
      art+=rect(x-11,61,29,17,'#629b8b',3)+bolt(x+2,69);
    }
    art+='<path d="M174 44H513L525 51H186Z" fill="#afcfc1"/><path d="M186 51H525V72H186Z" fill="#6da695"/><path d="M174 44L186 51V72L174 65Z" fill="#478573"/>';
    for(const x of [195,215,491,511])art+=bolt(x,61);
    art+=rect(183,48,5,25,'#4f7c6b')+rect(519,49,5,24,'#4f7c6b');
    art+=rect(461,291,34,7,'#b4c9b9')+rect(461,362,34,7,'#b4c9b9')+bolt(489,294.5)+bolt(489,365.5);
    art+='<g class="ruler">'+rect(443,289,20,94,'#fbf7e5');
    for(let i=0;i<=30;i++)art+=`<path class="iso-line" d="M443 ${376-i*2.5}h${i%5===0?20:5}" stroke="#829585"/>`+(i%10===0?`<text x="467" y="${380-i*2.5}">${i}</text>`:'');
    art+=bolt(453,294)+'</g>';
    if(mode!=='fixed')art+=rect(253,72,14,10,'#668b75')+circle(260,81,5,'#ebeee1');
    if(mode!=='movable'){
      const x=mode==='fixed'?355:350;
      art+=rect(x-8,72,16,39,'#a8c4b4',4)+bolt(x,82)+wheel('fixed-wheel',x,110,false);
    }
    if(mode!=='fixed')art+=wheel('moving-wheel',290,285,true);
    art+='<path id="rope" class="rope"/><path id="rope-highlight" class="rope-light"/>';
    art+='<g id="hanger" fill="none" stroke="#628578" stroke-width="4"><path d="M290 285V310Q290 316 295 316Q302 316 300 309"/></g>';
    art+='<g id="load" class="grabbable" data-drag="load"><path d="M-31 5L-23 -3H38L30 5Z" fill="#ffc7a6"/><path d="M30 5L38 -3V43L30 51Z" fill="#bf6e52"/><rect x="-31" y="5" width="61" height="46" rx="4" fill="#ed9b79"/><path d="M-17 5V51M16 5V51" stroke="#ffd3ac" stroke-width="5"/><path d="M-7 0V-6Q0 -15 7 -6V0" fill="none" stroke-width="3"/>'+bolt(-25,12)+bolt(24,12)+bolt(-25,44)+bolt(24,44)+'</g>';
    art+='<g id="handle" class="grabbable" data-drag="handle">'+rect(-4,-3,8,12,'#9a7950')+rect(-20,9,40,30,'#d49336',7)+rect(-15,14,30,20,'#ffe3a5',5)+[0,1,2,3,4].map(i=>rect(-12+i*5,28,2,5,'#c39350',1)).join('')+circle(0,2,3,'#fff0ca')+'</g>';
    $('#apparatus').innerHTML=art;
  }
  function positionHints(){
    const m=model(mode,current,weight);
    positionMoveHint($('#handle-hint'),[m.handleX,0,-(m.handleY+25)],P);
    positionMoveHint($('#load-hint'),[m.loadX,0,-(m.loadY+32)],P);
  }
  function graph(m){
    const x=s=>47+s/60*320,y=h=>177-h/30*148;
    $('#graph').innerHTML=[0,10,20,30].map(h=>`<path d="M47 ${y(h)}H367" stroke="#dfe5db"/><text x="35" y="${y(h)+4}" text-anchor="end">${h}</text>`).join('')+
      [0,20,40,60].map(s=>`<text x="${x(s)}" y="197" text-anchor="middle">${s}</text>`).join('')+
      `<text x="47" y="17">${english()?'Load lifted (cm)':'上升高度 (cm)'}</text><text x="367" y="218" text-anchor="end">${english()?'Rope pulled (cm)':'拉绳距离 (cm)'}</text>`+
      `<path d="M47 177L${x(30)} ${y(30)}" stroke="#dd8955" stroke-width="3" fill="none"/><path d="M47 177L${x(60)} ${y(30)}" stroke="#398f8a" stroke-width="3" fill="none"/><circle id="graph-point" cx="${x(m.s)}" cy="${y(m.h)}" r="6" fill="${m.n===1?'#dd8955':'#398f8a'}" stroke="#fffefa" stroke-width="2"/>`;
  }
  function draw(){
    const m=model(mode,current,weight),number=v=>Number(v.toFixed(1));
    const en=english();document.title=en?'Pulley Lab · Primary Science':'滑轮实验室 · 小学科学';
    $('.card-head > span:first-child').textContent=en?'Grade 3 · Simple machines':'三年级 · 简单机械';$('.card-head .live').textContent=en?'Try it yourself':'动手试一试';
    document.querySelectorAll('[data-mode]').forEach((b,i)=>b.textContent=['①','②','③'][i]+' '+(en?['Fixed pulley','Movable pulley','Pulley system'][i]:['定滑轮','动滑轮','滑轮组'][i]));
    $('.configuration').setAttribute('aria-label',en?'Choose a pulley setup':'选择滑轮配置');
    stage.setAttribute('aria-label',en?'Pulley lab: drag the rope handle or load. Use arrow keys to change height, Home for bottom, End for top.':'滑轮实验台：拖动绳柄或重物，上下方向键调整高度，Home 到底部，End 到顶部');
    svg.setAttribute('aria-label',en?'A pulley rig with rope handle and load':'安装在实验台上的滑轮、绳柄和重物');
    put('.stage-note .pill',m.direction===1?'向下拉 · 重物上升':'向上拉 · 重物上升',m.direction===1?'Pull down · load rises':'Pull up · load rises');
    $('#handle-hint').textContent=en?'↕ Rope handle':'↕ 拉绳柄';$('#handle-hint').setAttribute('aria-label',en?'Rope handle: drag or use arrow keys to change height':'绳柄：拖动或用方向键调整高度');$('#load-hint').textContent=en?'↕ Moving load':'↕ 移动重物';$('#load-hint').setAttribute('aria-label',en?'Load: drag or use arrow keys to change height':'重物：拖动或用方向键调整高度');
    labelText('label[for=pull]','拉绳距离','Rope pulled');labelText('label[for=weight]','重物重量','Load weight');$('.range-labels span:first-child').textContent=en?'Start':'起点';
    $('#lift').textContent=en?'Pull 20 cm more':'再拉 20 cm';$('#reset').textContent=en?'Reset':'重置';$('#play').textContent=auto?(en?'Pause':'暂停'):(en?'Auto explore':'自动探索');
    put('.formula-card > span','省力与距离','Force and distance');labelText('.formula-card strong','拉力 = 重量 ÷ ','Effort = load ÷ ');labelText('.formula-card p','拉绳距离 = 上升高度 × ','Rope pulled = lift × ');put('.formula-card small','理想滑轮 · 不计摩擦和轮重','Ideal pulleys · no friction or pulley weight');
    document.querySelectorAll('.metric > span').forEach((el,i)=>el.textContent=en?['Effort needed','Load lifted'][i]:['需要的拉力','重物上升'][i]);
    document.querySelectorAll('.legend span').forEach((el,i)=>el.lastChild.textContent=en?['Fixed frame','Rope','Coral: moving load'][i]:['固定支架','绳子','珊瑚色：升降重物'][i]);
    put('#saving',m.n===1?'和直接提起一样用力':'只需一半拉力 · 两段绳承重',m.n===1?'Same effort as lifting directly':'Half the effort · two rope sections support the load');
    put('#finding-title',words[mode][0],words[mode][2]);put('#finding',words[mode][1],words[mode][3]);put('.graph-heading h2','拉多少，升多高？','How far pulled, how high lifted?');$('#graph').setAttribute('aria-label',en?'Relationship between rope pulled and load lifted':'拉绳距离与重物上升高度的关系图');$('.graph-key').innerHTML=en?'<span>● Fixed</span><span>● Movable / this system</span>':'<span>● 定滑轮</span><span>● 动滑轮 / 本滑轮组</span>';
    const caption=document.querySelector('.stage-caption > span:first-child');caption.textContent=en?'Drag handle or load · ↑↓ / Home / End':'拖动绳柄或重物 · ↑↓ / Home / End';
    $('#rope').setAttribute('d',m.rope);$('#rope-highlight').setAttribute('d',m.rope);
    $('#load').setAttribute('transform',`translate(${m.loadX} ${m.loadY})`);
    $('#handle').setAttribute('transform',`translate(${m.handleX} ${m.handleY})`);
    $('#hanger').style.display=mode==='fixed'?'none':'';
    $('#hanger').setAttribute('transform',`translate(0 ${-2.5*m.h})`);
    if($('#moving-wheel')){$('#moving-wheel').setAttribute('transform',`translate(290 ${m.movingY})`);$('#moving-wheel .spokes').setAttribute('transform',`rotate(${m.movingAngle})`);}
    if($('#fixed-wheel'))$('#fixed-wheel .spokes').setAttribute('transform',`rotate(${m.fixedAngle})`);
    $('#pull').max=30*m.n;$('#pull').value=m.s;$('#pull-max').textContent=30*m.n+' cm';$('#pull-label').textContent=number(m.s)+' cm';$('#weight').value=weight;$('#weight-label').textContent=weight+' N';
    for(const [selector,percent] of [['#pull',m.h/30*100],['#weight',(weight-10)/30*100]])$(selector).style.background=`linear-gradient(to right,var(--teal) ${percent}%,var(--border) ${percent}%)`;
    $('#force').innerHTML=m.force+' <small>N</small>';$('#height').innerHTML=number(m.h)+' <small>cm</small>';$('#distance').textContent=en?`Rope pulled ${number(m.s)} cm`:`拉绳 ${number(m.s)} cm`;
    $('#segments').textContent=$('#segments-copy').textContent=m.n;
    $('#direction').textContent=en?(m.direction===1?'Pull down · load rises':'Pull up · load rises'):(m.direction===1?'向下拉 · 重物上升':'向上拉 · 重物上升');
    $('[data-readout]').textContent=en?`Effort ${m.force} N · Pull ${number(m.s)} cm · Lift ${number(m.h)} cm`:`拉力 ${m.force} N · 拉绳 ${number(m.s)} cm · 上升 ${number(m.h)} cm`;
    for(const hint of stage.querySelectorAll('.move-hint')){hint.setAttribute('aria-valuenow',number(m.h));hint.setAttribute('aria-valuetext',en?`Load lifted ${number(m.h)} cm, rope pulled ${number(m.s)} cm`:`重物上升 ${number(m.h)} 厘米，拉绳 ${number(m.s)} 厘米`);}
    $('#lift').disabled=target>=30;graph(m);positionHints();
  }
  function playState(){$('#play').textContent=auto?(english()?'Pause':'暂停'):(english()?'Auto explore':'自动探索');$('#play').setAttribute('aria-pressed',auto);$('#play').disabled=reduced.matches;}
  function run(){if(!frame&&visible&&!document.hidden&&(auto||current!==target)){last=0;frame=requestAnimationFrame(tick);}}
  function tick(now){
    frame=0;if(!visible||document.hidden)return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if(auto){clock+=dt;target=15-15*Math.cos(clock*.65);}
    current=reduced.matches?target:current+(target-current)*(1-Math.exp(-dt/.15));
    if(Math.abs(current-target)<.015)current=target;
    draw();if(auto||current!==target)frame=requestAnimationFrame(tick);
  }
  function steer(h,immediate=false){auto=false;target=clamp(h,0,30);playState();if(reduced.matches||immediate)current=target;draw();run();}
  function select(next){mode=next;for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',b.dataset.mode===mode);build();steer(current,true);}
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>select(b.dataset.mode));
  $('#pull').oninput=()=>steer(+$('#pull').value/configurations[mode].n);
  $('#weight').oninput=()=>{weight=+$('#weight').value;draw();};
  $('#lift').onclick=()=>steer(target+20/configurations[mode].n);
  $('#play').onclick=()=>{auto=!auto;clock=Math.acos(1-current/15)/.65;target=current;playState();run();};
  $('#reset').onclick=()=>{weight=20;current=target=0;select('fixed');$('#announcement').textContent=english()?'Reset: fixed pulley, 20 newtons, at the start.':'已重置：定滑轮，20 牛顿，起点。';};
  stage.addEventListener('keydown',e=>{let next;const step=e.shiftKey?5:1;if(['ArrowUp','ArrowRight'].includes(e.key))next=target+step;if(['ArrowDown','ArrowLeft'].includes(e.key))next=target-step;if(e.key==='Home')next=0;if(e.key==='End')next=30;if(next!==undefined){e.preventDefault();steer(next);}});
  stage.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;const part=e.target.closest('[data-drag]')?.dataset.drag||(e.target.closest('#handle-hint')?'handle':e.target.closest('#load-hint')?'load':null);if(!part)return;
    e.preventDefault();steer(current,true);const m=model(mode,current,weight);drag={y:e.clientY,h:current,part,scale:svg.getScreenCTM().d,ratio:part==='handle'?m.direction*m.n*2.5:-2.5};stage.setPointerCapture(e.pointerId);(e.target.closest('.move-hint')||stage).focus({preventScroll:true});
  });
  stage.addEventListener('pointermove',e=>{if(drag)steer(drag.h+(e.clientY-drag.y)/(drag.scale*drag.ratio),true);});
  for(const type of ['pointerup','pointercancel'])stage.addEventListener(type,e=>{drag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);});
  document.addEventListener('model-fullscreen-change',positionHints);new ResizeObserver(positionHints).observe(stage);
  function suspend(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)suspend();else run();}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else run();});
  reduced.addEventListener('change',()=>{suspend();auto=false;current=target;playState();draw();});
  document.addEventListener('primary-language-change',draw);
  window.pulley={model,setHeight:steer,select,getState:()=>({...model(mode,current,weight),current,target,auto})};
  build();playState();draw();
})();
