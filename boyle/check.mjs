import {spawnSync} from 'node:child_process';
const checks=[
 ['eval',`(()=>{for(const v of [20,30,60,100]){const m=boyle.model(v);if(Math.abs(m.p*v-6000)>1e-8)throw Error('PV invariant');}if(boyle.model(30).p!==2*boyle.model(60).p)throw Error('Half volume must double pressure');if(boyle.getState().particles!==24)throw Error('Gas quantity changed');return 'PASS: Boyle model and fixed quantity';})()`],
 ['click','#half'],['wait',1700],
 ['eval',`(()=>{if(Math.abs(boyle.getState().current-30)>.1)throw Error('Half button');if(!document.querySelector('#pressure').textContent.includes('200.0'))throw Error('Pressure readout');if(!document.querySelector('#half').disabled)throw Error('Below-range half allowed');return 'PASS: half volume, double pressure';})()`],
 ['click','#inverse'],['eval',`(()=>{if(!boyle.getState().inverse)throw Error('Graph mode');return 'PASS: reciprocal graph';})()`],
 ['shot','shots/compressed.png','body'],
 ['key','Home','#stage'],['wait',1700],
 ['eval',`(()=>{if(Math.abs(boyle.getState().current-20)>.1)throw Error('Home key');return 'PASS: minimum';})()`],
 ['key','End','#stage'],['wait',1700],
 ['eval',`(()=>{if(Math.abs(boyle.getState().current-100)>.1)throw Error('End key');return 'PASS: maximum';})()`],
 ['shot','shots/expanded.png','body'],
 ['drag','#stage',.6,.55,.4,.45,15],['wait',1200],
 ['eval',`(()=>{if(boyle.getState().current>=99)throw Error('Piston drag');return 'PASS: pointer drag';})()`],
 ['click','#reset'],['wait',1700],
 ['click','#play'],['wait',800],
 ['eval',`(()=>{if(!boyle.getState().auto)throw Error('Tour did not start');return 'PASS: tour';})()`],
 ['click','#play'],['click','#theme'],['shot','shots/dark.png','body'],
 ['eval',`(()=>{if(document.body.dataset.theme!=='dark')throw Error('Theme');if(document.documentElement.scrollWidth>innerWidth)throw Error('Horizontal overflow');return 'PASS: theme and layout';})()`],
 ['lines']
];
const result=spawnSync(process.execPath,['/Users/baoren/.agents/skills/anatomy/scripts/drive.mjs','index.html',JSON.stringify(checks),'--height','1500'],{encoding:'utf8'});
process.stdout.write(result.stdout);process.stderr.write(result.stderr);
if(result.status||/exception:|Error:|FAIL/.test(result.stdout+result.stderr))process.exit(1);
console.log('All interaction checks passed.');
