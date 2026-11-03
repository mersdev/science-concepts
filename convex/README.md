# Convex Lens — The Light Lab

Open `index.html` directly. This standalone interactive lesson covers F4 Chapter 6, SP 6.4.1. No installation or server is required.

Move the illuminated object with the slider, presets, pointer drag or keyboard (arrows: 0.5 cm; Shift: 5 cm; Home/End: limits). Slide the white screen manually or use **Find sharp image**. A close-up shows the projection sharpening or blurring. Only focused real images can be recorded. Notebook readings last for the page session.

The fixed focal length is 20 cm. The ideal thin-lens model uses `v = fu/(u-f)` and signed magnification `m = -v/u`. Object distance u is positive; real v is positive, virtual v is negative. At u = f, v is infinite and 1/v is zero. Virtual images remain visible through the lens but cannot be projected on the white screen.

The reciprocal plot obeys `1/v = -1/u + 1/f`: gradient −1 and vertical intercept 0.050 cm⁻¹. The signed virtual branch is dashed. Switch to v versus u to inspect the asymptotes. Distances use centimetres throughout.

Object travel: 10–80 cm. Screen travel: 22–100 cm. A focus tolerance of ±0.35 cm permits recording; the table stores the actual screen distance. A real image may fall outside the bench travel when u is close to f. Screen defocus is an illustrative geometric blur, not a wave-optics, brightness or exposure simulation. The optical apparatus and lens thickness are schematic; the screen is viewed from the rear. The side-view ray diagram uses two paraxial principal rays and shows backward extensions for virtual images. Images outside its bounds are explicitly identified.

Build and verify using the installed anatomy kit:

```sh
node build.mjs --audit
node check.mjs
```

The geometry audit checks all solids. Browser checks cover the lens equation, magnification, real/virtual/focal cases, focusing, screen travel, recording, rays, graphs, quiz, keyboard, dragging, auto explore, themes and line ends. Screenshots are in `shots/`. `index-dark.html` opens in dark mode.
