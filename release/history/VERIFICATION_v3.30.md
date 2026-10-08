# Verification — Grandis Legacy PvP v3.30

Date: 2026-09-04

## Passed

- `node tests/run-v330-mobile-controls-functional.cjs`
  - Active-match cross-app hamburger is directly hidden.
  - Mobile nav refuses to reopen while match-active.
  - PvP capture-phase Hero action star routes to the VS AI mobile action opener through the UI bridge.
  - Bridge opener was exercised against a real initialized PvP runtime state and returned success.
- `npm run check` — PASS.
- `npm run test:package` — PASS.
- `npm run test:bridge` — PASS.
- `npm run test:ui` — PASS.
- Runtime sync lock v2.51 self-test — PASS.

## Live network limitation

A live WebSocket room integration run is not claimed in this environment unless the `ws` dependency is installed and the room test is actually executed.
