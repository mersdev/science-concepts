@/Users/baoren/.codex/RTK.md

# Repository instructions

## Shared design and language

- Keep every page in the same Science Concepts design system. Lesson pages use `shared.css` for the page shell, cards, colors, typography, controls and responsive layout; experiment stylesheets are for apparatus and control-specific details. Do not override shared page colors or rebuild the shell per experiment.
- Catalog pages use the shared catalog structure and `index.css`. Keep their header, card, typography, palette and mobile behavior consistent; vary the number and content of cards only.
- Only `primary/pulley/index.html` is bilingual. It supports Simplified Chinese and English. Keep `primary/index.html` and all secondary pages in English, without language toggles or translation attributes.
- A lesson page has a compact title and one-sentence description above its workspace. Do not add hero sections, lesson navigation, quizzes, notebooks, long explanations, promotional content or decorative sections.
- Keep the desktop overview readable and fully visible at 100% zoom on a 1366×768 laptop. Use compact spacing, keep the full model inside its stage, and arrange related controls side by side when useful. Fullscreen may use a larger model framing. Optional `data-overview-viewbox` bounds must include every allowed mechanism pose.
- Lesson workspace: animated model and controls on the left; formula, live outputs, relevant physical preview and relationship graph on the right, in that order. Stack on phones. Sliders sit below the model. Keep one primary action, Auto explore/Pause and Reset; controls must work with pointer and keyboard.
- Put the **Full Screen** button at the model’s top right. Fullscreen shows the model, live output, movement indicators, any relevant live preview and the exit button. Hide page text, sliders, graphs, formulas, badges and other controls. Preserve model dragging and keyboard operation, support Escape, restore focus and provide a fallback when native fullscreen is unavailable.
- Show `.move-hint` indicators only in fullscreen. Anchor each to a genuinely movable part with `positionMoveHint()`, keep it aligned during movement and resize, and support dragging plus arrow keys, Home and End. Fixed parts have no indicator. Keep labels visible on narrow screens and synchronize them with the real model values.
- Convex lens fullscreen includes its live white-screen preview and indicators for the independently movable object and screen; the lens stays fixed. Move the same preview node into fullscreen on `model-fullscreen-change` and restore it on exit. Do not duplicate IDs or create a second preview.

## Implementation and maintenance

- Preserve each real animated SVG apparatus and its correct physics. Drive motion, readouts, previews and graph points from one model. Define units, ranges, limits, constants and boundary cases; document illustrative approximations in the experiment README.
- Respect reduced motion. Pause animation and background work while the document is hidden or the model is offscreen.
- Prefer plain HTML, CSS and JavaScript. Put shared behavior in root shared files and experiment-specific behavior in its folder. Pages must open directly from disk and work offline without installation or build dependencies.
- Maintain the root and experiment READMEs. Ignore screenshots, local environments, dependency folders, caches and OS metadata. Commit only necessary source, documentation and runnable checks.
- After layout, interaction or physics changes, run `node check.mjs` and review desktop, phone and fullscreen screenshots in `artifacts/`.

## Creating another physics concept with `$anatomy`

Treat `secondary/boyle/`, `secondary/convex/` and `secondary/ohm/` as the established lesson standard. Follow these rules automatically when asked to add a concept; the repository design rules take precedence over the Anatomy skill’s default lesson framing.

1. Read the installed Anatomy skill and the closest existing experiment first. Follow its physical apparatus, purposeful detail, geometry, depth order, motion and verification guidance while retaining this repository’s shared design.
2. Add a clearly named folder inside the appropriate series with `index.html`, `app.js`, `style.css` and `README.md`. Reuse root shared files. For a concept one level below the root, load `../../shared.css` before its stylesheet, then scripts as `../../geometry.js`, `app.js`, and `../../shared.js`. Keep it offline and directly runnable.
3. Use the shared lesson structure: a compact title and one-sentence learning goal; model and controls on the left; formula first, then live output, relevant preview and graph on the right. Do not add unrelated teaching or promotional sections.
4. Keep one physics model as the source for motion, readouts, preview and graph. Document units, ranges, limits, constants, boundary cases and illustrative approximations. Include pointer and keyboard interaction, labelled sliders, a primary action, Auto explore/Pause and Reset. Reset restores the model and graph. Respect reduced motion and hidden/offscreen pause behavior.
5. Use shared fullscreen behavior: `.stage-wrap` is the target, `#stage` is the model region, `#fullscreen` is the button and `[data-readout]` holds current values. Fullscreen keeps the apparatus, live output, anchored indicators and any useful live physical preview; it hides controls, graph, formula, title and description. Move a shared preview DOM node on `model-fullscreen-change` and restore it on exit.
6. Label every adjustable component with a fullscreen-only movement indicator. Support pointer and keyboard movement, keep indicators anchored and in the viewport, and keep controls, readouts and model state synchronized. For multiple parts, make selection and independent movement clear.
7. Extend `check.mjs` with concept-specific physics and interaction checks. Cover initial and extreme states, primary action, reset, dragging, keyboard, auto mode, reduced motion, indicator visibility, output synchronization, native and fallback fullscreen, Escape, focus restoration and preview restoration when relevant. Check 1366×768 and 1440×900 desktop, 390px phone and 320px narrow layouts at 100% zoom. Run Anatomy geometry and line audits for new geometry; inspect screenshots and mechanism close-ups.
8. Add the concept to the root README table and document its controls, formula, assumptions and ranges in its README. Keep final page source and necessary portable generation source; exclude toolkit installations, absolute-path dependencies, duplicate generated pages, screenshots, caches, logs and dependency folders.
