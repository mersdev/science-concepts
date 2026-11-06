import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Capture actual apparatus geometry once; catalogues never run simulations.
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
const primaryExperiments = [['tower', 'Build a More Stable Tower', 'Stability and strength', 'Year 6: change height and base, then test for tipping.', 'Wider + lower = steadier'], ['bridges', 'Why Triangles Make Structures Stronger', 'Stability and strength', 'Year 6: compare a frame, triangular truss and arch under load.', 'Deflection = load ÷ stiffness'], ['seesaw', 'Balancing a Seesaw', 'Loads and fulcrums', 'Move two riders and change their masses to discover balance.', 'Mass × distance must match'], ['gears', 'How Gears Transfer Motion', 'Simple machines', 'Turn meshing gears and compare their direction and speed.', 'N₁θ₁ + N₂θ₂ = 0'], ['door-handle', 'Inside a Door Handle: Wheel and Axle', 'Simple machines', 'Turn a knob and reveal the spindle and sliding latch inside.', 'Knob turn = axle turn'], ['wedge', 'How a Wedge Splits Materials', 'Simple machines', 'Push a virtual blade and see how its sloping faces separate a sample.', 'Push down → split apart'], ['inclined-plane', 'Moving Loads with an Inclined Plane', 'Simple machines', 'Compare two ramps: less force, more distance, the same rise.', 'Longer ramp, less force'], ['screw', 'How Screws Turn Rotation into Movement', 'Simple machines', 'Turn a screw into wood and follow its helical thread forward.', 'Travel = turns × pitch']];
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
  for (const [series,lessons] of [['secondary',experiments],['primary',primaryExperiments]]) for (const [folder] of lessons) {
    await send('Page.navigate', { url: new URL(`${series}/${folder}/index.html`, root).href });
    const result = await send('Runtime.evaluate', {
      expression: `new Promise((done,fail)=>{const start=Date.now();const check=()=>{const svg=document.querySelector('#stage svg');if(document.readyState==='complete'&&svg?.querySelectorAll('path,polygon').length>20)done(new XMLSerializer().serializeToString(svg));else if(Date.now()-start>8000)fail(Error('Apparatus did not initialize'));else setTimeout(check,30)};check()})`,
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
function cardsFor(series,lessons){return lessons.map(([folder, title, topic, description, formula], index) => {
  let svg = previews.get(folder);
  const viewbox = svg.match(/data-overview-viewbox="([^"]+)"/)?.[1];
  if (viewbox) svg = svg.replace(/ viewBox="[^"]+"/, ` viewBox="${viewbox}"`);
  svg = svg.replace('<svg ', '<svg id="stage" ');
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  const styles = (svgStyles + read(`${series}/${folder}/style.css`)).replaceAll('#stage svg', '#stage');
  svg = svg.replace(/(<svg\b[^>]*>)/, `$1<style>${styles}\n:root{background:transparent}#stage{width:100%;height:100%;overflow:hidden;aspect-ratio:auto;background:transparent}*{animation:none!important}</style>`);
  writeFileSync(new URL(`assets/catalog/${folder}.svg`, root), svg);
  return `<a class="experiment-card" href="${folder}/index.html" aria-labelledby="title-${folder}">
  <div class="card-label"><span>${String(index + 1).padStart(2, '0')} / ${topic}</span><span aria-hidden="true">↗</span></div>
  <div class="apparatus"><img src="../assets/catalog/${folder}.svg" alt="" width="680" height="300"></div>
  <div class="card-copy"><h2 id="title-${folder}">${title}</h2><p>${description}</p></div>
  <div class="card-foot"><span class="equation">${formula}</span><span class="open">Open experiment <span aria-hidden="true">→</span></span></div>
</a>`;
}).join('\n');}
const cards = cardsFor('secondary',experiments);
writeFileSync(new URL('secondary/index.html', root), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Interactive Form 4 &amp; 5 Physics experiments. Explore gases, optics, electricity, heat, fluids and motion with hands-on apparatus.">
<title>Science Concepts · Form 4 &amp; 5 Physics</title>
<link rel="icon" type="image/png" href="../assets/science-concepts-icon.png">
<link rel="apple-touch-icon" href="../assets/science-concepts-icon.png">
<link rel="stylesheet" href="../shared.css">
<link rel="stylesheet" href="../index.css">
</head>
<body>
<main class="catalog">
<header class="catalog-header"><div><div class="brand-heading"><img class="site-icon" src="../assets/science-concepts-icon.png" alt="" width="56" height="56"><div><span class="eyebrow">FORM 4 &amp; 5 PHYSICS</span><h1>Science Concepts<span aria-hidden="true">.</span></h1></div></div><p>Choose an experiment. Move the apparatus. See the relationship.</p></div><span class="catalog-count">${String(experiments.length).padStart(2, '0')} EXPERIMENTS <span aria-hidden="true">/</span> INTERACTIVE MODELS</span></header>
<nav class="experiment-grid" aria-label="All experiments">
${cards}
</nav>
<footer><a href="../index.html">← Choose Primary or Secondary</a><span>Drag · Measure · Explore</span></footer>
</main>
</body>
</html>
`);


const page=(prefix,eyebrow,description,count,cards,label)=>`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Science Concepts · ${label}</title><link rel="icon" href="${prefix}assets/science-concepts-icon.png"><link rel="stylesheet" href="${prefix}shared.css"><link rel="stylesheet" href="${prefix}index.css"></head>
<body><main class="catalog ${prefix?'':'catalog-series'}"><header class="catalog-header"><div><div class="brand-heading"><img class="site-icon" src="${prefix}assets/science-concepts-icon.png" width="56" height="56" alt=""><div><span class="eyebrow">${eyebrow}</span><h1>Science Concepts<span aria-hidden="true">.</span></h1></div></div><p>${description}</p></div><span class="catalog-count">${count}</span></header><nav class="experiment-grid" aria-label="${label}">${cards}</nav><footer>${prefix?'<a href="../index.html">← Choose Primary or Secondary</a>':'<span>Small experiments. Observable science.</span>'}<span>Drag · Measure · Explore</span></footer></main></body></html>`;
writeFileSync(new URL('primary/index.html',root),page('../','PRIMARY SCIENCE','Choose a lesson. Build a model. Discover the science.',`${String(primaryExperiments.length).padStart(2,'0')} LESSONS / INTERACTIVE MODELS`,cardsFor('primary',primaryExperiments),'Primary science lessons'));
const seriesCards=[['primary','Primary Science','Primary science','Build and test colorful models to discover everyday science.','tower',`${String(primaryExperiments.length).padStart(2,'0')} interactive lessons`],['secondary','Secondary Physics','Form 4 &amp; 5 physics','Explore gases, optics, electricity, heat, fluids and motion.','boyle','06 interactive experiments']].map(([folder,title,topic,description,preview,count],i)=>`<a class="experiment-card" href="${folder}/index.html" aria-labelledby="title-${folder}"><div class="card-label"><span>0${i+1} / ${topic}</span><span aria-hidden="true">↗</span></div><div class="apparatus"><img src="assets/catalog/${preview}.svg" alt="" width="680" height="300"></div><div class="card-copy"><h2 id="title-${folder}">${title}</h2><p>${description}</p></div><div class="card-foot"><span class="equation">${count}</span><span class="open">Explore ${folder} →</span></div></a>`).join('\n');
writeFileSync(new URL('index.html',root),page('','INTERACTIVE SCIENCE','Choose Primary or Secondary to start exploring.','02 SERIES / HANDS-ON LEARNING',seriesCards,'Choose your series'));
console.log(`Built root, primary and secondary catalogues with ${experiments.length+primaryExperiments.length} actual apparatus previews.`);
