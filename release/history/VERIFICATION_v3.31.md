# Verification — Grandis Legacy PvP v3.31

Date: 2026-09-04

## Passed

- `node tests/run-v331-player-name-binding.cjs` — PASS.
  - Reproduces the reported condition: canonical board contains stale `OPPONENT`, while the live room snapshot exposes the real remote name.
  - Confirms the battlefield opponent header renders the live remote name.
  - Confirms the local header renders the live local name.
  - Confirms stale `OPPONENT` no longer wins.
- `npm run check` — PASS.
- `npm run test:package` — PASS.
- `npm run test:bridge` — PASS.
- `npm run test:ui` — PASS.
- Runtime sync lock v2.51 self-test — PASS.

## Live network limitation

A live WebSocket room integration run is not claimed in this environment because the `ws` dependency is not installed in the execution sandbox.
