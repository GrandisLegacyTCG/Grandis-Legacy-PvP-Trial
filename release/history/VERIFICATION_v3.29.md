# Verification — PvP v3.29

Date: 2026-09-04

Verified in the packaged source environment:

- JavaScript syntax checks: PASS.
- `tests/run-v329-pvp-mobile-parity.cjs`: PASS.
  - active-match cross-app hamburger hiding;
  - mobile Hero action star routing;
  - authoritative Racial Trait route preserved;
  - Legacy/Hero sizing anchor parity;
  - lobby/server player-name propagation and seat mirroring;
  - post-render authoritative VFX/audio dispatch.
- Live-VFX renderer regression: PASS. The test delays Hero-anchor availability and confirms `M.Attack.png` and `P.Defense.png` are actually painted after retry.
- `npm run check`: PASS.
- `npm run test:package`: PASS.
- `npm run test:bridge`: PASS.
- `npm run test:ui`: PASS.
- Runtime sync lock self-test: PASS.
- PvP 60 / normal max-3 / Ultimate max-1 deck validator regression: PASS.

The full WebSocket server/room integration tests are not claimed as PASS in this sandbox because `node_modules` is not installed here, so the `ws` runtime dependency is unavailable for a real local room process.
