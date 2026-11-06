# How Scissors and Hole Punches Work

Primary science: identify the lever and wedge mechanisms in a tool and explain how they work together. Scissors and combinations of simple machines are the curriculum focus. The complete hole-punch teardown is an extension. Open `index.html` directly, offline.

## Figure plan

A colorful inspection bench holds one of two selectable tools. Colored handles act as levers about golden pivots; blue bevels identify cutting wedges. Separate the assemblies, then reassemble and operate them. The paper-result preview shows the outcome of the same model, and moves into fullscreen as the same DOM node.

Purposeful parts: bench, inset mat, four feet and fasteners, scissor fulcrum pedestal, two metal shanks, two pivot-eye frames, two elliptical hollow grips with inner inlays, two blade spines, two triangular cutting bevels, pivot shaft, two washers and screw head/slot. Punch: base, die ring, two pivot cheeks, headed pivot pin, handle eye, lever arm, colored grip, grip fasteners, two guide posts, four guide-frame rails, punch shaft, beveled annular cutting rim, punch head, follower roller, compression spring and mounting plates. Rings are made from contiguous solid sectors; internal sector walls are omitted from the drawing. Each complete tool is a detailed Figure, not a wireframe. Projection: 75° azimuth, 36° elevation.

## Interaction

- Scissors / Hole punch selects the model and resets its motion and separation; each paper result is retained until Reset.
- Operate: 0–100%, 1% steps. Drag a handle or use the slider. Arrows change by 5% (Shift: 20%); Home/End select open/released and closed/pressed.
- Separate parts: 0–100%, 1% steps. Drag the pivot screw/pin or its fullscreen label vertically. Arrows change 5% (Shift: 20%); Home/End assemble or fully separate.
- Operating a separated tool first reassembles it. Separating a closed tool first releases it. Disconnected parts never demonstrate a working linkage.
- The primary action operates/releases the tool. Auto explore repeats its motion; Pause stops the tour. Reduced motion gives one immediate static comparison.
- Reset returns to assembled, open scissors, stops auto mode, restores both paper samples, graph and values.
- Full Screen retains the tool, live values, two anchored movement labels, paper-result preview and exit button. Escape and focus restoration work in native and fallback fullscreen. Motion pauses when hidden or offscreen.

## Model and limits

World units are illustrative millimetres. This is a prescribed-motion teaching model, not a stress/fracture simulation; force, friction and elastic deformation are not calculated.

For scissors, handle closure q = 0–100% sets each lever half-angle θ = 25° − 27° × q/100. Each handle, shank and blade turns as one rigid part about the common pivot. The blade faces occupy adjacent vertical layers and slide against/past one another. The cutting bevel has a triangular cross-section. At a reference 50 mm from the pivot, projected cutting-edge gap is **max(0, 2 × 50 sin θ) mm**, from 42.26 to 0 mm. The final 2° lets the blades pass one another. The paper-result animation registers a completed cut when the edges first meet (θ ≤ 0). Blade tips are simplified blunt ends; the two grip centers remain separated when closed.

For the punch, handle angle α = 18° × (1 − q/100). Its fixed pivot is at x = −55, z = 80 mm. The underside of the handle is 4 mm below its center plane. A 6 mm-radius follower roller at x = 0 stays tangent to that underside: its center is **zᵣ = 80 + 55 tan α − 10/cos α**. Its contact point is (−6 sin α, zᵣ + 6 cos α). The punch head touches the roller at zᵣ − 6, and the cutter below that head is 42 mm long. Thus its tip is zᵣ − 48, travelling from about 39.36 to 22 mm; paper top is z = 26, lower face z = 25.5, and the die top is z = 25. The displayed clearance is max(0, tip − 26). Once the cutting rim reaches the paper's lower face, a hole is recorded. The beveled annular rim shears a disc against the die; this extends the wedge idea, rather than modeling every commercial punch design. The return spring shortens with the follower; no spring force is calculated.

Paper results latch: releasing a tool or switching views does not heal its paper. Reset supplies new paper. Material separation and the ejected disc are illustrative visuals. The full paper sample is shown in the dedicated physical preview, keeping the model's joints visible.

Scissor parts separate along the pivot axis. For the punch, the pivot pin first withdraws along its own axis; only after it clears the cheeks do the handle, cutter, guide/spring and die lift apart. Separation poses are inspection arrangements, not operating poses.

## Sources and checks

[TeachEngineering, Levers That Lift](https://www.teachengineering.org/lessons/cub_simp_machines_lesson03) identifies the scissor arms as levers and the cutting edges as wedges. [Fiskars scissors information](https://www.fiskars.com/en-en/collections/scissors) describes the blades, handles and spring-assisted variants. The punch linkage and dimensions here are illustrative, documented geometry.

Run `node check.mjs` from the repository root. Concept checks cover both models, limits, coupling, paper persistence/reset, separation sequencing, geometry/order/bounds, sliders, pointer/keyboard, auto/pause, reduced motion, hidden/offscreen pause, native/fallback fullscreen, Escape/focus and same-node preview restoration. Review 1366×768, 1440×900, 390px and 320px screenshots and close-ups in ignored `artifacts/`. Decorative details are closed filled shapes, with no open line ends.

The portable geometry check verifies actual projected face intersections and drawing order in 22 assembled/operated/separated poses. The installed Anatomy kit's volume/support audit passes on the 335 scissor mesh pieces and 151 punch mesh pieces at rest; face order is checked separately against the rendered surfaces. Both use the shared light theme. Close-ups include the assembled and separated pivots and the pressed cutter, roller, spring and die.
