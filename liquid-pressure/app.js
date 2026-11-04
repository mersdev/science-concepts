// Anatomy Figure: one pressure bench; all measurements share this hydrostatic model.
// Parts: base, bevel, four feet, tank floor, three glass walls, rim, four corner
// strips, depth ruler, 13 ticks, probe rail, stops, carriage, gland, probe shell,
// membrane, gasket, six bolts, rotation handle, hose, two couplings, manometer
// board, four board screws, four tube saddles, U tube, two menisci and scale.
(() => {
 const $=s=>document.querySelector(s), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const model=(h,rho)=>({p:rho*9.81*h,delta:rho*h/1000});
 const stage=$('#stage'),svg=stage.querySelector('svg'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let h=.1,rho=1000,angle=0,mode='depth',auto=false,frame=0,last=0,time=0,visible=true,drag=null;
 const rect=(x,y,w,hh,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="3" fill="${fill}" ${extra}/>`;
 const screw=(x,y)=>`<circle cx="${x}" cy="${y}" r="3" fill="#d4e2e6" stroke="#63828c"/><path d="M${x-1.5} ${y}h3" stroke="#63828c"/>`;
 const tube='M510 105V310Q510 345 545 345H565Q600 345 600 310V105';
 let art=`<ellipse cx="382" cy="379" rx="307" ry="19" fill="#c4dbe0" opacity=".45"/>`;
 for(const x of [105,405,650])art+=rect(x,365,28,14,'#65828a');
 art+=`<path d="M80 351L117 329H685V358L650 380H80Z" fill="#8baab5"/><path d="M80 351H650L685 329H117Z" fill="#d9e8ed"/><path d="M80 351H650V367H80Z" fill="#bfd2d9"/>`;
 art+=rect(465,67,183,282,'#d5ccef','stroke="#a298c5" stroke-width="2"');
 art+=rect(474,76,165,262,'#f2eef9');
 for(const x of [480,632])for(const y of [82,331])art+=screw(x,y);
 art+=`<path d="M100 100L140 76H420V320L380 344H100Z" fill="#e2f1f3" stroke="#80aeba" stroke-width="2"/><path d="M100 344L140 320H420L380 344Z" fill="#a3cbd3"/>`;
 art+=`<path id="liquid-side" d="M380 139L420 115V320L380 344Z" fill="#19a9c3" opacity=".5"/><path id="liquid-front" d="M100 139H380V344H100Z" fill="url(#water)"/><path id="liquid-top" d="M100 139L140 115H420L380 139Z" fill="#8ce7ef" opacity=".65" stroke="#38a8bb"/>`;
 // Ruler is mounted to the front glass; its ticks terminate on its left edge.
 art+=rect(112,132,27,196,'#e6f7f5','fill-opacity=".85" stroke="#8bbac4"');
 for(let i=0;i<=12;i++){const y=139+i*14;art+=`<path class="iso-line" data-tone="mid" d="M112 ${y}h${i%2?6:27}"/>`;if(i%4===0)art+=`<text class="scale-text" x="126" y="${y+3}" font-size="8">${(i/20).toFixed(1)}</text>`;}
 art+=rect(242,90,12,251,'url(#metal)');
 art+=rect(235,87,26,8,'#537e8a')+rect(235,333,26,8,'#537e8a');
 art+=`<path id="hose" fill="none" stroke="#436b7d" stroke-width="9" stroke-linecap="round"/><path id="hose-shine" fill="none" stroke="#9fbfc9" stroke-width="3"/>`;
 art+=`<path d="${tube}" fill="none" stroke="#7e94ae" stroke-width="19"/><path d="${tube}" fill="none" stroke="#fff" stroke-width="14"/><path id="indicator-liquid" fill="none" stroke="#d95388" stroke-width="11"/><path d="${tube}" fill="none" stroke="#d0e4ed" stroke-width="2" transform="translate(-5 0)" opacity=".7"/>`;
 for(const x of [510,600])for(const y of [125,290]){art+=rect(x-15,y-5,30,10,'#92a9ba');art+=screw(x-11,y)+screw(x+11,y);}
 art+=rect(543,112,22,199,'#faf7ed','stroke="#c7bad6"');
 for(let i=0;i<=20;i++)art+=`<path class="iso-line" data-tone="mid" d="M543 ${120+i*9}h${i%5?6:22}"/>`;
 art+=rect(502,96,16,14,'#5c7c8c')+`<ellipse cx="600" cy="105" rx="8" ry="3" fill="#f8fbff" stroke="#8496ad"/>`;
 art+=`<path id="difference-mark" fill="none" stroke="#ba4777" stroke-width="1.5"/><text id="difference-text" x="658" y="220" text-anchor="middle"></text><text x="590" y="58" text-anchor="middle">U-tube manometer</text><text x="600" y="94" text-anchor="middle" class="engraved">AIR</text>`;
 art+=`<g id="probe" data-part="probe"><rect x="235" y="-12" width="26" height="24" rx="4" fill="#e3eef0" stroke="#6c969e"/><circle r="27" cx="248" fill="#6a8995"/><circle r="23" cx="248" fill="#dce8eb" stroke="#406b7b"/><circle r="18" cx="248" fill="url(#membrane)" stroke="#ba6b2b"/>`;
 for(let i=0;i<6;i++){const t=i*Math.PI/3;art+=screw(248+21*Math.cos(t),21*Math.sin(t));}
 art+=`<g id="orientation-part" data-part="rotation"><g id="rotation-handle"><path d="M248 0H282" stroke="#9a571d" stroke-width="6"/><circle cx="282" r="8" fill="#f4a141" stroke="#a76228"/><path d="M279 -4V4M282 -5V5M285 -4V4" stroke="#b67529" stroke-width="1"/></g><ellipse cx="248" rx="8" ry="14" fill="#fff0bd" stroke="#cb842e"/></g><g id="pressure-arrows" stroke="#087f98" fill="#087f98" stroke-width="2"></g></g>`;
 // Front glazing and rim are painted after the submerged mechanism.
 art+=`<path d="M100 100V344H380V100M380 344L420 320V76" fill="none" stroke="#6b9faa" stroke-width="3"/><path d="M100 100L140 76H420L380 100Z" fill="none" stroke="#9dbfc6" stroke-width="5"/><path d="M108 161V320M371 164V325" stroke="#fff" stroke-width="3" opacity=".55"/><text x="313" y="129" class="engraved">SURFACE</text><text x="175" y="365" class="engraved">MEMBRANE PROBE</text><text x="531" y="365" class="engraved">DYED WATER</text>`;
 $('#apparatus').innerHTML=art;
 const hints=[...stage.querySelectorAll('.move-hint')];
 // Map SVG screen coordinates through the shared projection/viewport helper.
 const P={origin:[0,0],scale:1,azimuth:90,elevation:0};
 function positionHints(){const y=139+280*h,a=angle*Math.PI/180;[[248,y-28],[248+34*Math.cos(a),y+34*Math.sin(a)+64]].forEach(([x,y],i)=>positionMoveHint(hints[i],[x/UNIT,0,-y/UNIT],P));}
 function graph(){
  const px=x=>48+x/.6*340,py=p=>216-p/8000*185;
  let out='';for(const p of [0,2000,4000,6000,8000])out+=`<path d="M48 ${py(p)}H388" stroke="#dbe6e8"/><text x="38" y="${py(p)+4}" text-anchor="end">${p/1000}</text>`;
  for(const d of [0,.2,.4,.6])out+=`<text x="${px(d)}" y="239" text-anchor="middle">${d.toFixed(1)}</text>`;
  out+=`<text x="48" y="19">P (kPa)</text><text x="388" y="259" text-anchor="end">Depth h (m)</text><path d="M48 216L388 ${py(model(.6,1000).p)}" stroke="#a8b9c0" stroke-width="2" stroke-dasharray="5 5"/><path id="pressure-line" d="M48 216L388 ${py(model(.6,rho).p)}" stroke="#139db6" stroke-width="3"/><path d="M48 ${py(model(h,rho).p)}H${px(h)}V216" fill="none" stroke="#e69a45" stroke-dasharray="3 4"/><circle id="graph-point" cx="${px(h)}" cy="${py(model(h,rho).p)}" r="6" fill="#e48d36" stroke="white" stroke-width="2"/>`;
  $('#plot').innerHTML=out;
 }
 function draw(){
  const {p,delta}=model(h,rho),y=139+280*h,lo=225+delta*100,hi=225-delta*100;
  $('#probe').setAttribute('transform',`translate(0 ${y})`);$('#orientation-part').setAttribute('transform',`rotate(${angle} 248 0)`);
  const hose=`M265 ${y-17}C308 ${y-55} 300 52 351 52H480Q510 52 510 82V96`;
  $('#hose').setAttribute('d',hose);$('#hose-shine').setAttribute('d',hose);
  $('#indicator-liquid').setAttribute('d',`M510 ${lo}V310Q510 345 545 345H565Q600 345 600 310V${hi}`);
  $('#difference-mark').setAttribute('d',`M610 ${hi}H633M628 ${hi}V${lo}M610 ${lo}H633`);
  $('#difference-text').textContent='ΔH';$('#difference-text').setAttribute('y',(hi+lo)/2-5);
  const color=rho<950?'#e4b74d':rho>1100?'#a692e4':'#17a7c7';
  $('#liquid-front').style.fill=color;$('#liquid-front').style.opacity='.4';$('#liquid-side').style.fill=color;$('#liquid-top').style.fill=color;
  const len=8+p/7500*19;
  $('#pressure-arrows').innerHTML=p===0?'':[0,90,180,270].map(a=>`<g transform="rotate(${a} 248 0)"><path d="M${248+36+len} 0H284"/><path d="M284 0l5 -3v6Z" stroke="none"/></g>`).join('');
  $('#depth').value=h;$('#density').value=rho;$('#angle').value=angle;
  $('#depth-value').textContent=h.toFixed(2);$('#density-value').textContent=Math.round(rho);$('#angle-value').textContent=Math.round(angle)+'°';
  $('#pressure').innerHTML=(p/1000).toFixed(2)+' <small>kPa</small>';$('#difference').innerHTML=(delta*100).toFixed(1)+' <small>cm</small>';
  $('#substitution').textContent=`${Math.round(rho)} × 9.81 × ${h.toFixed(2)} = ${(p/1000).toFixed(2)} kPa`;
  $('[data-readout]').textContent=`h ${h.toFixed(2)} m · P ${(p/1000).toFixed(2)} kPa · ΔH ${(delta*100).toFixed(1)} cm`;
  $('#liquid-name').textContent=rho===1000?'WATER':rho===800?'OIL':rho===1260?'GLYCEROL':'TEST LIQUID';
  hints[0].setAttribute('aria-valuenow',h.toFixed(2));hints[1].setAttribute('aria-valuenow',Math.round(angle));
  for(const hint of hints)hint.setAttribute('aria-valuetext',`${hint.dataset.move==='depth'?h.toFixed(2)+' metres':Math.round(angle)+' degrees'}, ${(p/1000).toFixed(2)} kilopascals`);
  for(const id of ['depth','density','angle']){const el=$('#'+id);el.style.setProperty('--fill',100*(el.value-el.min)/(el.max-el.min)+'%');}
  graph();positionHints();
 }
 function playState(){$('#tour').disabled=reduced.matches;$('#tour').textContent=reduced.matches?'Motion reduced':auto?'Ⅱ Pause':'▷ Auto explore';$('#tour').setAttribute('aria-pressed',String(auto));}
 function stop(){auto=false;if(frame)cancelAnimationFrame(frame);frame=0;playState();}
 function setMode(next){stop();mode=next;$('#density').disabled=next==='depth';$('#depth').disabled=next==='density';for(const m of ['depth','density','free'])$('#'+m+'-mode').setAttribute('aria-pressed',String(m===next));$('#compare').textContent=next==='density'?'Use denser liquid':'Lower probe';$('#comparison-note').textContent=next==='depth'?`Depth comparison: density stays at ${Math.round(rho)} kg/m³.`:next==='density'?`Density comparison: depth stays at ${h.toFixed(2)} m.`:'Free explore: adjust depth and density independently.';draw();}
 function change(part,value){stop();if(part==='angle')angle=clamp(value,0,360);else if(part==='density'&&mode!=='depth')rho=clamp(value,800,1260);else if(part==='depth'&&mode!=='density')h=clamp(value,0,.6);draw();$('#announcement').textContent=$('[data-readout]').textContent;}
 for(const part of ['depth','density','angle'])$('#'+part).addEventListener('input',e=>change(part,+e.target.value));
 for(const m of ['depth','density','free'])$('#'+m+'-mode').onclick=()=>setMode(m);
 $('#compare').onclick=()=>mode==='density'?change('density',rho<1260?1260:1000):change('depth',h<.5?.5:.1);
 $('#reset').onclick=()=>{h=.1;rho=1000;angle=0;time=0;setMode('depth');};
 function tick(now){frame=0;if(document.hidden||!visible||!auto||reduced.matches)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;const wave=(1-Math.cos(time*.8))/2;if(mode==='density')rho=1000+260*wave;else h=.1+.4*wave;draw();frame=requestAnimationFrame(tick);}
 function resume(){last=0;if(auto&&visible&&!document.hidden&&!reduced.matches&&!frame)frame=requestAnimationFrame(tick);}
 $('#tour').onclick=()=>{if(auto)stop();else{auto=true;time=0;playState();resume();}};
 stage.addEventListener('keydown',e=>{const part=e.target.closest('[data-move]')?.dataset.move||'depth',value=part==='angle'?angle:h,step=part==='angle'?5:.01,max=part==='angle'?360:.6;let next;if(['ArrowUp','ArrowRight'].includes(e.key))next=value+step;if(['ArrowDown','ArrowLeft'].includes(e.key))next=value-step;if(e.key==='Home')next=0;if(e.key==='End')next=max;if(next!==undefined){e.preventDefault();change(part,next);}});
 const local=e=>new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());
 stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;const part=e.target.closest('[data-move]')?.dataset.move||(e.target.closest('#rotation-handle')?'angle':'depth');if(part==='depth'&&mode==='density')return;stop();const p=local(e);drag={part,start:p.y,h,angle,x:e.clientX};stage.setPointerCapture(e.pointerId);e.preventDefault();});
 stage.addEventListener('pointermove',e=>{if(!drag)return;change(drag.part,drag.part==='angle'?drag.angle+(e.clientX-drag.x)*2:drag.h+(local(e).y-drag.start)/280);});
 for(const t of ['pointerup','pointercancel'])stage.addEventListener(t,e=>{drag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();}).observe(stage);
 document.addEventListener('visibilitychange',resume);document.addEventListener('model-fullscreen-change',positionHints);new ResizeObserver(positionHints).observe(stage);
 reduced.addEventListener('change',()=>{stop();draw();});
 window.liquidPressure={model,getState:()=>({h,rho,angle,mode,auto,current:h,target:h,...model(h,rho)}),setDepth:value=>change('depth',value)};
 setMode('depth');
})();
