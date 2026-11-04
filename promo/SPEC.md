# SPEC

**GOAL:** Teachers see a usable classroom demo; students see that changing a condition changes a live physics result.

**OUTPUT:** HyperFrames, 1080 × 1920, 30 fps, Chinese text, 9:16.

**TIME:** 22 s × 30 fps = 660 frames. Silent, planned for muted playback.

**LOOK:** Ground `#f5f7f3`; ink `#263e39`; teal `#3d8d7e`; coral `#e99161`; violet `#8270a7`. `Noto Sans JP` supports Chinese glyphs. Titles 72 px bold; supporting lines 36 px; labels 30 px. Product captures use the real app palette. No grain, filters, gradients or decorative HUD.

**SAFE AREA:** Keep all Chinese copy and product screenshots between y=180 and y=1320. Leave the lower platform-overlay region empty.

**OBJECTS:** Cropped screenshots from the six working experiment pages, a single pointer, Chinese explanatory copy and a text end card. No drawn or invented app controls.

**MOTION:** One pointer action per experiment. Before/after source captures change at the click, with an 8-frame dissolve. Move the pointer for 12–18 frames; let the result hold. Use direct cuts and object-match handoffs between experiments. Keep titles still while read.

**SHOTS:**

| Frames | Shot and evidence | Chinese copy |
| --- | --- | --- |
| 0–83 | Boyle: drag 60 → 30 mL; 100 → 200 kPa, with PV constant. Teacher/student audience is stated over the real app on frame 0. | 老师课堂演示 · 学生自主探究 / 亲手改变量，实时看结果 |
| 84–167 | Convex lens: object distance 60 → 40 cm; image distance 30 → 40 cm, reaching a sharp real image. | 物距一变 / 成像跟着变；物距 60→40 cm · 像距 30→40 cm |
| 168–251 | Ohm: 6 → 12 V and 0.6 → 1.2 A on the fixed resistor. | 电压加倍 / 电流也加倍 |
| 252–335 | Latent heat: 16.70 kJ melts 50 g; temperature stays at 0°C. | 冰在融化 / 温度仍为0°C |
| 336–419 | Liquid pressure: h = 0.10 → 0.50 m; P = 0.98 → 4.91 kPa. | 探头越深 / 压强越大 |
| 420–503 | Free fall: compare 100 g and 250 g in the real model at t = 0.300 s; h and g stay the same. The live output panel is shown once because its readouts do not change with mass. | 换个质量 / 落下距离不变 |
| 504–659 | End card names all six concepts, then gives the project repository URL and direct-open instructions. | 六个互动实验 / 下载后用浏览器打开 |

**BANNED:** Fake controls, decorative formula cards, tiny centered app screenshots, unverified live-demo claims, English-only promotional copy, logo-only opening, sound claims, and a live website URL (none is configured).

**QA:** Check frame 0, every apparatus/result transition, Chinese glyph rendering, 360 px phone snapshots, final repository URL, silent playback disclosure, lint/runtime/layout/contrast checks, and the Studio preview before requesting render approval.
