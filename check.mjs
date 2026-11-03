import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
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
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(artifacts, `${name}.png`), Buffer.from(data, 'base64'));
  };
  const key = async value => {
    await evaluate(`document.querySelector('#stage').focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: value });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: value });
    await settle();
  };
  await send('Runtime.enable'); await send('Page.enable');
  for (const name of ['boyle', 'convex', 'ohm']) {
    activeExperiment = name;
    errors.length = 0;
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: pathToFileURL(resolve(root, name, 'index.html')).href });
    await wait(500);
    assert(await evaluate(`Boolean(window.${name})`), `${name}: application initialized`);
    assert.equal(await evaluate(`document.querySelectorAll('nav,footer,.quiz,.notebook,.intro,.investigation').length`), 0);
    assert.equal(await evaluate(`document.querySelectorAll('.page-intro h1').length`), 1);
    assert(await evaluate(`Boolean(document.querySelector('.page-intro p').textContent.trim())`));
    assert.equal(await evaluate(`document.querySelectorAll('.formula-card').length`), 1);
    assert(await evaluate(`document.querySelector('aside').firstElementChild.classList.contains('formula-card')`));
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
    const box = await evaluate(`{const r=document.querySelector('#stage').getBoundingClientRect();({x:r.x+r.width*.6,y:r.y+r.height*.5,width:r.width})}`);
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
    await key('Home'); await screenshot(`${name}-fullscreen`);
    await click('#fullscreen'); await wait(150);
    assert(await evaluate(`document.fullscreenElement===null && !document.querySelector('#reset').inert`));
    assert.equal(await evaluate('document.activeElement.id'), 'fullscreen');
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
    await click('#fullscreen');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await key('End'); assert.equal(await evaluate(`${name}.getState().auto`), false);
    await send('Emulation.setEmulatedMedia', { features: [] });
    assert.deepEqual(errors, [], `${name}: browser console errors`);
    console.log(`PASS ${name}: physics, controls, animation, drag, keyboard, fullscreen, mobile and reduced motion`);
  }
} finally {
  socket?.close();
  const stopped = new Promise(done => chrome.once('exit', done));
  chrome.kill(); await stopped;
  rmSync(profile, { recursive: true, force: true });
}
