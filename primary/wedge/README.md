# How a Wedge Splits Materials

Primary science: explain that a wedge is a simple machine used to split or cut materials. Material fracture is a conceptual animation only.

## Apparatus and concept

A virtual blade moves vertically in a guided tabletop press. Its pointed tip enters first; the two sloping faces move the sample sides apart. The sample is shown as two rigid halves for clarity. This is not a real blade activity.

Anatomy Figure parts plan, before geometry: base plate and top mat (2), feet (4), foot pads (4), corner washers and screw heads (8), guide shoes (2), square guide posts (2), post caps (2), top bridge (1), top bridge fasteners (4), ruler foot and stem (2), ruler backing (1), ruler inlays (21), sample support strips (2), sample halves (2), sample surface strips (8), blade (1), blade clamp (1), clamp fasteners (4), sliding crosshead (1), guide sleeve walls (8), handle stems (2), handle grip (1), grip ribs (7). Parts are solid prisms with face shading, projected at 72° azimuth and 25° elevation. The base supports the guides and the sample; the guides support the blade carriage. The blade is the brightest subject.

## Controls

- Drag the blade or handle down/up, or adjust **Push depth** (0–100%, initially 0%).
- Change **Blade width** (20–50 mm, initially 30 mm). This changes both sloping faces symmetrically.
- Focus the model or fullscreen movement label: Down/Right pushes, Up/Left lifts, Home lifts fully, End pushes fully; Shift makes larger steps.
- **Push wedge** moves to maximum depth; **Lift wedge** lifts it again. **Auto explore / Pause** cycles depth. Reset restores both controls and graph.
- Full Screen retains the same live cross-section node, readout and a blade movement indicator. Escape exits, including the fallback. Focus returns to Full Screen.
- Reduced motion applies requested positions immediately; Auto explore selects one static comparison. Animation pauses while hidden or offscreen and resumes without catching up.

## One illustrative model

All lengths are in mm. The blade is an 80 mm long symmetric triangular prism; its width is measured at its broad end. Sample height is 79 mm; the sample surface is at z = 100 mm and its base rests on support strips at z = 21 mm. Blade tip height is `120 − 0.8 × pushPercent`. Thus there is 20 mm of approach before contact at 25% push. Maximum entry is 60 mm: the tip stays 19 mm above the sample base.

`entry = max(0, 100 − tipHeight)` and `opening = bladeWidth × entry / 80`.

Each conceptual half moves sideways by half the opening; the blade faces meet the inner top edges. The cross-section, opening value and graph point all use this same geometry. Width does not imply a prediction about which blade cuts more easily. No force, friction, stress, sharpness, material strength or energy is calculated. The rigid halves separate and close reversibly, with no fracture threshold, damage, debris or real crack propagation. The displayed graph is a geometry relationship, not measured material behaviour.

## Verification

Run `node check.mjs` from the repository root. The wedge checks cover model limits/contact, finite geometry and stage bounds, controls, reset/graph, direct dragging and keyboard, automatic/reduced motion, hidden/offscreen pause, preview restoration, native/fallback fullscreen, focus, and desktop/phone layouts. Screenshots go to ignored `artifacts/`.
