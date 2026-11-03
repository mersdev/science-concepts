# Ohm’s Law — The Current Lab

Open `index.html` directly in a browser. This self-contained lesson covers Form 5 Chapter 3, SP 3.2.1. No server or installation is needed. Notebook readings last for the current page session.

Adjust the voltage with the slider, drag the circuit bench, or focus it and use arrow keys (Shift for 1 V steps), Home and End. Switch between the resistor and bulb, compare curves, record readings, open the circuit key, and answer the prediction check. Auto sweep pauses on interaction; reduced-motion mode uses still endpoints.

The fixed resistor is 10 Ω with temperature held constant. The illustrative bulb uses `V = 10I + 30I³`, giving increasing steady-state resistance `V/I = 10 + 30I²`. It is a qualitative teaching model, not a fit to a particular bulb or a thermal transient simulation. At zero voltage, current is zero and V/I is undefined. The 12 V source and series rheostat set voltage across the conductor; at 0 V the circuit is open. Meters are ideal. The isometric board traces are schematic; the circuit key specifies the series and parallel connections.

Development uses the installed anatomy kit at `/Users/baoren/.agents/skills/anatomy`:

```sh
node build.mjs --audit
node check.mjs
```

Both conductor geometries are audited. Browser checks cover physics, zero voltage, conductor switching, comparison, recording, keyboard, dragging, sweep, quiz, themes and line endings. Screenshots live in `shots/`. `index-dark.html` opens the same lesson in dark mode.

The amber LED on the front of the bench is a buffered teaching voltage indicator. Its brightness scales from off at 0 V to bright at 12 V for either conductor, without changing test current. This is not a bare LED I–V or photometric model.
