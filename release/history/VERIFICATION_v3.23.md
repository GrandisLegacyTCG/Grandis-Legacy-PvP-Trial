# Verification — PvP v3.23

## Result
**PASS for all offline/runtime/bridge/UI/package regression coverage available in the packaging environment.**

## v3.23 targeted parity checks
- `node tests/run-v323-turn-flow-parity.cjs`: **PASS**.
- `npm run test:bridge`: **PASS**.
  - Opening first player: mandatory Draw resolves and state reaches **Deploy** automatically.
  - Next canonical player after End: mandatory Draw resolves and state reaches **Deploy** automatically.
  - `pvpTurnReady` acknowledgement is not required.
- `npm run test:ui`: **PASS**.

## Preserved v3.22 regression coverage
- `npm run check`: **PASS**.
- Package/source/manifest contracts: **PASS**.
- Redirect fresh Defense Window and Attack Direction Indicator: **PASS**.
- Source Stack / Hero Components / canonical Defense / deck 50-or-60 rules: **PASS**.
- Card Played audit, Spectral Grappling Hook fixes, immediate Legacy choice, Draw This Turn parity, attachment/defeat/casting/gameplay-foundation checks: **PASS**.
- Runtime sync verifier v2.51: **PASS**.

## VS AI → PvP behavior audit
The shared-board exceptions in `app.bundle.js` were reviewed. The clear parity gap was the PvP-only Draw/turn-start acknowledgement path and the shared-mode Draw continuation. PvP-only exceptions that are required for multiplayer semantics (remote pending ownership, hidden information, server result flow, spectator handling, disabled Local-AI director) were intentionally preserved.

## Live WebSocket integration limitation
The packaging sandbox does not contain the npm dependency `ws`, so tests that boot the real WebSocket server (`run-server-health-test.cjs`, `run-pvp-room-sync-test.cjs`, and the live portion of `run-v307-network-regression.cjs`) cannot start `server.js` here. The dependency remains declared in `package.json` / `package-lock.json`. This is an environment dependency limitation, not an observed gameplay/runtime regression.
