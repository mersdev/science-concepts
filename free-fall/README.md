# Free Fall

Use **Home** to return to the [experiment index](../index.html). The link appears only outside fullscreen.

Open `index.html` directly in a browser. No installation, build or network is needed.

A steel ball is held by an adjustable electromagnet above an impact detector. Releasing the magnet starts the timer at zero; the detector stops it at first contact. Translucent amber markers retain successive ball positions at equal **0.10 s** physical intervals. Their increasing separation shows acceleration.

## Controls

- Set **release height H**, from 0.25 to 2.00 m, using the slider or by dragging the electromagnet vertically. Changing height rearms the magnet and timer.
- Set **ball mass**, from 50 to 250 g. Every mass has the same acceleration and flight time from the same height. Changing mass rearms the apparatus; completed measurements remain on the graph.
- **Release ball** starts from rest, then becomes **Pause fall / Resume fall**. Release again after detection to repeat the drop. Playback runs at **¼ speed** for visibility; the clock, sample times, velocity and graph always use physical time.
- Scrub **elapsed time** with the slider or drag the steel ball vertically. Scrubbing pauses playback and changes the same time value that drives every readout. Scrubbing to the detector inspects the endpoint but does not record an experimental trial.
- Tap the ball or its fullscreen label to release, pause or resume. **Enter** or **Space** while the apparatus or either movement label is focused performs the same action, including in fullscreen.
- **Auto explore / Pause tour** cycles through 0.50, 1.00, 1.50 and 2.00 m at fixed mass. It pauses work while the document is hidden or the apparatus is offscreen, and resumes without a time jump.
- **Reset** restores 1.50 m, 100 g, zero time, a held ball and an empty measurement graph. It clears all markers and completed drops.
- Focus the apparatus and use arrows (0.05 m), Home or End to set height. Fullscreen labels independently adjust height and ball time; the time label uses arrows (0.01 s), Home or End. Drag either label to move its attached component. Escape exits fullscreen and restores focus to **Full Screen**. A fallback works without the Fullscreen API.
- Reduced motion disables the automatic tour. **Release ball** arms a released, paused state at t = 0; subsequent **Step 0.10 s** presses advance one sample at a time. Sliders, dragging and keyboard controls remain available.

## Physics

The ball is released from rest with constant downward acceleration **g = 9.81 m/s²**. With downward distance h measured from the release position:

`h = ½gt²`, `v = gt`, `g = 2h/t²`, `flight time = √(2H/g)`.

Mass does not enter these equations. Air resistance, buoyancy, residual magnetic force after release, detector latency, and changes in g with height are neglected. The theoretical h-versus-t² graph is a straight line through the origin, with slope g/2 = 4.905 m/s². The orange point shows the inspected state; green points show completed timed drops. One point per release height is retained, up to eight points.

At t = 0, inference using 2h/t² is undefined, so the gravity readout shows a dash. The ball stops at the detector. At detection the speed card reports speed **immediately before contact**, rather than implying continued acceleration through the apparatus. Time is clamped at the physical flight duration, from about 0.226 s at 0.25 m to 0.639 s at 2.00 m. Values shown with rounded digits may produce a slightly different result if manually substituted; the model and graph use full precision.

## Apparatus and checks

This Anatomy Figure uses an isometric base, four rubber feet, mounting block, vertical rail and ruler, moving collar and arm, copper coil with windings, pole, steel sphere, detector pad and indicator, and a timer with its own live display. Internal wiring runs through the support and base. Steel-ball radii are enlarged for visibility; their cube-root variation with mass is illustrative, and does not alter the flight distance. Release height is the ball's vertical travel to first detector contact. The magnet pole moves with ball radius so the held sphere touches it at every mass.

Geometry is created once from the portable primitives in `app.js`, using the root projection helper. The head moves as one assembly; the ball moves only vertically. The page uses shared styling and fullscreen behavior, with closer phone framing that retains every allowed apparatus pose. The fullscreen readout distinguishes release height H from distance fallen h.

`node check.mjs` covers the equations, mass independence, clock start and detector stop, equal-time samples, graph coordinates, reset, controls, pointer and keyboard input, auto mode, hidden-page pause, reduced motion, desktop and phone layouts, and native/fallback fullscreen. It also checks apparatus bounds across 27 height/mass/time poses and writes the actual geometry to ignored `artifacts/` for Anatomy audits. Screenshots include the apparatus and mechanism close-up.
