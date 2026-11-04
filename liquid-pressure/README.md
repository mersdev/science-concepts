# Liquid pressure

Use **Home** to return to the [experiment index](../index.html). The link appears only outside fullscreen.

Open `index.html` directly; no network, installation or build is needed.

The clear tank, sliding membrane probe, air hose and open U-tube manometer form one Anatomy Figure. Lowering the membrane increases the pressure and pushes the connected manometer column down while the open column rises.

## Controls

- **Compare depth** starts with water at 1000 kg/m³ and a probe at 0.10 m. Density stays locked at the selected value. **Lower probe** alternates between 0.50 and 0.10 m.
- **Compare density** holds the current depth fixed. **Use denser liquid** alternates between the current liquid and 1260 kg/m³ (then water at 1000). At the surface both pressures remain zero.
- **Free explore** unlocks both quantities. Density colors indicate oil (800), water (1000), glycerol (1260), and intermediate illustrative liquids.
- Drag vertically in the apparatus or use depth's slider. Focus the apparatus or depth label and use arrows (0.01 m), Home or End. Depth stays locked during density comparison.
- Drag the orange rotation handle horizontally, use its slider, or focus its fullscreen label and use arrows (5°), Home or End. Rotation changes orientation without changing depth or pressure.
- **Auto explore / Pause** sweeps only depth, or only density in density comparison. It pauses work when hidden or offscreen, and is disabled for reduced motion. Manual changes stop it.
- **Reset** restores water, 0.10 m, 0°, the initial graph point and depth comparison. **Full Screen** retains the apparatus, readout, exit button and anchored movement labels. Escape exits and restores focus.

## Physics and assumptions

Gauge pressure P = ρgh, in pascals, with g = 9.81 m/s². Depth h spans 0–0.60 m; density ρ spans 800–1260 kg/m³. The maximum pressure is 7416.36 Pa. The graph uses kPa and metres and always includes the water reference line.

The manometer contains separate dyed water with ideal constant density ρm = 1000 kg/m³. Its height difference is ΔH = P/(ρm g) = ρh/ρm, in metres; each equal-bore limb moves ΔH/2 in opposite directions. Maximum ΔH is 0.756 m. The tank and manometer have different drawing scales (280 and 200 SVG units per metre); the apparatus is schematic, and the displayed numerical difference is the physical value.

The reservoir and open manometer limb share atmospheric pressure. Air transmits the membrane pressure to the connected limb; air weight, capillarity, membrane stiffness, air compression and transient oscillations are neglected. Fluids are uniform, incompressible and stationary. Density changes represent replacing the entire test liquid, rather than mixing or layering it. Auto mode is a sequence of equilibrium states.

The membrane is an ideal point probe at its centre; its drawn size and deformation are illustrative. At h = 0 the gauge pressure and manometer difference are zero. Pressure is a scalar, independent of membrane orientation at a fixed point; equal inward arrows represent equal normal stresses and vanish at the surface. The rotating handle illustrates membrane orientation. It does not stir the liquid. Absolute pressure would be atmospheric pressure plus P.

## Geometry and checks

The portable geometry is constructed once in `app.js`: a shaded bench, glass tank and rim, rail, carriage, membrane, gasket, mounting bolts, rotary grip, hose, couplings, manometer board, tube saddles, scales and screws. Moving geometry uses transforms; only the flexible hose and fluid column paths change. Back walls and liquid precede the probe, and the front glass rim follows it.

`node check.mjs` checks physics, controlled variables, manometer geometry, orientation, reset, drag, keyboard, animation, reduced motion, desktop and phone layout, fullscreen and fallback. Screenshots are written to ignored `artifacts/`.
