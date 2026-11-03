import {spawnSync} from 'node:child_process';
const actions=[
 ['eval',`(()=>{if(Number(document.querySelector('#led-emitter').getAttribute('opacity'))!==.5)throw Error('LED at 6 V');return 'PASS LED half brightness';})()`],
 ['key','Home','#stage'],['wait',1300],['eval',`(()=>{if(Number(document.querySelector('#led-emitter').getAttribute('opacity'))!==0||Number(document.querySelector('#led-glow').getAttribute('opacity'))!==0||document.querySelector('#led-state').textContent!=='Off')throw Error('LED off');return 'PASS LED off at zero volts';})()`],['shot','shots/led-off.png','.workspace'],
 ['eval',`(()=>{const s=document.querySelector('#voltage');s.value=3;s.dispatchEvent(new Event('input'));})()`],['wait',1300],['eval',`(()=>{if(Number(document.querySelector('#led-emitter').getAttribute('opacity'))!==.25||document.querySelector('#led-state').textContent!=='Dim')throw Error('LED dim');return 'PASS LED dim at 3 V';})()`],['shot','shots/led-dim.png','.workspace'],
 ['eval',`(()=>{const s=document.querySelector('#voltage');s.value=6;s.dispatchEvent(new Event('input'));})()`],['wait',1300],
 ['eval',`(()=>{for(let v=0;v<=12;v+=.5){const r=ohm.model(v),b=ohm.model(v,'lamp');if(Math.abs(r.i-v/10)>1e-9)throw Error('Ohmic model');if(Math.abs(10*b.i+30*b.i**3-v)>1e-9)throw Error('Bulb model');}if(ohm.model(0).r!==null)throw Error('Zero resistance quotient');if(ohm.model(12,'lamp').r<=ohm.model(6,'lamp').r)throw Error('Heating');if(ohm.model(12,'lamp').i>=2*ohm.model(6,'lamp').i)throw Error('Non-ohmic behavior');return 'PASS model, zero case, bulb heating';})()`],
 ['click','#double'],['wait',1300],['eval',`(()=>{if(ohm.getState().current!==12||!document.querySelector('#current').textContent.includes('1.200'))throw Error('Doubling voltage');return 'PASS doubling';})()`],
 ['eval',`(()=>{if(Number(document.querySelector('#led-emitter').getAttribute('opacity'))!==1||document.querySelector('#led-state').textContent!=='Bright')throw Error('LED maximum');return 'PASS LED bright at 12 V';})()`],['shot','shots/led-bright.png','.workspace'],
 ['click','#record'],['click','#record'],['eval',`(()=>{if(ohm.getState().rows.length!==1)throw Error('Record deduplication');return 'PASS notebook';})()`],
 ['click','#lamp'],['click','#compare'],['eval',`(()=>{if(ohm.getState().kind!=='lamp'||!ohm.getState().compare)throw Error('Conductor/compare');if(getComputedStyle(document.querySelector('[data-conductor]')).display!=='none')throw Error('Cartridge');return 'PASS bulb cartridge and graph comparison';})()`],
 ['shot','shots/bulb.png','.workspace'],
 ['key','Home','#stage'],['wait',1300],['eval',`(()=>{if(ohm.getState().current!==0||!document.querySelector('#resistance-note').textContent.includes('undefined'))throw Error('Zero input');return 'PASS keyboard and zero state';})()`],
 ['key','End','#stage'],['wait',1300],['click','#record'],
 ['click','#circuit-toggle'],['eval',`(()=>{if(document.querySelector('#circuit-key').hidden)throw Error('Circuit key');return 'PASS circuit key';})()`],['click','#circuit-toggle'],
 ['click','[data-answer="0.30"]'],['eval',`(()=>{if(!document.querySelector('#feedback').textContent.includes('Try'))throw Error('Wrong answer feedback');return 'PASS corrective feedback';})()`],
 ['click','[data-answer="0.60"]'],['eval',`(()=>{if(!document.querySelector('#feedback').textContent.includes('Exactly'))throw Error('Answer');return 'PASS quiz';})()`],
 ['click','#reset'],['wait',1300],['drag','#stage',.3,.5,.5,.5,12],['wait',1300],['eval',`(()=>{if(ohm.getState().current<=6)throw Error('Drag');return 'PASS drag';})()`],
 ['click','#tour'],['wait',700],['eval',`(()=>{if(!ohm.getState().auto)throw Error('Tour');return 'PASS auto sweep';})()`],['click','#tour'],
 ['click','#reset'],['wait',1300],['click','#clear'],['eval',`(()=>{if(ohm.getState().rows.length)throw Error('Clear');return 'PASS clear';})()`],
 ['lines'],['click','#theme'],['lines'],['shot','shots/dark.png','.workspace'],
 ['eval',`(()=>{if(document.documentElement.scrollWidth>innerWidth)throw Error('Overflow');return 'PASS layout';})()`]
];
const driven=actions.flatMap(a=>['click','drag','key'].includes(a[0])?[['scroll',a[0]==='key'?(a[2]||'#stage'):a[1]],['wait',650],a]:[a]);
const r=spawnSync(process.execPath,['/Users/baoren/.agents/skills/anatomy/scripts/drive.mjs','index.html',JSON.stringify(driven),'--height','1400'],{encoding:'utf8'});
process.stdout.write(r.stdout);process.stderr.write(r.stderr);
if(r.status||/exception:|Error:|FAIL/.test(r.stdout+r.stderr))process.exit(1);
console.log('All lesson checks passed.');
