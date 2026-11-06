# Inside a Door Handle: Wheel and Axle

Primary science. Identify the knob as the **wheel** and the central spindle as the **axle**. Turning the knob turns its attached spindle through exactly the same angle. The cutaway latch is an extension: its cam converts rotation into a sliding movement. Open `index.html` directly, offline.

## Figure plan

A coral knob turns a golden square spindle in a cutaway mint door. A blue cam and slotted follower pull a brass latch inward against a return spring. Lift the inspection cover to inspect the same working mechanism; it does not disconnect the knob or axle. This is a teaching cutaway, not a disassembly guide or a security lock.

Purposeful parts (over 60): four feet, bench plate, bench inlay, two door uprights, upper and lower door rails, four timber trim strips, latch backplate, two guide rails, four rail fasteners, four faceplate sections, two faceplate screws, latch bolt, connecting bar, two follower cheeks, follower bridge, cam, crank pin, two spindle bearings, square spindle, two-layer cutaway rose, two rose screws, knob neck, neck collar, rounded knob body, face inset, twelve grip inlays, two matching rotation markers, inspection lid, lid lip, four lid screws, spring seats, mounting bracket, moving collar and compression spring. The isometric camera is 45° azimuth and 24° elevation. Filled, shaded surfaces hide parts behind them; no hidden wireframe edges.

## Controls and accessible interaction

- Turn knob: 0–90°, 1° slider steps. Drag the knob horizontally; arrows change 5° (Shift: 15°), Home/End select 0°/90°.
- Lift latch cover: 0–100%, 1% steps. Drag the lid vertically or use its independent fullscreen movement label. Arrows change 5% (Shift: 15%), Home/End select 0%/100%.
- Turn / release knob toggles between rest and a quarter turn. Auto explore sweeps the knob; Pause stops it. Reduced motion gives one immediate comparison without animation.
- Reset restores 0°, cover lifted 75%, stopped auto mode, knob selection, and graph point.
- Full Screen retains the apparatus, output and two anchored movement labels. Escape exits, and focus returns to Full Screen. Native and CSS fallback fullscreen share the same behavior.
- Animation stops when hidden or offscreen and resumes without catching up. Explicit input still updates a static offscreen/reduced-motion model.

## Model, units and limits

One model drives all geometry, markers, outputs, status and graph. Knob angle θ and axle angle are identical: **θₖ = θₐ**. Knob radius R = 30 mm; square spindle half-width = 4 mm. A point on the knob rim travels Rθ radians (0–47.12 mm); this is an arc length, not latch travel. Equal angles do not imply equal distances from the axis.

The latch extension is an illustrative Scotch-yoke cam, not a claim about every commercial latch: a crank pin of radius √72 mm starts at 45° above the horizontal on the blue cam. Its offset from the axle is (6 cos θ − 6 sin θ, 6 sin θ + 6 cos θ) mm. This keeps the entire follower above the rotating square spindle. A vertical slot allows the pin's vertical movement while the follower and latch move horizontally. Latch retraction **s = 6(1 − cos θ + sin θ) mm**, extension **12 − s mm**, each bounded by 0–12 mm. At 0° the latch projects 12 mm; at 90° it is flush with the faceplate. The return spring shortens by the same s. Knob release is prescribed motion toward rest; spring force, friction, torque and material deformation are not simulated. No separate key lock or deadbolt is modeled.

World units are millimetres. The cover is lifted up to 56 mm for inspection and its screws rise with it; the operating geometry stays connected. The upper half of the rose and the door edges are cut away to keep the mechanism visible. Colors identify the wheel (coral), axle (gold), and latch extension (blue/brass), preserving the shared page palette.

## Sources and checks

The [National Geographic wheel-and-axle example](https://explorer-mag.nationalgeographic.org/pioneer_march_2019/wheels_that_dont_roll_and_wheels_and_axles_can_be_fun_and_going_along_for_the_ride) identifies the doorknob as a wheel and axle. [Schlage installation instructions](https://www.schlage.com/content/dam/sch-us/documents/pdf/installation-manuals/P515-360.pdf) show the knob, spindle and latch connection; the particular cam law and exposed inspection cover here are educational approximations.

Run `node check.mjs` from the repository root (Node.js and Chrome/Chromium). Concept checks cover model boundaries, synchronization, apparatus bounds, independent dragging and keyboard controls, primary action, auto/pause, reset, reduced motion, hidden/offscreen pausing, native/fallback fullscreen, Escape and focus, plus 1366×768, 1440×900, 390px and 320px layouts. Screenshots go to ignored `artifacts/`.

The portable geometry check tests actual projected face intersections and topological drawing order in 21 combined knob/cover poses. The installed Anatomy kit's volume/support audit also passed on the assembled 169-piece mesh; drawing order is checked separately against the rendered faces. All decorative apparatus details are filled, closed shapes, so the Anatomy line audit reports zero open line ends. The page uses the repository's single shared light theme.
