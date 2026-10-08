# Verification — PvP v3.27

Date: 2026-09-04

Completed verification:

- `npm run sync-lock`: PASS (25 runtime-sync files)
- `npm run check`: PASS
- PvP custom deck legality: PASS — exactly 60 Main Deck cards
- Lobby copy-limit validation: PASS — normal max 3 / Ultimate max 1 using canonical runtime card data
- Gameplay/runtime deck validator: PASS — normal max 3 / Ultimate max 1
- Authoritative server deck validator: PASS — normal max 3 / Ultimate max 1
- Card Played parity with VS AI v6.24: PASS
- P.Atk / M.Atk / P.Def / M.Def audiovisual regression checks: PASS
- Quick Reload / Aura Infusion Bolt Draw This Turn counter regression: PASS
- Draw Phase, redirect, mobile, response, Starter60, authority, and UI regression suites: PASS
- `npm run test:package`: PASS
- `npm run test:bridge`: PASS
- `npm run test:ui`: PASS
- Package manifest verification: PASS (227 files before final documentation refresh; regenerated for release)

Live server / WebSocket integration tests could not execute in this sandbox because the package dependency `ws` is not installed in the environment. `test:server` and `test:room` therefore fail at server startup with `ERR_MODULE_NOT_FOUND: ws`; no live-network PASS is claimed.
