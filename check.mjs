import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkTower } from './primary/tower/check.mjs';
import { checkBridges } from './primary/bridges/check.mjs';

// A dependency-free Chrome DevTools check; no application build is needed.
const root = fileURLToPath(new URL('.', import.meta.url));
const chromePath = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(existsSync);
assert(chromePath, 'Install Chrome/Chromium or set CHROME_PATH.');
const profile = mkdtempSync(join(tmpdir(), 'science-check-'));
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank']);
const wait = ms => new Promise(done => setTimeout(done, ms));
const artifacts = join(root, 'artifacts');
mkdirSync(artifacts, { recursive: true });
let socket;
try {
  const port = await new Promise((done, fail) => {
    let output = '';
    const timer = setTimeout(() => fail(Error('Chrome startup timed out')), 15000);
    chrome.once('error', fail);
    chrome.stderr.on('data', data => {
      output += data;
      const found = output.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (found) { clearTimeout(timer); done(found[1]); }
    });
  });
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, fail) => { socket.onopen = done; socket.onerror = fail; });
  let sequence = 0;
  const pending = new Map(), errors = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const job = pending.get(message.id);
      if (job) { pending.delete(message.id); clearTimeout(job.timer); message.error ? job.fail(Error(message.error.message)) : job.done(message.result); }
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map(arg => arg.value || arg.description).join(' '));
    }
  };
  const send = (method, params = {}) => new Promise((done, fail) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); fail(Error(`${method} timed out`)); }, 15000);
    pending.set(id, { done, fail, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  };
  const click = async selector => {
    const previous = selector === '#fullscreen' ? await evaluate(`document.querySelector('#fullscreen').getAttribute('aria-pressed')`) : null;
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    if (previous !== null) {
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        if (await evaluate(`document.querySelector('#fullscreen').getAttribute('aria-pressed')!==${JSON.stringify(previous)} && document.activeElement.id==='fullscreen'`)) return;
        await wait(20);
      }
      assert.fail('Fullscreen transition did not finish and restore button focus');
    }
  };
  let activeExperiment;
  const settle = async () => {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (await evaluate(`{const s=${activeExperiment}.getState();s.u===undefined?s.current===s.target:s.u===s.targetU&&s.s===s.targetS}`)) return;
      await wait(100);
    }
    throw Error(`${activeExperiment}: animation did not settle`);
  };
  const input = async (selector, value) => {
    await evaluate(`{const el=document.querySelector(${JSON.stringify(selector)});el.value=${value};el.dispatchEvent(new Event('input'));}`);
    await settle();
  };
  const screenshot = async name => {
    if (!await evaluate(`document.body.classList.contains('model-fullscreen')`)) {
      assert(await evaluate(`{const r=document.querySelector('main').getBoundingClientRect();Math.abs(r.left+r.width/2-document.documentElement.clientWidth/2)<1&&Math.abs(r.top+scrollY-Math.max(0,(innerHeight-r.height)/2))<1}`), `${name}: page is centered with safe vertical overflow`);
    }
    if (await evaluate(`Boolean(document.querySelector('.home-link'))`)) {
      assert(await evaluate(`{const home=document.querySelector('.home-link'),full=document.body.classList.contains('model-fullscreen');Boolean(home.getClientRects().length)===!full&&home.inert===full}`), `${name}: Home is visible and focusable only outside fullscreen`);
    }
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(artifacts, `${name}.png`), Buffer.from(data, 'base64'));
  };
  const key = async (value, selector = '#stage') => {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: value });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: value });
    await settle();
  };
  await send('Runtime.enable'); await send('Page.enable');
  if (!process.env.TOWER_ONLY && !process.env.BRIDGES_ONLY) {
  await send('Page.navigate',{url:pathToFileURL(resolve(root,'index.html')).href});await wait(250);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.experiment-card')].map(a=>a.getAttribute('href'))`),['primary/index.html','secondary/index.html']);
  assert(await evaluate('document.scripts.length===0&&[...document.images].every(img=>img.complete&&img.naturalWidth>0)'));
  for(const [width,height] of [[1366,768],[1440,900],[390,844],[320,740]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await wait(80);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));if(width>900)assert(await evaluate('document.documentElement.scrollHeight<=innerHeight+1'));await screenshot('root-index-'+width);}
  for(const series of ['primary','secondary']){await evaluate(`document.querySelector('a[href="${series}/index.html"]').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(200);assert(await evaluate(`location.pathname.endsWith('/${series}/index.html')`));await evaluate(`document.querySelector('footer a').click()`);await wait(200);assert.equal(await evaluate('location.href'),pathToFileURL(resolve(root,'index.html')).href);}
  await send('Page.navigate', { url: pathToFileURL(resolve(root, 'primary', 'index.html')).href });
  await wait(250);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.experiment-card')].map(a=>a.getAttribute('href'))`), ['tower/index.html','bridges/index.html']);
  assert(await evaluate(`document.documentElement.lang==='en'&&document.querySelectorAll('#language,[data-en],[data-zh]').length===0&&document.querySelector('.apparatus img[src="../assets/catalog/tower.svg"]')&&[...document.images].every(img=>img.complete&&img.naturalWidth>0)`), 'primary catalogue is English-only and uses the shared card design');
  assert.equal(await evaluate('document.scripts.length'), 0, 'primary catalogue needs no runtime scripts');
  for (const [width,height] of [[1366,768],[1440,900],[390,844],[320,740]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await evaluate('scrollTo(0,0)'); await wait(80); await screenshot(`primary-index-${width}`);
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'), `primary catalogue fits ${width}px`);
    if(width>900) assert(await evaluate('document.documentElement.scrollHeight<=innerHeight+1'), 'primary catalogue fits without desktop scrolling');
    assert(await evaluate(`[...document.querySelectorAll('.experiment-card')].every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height>200})`));
  }
  // The catalogue must also work directly from disk, with no running simulations.
  await send('Page.navigate', { url: pathToFileURL(resolve(root, 'secondary', 'index.html')).href });
  await wait(400);
  const catalogueFolders = ['boyle', 'convex', 'ohm', 'latent-heat', 'liquid-pressure', 'free-fall'];
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.experiment-card')].map(a=>a.getAttribute('href'))`), catalogueFolders.map(name=>`${name}/index.html`));
  assert(await evaluate(`document.querySelectorAll('.apparatus img').length===6 && [...document.images].every(img=>img.complete&&img.naturalWidth>0)`), 'all offline apparatus previews and the site icon load');
  assert.equal(await evaluate(`document.querySelectorAll('.home-link').length`), 0, 'catalogue has no Home button');
  assert(await evaluate(`document.querySelector('.eyebrow').textContent.includes('FORM 4 & 5')`));
  assert.equal(await evaluate('document.scripts.length'), 0, 'catalogue needs no runtime scripts');
  for (const [width,height] of [[1366,768],[1440,900],[390,844],[320,740]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await evaluate('scrollTo(0,0)');
    await wait(80);
    await screenshot(`index-${width}`);
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'), `catalogue fits ${width}px`);
    if(width>900) assert(await evaluate('document.documentElement.scrollHeight<=innerHeight+1'), 'desktop catalogue fits without scrolling');
    assert(await evaluate(`[...document.querySelectorAll('.experiment-card')].every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height>200})`));
  }
  await evaluate(`document.querySelector('.experiment-card').focus()`);
  assert.equal(await evaluate(`document.activeElement.getAttribute('href')`), 'boyle/index.html');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await wait(300);
  assert(await evaluate(`location.pathname.endsWith('/secondary/boyle/index.html')`), 'Enter opens the selected experiment');
  assert.deepEqual(errors,[]);
  console.log('PASS experiment index: offline previews, all links, keyboard navigation and desktop/phone layouts');
  for (const name of catalogueFolders) {
    await send('Page.navigate', { url: pathToFileURL(resolve(root, 'secondary', name, 'index.html')).href });
    await wait(250);
    assert.equal(await evaluate(`document.querySelectorAll('.home-link').length`), 1);
    assert(await evaluate(`{const a=document.querySelector('.home-link');a.getAttribute('href')==='../index.html'&&a.getClientRects().length>0&&a.querySelector('img').naturalWidth>0}`), `${name}: Home and icon available`);
    await evaluate(`document.querySelector('.home-link').focus()`);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await wait(150);
    assert.equal(await evaluate('location.href'), pathToFileURL(resolve(root,'secondary','index.html')).href, `${name}: Home keyboard navigation returns to catalogue`);
  }
  console.log('PASS Home links: all six experiments return to the catalogue with Enter');
  for (const name of ['boyle', 'convex', 'ohm']) {
    activeExperiment = name;
    errors.length = 0;
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: pathToFileURL(resolve(root, 'secondary', name, 'index.html')).href });
    await wait(500);
    assert(await evaluate(`Boolean(window.${name})`), `${name}: application initialized`);
    assert.equal(await evaluate(`document.querySelectorAll('nav:not(.page-tools),footer,.quiz,.notebook,.intro,.investigation').length`), 0);
    assert.equal(await evaluate(`document.querySelectorAll('.page-intro h1').length`), 1);
    assert(await evaluate(`Boolean(document.querySelector('.page-intro p').textContent.trim())`));
    assert.equal(await evaluate(`document.querySelectorAll('.formula-card').length`), 1);
    assert(await evaluate(`document.querySelector('aside').firstElementChild.classList.contains('formula-card')`));
    assert(await evaluate(`document.querySelectorAll('.move-hint').length>0 && [...document.querySelectorAll('.move-hint')].every(el=>getComputedStyle(el).display==='none')`), 'movement indicators hidden outside fullscreen');
    for(const [width,height] of [[1366,768],[1440,900]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
      await wait(80);
      assert(await evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth'),`${name}: overview fits at 100% on ${width}×${height}`);
      assert(await evaluate(`{const stage=document.querySelector('#stage').getBoundingClientRect(),svg=document.querySelector('#stage > svg').getBoundingClientRect();svg.top>=stage.top-1&&svg.bottom<=stage.bottom+1&&svg.left>=stage.left-1&&svg.right<=stage.right+1}`),'model stays within stage without overlapping controls');
      assert(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.control-title label')).fontSize)>=14`),'desktop controls remain readable');
      if(width===1366)await screenshot(`${name}-laptop`);
    }
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1200,deviceScaleFactor:1,mobile:false});
    if (name === 'boyle') {
      assert(await evaluate('[20,30,60,100].every(v=>Math.abs(boyle.model(v).p*v-6000)<1e-9)'));
      await click('#half'); await settle();
      assert.equal(await evaluate('boyle.getState().current'), 30);
      assert.equal(await evaluate('boyle.model(30).p'), 200);
      await click('#inverse'); assert(await evaluate('boyle.getState().inverse'));
      const dots = await evaluate(`document.querySelector('#gas').innerHTML`); await wait(150);
      assert.notEqual(await evaluate(`document.querySelector('#gas').innerHTML`), dots, 'particles animate');
    } else if (name === 'convex') {
      assert(await evaluate('[10,15,21,30,40,60,80].every(u=>Math.abs(1/20-1/u-1/convex.model(u).v)<1e-10)'));
      await input('#object', 40); assert.equal(await evaluate('convex.getState().sharp'), false);
      await click('#focus'); await settle(); assert(await evaluate('convex.getState().sharp'));
      await input('#screen', 60); assert.equal(await evaluate('convex.getState().sharp'), false);
      await click('[data-u="10"]'); await settle();
      assert.equal(await evaluate('convex.model(10).v'), -20);
      assert(await evaluate(`document.querySelector('#focus').disabled`));
      await click('[data-u="20"]'); await settle();
      assert.equal(await evaluate('convex.model(20).invV'), 0);
      assert(await evaluate(`document.querySelector('#image-distance').textContent.includes('∞')`));
      await input('#object', 21); assert(await evaluate(`document.querySelector('#focus').disabled`));
      await click('#distance'); assert.equal(await evaluate('convex.getState().reciprocal'), false);
    } else {
      assert(await evaluate('[0,3,6,12].every(v=>Math.abs(ohm.model(v).i-v/10)<1e-9)'));
      await click('#double'); await settle(); assert.equal(await evaluate('ohm.getState().current'), 12);
      await click('#lamp'); await click('#compare');
      assert(await evaluate('ohm.getState().compare'));
      assert(await evaluate('[3,6,12].every(v=>{const {i}=ohm.model(v,"lamp");return Math.abs(10*i+30*i**3-v)<1e-9})'));
      assert(await evaluate(`document.querySelector('#formula-equation').textContent.includes('30I³')`));
      await input('#voltage', 0); assert.equal(await evaluate('ohm.model(0).r'), null);
      assert.equal(await evaluate(`document.querySelector('#led-emitter').getAttribute('opacity')`), '0.0000');
    }
    await click('#reset'); await settle();
    const play = name === 'boyle' ? '#play' : '#tour';
    await click(play); await wait(250); assert(await evaluate(`${name}.getState().auto`));
    const state = await evaluate(`JSON.stringify(${name}.getState())`); await wait(250);
    assert.notEqual(await evaluate(`JSON.stringify(${name}.getState())`), state, 'auto mode animates');
    await click(play); assert.equal(await evaluate(`${name}.getState().auto`), false);
    await key('Home'); await key('End');
    assert.equal(await evaluate(`${name}.getState().${name === 'convex' ? 'u' : 'current'}`), name === 'boyle' ? 100 : name === 'convex' ? 80 : 12);
    const box = await evaluate(`{const r=document.querySelector('${name==='convex'?'#object-carriage':'#stage'}').getBoundingClientRect();({x:r.x+r.width*.6,y:r.y+r.height*.5,width:r.width})}`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + (name === 'convex' ? 70 : -70), y: box.y, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + (name === 'convex' ? 70 : -70), y: box.y, button: 'left', clickCount: 1 });
    await settle();
    assert(await evaluate(`${name}.getState().${name === 'convex' ? 'u' : 'current'} < ${name === 'boyle' ? 100 : name === 'convex' ? 80 : 12}`), 'pointer drag changes model');
    assert(await evaluate('getSelection().isCollapsed'), 'model drag does not select SVG text');
    await click('#reset'); await settle();
    if (name === 'boyle') assert.equal(await evaluate('boyle.getState().inverse'), false);
    if (name === 'convex') assert.equal(await evaluate('convex.getState().reciprocal'), true);
    await evaluate('document.activeElement.blur()');
    await screenshot(`${name}-desktop`);
    await click('#fullscreen'); await wait(250);
    assert(await evaluate(`document.fullscreenElement===document.querySelector('.stage-wrap')`), 'native fullscreen');
    assert(await evaluate(`document.querySelector('#fullscreen').getAttribute('aria-pressed')==='true'`));
    assert(await evaluate(`document.querySelector('#reset').inert`));
    assert(await evaluate(`getComputedStyle(document.querySelector('.stage-caption > span:first-child')).display==='none'`));
    assert(await evaluate(`[...document.querySelectorAll('.move-hint')].every(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})`), 'fullscreen movement indicators visible and in bounds');
    if(name!=='convex') {
      const before=await evaluate(`${name}.getState().current`);
      const hint=await evaluate(`{const r=document.querySelector('.move-hint').getBoundingClientRect();({x:r.x+r.width/2,y:r.y+r.height/2})}`);
      await send('Input.dispatchMouseEvent',{type:'mousePressed',x:hint.x,y:hint.y,button:'left',clickCount:1});
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:hint.x+35,y:hint.y,button:'left',buttons:1});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:hint.x+35,y:hint.y,button:'left',clickCount:1});
      await settle();
      const afterDrag=await evaluate(`${name}.getState().current`);
      assert(afterDrag>before,'dragging indicator moves its component');
      assert(await evaluate(`{const r=document.querySelector('.move-hint').getBoundingClientRect();Math.abs(r.x+r.width/2-${hint.x})>1}`),'indicator follows component');
      await key('ArrowRight','.move-hint');
      assert(await evaluate(`${name}.getState().current>${afterDrag}`),'focused indicator supports keyboard movement');
    }
    if(name==='convex') {
      assert(await evaluate(`document.querySelector('.stage-wrap .screen-preview')!==null && document.querySelectorAll('#preview').length===1`), 'live preview is inside fullscreen');
      assert(await evaluate(`[...document.querySelectorAll('.move-hint')].every(el=>getComputedStyle(el).display!=='none')`), 'movement indicators visible');
      const dragScreen = async cm => {
        const drag = await evaluate(`{const r=document.querySelector('[data-move="screen"]').getBoundingClientRect(),matrix=document.querySelector('#stage > svg').getScreenCTM();const a=new DOMPoint(...iso([0,0,0],P)).matrixTransform(matrix),b=new DOMPoint(...iso([${cm*3},0,0],P)).matrixTransform(matrix);({x:r.x+r.width/2,y:r.y+r.height/2,dx:b.x-a.x,dy:b.y-a.y})}`);
        await send('Input.dispatchMouseEvent', {type:'mousePressed', x:drag.x, y:drag.y, button:'left', clickCount:1});
        await send('Input.dispatchMouseEvent', {type:'mouseMoved', x:drag.x+drag.dx, y:drag.y+drag.dy, button:'left', buttons:1});
        await send('Input.dispatchMouseEvent', {type:'mouseReleased', x:drag.x+drag.dx, y:drag.y+drag.dy, button:'left', clickCount:1});
        await settle();
      };
      await dragScreen(10);
      assert(await evaluate(`Math.abs(convex.getState().s-40)<.01 && convex.getState().u===60`), 'screen drags independently');
      assert.equal(await evaluate(`document.querySelector('#preview-status').textContent`),'OUT OF FOCUS');
      await dragScreen(-10); assert(await evaluate('convex.getState().sharp'), 'screen drag restores focus');
      await key('ArrowRight'); assert.equal(await evaluate(`document.querySelector('#preview-status').textContent`),'OUT OF FOCUS');
      await key('ArrowLeft'); assert(await evaluate('convex.getState().sharp'), 'keyboard moves selected screen');
      await evaluate(`document.querySelector('[data-move="object"]').focus()`);
    }
    await key('Home'); await screenshot(`${name}-fullscreen`);
    if(name==='convex') {
      assert.equal(await evaluate(`document.querySelector('#preview-status').textContent`),'NO SHARP IMAGE');
      assert.equal(await evaluate(`document.querySelector('#preview-arrow').getAttribute('opacity')`),'0');
    }
    await click('#fullscreen'); await wait(150);
    assert(await evaluate(`document.fullscreenElement===null && !document.querySelector('#reset').inert`));
    assert.equal(await evaluate('document.activeElement.id'), 'fullscreen');
    assert(await evaluate(`[...document.querySelectorAll('.move-hint')].every(el=>getComputedStyle(el).display==='none')`), 'indicators disappear after exit');
    if(name==='convex')assert(await evaluate(`document.querySelector('aside .screen-preview')!==null && document.querySelectorAll('#preview').length===1`), 'preview returns to sidebar');
    await evaluate(`document.querySelector('.stage-wrap').requestFullscreen=undefined`);
    await click('#fullscreen'); assert(await evaluate(`document.querySelector('.stage-wrap').classList.contains('is-fullscreen')`));
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape' });
    assert.equal(await evaluate(`document.querySelector('.stage-wrap').classList.contains('is-fullscreen')`), false);
    for (const width of [320, 390, 768, 1024]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: false });
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'), `${name}: overflow at ${width}px`);
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await click('#reset'); await settle();
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'), 'phone has no horizontal overflow');
    await screenshot(`${name}-phone`);
    await click('#fullscreen'); await wait(100); await screenshot(`${name}-phone-fullscreen`);
    assert(await evaluate(`document.querySelector('.stage-wrap').getBoundingClientRect().width===innerWidth`));
    assert(await evaluate(`[...document.querySelectorAll('.move-hint')].every(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})`), 'phone fallback movement indicators in bounds');
    if(name==='convex')assert(await evaluate(`{const r=document.querySelector('.stage-wrap .screen-preview').getBoundingClientRect();r.height>0&&r.bottom<=innerHeight&&r.right<=innerWidth}`), 'phone fallback contains the preview');
    await click('#fullscreen');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await key('End'); assert.equal(await evaluate(`${name}.getState().auto`), false);
    await send('Emulation.setEmulatedMedia', { features: [] });
    assert.deepEqual(errors, [], `${name}: browser console errors`);
    console.log(`PASS ${name}: physics, controls, animation, drag, keyboard, fullscreen, mobile and reduced motion`);
  }
  // Liquid-pressure cases use their own ranges, equations and vertical mechanism.
  activeExperiment = 'liquidPressure';
  errors.length = 0;
  await send('Emulation.setDeviceMetricsOverride', {width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate', {url:pathToFileURL(resolve(root,'secondary','liquid-pressure','index.html')).href});
  await wait(500);
  assert(await evaluate('Boolean(window.liquidPressure)'));
  assert(await evaluate('liquidPressure.getState().h===.1 && liquidPressure.getState().rho===1000 && liquidPressure.getState().p===981'));
  assert(await evaluate(`[0,.1,.3,.6].every(h=>[800,1000,1260].every(rho=>{const s=liquidPressure.model(h,rho);return Math.abs(s.p-rho*9.81*h)<1e-8&&Math.abs(s.p-1000*9.81*s.delta)<1e-8}))`));
  assert(await evaluate(`document.querySelector('aside').firstElementChild.matches('.formula-card')`));
  assert(await evaluate(`[...document.querySelectorAll('.move-hint')].every(el=>getComputedStyle(el).display==='none')`));
  for(const [width,height] of [[1366,768],[1440,900]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await wait(80);
    assert(await evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth'),'liquid pressure overview fits');
    assert(await evaluate(`{const a=document.querySelector('#stage').getBoundingClientRect(),b=document.querySelector('#stage>svg').getBoundingClientRect();b.top>=a.top-1&&b.bottom<=a.bottom+1}`));
    await screenshot(`liquid-pressure-${width}`);
  }
  await click('#compare');assert(await evaluate('liquidPressure.getState().h===.5 && liquidPressure.getState().rho===1000'));
  await input('#depth',.6);assert.equal(await evaluate('liquidPressure.getState().p'),5886);
  await click('#density-mode');await click('#compare');
  assert(await evaluate('liquidPressure.getState().h===.6 && liquidPressure.getState().rho===1260 && Math.abs(liquidPressure.getState().delta-.756)<1e-10'));
  assert(await evaluate(`document.querySelector('#depth').disabled && !document.querySelector('#density').disabled`));
  const pressure=await evaluate('liquidPressure.getState().p');
  await input('#angle',180);assert.equal(await evaluate('liquidPressure.getState().p'),pressure);
  assert.equal(await evaluate(`document.querySelector('#orientation-part').getAttribute('transform')`),'rotate(180 248 0)');
  assert.equal(await evaluate(`document.querySelector('#pressure').textContent.trim()`),'7.42 kPa');
  assert.equal(await evaluate(`document.querySelector('#difference').textContent.trim()`),'75.6 cm');
  await screenshot('liquid-pressure-dense');
  // Both menisci conserve volume and their drawn difference matches the physical model.
  assert(await evaluate(`{const d=document.querySelector('#indicator-liquid').getAttribute('d');const a=+d.match(/^M510 ([\\d.]+)/)[1],b=+d.match(/V([\\d.]+)$/)[1];Math.abs(a+b-450)<1e-8&&Math.abs(a-b-liquidPressure.getState().delta*200)<1e-8}`));
  await click('#reset');await key('Home');assert.equal(await evaluate('liquidPressure.getState().p'),0);
  assert.equal(await evaluate(`document.querySelector('#pressure-arrows').childElementCount`),0);
  await key('End');assert.equal(await evaluate('liquidPressure.getState().h'),.6);
  await click('#reset');
  await click('#tour');await wait(300);assert(await evaluate('liquidPressure.getState().auto && liquidPressure.getState().h>.1 && liquidPressure.getState().rho===1000'));
  await click('#tour');assert.equal(await evaluate('liquidPressure.getState().auto'),false);
  await click('#density-mode');const fixedDepth=await evaluate('liquidPressure.getState().h');
  await click('#tour');await wait(300);assert(await evaluate(`liquidPressure.getState().h===${fixedDepth} && liquidPressure.getState().rho>1000`));await click('#tour');
  await click('#reset');
  const dragPressure = async (selector,dx,dy)=>{
    const b=await evaluate(`{const r=document.querySelector('${selector}').getBoundingClientRect();({x:r.x+r.width/2,y:r.y+r.height/2})}`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:b.x,y:b.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:b.x+dx,y:b.y+dy,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:b.x+dx,y:b.y+dy,button:'left',clickCount:1});
  };
  await dragPressure('#probe',0,30);assert(await evaluate('liquidPressure.getState().h>.1'));
  await dragPressure('#rotation-handle',30,0);assert(await evaluate('liquidPressure.getState().angle>0'));
  await click('#reset');await screenshot('liquid-pressure-desktop');
  await click('#fullscreen');await wait(200);
  assert(await evaluate(`document.fullscreenElement===document.querySelector('.stage-wrap')`));
  assert(await evaluate(`document.querySelector('#reset').inert && getComputedStyle(document.querySelector('.stage-note')).display==='none'`));
  const before=await evaluate('liquidPressure.getState().h');
  await dragPressure('[data-move="depth"]',0,30);assert(await evaluate(`liquidPressure.getState().h>${before}`));
  await key('ArrowRight','[data-move="angle"]');assert.equal(await evaluate('liquidPressure.getState().angle'),5);
  await key('End','[data-move="angle"]');assert.equal(await evaluate('liquidPressure.getState().angle'),360);
  await key('Home','[data-move="angle"]');await screenshot('liquid-pressure-fullscreen');
  // Close-up of the membrane, rotary grip, rail and hose coupling.
  const clip=await evaluate(`{const r=document.querySelector('#probe').getBoundingClientRect();({x:r.x-15,y:r.y-15,width:r.width+30,height:r.height+30,scale:4})}`);
  const close=await send('Page.captureScreenshot',{format:'png',clip});writeFileSync(join(artifacts,'liquid-pressure-mechanism.png'),Buffer.from(close.data,'base64'));
  await click('#fullscreen');assert.equal(await evaluate('document.activeElement.id'),'fullscreen');
  assert(await evaluate(`[...document.querySelectorAll('.move-hint')].every(el=>getComputedStyle(el).display==='none')`));
  await evaluate(`document.querySelector('.stage-wrap').requestFullscreen=undefined`);
  await click('#fullscreen');assert(await evaluate(`document.querySelector('.stage-wrap').classList.contains('is-fullscreen')`));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});
  assert(await evaluate(`!document.querySelector('.stage-wrap').classList.contains('is-fullscreen') && document.activeElement.id==='fullscreen'`));
  for(const width of [390,320]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await click('#reset');
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
    await screenshot(`liquid-pressure-phone-${width}`);await click('#fullscreen');await wait(100);
    assert(await evaluate(`[...document.querySelectorAll('.move-hint')].every(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})`));
    await screenshot(`liquid-pressure-phone-fullscreen-${width}`);await click('#fullscreen');
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await key('End');assert(await evaluate(`liquidPressure.getState().h===.6 && !liquidPressure.getState().auto && document.querySelector('#tour').disabled`));
  await click('#reset');assert(await evaluate('liquidPressure.getState().h===.1 && liquidPressure.getState().rho===1000 && liquidPressure.getState().angle===0 && liquidPressure.getState().mode==="depth"'));
  await send('Emulation.setEmulatedMedia',{features:[]});assert.deepEqual(errors,[]);
  console.log('PASS liquid pressure: physics, controlled comparisons, isotropy, manometer, drag, keyboard, animation, layouts and fullscreen');
  // Free fall: physical time is independent of playback speed and ball mass.
  {
  activeExperiment='freeFall'; errors.length=0;
  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:pathToFileURL(resolve(root,'secondary','free-fall','index.html')).href});await wait(400);
  assert(await evaluate('Boolean(window.freeFall)'));
  assert(await evaluate('freeFall.getState().height===1.5 && freeFall.getState().t===0 && freeFall.getState().mass===100 && freeFall.getState().phase==="held" && freeFall.getState().g===null'));
  assert(await evaluate(`[.25,.5,1.5,2].every(H=>[50,100,250].every(m=>{const a=freeFall.model(H,0,m),b=freeFall.model(H,1e3,m),c=freeFall.model(H,a.duration/2,m);return a.h===0&&a.v===0&&a.g===null&&Math.abs(b.h-H)<1e-12&&Math.abs(a.duration**2-2*H/9.81)<1e-12&&Math.abs(c.h-H/4)<1e-12&&Math.abs(c.v-9.81*c.t)<1e-12&&Math.abs(c.g-9.81)<1e-12&&a.duration===freeFall.model(H,0,100).duration}))`),'free-fall equations and mass independence');
  assert(await evaluate(`document.querySelector('aside').firstElementChild.matches('.formula-card') && [...document.querySelectorAll('.move-hint')].every(el=>getComputedStyle(el).display==='none')`));
  for(const [width,height] of [[1366,768],[1440,900]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await wait(80);
    assert(await evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth'),`free fall overview fits ${width}×${height}`);
    assert(await evaluate(`{const a=document.querySelector('#stage').getBoundingClientRect(),b=document.querySelector('#stage>svg').getBoundingClientRect();b.top>=a.top-1&&b.bottom<=a.bottom+1}`));
    assert(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.control-title label')).fontSize)>=14`));
    await screenshot(`free-fall-${width}`);
  }
  await input('#height',2);await input('#mass',250);
  assert(await evaluate('freeFall.getState().height===2 && freeFall.getState().t===0 && freeFall.getState().mass===250'));
  await click('#release');
  assert(await evaluate('freeFall.getState().t===0 && freeFall.getState().phase==="falling" && document.querySelector("#timer-digits").textContent==="0.000"'),'release starts at zero');
  await wait(450);assert(await evaluate('freeFall.getState().t>0 && freeFall.getState().t<.2'),'quarter-speed physical clock');
  await click('#release');const frozen=await evaluate('freeFall.getState().t');await wait(150);
  assert.equal(await evaluate('freeFall.getState().t'),frozen,'pause freezes ball and timer');
  await input('#time',.5);
  assert(await evaluate('Math.abs(freeFall.getState().h-1.22625)<1e-10 && Math.abs(freeFall.getState().v-4.905)<1e-10'));
  assert.equal(await evaluate(`document.querySelector('#timer-digits').textContent`),'0.500');
  assert(await evaluate(`{const a=[...document.querySelectorAll('[data-sample]')];const ys=a.map(e=>+e.getAttribute('cy'));a.length===6&&a.every((e,i)=>Math.abs(+e.dataset.sample-i*.1)<1e-9)&&ys.slice(2).every((y,i)=>y-ys[i+1]>ys[i+1]-ys[i])}`),'equal-time markers spread increasingly far apart');
  assert(await evaluate(`Math.abs(+document.querySelector('#graph-point').getAttribute('cx')-(48+.25/.45*340))<1e-8`),'graph uses squared physical time');
  await screenshot('free-fall-in-motion');
  await click('#reset');await click('#release');await wait(2500);
  assert(await evaluate('freeFall.getState().phase==="landed" && freeFall.getState().h===1.5 && freeFall.getState().trials.length===1 && !freeFall.getState().running'));
  const stopped=await evaluate('freeFall.getState().t');await wait(120);assert.equal(await evaluate('freeFall.getState().t'),stopped,'detector stops clock');
  assert.equal(await evaluate(`document.querySelector('#timer-phase').textContent`),'STOPPED');
  await screenshot('free-fall-detected');
  // Record the same geometry drawn by the page, including extreme and intermediate poses.
  const geometry=await evaluate(`{const poses=[];for(const H of [.25,1.5,2])for(const m of [50,100,250])for(const f of [0,.5,1]){freeFall.setHeight(H);freeFall.setMass(m);freeFall.setTime(f*freeFall.model(H).duration);const b=document.querySelector('#apparatus').getBBox();if(b.x<0||b.y<0||b.x+b.width>760||b.y+b.height>430)throw Error('Apparatus leaves stage');poses.push({H,m,f,magnetZ:freeFall.geometry.magnetZ(),ball:freeFall.geometry.ballPoint(),radius:freeFall.geometry.radius()});}({P:freeFall.geometry.P,solids:freeFall.geometry.solids,poses})}`);
  writeFileSync(join(artifacts,'free-fall-geometry.json'),JSON.stringify(geometry));
  await click('#reset');await key('Home');assert.equal(await evaluate('freeFall.getState().height'),.25);
  await key('End');assert.equal(await evaluate('freeFall.getState().height'),2);
  const dragFall=async(selector,dx,dy)=>{
    const b=await evaluate(`{const r=document.querySelector('${selector}').getBoundingClientRect();({x:r.x+r.width/2,y:r.y+r.height/2})}`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:b.x,y:b.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:b.x+dx,y:b.y+dy,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:b.x+dx,y:b.y+dy,button:'left',clickCount:1});
  };
  await dragFall('#magnet',0,30);assert(await evaluate('freeFall.getState().height<2 && freeFall.getState().t===0'));
  await dragFall('#ball',0,40);assert(await evaluate('freeFall.getState().t>0 && freeFall.getState().phase==="paused"'));
  await click('#reset');await dragFall('#ball',0,0);assert(await evaluate('freeFall.getState().running'),'tapping ball releases it');
  await key('Enter');assert.equal(await evaluate('freeFall.getState().running'),false,'Enter pauses the fall');
  await click('#reset');await click('#tour');await wait(300);assert(await evaluate('freeFall.getState().auto && freeFall.getState().t>0 && freeFall.getState().mass===100'));
  // Hidden documents must not accumulate physical time, including on resumption.
  await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));`);
  const hiddenT=await evaluate('freeFall.getState().t');await wait(250);assert.equal(await evaluate('freeFall.getState().t'),hiddenT);
  await evaluate(`delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));`);await wait(100);
  assert(await evaluate(`freeFall.getState().t>${hiddenT} && freeFall.getState().t<${hiddenT+.1}`));
  await evaluate(`document.querySelector('#stage').style.transform='translateY(-2000px)'`);await wait(100);
  const offscreenT=await evaluate('freeFall.getState().t');await wait(200);assert.equal(await evaluate('freeFall.getState().t'),offscreenT,'offscreen apparatus pauses');
  await evaluate(`document.querySelector('#stage').style.transform=''`);await wait(100);assert(await evaluate(`freeFall.getState().t>${offscreenT}`));
  await click('#tour');assert.equal(await evaluate('freeFall.getState().auto'),false);
  await click('#reset');await screenshot('free-fall-desktop');await click('#fullscreen');await wait(150);
  assert(await evaluate(`document.fullscreenElement===document.querySelector('.stage-wrap') && document.querySelector('#reset').inert`));
  assert(await evaluate(`getComputedStyle(document.querySelector('.stage-note')).display==='none' && [...document.querySelectorAll('.move-hint')].every(el=>getComputedStyle(el).display!=='none')`));
  const labelY=await evaluate(`document.querySelector('[data-move="height"]').getBoundingClientRect().y`);
  await dragFall('[data-move="height"]',0,25);assert(await evaluate('freeFall.getState().height<1.5'));
  assert(await evaluate(`document.querySelector('[data-move="height"]').getBoundingClientRect().y>${labelY}`),'height label follows carriage');
  await key('Enter','[data-move="time"]');await wait(100);assert(await evaluate('freeFall.getState().running && freeFall.getState().t>0'),'fullscreen can release the ball');
  await key('Enter','[data-move="time"]');assert.equal(await evaluate('freeFall.getState().running'),false);
  await key('End','[data-move="time"]');assert(await evaluate('freeFall.getState().phase==="landed"'));
  await key('Home','[data-move="time"]');await key('ArrowRight','[data-move="time"]');assert.equal(await evaluate('freeFall.getState().t'),.01);
  await dragFall('[data-move="time"]',0,35);assert(await evaluate('freeFall.getState().t>.01'));
  await screenshot('free-fall-fullscreen');
  const mechanism=await evaluate(`{const r=document.querySelector('#magnet').getBoundingClientRect();({x:r.x-10,y:r.y-10,width:r.width+20,height:r.height+45,scale:4})}`);
  const close=await send('Page.captureScreenshot',{format:'png',clip:mechanism});writeFileSync(join(artifacts,'free-fall-mechanism.png'),Buffer.from(close.data,'base64'));
  await click('#fullscreen');await wait(150);assert.equal(await evaluate('document.activeElement.id'),'fullscreen');
  await evaluate(`document.querySelector('.stage-wrap').requestFullscreen=undefined`);await click('#fullscreen');
  assert(await evaluate(`document.querySelector('.stage-wrap').classList.contains('is-fullscreen')`));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});assert(await evaluate(`!document.querySelector('.stage-wrap').classList.contains('is-fullscreen') && document.activeElement.id==='fullscreen'`));
  for(const width of [390,320]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await click('#reset');
    await wait(100);
    assert(await evaluate(`document.querySelector('#stage>svg').getAttribute('viewBox')==='175 10 415 420'`),'phone uses the closer apparatus framing');
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));await screenshot(`free-fall-phone-${width}`);
    await click('#fullscreen');await wait(100);
    assert(await evaluate(`[...document.querySelectorAll('.move-hint')].every(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})`));
    await screenshot(`free-fall-phone-fullscreen-${width}`);await click('#fullscreen');
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await click('#reset');await click('#release');assert(await evaluate('freeFall.getState().t===0 && !freeFall.getState().running && document.querySelector("#tour").disabled'));
  await click('#release');assert.equal(await evaluate('freeFall.getState().t'),.1);
  await click('#reset');assert(await evaluate('freeFall.getState().height===1.5 && freeFall.getState().mass===100 && freeFall.getState().t===0 && freeFall.getState().trials.length===0 && document.querySelectorAll("#markers circle").length===0'));
  assert(await evaluate(`[...document.querySelectorAll('.move-hint')].every(el=>getComputedStyle(el).display==='none')`));
  await send('Emulation.setEmulatedMedia',{features:[]});assert.deepEqual(errors,[]);
  console.log('PASS free fall: uniform acceleration, mass independence, release clock, equal-time markers, detector, graph, controls, pause, fullscreen and responsive layouts');
  }
  // Latent heat: only a phase change, with no pre-completion temperature rise.
  activeExperiment = 'latentHeat'; errors.length = 0;
  await send('Emulation.setDeviceMetricsOverride', {width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:pathToFileURL(resolve(root,'secondary','latent-heat','index.html')).href});
  await wait(350);
  assert(await evaluate('Boolean(window.latentHeat)'));
  assert(await evaluate(`document.querySelector('aside').firstElementChild.classList.contains('formula-card')`));
  assert(await evaluate(`getComputedStyle(document.querySelector('.move-hint')).display==='none'`));
  assert(await evaluate(`document.querySelectorAll('.page-intro h1').length===1 && document.querySelectorAll('nav:not(.page-tools),footer,.quiz,.notebook').length===0`));
  assert(await evaluate(`[50,100,200].every(mass=>[0,.01,.25,.5,.999,1].every(f=>{
    const m=latentHeat.model(mass/1000*334000*f,mass);
    return m.temperature===0 && Math.abs(m.melted-mass*f)<1e-9 && Math.abs(m.melted+m.remaining-mass)<1e-9 && Math.abs(m.q-m.melted/1000*334000)<1e-8;
  }))`));
  assert(await evaluate('latentHeat.model(-100).q===0 && latentHeat.model(1e9).melted===100 && latentHeat.model(1e9).temperature===0'));
  for(const [width,height] of [[1366,768],[1440,900]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await wait(80);
    assert(await evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth'),`latent heat overview fits ${width}×${height}`);
    assert(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.control-title label')).fontSize)>=14`));
    assert(await evaluate(`{const r=document.querySelector('#stage').getBoundingClientRect(),s=document.querySelector('#stage>svg').getBoundingClientRect();s.top>=r.top-1&&s.bottom<=r.bottom+1}`));
    await screenshot(`latent-heat-${width===1366?'laptop':'desktop'}`);
  }
  await input('#energy',16700);
  assert(await evaluate(`latentHeat.getState().q===16700 && document.querySelector('#melted').textContent.includes('50.0') && document.querySelector('#scale-reading').textContent==='50.0 g' && document.querySelector('#graph-point').getAttribute('cy')==='115'`));
  await screenshot('latent-heat-half-melted');
  await send('Page.captureScreenshot',{format:'png',clip:{x:30,y:160,width:800,height:300,scale:3}}).then(({data})=>writeFileSync(join(artifacts,'latent-heat-mechanism-closeup.png'),Buffer.from(data,'base64')));
  await input('#mass',200);assert.equal(await evaluate('latentHeat.getState().q'),0);
  assert.equal(await evaluate(`Number(document.querySelector('#energy').max)`),66800);
  await input('#energy',66800);assert(await evaluate(`document.querySelector('#heater').disabled && document.querySelector('[data-readout]').textContent.includes('0.0°C')`));
  assert(await evaluate(`[...document.querySelectorAll('[data-ice]')].every(el=>getComputedStyle(el).visibility==='hidden')`));
  await screenshot('latent-heat-all-melted');
  await click('#reset');await click('#heater');await wait(300);
  assert(await evaluate('latentHeat.getState().q>500 && latentHeat.getState().q<3000 && latentHeat.getState().running'));
  await click('#heater');const pausedQ=await evaluate('latentHeat.getState().q');await wait(120);
  assert.equal(await evaluate('latentHeat.getState().q'),pausedQ);
  await input('#energy',33390);await click('#heater');await wait(120);
  assert(await evaluate('latentHeat.getState().q===33400 && !latentHeat.getState().running'));
  await click('#reset');await click('#tour');await wait(180);
  assert(await evaluate('latentHeat.getState().auto && latentHeat.getState().q>0'));
  await click('#tour');assert(await evaluate('!latentHeat.getState().auto && !latentHeat.getState().running'));
  await key('Home');assert.equal(await evaluate('latentHeat.getState().power'),100);
  await key('End');assert.equal(await evaluate('latentHeat.getState().power'),1000);
  const dragLatent = async(selector,dx)=>{
    const b=await evaluate(`{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();({x:r.x+r.width/2,y:r.y+r.height/2})}`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...b,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:b.x+dx,y:b.y,buttons:1,button:'left'});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:b.x+dx,y:b.y,button:'left',clickCount:1});
  };
  await dragLatent('#power-dial',-55);assert(await evaluate('latentHeat.getState().power<1000'));
  assert(await evaluate('getSelection().isCollapsed'));
  await click('#reset');await click('#fullscreen');await wait(120);
  assert(await evaluate(`document.fullscreenElement===document.querySelector('.stage-wrap') && document.querySelector('#reset').inert`));
  assert(await evaluate(`getComputedStyle(document.querySelector('.stage-caption > span:first-child')).display==='none'`));
  assert(await evaluate(`getComputedStyle(document.querySelector('.move-hint')).display!=='none'`));
  await dragLatent('.move-hint',55);assert(await evaluate('latentHeat.getState().power>500'));
  await key('Home','.move-hint');await key('ArrowRight','.move-hint');assert.equal(await evaluate('latentHeat.getState().power'),110);
  await key('End','.move-hint');assert.equal(await evaluate('latentHeat.getState().power'),1000);
  await screenshot('latent-heat-fullscreen');
  await click('#fullscreen');await wait(100);assert.equal(await evaluate('document.activeElement.id'),'fullscreen');
  assert(await evaluate(`!document.querySelector('#reset').inert && getComputedStyle(document.querySelector('.move-hint')).display==='none'`));
  await evaluate(`document.querySelector('.stage-wrap').requestFullscreen=undefined`);
  for(const width of [320,390]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
    await click('#reset');await wait(80);
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`latent heat phone ${width}`);
    await screenshot(`latent-heat-phone-${width}`);await click('#fullscreen');await wait(100);
    assert(await evaluate(`document.querySelector('.stage-wrap').classList.contains('is-fullscreen')`));
    assert(await evaluate(`{const r=document.querySelector('.move-hint').getBoundingClientRect();r.width>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}`));
    await key('ArrowRight','.move-hint');assert.equal(await evaluate('latentHeat.getState().power'),510);
    await screenshot(`latent-heat-phone-fullscreen-${width}`);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});await wait(50);
    assert.equal(await evaluate('document.activeElement.id'),'fullscreen');
    assert(await evaluate(`!document.querySelector('.stage-wrap').classList.contains('is-fullscreen')`));
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await wait(80);await evaluate('scrollTo(0,0)');await wait(80);
  await click('#reset');await click('#heater');await wait(250);
  assert(await evaluate('latentHeat.getState().q>0'),'reduced motion still allows explicitly started heating');
  const arrow=await evaluate(`document.querySelector('#heat-arrows').getAttribute('transform')`);
  await wait(120);assert.equal(await evaluate(`document.querySelector('#heat-arrows').getAttribute('transform')`),arrow);
  await evaluate('scrollTo(0,document.documentElement.scrollHeight)');await wait(100);
  const offscreenQ=await evaluate('latentHeat.getState().q');await wait(150);
  assert.equal(await evaluate('latentHeat.getState().q'),offscreenQ,'offscreen model pauses heat input');
  await evaluate('scrollTo(0,0)');await wait(200);
  assert(await evaluate(`latentHeat.getState().q>${offscreenQ}`),'visible model resumes without catching up');
  await click('#heater');await click('#reset');
  assert(await evaluate(`latentHeat.getState().q===0 && latentHeat.getState().power===500 && latentHeat.getState().mass===100 && document.querySelector('#graph-point').getAttribute('cx')==='65'`));
  await send('Emulation.setEmulatedMedia',{features:[]});assert.deepEqual(errors,[]);
  console.log('PASS latent heat: constant-temperature melting, energy conservation, controls, cutoff, drag, keyboard, native/fallback fullscreen and responsive layouts');

  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});

  }
  if (!process.env.BRIDGES_ONLY) {
  activeExperiment = 'tower';
  await checkTower({send,evaluate,click,key,wait,screenshot,url:pathToFileURL(resolve(root,'primary/tower/index.html')).href,assert});
  }
  activeExperiment = 'bridges';
  await checkBridges({send,evaluate,click,key,wait,screenshot,url:pathToFileURL(resolve(root,'primary/bridges/index.html')).href,assert});
  assert.deepEqual(errors,[]);
} finally {
  socket?.close();
  const stopped = new Promise(done => chrome.once('exit', done));
  chrome.kill(); await stopped;
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
