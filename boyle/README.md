# Boyle’s Law — The Pressure Lab

Open `index.html` in a browser. The generated page contains its styles, SVG, and JavaScript; no installation or server is required. Web fonts are optional and have system fallbacks.

Drag the piston, use the volume slider or arrow keys, halve the volume, or run Auto explore. Switch between pressure–volume and pressure–reciprocal-volume graphs and between light and dark themes.

The model uses absolute pressure: `P = 6000 / V`, with P in kPa and V in mL. Gas quantity and temperature (300 K) stay constant. The 24 particles illustrate constant-speed molecular motion; pressure is calculated from Boyle’s law, not simulated collision counting. The cutaway apparatus is schematic.

## Development

The builder uses the locally installed anatomy skill at `/Users/baoren/.agents/skills/anatomy`.

```sh
node build.mjs --audit
node check.mjs
```

The geometry audit covers the 47 static solids. Browser checks cover the model, halving, limits, keyboard, dragging, graph selection, tour, themes, and line endings. Reduced-motion and 390 px layouts are checked separately. Screenshots are in `shots/`.
