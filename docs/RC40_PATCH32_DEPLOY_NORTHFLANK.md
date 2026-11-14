# Grandis Legacy PvP RC40 Patch 3.2 - Manual Deployment Guide

**Target repo:** `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial`, branch `main`. **Do not write to the Website repository from this process.**

## 1. Update GitHub PvP-Trial manually

1. Backup or tag the current `main` locally for rollback.
2. Extract `Grandis_Legacy_PvP_Trial_RC40_Patch3_2_FULL_REPO_2026-11-14.zip` into a temporary directory.
3. Check its **root** has `Dockerfile`, `server.js`, `package.json`, `package-lock.json`, `public/`, `server/`, `scripts/`, `tests/` and `.github/workflows/qa.yml`. There must be no extra `Grandis-Legacy.../` nesting.
4. Replace the old PvP-Trial repository contents with extracted root contents. Remove old backups, but preserve untracked secrets only outside Git; do not upload `.env` or credentials.
5. Commit and push `main` **manually**. This assistant did not push, commit, or create a PR.
6. Inspect the repository Actions `qa.yml` run. It should install Node 22, Python WebSocket dependency, run `npm ci`, `npm run build:precompress`, `npm run check:rc40-p32`, `npm run check`, Docker build and Docker health checks. CI must be **green** before deployment.

## 2. Northflank Docker deployment

- Build source: GitHub `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` -> `main`.
- Build type: **Dockerfile** at repository root (`./Dockerfile`). Node base image: `node:22-alpine`.
- Service: one public HTTP service on **container port 3000**, with HTTPS/WSS provided by Northflank's ingress (not GitHub Pages). If setting a different port, also provide that `PORT` and match Northflank's port configuration.
- Replicas: **1**. Do not autoscale horizontally while lobby, match state, and seat tokens are held in server process memory.
- Health check: HTTP GET `/health`, expect 200 and JSON `ok:true`, `transport:'ws'`, `architecture:'s1-v38017-lite-lobby__s0-rc40-authority'`, and exact current `buildId`.
- Bind address: `HOST=0.0.0.0`. Server listens on `PORT`, not hardcoded IP/port in source.

Recommended environment variables:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
PVP_REQUIRE_WS=1
PVP_ALLOWED_ORIGINS=https://grandislegacytcg.web.id
```

Keep the current default timeouts unless QA establishes a problem. Other server parameters such as `MATCH_IDLE_MS`, `MATCH_DISCONNECT_GRACE_MS`, `COIN_CHOICE_TIMEOUT_MS`, `POST_MATCH_CLEANUP_MS` exist but do not require changing for this patch.

If Northflank injects `PORT` automatically, prefer the injected value and configure the service port to match it. Do not publish ports other than its HTTPS/WSS ingress without a reason.

## 3. Check the real backend (required)

From Northflank's assigned public HTTPS hostname, test:

```
GET https://<verified-northflank-host>/health
```

Verify `ok: true`, `transport: ws`, version `S0-RC40-PVP-NET-RC6-STAGE2-PATCH3.2`, and `buildId: gl-s0-pvp-rc40-patch32-item-discard-2026-11-14`.

The WebSocket URL must then be `wss://<verified-northflank-host>/ws`. Test with an RFC6455-compatible tool **sending Origin `https://grandislegacytcg.web.id`**. An unapproved origin must be rejected; production requires TLS (`wss://`). Do not assume any older Northflank hostname is active until tested.

## 4. Website frontend handoff (for the Website maintainer only)

The separate ZIP `Grandis_Legacy_PvP_RC40_Patch3_2_WEBSITE_FRONTEND_HANDOFF_2026-11-14.zip` contains `pvp/` only (plus handoff README). It is **not** a Node backend package. Handoff to the website maintainer; do not update `Grandis-Legacy-Website` from this PvP session.

Website maintainer must:

1. Extract `pvp/` into the **root** of `Grandis-Legacy-Website`, beside `index.html` and `deck-builder/`.
2. Set `pvp/config.js` **`wsBase`** to the **verified Northflank WSS origin** (`wss://<actual-host>`, without `/ws`). It intentionally ships blank and displays a configuration message rather than trying `wss://grandislegacytcg.web.id/ws`.
3. Confirm `/pvp/` and `/pvp/battle/` render and script paths resolve. The battlefield consumes `../build-meta.js` relative to `/pvp/battle/`.
4. Confirm all `card-art/S0-*.webp` references resolve against root `/card-art/`. The website already supplies 248 RC40-compatible files, no duplicate art added to `/pvp/`.
5. Confirm Lobby navigation: `GO TO VS AI` -> `/` and `GO TO DECK BUILDER` -> `/deck-builder/`.
6. Confirm `BACK TO LOBBY` returns both players to the PvP setup room, not to VS AI, via the authoritative room `return-to-lobby` operation.

**Frontend and backend build ID must be identical** or the server deliberately rejects the client. Deploy the backend first, then frontend.

## 5. Staging acceptance - two real browsers

Use two separate browsers/profiles (not two tabs sharing a copied seat token), same Website frontend, both connected to the same one-replica Northflank backend.

- Open Lobby, set two distinct names/decks (and try Custom Deck import), READY both, START, coin flip, choose turn order, confirm; both players must enter consistent match state.
- Verify Hand/Deck and undisclosed Mana identities are masked to opponent and spectator; inspect raw WebSocket frames, not only UI masking.
- Verify turn progression, Mana payment and loss, Attack/Response, Counter, status, Rank Up, Tribute, Legacy/Revive, victory and post-match cleanup.
- Verify latest six restricted Item class gates, including Archer uses Spectral Grappling Hook to protect Mage, wrong-class source rejection, duplicate Hand card copies and stale Discard choice denial without charges.
- Verify Card Played exact VS AI detail renderer + viewer-safe adapter and no extra WebSockets for animations; no double hit SFX on full BLOCK/DODGE; no Mana pool blink.
- Refresh one browser mid-game, reclaim seat via exact tab seat token, continue; attempt wrong token, expect rejection with no privacy leak.
- Verify desktop and narrow mobile viewports, 248 shared images, lobby/battle return, screenshots and real sounds. Test connection interruption and reconnect.
- Repeat after a fresh deployment (cache-busting) and check server `/health` version. If any mismatch, revert deployment until fixed.

## 6. Local smoke commands

```sh
npm ci --omit=dev --ignore-scripts --no-audit --no-fund
npm run build:precompress
npm run check:rc40-p32
npm run check
node --check server.js
npm start
# in another terminal: GET http://localhost:3000/health
# Docker, when available: docker build -t gl-pvp-rc40-p32 .
```

**Release gate:** do **not** mark production ready based only on deterministic/VM tests. Pass native `ws` CI, Docker build, staging WSS, two-browser gameplay, browser UI/audio and reconnect first.
