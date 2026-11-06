# Science concepts

Small, interactive experiments for primary science and Form 4 & 5 Physics. Open [index.html](index.html) and choose Primary or Secondary; no build, installation or network connection is required. The secondary catalogue currently contains six experiments.

Primary lessons are in `primary/`; Form 4 & 5 experiments are in `secondary/`.


[Build a More Stable Tower](primary/tower/index.html) adds a colorful Year 6 stability lesson with adjustable height, base size and shape, sideways tests, and a live tipping graph. Its [README](primary/tower/README.md) records the curriculum mapping and model assumptions.

[Why Triangles Make Structures Stronger](primary/bridges/index.html) compares a rectangular frame, triangular truss and arch under adjustable loads and spans. Its [README](primary/bridges/README.md) explains the elastic teaching model, curriculum mapping and assumptions.

[How Gears Transfer Motion](primary/gears/index.html) lets students crank a pair of meshing gears, change tooth counts and predict opposite rotation directions. The [README](primary/gears/README.md) documents its exact turn ratio and tooth-profile assumptions.

Start at the [experiment index](secondary/index.html) to browse all six apparatus previews and open an experiment. The responsive catalogue works offline and supports keyboard navigation. Its static SVG previews reuse the experiments’ actual geometry without running simulations in the background. After changing apparatus artwork or the catalogue entries, run `node build-index.mjs` to refresh the root and series catalogues and previews using Node.js and Chrome/Chromium; no toolkit installation is required.

[Inside a Door Handle: Wheel and Axle](primary/door-handle/index.html) shows a knob turning its spindle through the same angle, with an independently lifted cover revealing a cam-and-spring latch extension. Its [README](primary/door-handle/README.md) documents the controls and teaching model.

[How a Wedge Splits Materials](primary/wedge/index.html) lets Primary learners push a virtual blade and compare its width, entry and sideways opening. The [README](primary/wedge/README.md) explains the geometric model and the conceptual-only fracture animation.

[Moving Loads with an Inclined Plane](primary/inclined-plane/index.html) compares identical loads on two adjustable ramps reaching the same height. Its [README](primary/inclined-plane/README.md) documents the ideal force–distance model and marks the calculations as an extension.

[Inside a Mechanical Pencil Sharpener](primary/pencil-sharpener/index.html) combines a crank, axle, planetary gears and wedge-shaped cutting edges. Disassemble five assemblies, inspect their roles, reassemble and sharpen a virtual pencil. Its [README](primary/pencil-sharpener/README.md) records the supplied SK/SJKC curriculum notes, gear kinematics and illustrative cutter/point model.

[How Scissors and Hole Punches Work](primary/scissors-punch/index.html) combines colored lever handles, pivots and cutting wedges, with an exploded hole-punch extension and persistent paper results. Its [README](primary/scissors-punch/README.md) records the geometry and assumptions.

| Experiment | Page | Formula |
| --- | --- | --- |
| How Scissors and Hole Punches Work (Primary) | [primary/scissors-punch/index.html](primary/scissors-punch/index.html) | Lever + wedge |
| Inside a Mechanical Pencil Sharpener (Primary) | [primary/pencil-sharpener/index.html](primary/pencil-sharpener/index.html) | Turn → transfer → cut |
| How Screws Turn Rotation into Movement (Primary) | [primary/screw/index.html](primary/screw/index.html) | N = L/p |
| Moving Loads with an Inclined Plane (Primary) | [primary/inclined-plane/index.html](primary/inclined-plane/index.html) | F = mgh/L |
| How a Wedge Splits Materials (Primary) | [primary/wedge/index.html](primary/wedge/index.html) | Push down → split apart |
| Inside a Door Handle: Wheel and Axle (Primary) | [primary/door-handle/index.html](primary/door-handle/index.html) | θknob = θaxle |
| Balancing a Seesaw (Primary) | [primary/seesaw/index.html](primary/seesaw/index.html) | m₁d₁ = m₂d₂ |
| How Gears Transfer Motion (Primary) | [primary/gears/index.html](primary/gears/index.html) | N₁θ₁ + N₂θ₂ = 0 |
| Why Triangles Make Structures Stronger (Primary Year 6) | [primary/bridges/index.html](primary/bridges/index.html) | δ = F/k |
| Build a More Stable Tower (Primary Year 6) | [primary/tower/index.html](primary/tower/index.html) | aₜᵢₚ = gb/h꜀ |
| Boyle’s law | [secondary/boyle/index.html](secondary/boyle/index.html) | PV = constant |
| Convex lens | [secondary/convex/index.html](secondary/convex/index.html) | 1/f = 1/u + 1/v |
| Ohm’s law | [secondary/ohm/index.html](secondary/ohm/index.html) | V = IR |
| Latent heat of fusion | [secondary/latent-heat/index.html](secondary/latent-heat/index.html) | Q = mLf |
| Liquid pressure | [secondary/liquid-pressure/index.html](secondary/liquid-pressure/index.html) | P = ρgh |
| Free fall | [secondary/free-fall/index.html](secondary/free-fall/index.html) | h = ½gt²; g = 2h/t² |

Drag a model, adjust its sliders, or focus the model and use the arrow keys. Home and End select the limits. Auto explore animates the experiment; Reset restores its starting state. Reduced-motion preferences are respected.

Each normal page has a title and short description, with its formula above the live output cards.

Every secondary experiment has a **Home** link to the secondary catalogue. It is hidden and unavailable to keyboard focus in native and fallback fullscreen, then restored on exit. The shared Science Concepts icon appears on the catalogue, Home links and browser tabs.

Pages center horizontally and vertically in the available viewport. Content taller than the viewport starts at the top and scrolls normally, keeping phone controls accessible.

The latent-heat rig melts crushed ice at 0°C, collects the water on a balance, and traces a flat heating-curve segment. Adjust heater power or ice mass, or scrub supplied energy. The heater cuts off when melting finishes. Readouts obey Q = mLf throughout; temperature never rises during melting. A fullscreen label follows the adjustable heater dial.

The liquid-pressure bench connects a draggable membrane probe to a U-tube manometer. Compare depth at fixed density, then density at fixed depth. Rotate the probe to see that pressure is independent of orientation; fullscreen labels move depth and orientation.

The free-fall tower releases a steel ball from an electromagnet and stops its timer at an impact detector. Equal-time position markers show uniform acceleration. Adjust height and mass, scrub the fall, and explore the h-versus-t² graph. All masses fall with the same g when air resistance is negligible.

The desktop overview fits at 100% browser zoom on a 1366×768 laptop display, with readable labels, compact cards and tightly framed models. The convex distance controls sit side by side on desktop; phone controls remain stacked.

**Full Screen** opens the model and live output. The tower keeps its Test tower action available inside fullscreen, using the selected disturbance; the same button returns to the normal controls on exit. Dragging and keyboard controls remain available. Use **Exit Full Screen** or Escape to return. Browsers without the Fullscreen API use a viewport-filling fallback.

Movement labels appear only in fullscreen: “Drag piston” for Boyle, “Slide contact” for Ohm, and “Drag object” / “Drag screen” for the convex lens. Drag a label or focus it and use the arrow keys to move its component. The convex-lens fullscreen also includes a live white-screen close-up.

Each folder contains its HTML model, animation logic and material colors. `shared.css`, `shared.js` and `geometry.js` provide the common layout, fullscreen behavior and isometric projection. Edit these files directly; generated copies and external toolkit installations are unnecessary.

The [primary seesaw lesson](primary/seesaw/index.html) has independently draggable coral and blue riders, mass and distance sliders, a Balance riders action, turning-effect comparison bars and a live relationship graph. Its [README](primary/seesaw/README.md) documents the fixed fulcrum, units, limits and illustrative tilt. Fullscreen keeps both rider movement labels and the live output. `SEESAW_ONLY=1 node check.mjs` runs its focused checks.

The original transparent science-teacher mascot, six experiment poses and layered campaign cover are in [social-posts](social-posts/README.md).

[How Screws Turn Rotation into Movement](primary/screw/index.html) follows a real helical thread into a cutaway wooden block. Fully seat every 39 mm screw, compare the turns needed for 2–4 mm pitches, track turns remaining and insertion progress, and zoom the synchronized thread close-up. Its [README](primary/screw/README.md) records the ideal engagement model and controls. Run `SCREW_ONLY=1 node check.mjs` for focused checks.

Run browser checks with Node.js 22+ and Chrome or Chromium:

```sh
node check.mjs
```

Set `CHROME_PATH` if the executable is not in a standard location. Checks cover physics, controls, animation, desktop/mobile layout, reduced motion, native fullscreen and its fallback. Screenshots are written to ignored `artifacts/`.

See [AGENTS.md](AGENTS.md) for the page design, repository rules and standard workflow for adding another physics concept with `$anatomy`.
