# Site assets

`science-concepts-icon.png` is the Science Concepts site icon, generated and edited with the built-in imagegen tool and resized to 256 × 256 for the catalogue, Home links and browser tabs. It has a transparent alpha background. It is a brand illustration, not a model of a particular experiment.

Generation prompt:

> Use case: logo-brand. Asset type: square website app icon and favicon for Science Concepts, an interactive Form 4 & 5 Physics learning site. Create one polished, simple, memorable symbol: an isometric mint-green laboratory instrument base holding a cream U-shaped magnet with one warm coral end, cradling a single small golden sphere. Communicate hands-on physics and curiosity with purposeful thick rounded forms. Match a calm light educational interface, sage green #397f73, cream #f7f8f3, warm coral #e58663. Center the compact symbol large on a solid pale cream square background, generous safe margin, clean silhouette recognizable at 32px. Softly crafted dimensional illustration, restrained four-tone shading, no thin detail, no lettering, no equations, no extra symbols, no watermark. This is a single finished app icon, not a presentation or sheet of alternatives.

Background-removal edit prompt (with transparent output enabled):

> Use case: background-extraction. Edit the provided Science Concepts app icon. Remove only the pale cream square background and all backdrop shadow; output genuine alpha transparency surrounding the instrument. Preserve the exact isometric mint-green base, cream horseshoe magnet with green and coral ends, golden sphere, composition, proportions, colors and shading of the icon itself. Keep the cream magnet solid and opaque. No new objects, no text, no white background, no checkerboard drawn into the image. Clean antialiased transparent cutout edges.

`catalog/` contains static SVG snapshots of the initialized experiments. Refresh them and the root catalogue with `node build-index.mjs`; their source geometry stays in each experiment folder. These previews include only the shared SVG styles and palette, plus the experiment's own styles, rather than copies of the shared page layout.
