# Latent heat of fusion

Use **Home** to return to the [experiment index](../index.html). The link appears only outside fullscreen.

Open `index.html` directly in a browser. No installation or network is needed.

The Figure is an insulated melting tray on four legs, with crushed ice, an immersed thermometer, a side-wall heater, a drain and a collecting beaker on a balance. Ice shrinks and the beaker fills from the same energy model. Blue indicates ice and water; coral indicates supplied energy.

## Model

Ice starts at its atmospheric-pressure melting point, **0°C**. The latent heat of fusion is approximated as **334,000 J/kg**. Supplied energy is `Q = P × t`; melted mass is `m = Q / Lf`, in kg. Energy is clamped to `0 ≤ Q ≤ initial mass × Lf`. The thermometer and heating curve stay exactly at 0°C throughout this experiment. The heater cuts off once all ice has melted; this model does not simulate subsequent water heating.

Initial mass: 50–200 g, initially 100 g. Heater power: 100–1,000 W, initially 500 W. At 100 g, complete melting requires 33.4 kJ. Playback runs at 10× physical time, so 500 W takes 6.68 real seconds to melt 100 g. Auto explore repeats after a short pause. Changing mass starts a fresh sample; changing power preserves supplied energy.

Assumptions: ideal insulation, uniform thermal equilibrium, no heater/tray heat capacity, evaporation or ambient melting. Meltwater drains immediately with negligible retained mass and is collected completely. Collected mass equals melted mass; the blue liquid-volume illustration is schematic. Individual ice chips shrink equally in three dimensions with the cube root of remaining mass; apparatus dimensions and droplet speed are illustrative. Energy arrows represent heat transfer through the tray wall, not matter flow.

## Controls

- **Heater on / Heater off** starts or pauses energy supply; **Auto explore / Pause** repeats melting; **Reset** restores 100 g, 500 W, zero energy and the initial graph.
- Sliders set power, initial mass and supplied energy. Scrubbing energy pauses playback and allows revisiting any stage, including the initial and fully melted states.
- Drag the coral heater dial horizontally. Focus the model or fullscreen dial label and use arrows (10 W), Shift + arrows (100 W), Home (100 W) or End (1,000 W).
- **Full Screen** shows only the apparatus, live output and an anchored dial movement label. Exit with the button or Escape; focus returns to the button. A fallback supports browsers without native fullscreen.
- Reduced motion suppresses decorative arrow/drop travel; user-started heating still advances the physical readouts and phase change. Hidden/offscreen pages pause computation without catching up on return.

Run `node check.mjs` from the repository root for physics, interaction, accessibility and responsive/fullscreen checks. Review screenshots in ignored `artifacts/`.
