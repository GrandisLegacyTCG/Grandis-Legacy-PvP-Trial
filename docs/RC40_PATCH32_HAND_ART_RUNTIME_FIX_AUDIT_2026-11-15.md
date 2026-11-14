# Grandis Legacy PvP S0 RC40 Patch 3.2 — Battlefield Hand Runtime Fix

Date: 2026-11-15 (Asia/Jakarta)  
Read-only GitHub baseline: `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` main `6e16d410617aace6d8190e31af448e35b3ee4dba`.  
Existing GitHub Actions Run #47 (`43623519919`): **SUCCESS on baseline** (native ws, historical regression, Docker build and Docker health all green). **The newly generated package has NOT run in GitHub Actions**; it has not been pushed.

## Root cause

`public/battle/shared-app/app-runtime.js` called `glBindPlayerHandArtwork(card,im,id)` from `renderHand()` but contained no definition. A scan of `public/battle` sources confirmed no script in the Battlefield HTML supplied that function either. The undefined reference throws only after a real Hand is rendered, so syntax checks and server-side gameplay regression could previously pass while the Battlefield Hand failed at runtime.

## Minimal fix

- Defined a **functional** local-Hand artwork binder in the existing Battlefield IIFE. Its successful image path uses the same `art(id)` principle as the correct VS AI RC40 donor (`img.src=art(id)`), rather than introducing another renderer.
- A lightweight Back-of-Card background is visible during image loading. An `error` listener switches exactly once to the correct Main, Legacy or Mana back image. There is no onload-driven re-render, no timer and no extra WebSocket. Existing Website document-level art fallback is respected.
- Left `renderOpponentHand`, `glHiddenCommittedDrawSlots`, `glPendingDrawReservations`, Draw flight/reveal, authority engine, WebSocket bridge, seat tokens, response logic, lobby/server state, and privacy projection unchanged.
- Added an HTTP cache-busting **`hotfix=handart-20261115` query parameter** to the modified Battlefield runtime script; its `v` query parameter remains the exact Patch 3.2 Build ID. Updated one historical source assertion to validate the actual URL components strictly instead of requiring no additional query parameters.
- Added `tests/rc40-p32-battlefield-hand-artwork.mjs` to both `check:rc40-p32` and historical `check`.
- Handoff Website pack uses its existing `/card-art/` root and embeds the Northflank `wss://` origin explicitly supplied by the project owner. Local static tests assert both deployment routes and keep shared art OUT of the handoff.

## Invariants retained

- No change to `server.js`, `Dockerfile`, gameplay engine `public/battle/engine/shared-app/app.bundle.js`, networking `pvp-network.js`, `pvp-host.js`, or viewer-safe projection. No wire protocol or authority change.
- Final Build ID **unchanged**: `gl-s0-pvp-rc40-patch32-item-discard-2026-11-14`.
- Single lobby-owned WebSocket per player and same-origin iframe `postMessage` bridge remain intact.

## Local QA evidence

| Gate | Result | Evidence / caveat |
| --- | --- | --- |
| `npm run build:precompress` | PASS | 84 compressed assets; modified runtime sidecars regenerated. |
| `npm run check:rc40-p32` | PASS, exit 0 | Item/Discard 353/353, donor Card Played 11/11, privacy, two-seat WS gate, new Hand test. |
| `npm run check` | PASS, exit 0 | Entire historical regression, including networking, reconnect, privacy, UI source tests, Response, legacy and newer Hand test. |
| New Hand DOM contract regression | PASS, 54 checks | Executes **actual** `renderHand`, `renderOpponentHand`, and artwork binder under Node `vm` with minimal DOM stubs. Tests both asset roots, one-shot fallback, stable image writes, hidden opponent Hand, and hidden/unhidden Draw slots. Not a browser rendering test. |
| Static frontend handoff scan | PASS | 43 HTML refs + 26 CSS URL targets, 33 CSS files, zero missing. |
| Static local HTTP smoke | PASS, 15/15 | `/pvp/`, `/pvp/battle/`, scripts/CSS/back images and shared art under mock Website root all HTTP 200. |
| Local `GET /health` | PASS on **lite** | Correct Patch 3.2 version and Build ID, `transport: lite` because native ws unavailable locally. |
| Real local two-seat RFC6455 tests | PASS in **lite** mode | Included ws-gate and net-rc6-live tests; not the native ws module. |
| JS syntax / script dependency scan | PASS | `node --check` and all local `gl*`/`pvp*`/`s0*` function calls resolved in Battlefield runtime. Does not establish all possible runtime paths. |
| Native `npm ci` | **NOT VERIFIED locally** | Registry request stalled without a resolvable network response; command terminated after timeout. CI #47 previously succeeded **before this UI-only fix**. |
| Local `docker build` | **NOT VERIFIED locally** | Docker CLI/daemon unavailable in this environment. GitHub #47 Docker build and native health passed on baseline. |
| Real Chromium Battlefield | **NOT VERIFIED** | Playwright/Chromium attempted `http://127.0.0.1:39252/` and got `net::ERR_BLOCKED_BY_ADMINISTRATOR`; cannot assert rendering or Draw animation actually seen. |
| Northflank live `/health` and `wss://` | **NOT VERIFIED** | Owner-provided host DNS lookup failed in this execution environment; no live handshake or two-browser match. |
| New GitHub Actions run | **NOT VERIFIED** | User must upload manually; Run #47 success is from baseline only. |

### Deployment handoff

Website repository `main` was only read: it **already had Patch 3.2 build metadata** at the time of audit, and its own Hand helper. Do not assume it is still Patch 3.1 or blindly delete the currently deployed Website `/pvp/` directory. Give the separate handoff ZIP to the Website maintainer to reconcile, especially `pvp/battle/shared-app/app-runtime.js`, `pvp/battle/index.html`, and cache-busted `pvp/config.js`. Website repo was NOT modified.

Suggested backend environment: `NODE_ENV=production`, `PORT=3000`, `HOST=0.0.0.0`, `PVP_REQUIRE_WS=1`, `PVP_ALLOWED_ORIGINS=https://grandislegacytcg.web.id`, **one replica**. Check `/health` returns `transport:ws` and the stated exact Build ID before public acceptance. Website `pvp/config.js` uses owner-provided `wss://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run` with `wsPath:'/ws'`; **this host has NOT been live-verified here**.

## Release decision

**Local regression PASS; STAGING CANDIDATE, NOT PRODUCTION-READY.** Required remaining gates: fresh GitHub Actions success for this ZIP, native ws/Docker smoke on the new artifact, browser with an actual Hand rendering and Draw, plus live Northflank WSS / two-player privacy and reconnect.
