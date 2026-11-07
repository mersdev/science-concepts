# Site assets

`science-concepts-icon.png` is a 256 × 256 transparent Newton’s cradle illustration for the catalogue, Home links, and browser tabs. `science-concepts-icon.svg` embeds the same logo.

`language-icon.svg` is the matching flat globe-and-speech icon used by the primary language toggle.

The PNG logo follows the palette and dimensional illustration style of the experiment icons. `language-icon.svg` remains an editable vector asset for the language toggle.

`catalog/` contains static SVG snapshots of the initialized experiments. Refresh them and the root catalogue with `node build-index.mjs`; their source geometry stays in each experiment folder. These previews include only the shared SVG styles and palette, plus the experiment's own styles, rather than copies of the shared page layout.

## Experiment icons

Transparent PNG icons are in `experiments/`. They show apparatus only and follow the rounded dark-teal outlines and teal, coral, sage and cream palette in the mascot artwork. Every active experiment has a matching character scene in the [character library](../social-posts/characters/README.md).

| Experiment | Character scene | Apparatus icon |
| --- | --- | --- |
| Build a More Stable Tower | [08-tower.png](../social-posts/characters/08-tower.png) | [tower.png](experiments/tower.png) |
| Why Triangles Make Structures Stronger | [09-bridges.png](../social-posts/characters/09-bridges.png) | [bridges.png](experiments/bridges.png) |
| Balancing a Seesaw | [10-seesaw.png](../social-posts/characters/10-seesaw.png) | [seesaw.png](experiments/seesaw.png) |
| How Gears Transfer Motion | [11-gears.png](../social-posts/characters/11-gears.png) | [gears.png](experiments/gears.png) |
| How a Wedge Splits Materials | [12-wedge.png](../social-posts/characters/12-wedge.png) | [wedge.png](experiments/wedge.png) |
| Moving Loads with an Inclined Plane | [13-inclined-plane.png](../social-posts/characters/13-inclined-plane.png) | [inclined-plane.png](experiments/inclined-plane.png) |
| How Screws Turn Rotation into Movement | [14-screw.png](../social-posts/characters/14-screw.png) | [screw.png](experiments/screw.png) |
| Inside a Mechanical Pencil Sharpener | [15-pencil-sharpener.png](../social-posts/characters/15-pencil-sharpener.png) | [pencil-sharpener.png](experiments/pencil-sharpener.png) |
| How Scissors and Hole Punches Work | [16-scissors-punch.png](../social-posts/characters/16-scissors-punch.png) | [scissors-punch.png](experiments/scissors-punch.png) |
| Boyle’s law | [01-boyle.png](../social-posts/characters/01-boyle.png) | [boyle.png](experiments/boyle.png) |
| Convex lens | [02-convex-lens.png](../social-posts/characters/02-convex-lens.png) | [convex-lens.png](experiments/convex-lens.png) |
| Ohm’s law | [03-ohm.png](../social-posts/characters/03-ohm.png) | [ohms-law.png](experiments/ohms-law.png) |
| Latent heat of fusion | [04-latent-heat.png](../social-posts/characters/04-latent-heat.png) | [latent-heat.png](experiments/latent-heat.png) |
| Liquid pressure | [05-liquid-pressure.png](../social-posts/characters/05-liquid-pressure.png) | [liquid-pressure.png](experiments/liquid-pressure.png) |
| Free fall | [06-free-fall.png](../social-posts/characters/06-free-fall.png) | [free-fall.png](experiments/free-fall.png) |

The new Primary scenes and icons were generated with the built-in imagegen tool using [`mascot-base.png`](../social-posts/characters/mascot-base.png), [`01-boyle.png`](../social-posts/characters/01-boyle.png), and the existing apparatus icons as visual references. The shared style and subject prompts are in the [prompt set](../social-posts/characters/prompts.md).
