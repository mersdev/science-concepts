# Build a More Stable Tower

An English, offline Year 6 lesson: explain how base area and height affect stability. Open `index.html`, or use the primary catalogue.

Curriculum mapping supplied in the brief (direct concept): SK Science Y6 Unit 12, Stability and Strength, printed pp. 194–198; SJKC Science Y6 Ch. 12, printed pp. 189–191. These page references are user-provided; textbook pages are not reproduced.

Adjust height (20–80 cm), base size (10–50 cm), shape, and sideways disturbance (0–10 m/s²). Drag the roof vertically or base horizontally; fullscreen has independently focusable movement labels and a Test tower button showing the selected disturbance. The same test button moves into fullscreen and returns to its original controls on exit. Arrow keys change by 1 cm, Shift changes by 5 cm, Home/End choose limits. Test tower applies the selected disturbance; Auto explore tests different heights with the same base. Pause stops the tour; Reset restores 60 cm, 24 cm square, 4 m/s² and the initial graph. Reduced motion uses immediate test results and a single comparison per Auto explore press. Hidden/offscreen motion pauses.

## Model and limits

A uniform rigid tower has center-of-mass height hc = h/2. The sideways disturbance represents a sustained equivalent horizontal acceleration applied at the center of mass, not wind speed or a measured earthquake. With g = 9.81 m/s², the overturning moment is ma·hc and the restoring moment is mg·b. Thus the tipping threshold is a = g·b/hc. Lengths in cm cancel in this ratio. Above the threshold the tower tips; equality is the marginal boundary; zero disturbance leaves it upright. The grippy bench prevents sliding; blocks stay attached. Mass cancels. Strength, bending, cracks, impacts and oscillatory resonance are excluded.

Square side and circle diameter equal base size w: b = w/2; area is w² or πw²/4. The rectangle is w/2 along the disturbance and w across it: b = w/4, area = w²/2. A circle and square of equal span have equal tipping thresholds despite different areas: directional support, rather than area alone, determines this test. Enlarging any one shape increases both area and stability. Lowering height lowers its center of mass.

The orange marker is on the visible surface at center-of-mass height. Eight colored courses, flush window panels, rubber feet, rails, fasteners and an inlaid scale form the apparatus. All solids use the shared isometric projection; no external artwork or runtime dependencies. Face shades distinguish orientations. Motion is an illustrative eased fall (1.2 seconds), or small damped rocking, not a dynamic rigid-body solver. The test outcome and graph use the exact threshold model; fall timing does not predict a real tower.

Physics background: [OpenStax: Conditions for Static Equilibrium](https://openstax.org/books/university-physics-volume-1/pages/12-1-conditions-for-static-equilibrium). A lower center of gravity and a wider support base resist tipping.

Run `node check.mjs` from the repository root for physics, interaction, geometry, responsive and fullscreen checks; screenshots go to ignored `artifacts/`.
