# Site assets

`science-concepts-icon.svg` is the flat 2D site mark: a diagonal ruler with scale marks, dark-teal outlines, sage details, and a coral measurement line. `science-concepts-icon.png` is its 256 × 256 transparent raster for the catalogue, Home links, and browser tabs.

`language-icon.svg` is the matching flat globe-and-speech icon used by the primary language toggle.

Both marks use the palette and rounded outlines of the experiment illustrations. The SVG files are the editable sources.

`catalog/` contains static SVG snapshots of the initialized experiments. Refresh them and the root catalogue with `node build-index.mjs`; their source geometry stays in each experiment folder. These previews include only the shared SVG styles and palette, plus the experiment's own styles, rather than copies of the shared page layout.
