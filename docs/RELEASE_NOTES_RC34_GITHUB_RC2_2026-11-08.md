# Grandis Legacy PvP Season 0 RC34 - GitHub RC2

**Build:** `gl-s0-rc34-github-rc2-2026-11-08`  
**Release type:** deadlock / liveness / reconnect fix, staging candidate.  
**Parent:** RC34 GitHub RC1.  
**Target:** `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial`; manual GitHub push only.

## Changes

1. **Server phase authority:** resolved mandatory Draw automatically advances to Deploy for Seat 1 or 2; End-phase Provoke's required opponent Mana selection now hands off immediately, without relying on a browser timer.
2. **Perspective state:** Seat-2 mirror now transforms turn-owned Provoke, per-turn action and end-cleanup markers to avoid duplicate effects or a wrong cursor after the other player's decision.
3. **Pregame recovery:** coin choice is idempotent; pregame stages are cancellable and have connected-player, acknowledgement, timeout and disconnect escape paths. Start requires both players connected; lost animation ACK has bounded grace.
4. **Surrender:** available during a pending opponent decision, an opening-animation busy gate, or an older inflight request; server permits an authenticated concession even if the base revision became stale.
5. **Opening animation:** watchdog clears locks/masks after a missing callback; old callbacks cannot break a newly started presentation.
6. **Network action responses:** `clientActionId` matching protects later queued requests from duplicate or delayed ACK. A timeout prompts resync.
7. **Fair inactivity:** timeout applies to current decision owner, not the waiting seat; there is reconnect grace for an unavailable owner.
8. **QA:** new deterministic engine, actual WebSocket, fault-injection ACK and opening handler tests included in `npm run check` and GitHub Actions.

## Preserved

- RC34 Season 0 static card definitions and original source ZIP; no changes to approved card balances.
- Lobby PvP Gold Import layout, art, animation assets, sound effect and optional background music.
- Atomic Mana PAY + full viewer-safe server authority, privacy, existing Network and Docker architecture.

## Test status and limits

`npm run check` and `npm run build:precompress` pass locally, including the RC34 **20/20** rules regression and new liveness tests. This verifies several root causes from the RC1 audit, **not** complete browser gameplay. Chromium in this local environment cannot navigate the test server (`ERR_BLOCKED_BY_ADMINISTRATOR`), so real two-browser/manual mobile opening, coin, PAY, animation, reaction, extended match, and hosted WSS still need testing. The Docker build likewise requires GitHub Actions or a Docker-capable host. **Not production FINAL.**

See `docs/RC34_RC2_DEADLOCK_FIXES_2026-11-08.md`, `docs/QA_STATUS_2026-11-08.md` and `docs/GITHUB_DEPLOY_RC34.md`.
