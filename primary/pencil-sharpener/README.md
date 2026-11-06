# Inside a Mechanical Pencil Sharpener

Primary science: identify the simple machines in a hand-cranked sharpener and explain how they work together. The supplied curriculum note includes mechanical-sharpener reassembly for SK (p. 219), and disassembly for SJKC (p. 208). This lesson supports both; it does not reproduce or independently verify those textbook pages.

## Object and parts plan

Anatomy Figure: a mint cutaway case on a bench, with a coral crank, golden axle/carrier, blue gears and a steel cutting roller. Turning the crank rotates the carrier around the stationary pencil. A fixed internal ring drives the roller's pinion and makes the cutting edges spin.

Parts planned before geometry: base and mat (2), feet (4), base washers and screws (8), support shoes (4), front and rear mounting uprights (4), case side/back/top/bottom panels (4), case trim rails (4), case fasteners (6), shavings-tray floor/walls/pull (6), crank hub/arm/knob/collar (4), axle (1), rear bearing stand/frame/bushing (6), rear carrier hub/arm/journal (3), front carrier ring/arm/journal (3), fixed ring body and mounting tabs (3), planet gear body/hub (2), cutter spindle/rear collar/front collar (3), cutter body (1), helical cutting edges (8), pencil body/wood/graphite (3). Gear teeth, screw slots and grip ribs are functional surface detail. The open front/right side is a permanent inspection cutaway.

## Controls and simple machines

- **Disassemble / Reassemble** moves the five colour-coded assemblies apart or together. The pencil withdraws during disassembly. Cranking is locked while apart.
- **Take apart** slider: 0–100%, initially 0%. Drag the housing or the fullscreen assembly indicator; Up/Right opens, Down/Left closes; Home/End selects a limit.
- **Crank turns** slider: 0–6 turns, initially 0. Drag the crank sideways; Right/Up turns forward, Left/Down scrubs back; Home/End selects a limit. Scrubbing replays the demonstration, including its point formation.
- Select Housing, Handle, Gears, Axle or Cutter to highlight that assembly and read its role. The housing supports and contains parts; it is not itself a simple machine. The crank is a wheel-and-axle action; gears are toothed wheels transmitting rotation; the axle and carrier transmit rotation; the cutter's edges act as wedges.
- **Auto explore / Pause** turns the reassembled mechanism. Under reduced motion it chooses a single still comparison. Hidden/offscreen animation pauses without catching up. Reset restores assembly, turns, selection, point and graph.
- Full Screen keeps the apparatus, readout, anchored controls and the same pencil-preview node. Escape exits the fallback; the browser handles native Escape. Focus returns to Full Screen.

## Model, dimensions and limits

World dimensions are illustrative mm. The fixed internal ring has 36 teeth, pitch radius 36 mm; the orbiting pinion has 12 teeth, pitch radius 12 mm. The carrier radius is 24 mm. If the crank/carrier turns through θ, the pinion's absolute spin is `(1 − 36/12)θ = −2θ`; relative to the carrier it is `−3θ`. Thus the pinion goes round the pencil with the carrier while spinning oppositely about its own axis. The axle and crank have the same angle. The gear graph shows magnitudes of the absolute turns, not a claim about input force.

The 40 mm cutting roller is a simplified tapered roller (18–24 mm radius) with eight helical edges, on an axis parallel to the pencil. Real sharpeners often use inclined cylindrical helical cutters; this substitute makes the conical cutting envelope clear and keeps the gear pitch planes parallel. The tooth flanks use involute reference curves with visual backlash (half-width reductions of 0.006 rad on ring teeth and 0.015 rad on pinion teeth); no manufacturing fit, load, friction, stress or cutting-force claim is made.

The pencil has a 6 mm radius. Point formation progresses from 0 to 100% over six crank turns. Its exposed cone length grows from 0 to 46 mm and the preview shows the same progress. This is an illustrative replay of wood removal and feed, not a mass-conserving material-removal or damage simulation. No additional sharpening happens beyond six turns. Replaying turns backwards restores an earlier demonstration frame; it does not mean real wood grows back.

Disassembly moves grouped parts in an exploded inspection view, with seams and shafts separated for clarity. It is not a screw-by-screw service procedure. The interface describes virtual parts only.

Mechanism reference: [US3965949A, Pencil sharpeners](https://patents.google.com/patent/US3965949A/en), description of crank-driven carrier, fixed annulus and planetary cutter. The supplied curriculum outcomes determine the lesson scope; the numerical gear ratio and dimensions are teaching choices.

## Checks

Run `node check.mjs` from the repository root. Pure model/gear checks are in `audit.mjs`; browser checks cover assembly interlock, gear relationships, controls, selection, pointer/keyboard, reduced/hidden/offscreen motion, reset/graph, native/fallback fullscreen, preview restoration and 1366×768, 1440×900, 390px and 320px layouts. Screenshots and close-ups are ignored in `artifacts/`.
