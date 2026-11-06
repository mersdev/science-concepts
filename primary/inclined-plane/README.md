# Moving Loads with an Inclined Plane

Primary science: compare two ramps and explain why a longer, gentler ramp needs less force under the same conditions. The inclined-plane idea is the curriculum focus; force calculations are an extension. Open `index.html` directly from disk; no build or network is required.

## Figure plan

Two colorful adjustable loading ramps sit on a sturdy demonstration bench. Identical wooden crates move up a coral ramp A and a blue ramp B, reaching the same height together. Extend either ramp's lower end to change its slope while the upper measurement point stays fixed. Color matches the ramps, boxes, outputs and graph points.

Purposeful parts (over 60): four feet, bench base, inset mat, four corner anchors with screw slots, two ramp decks, four triangular supporting cheeks, four bottom runners, four cross ties, two sliding toe shoes, four shoe fasteners, two distance strips with rooted distance ticks, four deck screws, six reinforcing battens with twelve rivets, two crates, four crate runners, four crate reinforcing straps, four crate corner guards, eight crate fasteners, two inset crate panels, two height posts, two post footplates, upper height crossbar and height scale with rooted ticks. Parts are filled solids with shading, not a wireframe. The camera looks across both lanes at 75° azimuth and 28° elevation.

## Controls

- Ramp A and B length: independently adjustable from 1.50 to 4.00 m, in 0.05 m slider steps. Drag a ramp's toe shoe to extend or shorten it; its upper measurement point remains fixed.
- Move both loads: a 0–100% progress slider. Drag either crate; both crates always rise through the same fraction of the 1 m rise, allowing a controlled comparison. Each travels a different distance if the lengths differ.
- Move loads / Return loads: moves both to the top or back to the bottom. Auto explore sweeps their positions; Pause stops it. Reduced motion gives one immediate comparison.
- Reset restores lengths A = 1.50 m and B = 3.00 m, progress 0%, stopped auto mode and the initial graph points.
- Focus the model or a fullscreen movement label: arrows change length by 0.10 m (Shift: 0.50 m) or progress by 5% (Shift: 20%); Home and End select the limits. Normal sliders retain native keyboard behavior.
- Full Screen keeps the apparatus, live output and labels for both adjustable toes and crates. Escape exits native or fallback fullscreen and restores focus. Labels track the actual geometry and remain inside narrow viewports.
- Animation and auto exploration pause while hidden or offscreen. Explicit input still updates the static model. No time accumulates while paused.

## One model, units and assumptions

Both loads have mass m = 10 kg; gravitational acceleration g = 9.8 m/s²; vertical rise h = 1.00 m. Ramp surface length L = 1.50–4.00 m. Horizontal run is √(L² − h²), and angle θ = asin(h/L), from 41.81° down to 14.48°. The model assumes negligible friction and an applied force parallel to the slope, balancing gravity during steady motion: **F = mgh/L = mg sin θ**. This is the required uphill force while moving or holding the box; it is displayed even at rest. No acceleration, friction or deformation is simulated. Animated motion is prescribed for comparison, rather than calculated from a changing applied force.

At progress p = 0–1, each crate's bottom-center reference rises by ph and travels pL along its ramp. Thus both rise equally, while the gentler ramp gives a longer travel distance. F × L = mgh = 98 J on either full trip; a ramp reduces force by increasing distance, not by reducing the ideal work. At equal lengths both angles, forces and distances match. Either ramp may be the longer one.

World scale is 65 drawing units per metre. Each deck extends 0.23 m beyond both measurement points so the whole crate remains supported at 0% and 100%. Those supporting extensions are excluded from the displayed travel length and height rise. Crates stay aligned to their slopes. Their centers of mass have different initial offsets on different slopes, but each rises by the same 1 m over its own trip. The triangular supports, crate size, deck thickness and fittings are illustrative. The shared height frame sits between the lanes, clear of both boxes' paths.

## Sources and verification

[OpenStax, Simple Machines](https://openstax.org/books/physics/pages/9-3-simple-machines) explains the force–distance tradeoff and ideal mechanical advantage L/h. [OpenStax, College Physics](https://openstax.org/books/college-physics/pages/9-5-simple-machines) explains equal work when friction is negligible.

Run `node check.mjs` from the repository root. Checks cover the ideal model and its limits, identical conditions, swapped/equal lengths, synchronized crate positions and distance/force/graph outputs, complete apparatus bounds and face order, controls, independent toe dragging, crate dragging, keyboard, auto/pause/reset, reduced motion, hidden/offscreen pause, native/fallback fullscreen, Escape/focus, and 1366×768, 1440×900, 390px and 320px layouts. Review screenshots in ignored `artifacts/`. All apparatus details use closed filled shapes, so there are no open decorative line ends.

The portable geometry check verifies real projected face intersections and drawing order at 27 combined length/progress poses. The installed Anatomy kit's volume/support audit passes on the 133 actual solid pieces at the initial pose; face order is verified separately by the portable check. The shared page uses a single light theme.
