# Science concepts

Small, interactive experiments for primary science and Form 4 & 5 Physics. Open `primary/index.html` or `secondary/index.html` directly in your browser; no build, installation or network connection is required. The secondary catalogue currently contains six experiments.

The existing experiments are in `secondary/`.

[Primary Science](primary/index.html) includes [Pulley Lab](primary/pulley/index.html), a colorful Grade 3 lesson comparing fixed, movable and combined pulleys, pull direction, effort and rope travel. It is the only bilingual page and supports Simplified Chinese and English. Open it directly from disk; the ideal model and research sources are documented in its [README](primary/pulley/README.md).

[Build a More Stable Tower](primary/tower/index.html) adds a colorful Year 6 stability lesson with adjustable height, base size and shape, sideways tests, and a live tipping graph. Its [README](primary/tower/README.md) records the curriculum mapping and model assumptions.

Start at the [experiment index](secondary/index.html) to browse all six apparatus previews and open an experiment. The responsive catalogue works offline and supports keyboard navigation. Its static SVG previews reuse the experiments’ actual geometry without running simulations in the background. After changing apparatus artwork or the catalogue entries, run `node build-index.mjs` to refresh the page and previews using Node.js and Chrome/Chromium; no toolkit installation is required.

| Experiment | Page | Formula |
| --- | --- | --- |
| Build a More Stable Tower (Primary Year 6) | [primary/tower/index.html](primary/tower/index.html) | aₜᵢₚ = gb/h꜀ |
| Boyle’s law | [secondary/boyle/index.html](secondary/boyle/index.html) | PV = constant |
| Convex lens | [secondary/convex/index.html](secondary/convex/index.html) | 1/f = 1/u + 1/v |
| Ohm’s law | [secondary/ohm/index.html](secondary/ohm/index.html) | V = IR |
| Latent heat of fusion | [secondary/latent-heat/index.html](secondary/latent-heat/index.html) | Q = mLf |
| Liquid pressure | [secondary/liquid-pressure/index.html](secondary/liquid-pressure/index.html) | P = ρgh |
| Free fall | [secondary/free-fall/index.html](secondary/free-fall/index.html) | h = ½gt²; g = 2h/t² |
| 滑轮实验室 · Pulley Lab (Primary 3) | [primary/pulley/index.html](primary/pulley/index.html) | F = W/n; s = nh |

Drag a model, adjust its sliders, or focus the model and use the arrow keys. Home and End select the limits. Auto explore animates the experiment; Reset restores its starting state. Reduced-motion preferences are respected.

Each normal page has a title and short description, with its formula above the live output cards.

Every secondary experiment has a **Home** link to the secondary catalogue. It is hidden and unavailable to keyboard focus in native and fallback fullscreen, then restored on exit. The shared Science Concepts icon appears on the catalogue, Home links and browser tabs.

Pages center horizontally and vertically in the available viewport. Content taller than the viewport starts at the top and scrolls normally, keeping phone controls accessible.

The latent-heat rig melts crushed ice at 0°C, collects the water on a balance, and traces a flat heating-curve segment. Adjust heater power or ice mass, or scrub supplied energy. The heater cuts off when melting finishes. Readouts obey Q = mLf throughout; temperature never rises during melting. A fullscreen label follows the adjustable heater dial.

The liquid-pressure bench connects a draggable membrane probe to a U-tube manometer. Compare depth at fixed density, then density at fixed depth. Rotate the probe to see that pressure is independent of orientation; fullscreen labels move depth and orientation.

The free-fall tower releases a steel ball from an electromagnet and stops its timer at an impact detector. Equal-time position markers show uniform acceleration. Adjust height and mass, scrub the fall, and explore the h-versus-t² graph. All masses fall with the same g when air resistance is negligible.

The desktop overview fits at 100% browser zoom on a 1366×768 laptop display, with readable labels, compact cards and tightly framed models. The convex distance controls sit side by side on desktop; phone controls remain stacked.

**Full Screen** opens only the model and live output. Dragging and keyboard controls remain available. Use **Exit Full Screen** or Escape to return. Browsers without the Fullscreen API use a viewport-filling fallback.

Movement labels appear only in fullscreen: “Drag piston” for Boyle, “Slide contact” for Ohm, and “Drag object” / “Drag screen” for the convex lens. Drag a label or focus it and use the arrow keys to move its component. The convex-lens fullscreen also includes a live white-screen close-up.

Each folder contains its HTML model, animation logic and material colors. `shared.css`, `shared.js` and `geometry.js` provide the common layout, fullscreen behavior and isometric projection. Edit these files directly; generated copies and external toolkit installations are unnecessary.

The original transparent science-teacher mascot, six experiment poses and layered campaign cover are in [social-posts](social-posts/README.md).

Run browser checks with Node.js 22+ and Chrome or Chromium:

```sh
node check.mjs
```

Set `CHROME_PATH` if the executable is not in a standard location. Checks cover physics, controls, animation, desktop/mobile layout, reduced motion, native fullscreen and its fallback. Screenshots are written to ignored `artifacts/`.

See [AGENTS.md](AGENTS.md) for the page design, repository rules and standard workflow for adding another physics concept with `$anatomy`.
