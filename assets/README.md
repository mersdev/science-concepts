# Site assets

`science-concepts-icon.svg` is the flat 2D site mark: a diagonal ruler with scale marks, dark-teal outlines, sage details, and a coral measurement line. `science-concepts-icon.png` is its 256 × 256 transparent raster for the catalogue, Home links, and browser tabs.

`language-icon.svg` is the matching flat globe-and-speech icon used by the primary language toggle.

Both marks use the palette and rounded outlines of the experiment illustrations. The SVG files are the editable sources.

`catalog/` contains static SVG snapshots of the initialized experiments. Refresh them and the root catalogue with `node build-index.mjs`; their source geometry stays in each experiment folder. These previews include only the shared SVG styles and palette, plus the experiment's own styles, rather than copies of the shared page layout.

## Experiment icons

Transparent PNG icons are in `experiments/`, styled to match [`mascot-base.png`](../social-posts/characters/mascot-base.png). Use them wherever a compact experiment illustration is useful.

| Experiment | Icon |
| --- | --- |
| Boyle’s law | [boyle.png](experiments/boyle.png) |
| Convex lens | [convex-lens.png](experiments/convex-lens.png) |
| Ohm’s law | [ohms-law.png](experiments/ohms-law.png) |
| Latent heat of fusion | [latent-heat.png](experiments/latent-heat.png) |
| Liquid pressure | [liquid-pressure.png](experiments/liquid-pressure.png) |
| Free fall | [free-fall.png](experiments/free-fall.png) |

Generation used the built-in imagegen tool. Shared style-transfer prompt: “Image 1 is the required style reference: match its friendly, flat cartoon illustration, thick rounded dark-teal outlines, simple solid color shapes, very restrained soft shading, and palette of dark teal, sage, coral and cream. Image 2 is the exact apparatus to adapt. Redraw Image 2 as a clean, compact icon in Image 1's visual style; keep the experiment apparatus and recognizable parts, but remove photorealistic 3D rendering and fine surface detail. Center one isolated apparatus, sized large with generous transparent padding, recognizable when small. Use actual alpha transparency outside the illustration. No mascot/person, no background, no card, no border, no text, labels, numbers, equations or watermark. Preserve the distinct silhouette and scientific meaning of Image 2.” Subjects: Boyle’s law, convex lens, Ohm’s law, latent heat of fusion, liquid pressure, and free fall.
