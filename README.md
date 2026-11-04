# Science concepts

Small, interactive physics experiments. Open an `index.html` directly in your browser; no build, installation or network connection is required.

| Experiment | Page | Formula |
| --- | --- | --- |
| Boyle’s law | [boyle/index.html](boyle/index.html) | PV = constant |
| Convex lens | [convex/index.html](convex/index.html) | 1/f = 1/u + 1/v |
| Ohm’s law | [ohm/index.html](ohm/index.html) | V = IR |
| Liquid pressure | [liquid-pressure/index.html](liquid-pressure/index.html) | P = ρgh |

Drag a model, adjust its sliders, or focus the model and use the arrow keys. Home and End select the limits. Auto explore animates the experiment; Reset restores its starting state. Reduced-motion preferences are respected.

Each normal page has a title and short description, with its formula above the live output cards.

The liquid-pressure bench connects a draggable membrane probe to a U-tube manometer. Compare depth at fixed density, then density at fixed depth. Rotate the probe to see that pressure is independent of orientation; fullscreen labels move depth and orientation.

The desktop overview fits at 100% browser zoom on a 1366×768 laptop display, with readable labels, compact cards and tightly framed models. The convex distance controls sit side by side on desktop; phone controls remain stacked.

**Full Screen** opens only the model and live output. Dragging and keyboard controls remain available. Use **Exit Full Screen** or Escape to return. Browsers without the Fullscreen API use a viewport-filling fallback.

Movement labels appear only in fullscreen: “Drag piston” for Boyle, “Slide contact” for Ohm, and “Drag object” / “Drag screen” for the convex lens. Drag a label or focus it and use the arrow keys to move its component. The convex-lens fullscreen also includes a live white-screen close-up.

Each folder contains its HTML model, animation logic and material colors. `shared.css`, `shared.js` and `geometry.js` provide the common layout, fullscreen behavior and isometric projection. Edit these files directly; generated copies and external toolkit installations are unnecessary.

Run browser checks with Node.js 22+ and Chrome or Chromium:

```sh
node check.mjs
```

Set `CHROME_PATH` if the executable is not in a standard location. Checks cover physics, controls, animation, desktop/mobile layout, reduced motion, native fullscreen and its fallback. Screenshots are written to ignored `artifacts/`.

See [AGENTS.md](AGENTS.md) for the page design, repository rules and standard workflow for adding another physics concept with `$anatomy`.
