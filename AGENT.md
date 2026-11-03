# Repository instructions

- Keep every experiment’s `index.html` focused on the animated model, live outputs, essential controls, a relationship graph and its formula. Use the compact optical-bench and Boyle’s-law references as the layout standard.
- Do not add hero sections, lesson navigation, quizzes, notebooks, long explanations, promotional content or decorative sections.
- Put sliders below the model. Use one primary experiment action, Auto explore/Pause and Reset; keep controls functional, keyboard accessible and responsive.
- Put a button labeled **Full Screen** at the model’s top right. Fullscreen shows only the model and live output, plus the exit button. Hide controls, graphs, formulas, badges and surrounding content. Preserve model dragging and keyboard operation. Support Escape, restore focus on exit and provide a fallback when native fullscreen is unavailable.
- Preserve the real animated SVG apparatus and correct physics. Respect reduced motion and pause animation when the document is hidden.
- Prefer plain HTML, CSS and JavaScript. Keep shared behavior in the root shared files and experiment-specific behavior in its folder. No build or runtime dependencies are needed.
- Maintain the root and experiment README files. Ignore screenshots, local environments, dependency folders, caches and OS metadata. Commit only necessary source, documentation and runnable checks.
- Run `node check.mjs` after changes to interactions, physics or layout. Review the desktop, phone and fullscreen screenshots in `artifacts/`.
