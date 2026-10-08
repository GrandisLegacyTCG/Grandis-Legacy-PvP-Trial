# Verification — PvP v3.24

## Result
**PASS for the targeted runtime regression and all offline/runtime/bridge/UI/package coverage executed in the packaging environment.**

## v3.24 targeted regression
- `node tests/run-v324-quick-reload-aura-counter.cjs`: **PASS**.
- Reproduces the actual server handoff state where the mandatory Draw has already raised Aura Infusion Bolt to 1 counter and the Node Draw Review runtime resolves **Quick Reload**.
- After Shuffle & Redraw:
  - Aura Infusion Bolt Draw Counter: **1 → 2**.
  - Visible Attachment counter: **1 → 2**.
  - `Draw This Turn`: **1 → 2**.
  - Draw Review completes into **Deploy**.
- The same flat Runtime Data v0.14.2 authority adapter is also checked for the full server Draw Phase helper.

## Regression coverage executed
- `npm run check`: **PASS**.
- `node tests/run-v309-conditional-followup-audio.cjs`: **PASS**.
- `node tests/run-unbroken-stand-class-row.cjs`: **PASS**.
- `node tests/run-arcane-duelist-legality.cjs`: **PASS**.
- `node tests/run-card-played-audit.cjs`: **PASS**.
- `npm run test:package`: **PASS**.
- `npm run test:bridge`: **PASS**.
- `npm run test:ui`: **PASS**.
- Runtime sync verifier v2.51: **PASS**.

## Root cause verified
The PvP browser runtime already increments Aura Infusion Bolt for the mandatory Draw. The server intercepts the Quick Reload / Rapid Chamber confirmation and performs the replacement draw in `runtime/pvp/draw-review-runtime.mjs`. That server adapter was reading only an obsolete nested `card.rules` metadata shape, while Runtime Data v0.14.2 exposes Aura Infusion Bolt authority at the card root. This is why `Draw This Turn` could reach 2 while Aura stayed at 1.

v3.24 reads current root-level Runtime Data first and keeps the nested shape only as a compatibility fallback.

## Live WebSocket integration limitation
The packaging environment does not have the npm dependency `ws` installed. Tests that boot the real WebSocket server were therefore not run here. The dependency remains declared in `package.json` and `package-lock.json`; no live-server result is claimed in this verification note.
