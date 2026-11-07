# Grandis Legacy PvP Season 0 RC32 — deployment handoff (2026-11-08)

## Status

**DEPLOYMENT CANDIDATE — NOT DEPLOYED.** This full repository bundle contains the blank lobby fix and regression test, and can be committed to the existing GitHub PvP S0 repository. Remote GitHub push and Northflank deployment have not been performed in this session (no authenticated connection to either service). Northflank live gameplay remains NOT VERIFIED.

## Baseline and scope

Baseline: `Grandis_Legacy_PvP_S0_RC32_S1_Lobby_Network_Only_S0_HeroPreview_2026-11-08.zip`.
Approved fix: remove obsolete `openingPresented` reference which threw `ReferenceError` on lobby initialization. Retain PvP S1 v3.80.17 lobby shell and seat/network features. Retain Season 0 RC32 decks, Hero/Rank/Formation components, coin flip and gameplay engine. No unrelated gameplay/code changes were made in the candidate.

Code changes vs baseline: `public/pvp/pvp-host.js` (remove old export), `tests/lobby-init.mjs` (new regression test), `package.json` (test included in `npm run check`). Documentation updates are included.

## QA performed before packaging

- `npm run check`: **PASS** (syntax, parity, lobby initialization VM test, S0 starter catalog, WebSocket two-seat transition).
- Node local server `/health` and root `/` through HTTP: **PASS**.
- Chromium navigating to local HTTP: **BLOCKED BY ADMINISTRATOR** (not a product FAIL; browser-hosted UI is NOT VERIFIED).
- Docker build: **NOT VERIFIED** (Docker binary not present in current environment).
- GitHub CI, Northflank public HTTPS/WSS, two-browser full match: **NOT VERIFIED**.

## Deploy to the existing repo and service

1. Extract the archive; commit its **contents** (not the ZIP itself) to the **PvP S0** repository root. Preserve original S1 and VS AI repositories. This is a complete repo snapshot, not a one-file patch.
2. Verify GitHub Actions `QA` workflow succeeds after the push.
3. On Northflank, confirm the existing combined service points to the PvP S0 repository/branch, builds via root `Dockerfile`, CI and CD enabled, HTTP public port 3000, one running instance (room state is in-memory), health endpoint `/health`.
4. Verify Northflank deployed commit equals pushed GitHub commit; check `/health` and service build logs.
5. Use two independent browsers or profiles to confirm lobby visible, seats/Ready, S0 decks, coin flip and game entry, Attack/Response and match end. A local-test waiver is not a PASS.

No Northflank secrets or account credentials are embedded in the bundle.
