import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Reuse the actual apparatus geometry; previews never run six simulations.
const root = new URL('.', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
// Previews need the SVG renderer and palette, not the experiment page layouts.
const shared = read('shared.css');
const svgStyles = shared.slice(0, shared.indexOf(':root')) + shared.match(/:root \{[\s\S]*?\n\}/)[0];
const experiments = [
  ['boyle', 'Boyle’s law', 'Gases', 'Compress a sealed gas and compare pressure with volume.', 'PV = constant'],
  ['convex', 'Convex lens', 'Optics', 'Move the object and screen to bring an image into focus.', '1/f = 1/u + 1/v'],
  ['ohm', 'Ohm’s law', 'Electricity', 'Vary the voltage and see how current responds.', 'V = IR'],
  ['latent-heat', 'Latent heat of fusion', 'Thermal physics', 'Supply energy to melting ice while its temperature stays fixed.', 'Q = mL<sub>f</sub>'],
  ['liquid-pressure', 'Liquid pressure', 'Fluids', 'Lower a probe and discover how pressure changes with depth.', 'P = ρgh'],
  ['free-fall', 'Free fall', 'Mechanics', 'Release a ball and measure its uniformly accelerated fall.', 'h = ½gt²'],
];
mkdirSync(new URL('assets/catalog/', root), { recursive: true });
// Some experiments construct their geometry at startup. Serialize the initialized
// SVG with the same dependency-free Chrome protocol used by check.mjs.
const chromePath = process.env.CHROME_PATH || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chromePath) throw Error('Install Chrome/Chromium or set CHROME_PATH to refresh previews.');
const profile = mkdtempSync(join(tmpdir(), 'science-index-'));
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank']);
const previews = new Map();
let socket;
try {
  const port = await new Promise((done, fail) => {
    const timeout = setTimeout(() => fail(Error('Chrome startup timed out')), 15000);
    chrome.once('error', fail);
    let output = '';
    chrome.stderr.on('data', data => {
      output += data;
      const match = output.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (match) { clearTimeout(timeout); done(match[1]); }
    });
  });
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, fail) => { socket.onopen = done; socket.onerror = fail; });
  let sequence = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data), job = pending.get(message.id);
    if (job) { pending.delete(message.id); clearTimeout(job.timer); message.error ? job.fail(Error(message.error.message)) : job.done(message.result); }
  };
  const send = (method, params) => new Promise((done, fail) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); fail(Error(`${method} timed out`)); }, 15000);
    pending.set(id, {done, fail, timer}); socket.send(JSON.stringify({id, method, params}));
  });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const [folder] of experiments) {
    await send('Page.navigate', { url: new URL(`${folder}/index.html`, root).href });
    const result = await send('Runtime.evaluate', {
      expression: `new Promise((done,fail)=>{const start=Date.now();const check=()=>{const svg=document.querySelector('#stage svg');if(document.readyState==='complete'&&svg?.querySelectorAll('path').length>20)done(new XMLSerializer().serializeToString(svg));else if(Date.now()-start>8000)fail(Error('Apparatus did not initialize'));else setTimeout(check,30)};check()})`,
      awaitPromise: true, returnByValue: true,
    });
    if (result.exceptionDetails || !result.result.value) throw Error(`${folder}: preview capture failed`);
    previews.set(folder, result.result.value);
  }
} finally {
  socket?.close(); chrome.kill();
  await new Promise(done => chrome.exitCode === null ? chrome.once('exit', done) : done());
  rmSync(profile, { recursive: true, force: true });
}
const cards = experiments.map(([folder, title, topic, description, formula], index) => {
  let svg = previews.get(folder);
  const viewbox = svg.match(/data-overview-viewbox="([^"]+)"/)?.[1];
  if (viewbox) svg = svg.replace(/ viewBox="[^"]+"/, ` viewBox="${viewbox}"`);
  svg = svg.replace('<svg ', '<svg id="stage" ');
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  const styles = (svgStyles + read(`${folder}/style.css`)).replaceAll('#stage svg', '#stage');
  svg = svg.replace(/(<svg\b[^>]*>)/, `$1<style>${styles}\n:root{background:transparent}#stage{width:100%;height:100%;overflow:hidden;aspect-ratio:auto;background:transparent}*{animation:none!important}</style>`);
  writeFileSync(new URL(`assets/catalog/${folder}.svg`, root), svg);
  return `<a class="experiment-card" href="${folder}/index.html" aria-labelledby="title-${folder}">
  <div class="card-label"><span>${String(index + 1).padStart(2, '0')} / ${topic}</span><span aria-hidden="true">↗</span></div>
  <div class="apparatus"><img src="assets/catalog/${folder}.svg" alt="" width="680" height="300"></div>
  <div class="card-copy"><h2 id="title-${folder}">${title}</h2><p>${description}</p></div>
  <div class="card-foot"><span class="equation">${formula}</span><span class="open">Open experiment <span aria-hidden="true">→</span></span></div>
</a>`;
}).join('\n');
writeFileSync(new URL('index.html', root), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Interactive Form 4 &amp; 5 Physics experiments. Explore gases, optics, electricity, heat, fluids and motion with hands-on apparatus.">
<title>Science Concepts · Form 4 &amp; 5 Physics</title>
<link rel="icon" type="image/png" href="assets/science-concepts-icon.png">
<link rel="apple-touch-icon" href="assets/science-concepts-icon.png">
<link rel="stylesheet" href="shared.css">
<link rel="stylesheet" href="index.css">
</head>
<body>
<main class="catalog">
<header class="catalog-header"><div><div class="brand-heading"><img class="site-icon" src="assets/science-concepts-icon.png" alt="" width="56" height="56"><div><span class="eyebrow">FORM 4 &amp; 5 PHYSICS</span><h1>Science Concepts<span aria-hidden="true">.</span></h1></div></div><p>Choose an experiment. Move the apparatus. See the relationship.</p></div><span class="catalog-count">${String(experiments.length).padStart(2, '0')} EXPERIMENTS <span aria-hidden="true">/</span> INTERACTIVE MODELS</span></header>
<nav class="experiment-grid" aria-label="All experiments">
${cards}
</nav>
<footer><span>Small experiments. Observable physics.</span><span>Drag · Measure · Explore</span></footer>
</main>
</body>
</html>
`);
console.log(`Built index and ${experiments.length} apparatus previews.`);
