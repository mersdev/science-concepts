# How Screws Turn Rotation into Movement

Primary science: the screw is a simple machine whose helical thread converts rotation into forward movement. Open `index.html` directly; no installation or network is required.

## Figure and parts plan

A horizontal wood screw rotates and advances into a clamped wooden block. A front cutaway reveals the thread inside the wood. The same live apparatus is magnified in the thread close-up. Coral marks on the head and on one section of thread make complete revolutions and the motion of the same material point visible.

Figure parts: four rubber feet and four risers; base plate and inset mat; four anchor plates and four fasteners; two clamp bases, two pedestals, two pressure pads, two clamp bars, two studs and two caps; wood back, lower front, upper back and shaped bore; two end-grain borders and four closed grain inlays; tapered screw tip, threaded core, continuous helical ridge, neck, head bevel, head rim, head face, two cross-slot inlays and coral turn marks. More than 40 purposeful components, with shaded faces and measured back-to-front ordering. Geometry is portable source in `screw.js` and `app.js`; no absolute-path toolkit dependency is shipped.

## Controls

Rotation is 0–6 turns in 0.01-turn slider steps. Choose a single-start pitch of 2, 3 or 4 mm per turn. Changing pitch resets rotation, representing swapping screws. Turn once adds one revolution; use the slider, drag the screw or movement label horizontally, or press arrow keys to turn either way. Arrow steps are 0.05 turns, Shift steps 0.25; Home/End select the limits. The 2×/4× close-up buttons change only magnification.

Auto explore drives in and then withdraws the screw; Pause stops the tour. Reset restores 0 turns, 3 mm pitch, 2× magnification and paused auto mode. Reduced motion performs a single static turn instead of a tour. Hidden and offscreen models pause without catching up. Fullscreen preserves the model, current outputs, anchored screw-turn label and the same close-up DOM node. Escape exits; unsupported browsers use the shared fallback and focus returns to Full Screen. The wood and clamps are fixed and have no movement labels.

## Model, geometry and assumptions

For a single-start screw, lead equals pitch: **travel (mm) = turns × pitch (mm/turn)**. Rotation is viewed from the screw head: clockwise advances into the wood; counterclockwise withdraws. The model uses x along the screw, z up, 2 drawing units per millimetre, and a 6-turn limit. Maximum travel is 24 mm. The starting tip is at the wood surface, x = 0. The head remains outside the wood at every allowed pose; the tip remains inside the 32.5 mm deep block.

The root radius is 2 mm and the full crest radius is 3.25 mm. The continuous triangular thread has half-width 0.24 pitch and tapers in both height and width over one pitch at each end, meeting the core without loose ends. Its helix is x = −72 + lead·t/(2π), y = r cos(t), z = 50 − r sin(t). The shared projection mirrors the transverse plane, so decreasing radial angles show clockwise motion as viewed from the head. A clockwise turn adds 2π to the clockwise phase and one lead to x. Therefore the thread path remains aligned with the stationary matching groove: x − lead·clockwise phase/(2π) is invariant. This is a real helical surface, not a stack of rings. The wooden bore uses the matching profile with 0.125 mm radial clearance; the front half of the block is cut away to expose it. Mesh samples create a smooth visual approximation of the analytic surfaces.

The model illustrates ideal engagement in a prepared groove. It does not predict first-time wood cutting, chips, friction, torque, force, pull-out strength or material deformation. Exponential easing (0.2 s) changes the speed of motion while preserving travel = turns × pitch at every frame. Reversing returns along the same helix. The initial touching tip is the zero of travel.

Background: [TeachEngineering, Just Plane Simple](https://www.teachengineering.org/lessons/cub_simp_machines_lesson02), for the screw and pitch relationship, and [Queen’s University, Screws: Simple Machines](https://www.queensu.ca/science-rendezvous/sites/srkwww/files/uploaded_files/resources/science-technology/six-simple-machines-lessons-plans/Rube-Goldberg-Screws-worksheet.pdf), for circular-to-linear motion. Curriculum wording comes from the supplied brief; no textbook mapping is invented.

Run `node check.mjs` at the root or `SCREW_ONLY=1 node check.mjs` for this lesson. `node primary/screw/audit.mjs` checks the analytic helix, pitch, engagement clearance, thread spacing and travel limits. Browser checks cover actual mesh bounds and depth order, inputs, reverse motion, reset, auto/reduced/hidden/offscreen behavior, close-up synchronization, fullscreen/fallback/preview restoration, and 1366×768, 1440×900, 390 px and 320 px layouts. Screenshots and line-audit images are ignored under `artifacts/`.
