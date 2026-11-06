# 滑轮实验室 · Pulley Lab

三年级：拖动绳柄或重物，比较定滑轮、动滑轮和一个定滑轮加一个动滑轮的组合。页面支持简体中文和 English，直接打开 `index.html` 即可离线使用。

## Research and model

[TeachEngineering: Powerful Pulleys (grades 3–5)](https://www.teachengineering.org/lessons/cub_simple_lesson05) supports comparing force direction, fixed/movable pulleys and the force–distance tradeoff. [UCSC Physics: Pulley Mechanical Advantage](https://ucscphysicsdemo.sites.ucsc.edu/physics-5a6a/pulley-mechanical-advantage/) describes ideal advantages of 1 and 2. This is a grade-appropriate exploration, not a claim of alignment with a particular national syllabus.

Count the rope segments supporting the load, not the number of wheels. With `n` supporting segments, load weight `W`, lift `h` and pulled distance `s`: `F = W/n`, `s = nh`, `Fs = Wh`. Fixed: n=1, pull down. Movable: n=2, pull up. Combination: n=2, pull down. The added fixed wheel redirects the pull; it does not add force advantage.

Ranges: W=10–40 N in 10 N steps; h=0–30 cm; s=0–30 cm (fixed) or 0–60 cm (other modes). Initial: fixed, W=20 N, h=0. Ideal massless, inextensible rope, frictionless massless pulleys, quasi-static lift; F is the force needed to lift steadily, not a dynamic force simulation. No free fall when released: the hand holds the rope. Use N for force, never kg. Motion uses 2.5 SVG units/cm; wheels rotate without rope slip. The graph shows all three s–h relationships with one current point, never accumulated samples. Real apparatus needs more effort because of friction and pulley weight.

## Apparatus and parts plan (Figure)

A tabletop lifting gantry: pulling the amber rope turns the wheels and raises the coral load. Frontal working plane preserves clear, vertical support strands; the bench, cheeks, hubs and load have visible depth. Teal means fixed supports, coral means moving load, amber means rope.

Purposeful parts: base top, front edge, right edge, four rubber feet, four foot collars, two post sockets, four socket bolts, two rear posts, two front post faces, crossbeam top/front/end, two beam end caps, four beam bolts, two suspension lugs, two clevis pins, rope anchor eye and collar, fixed wheel back flange/groove/front flange, three spokes, axle/hub/washer, moving wheel back flange/groove/front flange, three spokes, axle/hub/washer, moving yoke, hanger, hook, load top/front/side, two load bands, load rivets, rope ferrule, handle shell/inset/grip ribs/end caps, ruler rail/ticks/end screws. Static structure is behind the mechanism; rope meets wheel grooves tangentially; hubs sit in front of spokes; moving load follows the yoke.

## Controls

- Three configuration buttons preserve lift height and load weight for a fair comparison.
- Pull-distance and load-weight sliders; primary action pulls 20 cm more rope, with a stop at the travel limit.
- Drag the actual handle, load or moving wheel. Arrow keys change height by 1 cm (Shift: 5); Home/End choose travel limits. Up raises the load; Down lowers it.
- Auto explore/Pause moves slowly. Reset restores all initial values and graph state.
- Full Screen uses the shared behavior, with live output and independently focusable anchored handle/load movement labels. Escape exits and restores focus. Reduced motion disables auto and applies explicit changes immediately. Hidden/offscreen stages pause without catching up.

## Checks

Run `node check.mjs`. It includes pulley physics, rope-length conservation, wheel tangency/clearance across the complete travel, controls, pointer/keyboard, auto, reduced/hidden/offscreen motion, native/fallback fullscreen, focus restoration and responsive screenshots. `node primary/pulley/audit.mjs` checks the planar rope geometry independently. The installed Anatomy `scripts/lines.mjs` checks SVG line endings; screenshots include mechanism close-ups.
