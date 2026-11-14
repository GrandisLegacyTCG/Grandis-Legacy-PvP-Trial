# Grandis Legacy PvP RC40 Patch 3.2 - Manual GitHub, Northflank and Website Handoff

**Target/backend:** `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial`, branch `main`. **Target/static frontend:** `https://grandislegacytcg.web.id/pvp/`. NO assistant push/deploy. **State:** STAGING CANDIDATE; live verification required.

## A. Upload the FULL REPO manually (PvP-Trial only)

1. Save a backup/tag of current PvP-Trial `main` (previous SHA `24fb7204ab073d69e543c23a2ceef5270c42ae8e`). Do NOT change the separate Website repository here.
2. Extract the final FULL REPO ZIP to a temporary folder. Its **root** contains `.github/workflows/qa.yml`, `Dockerfile`, `server.js`, `package.json`, `package-lock.json`, `public/`, `server/`, `scripts/`, `tests/`, `docs/`. There is no extra wrapper folder.
3. Open the local checkout of `Grandis-Legacy-PvP-Trial`, and copy the **contents** of the extracted folder to the repository root. Do not copy a new nested folder or the ZIP itself. Preserve the existing `.git` directory (never overwrite `.git`). Remove obsolete tracked backup/QA dump files that were not included in the new package, but never include `.env`/secrets.
4. Run local tests if dependencies are available. The required commands are:
   ```bash
   npm ci --omit=dev --ignore-scripts --no-audit --no-fund
   npm run build:precompress
   npm run check:rc40-p32
   npm run check
   docker build -t grandis-pvp .
   ```
5. Commit and push to `main` **yourself**. Open GitHub Actions for `qa.yml` and require the **entire new run SUCCESS**. Previous Run #46/`43620361956` failed on stale HTTP 401 test; this local package fixes that assertion while keeping the negative-origin test. The previous run will not change status retroactively.
6. CI must pass both `check:rc40-p32` and complete `npm run check`, build Docker with Node 22 and verify Docker `/health` returns native `transport:'ws'` plus the exact RC40 Patch 3.2 identity. If anything fails, stop; do not proceed as production-ready.

## B. Northflank combined service

1. Northflank dashboard -> create service -> **Combined** (or update the existing PvP service). Link repository `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial`, branch `main`.
2. Build type **Dockerfile**, file location `./Dockerfile` at repository root, build context repository root. Base image `node:22-alpine`; `npm ci` downloads production dependency `ws@8.21.0` from the pinned lock file during Docker build.
3. Set **one replica** only. In memory: active lobby, room, match, pending Response, seat tokens and reconnect. Do not autoscale to 2+ until distributed session state exists.
4. Configure runtime variables **exactly**:
   ```env
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   PVP_REQUIRE_WS=1
   PVP_ALLOWED_ORIGINS=https://grandislegacytcg.web.id
   ```
   `PVP_REQUIRE_WS=1` is mandatory: the process exits if the native `ws` package cannot load. Never enable a fallback in production.
5. Configure **public HTTP port 3000** (`EXPOSE 3000` from Dockerfile); in Northflank this is under `Configure` -> `Networking`. HTTP(S) ingress also supports WebSocket Upgrade; public TLS is terminated by Northflank, so the external protocol is **HTTPS and WSS**. `HOST=0.0.0.0` listens on all container interfaces. No separate WebSocket service/port is needed.
6. Health check: HTTP GET `/health`, expect HTTP 200, `ok:true`, `transport:'ws'` and exact build identity. You can use one replica with HTTP health checks. Northflank assigns an actual public hostname, typically a `*.code.run` URL, which must be read from YOUR service settings rather than guessed.

Northflank official docs (current URLs):
- https://northflank.com/docs/v1/application/getting-started/build-and-deploy-your-code
- https://northflank.com/docs/v1/application/network/configure-ports
- https://northflank.com/docs/v1/application/build/build-with-a-dockerfile

## C. Verify production backend identity and Origin policy

Your service's real host might be `<verified-host>.code.run`; find the actual value from Northflank Networking, **not** from historic messages.

```bash
curl -fsS https://<VERIFIED_NORTHFLANK_HOST>/health
```

The JSON must include:

```json
{
  "ok": true,
  "version": "S0-RC40-PVP-NET-RC6-STAGE2-PATCH3.2",
  "buildId": "gl-s0-pvp-rc40-patch32-item-discard-2026-11-14",
  "architecture": "s1-v38017-lite-lobby__s0-rc40-authority",
  "transport": "ws"
}
```

The `architecture` string is a legacy protocol label; **`transport:'ws'`** is the decisive native `ws` field. For clients the WebSocket URL is `wss://<VERIFIED_NORTHFLANK_HOST>/ws`.

Use an RFC6455 WebSocket client and two cases: `Origin: https://grandislegacytcg.web.id` **must upgrade** to 101 and receive a snapshot when sending the correct build ID; `Origin: https://untrusted.example` **must NOT upgrade**, usually returning HTTP 401 or 403. HTTP 400 is also a recognized failed handshake status, but investigate if a malformed request caused it. A test with no Origin is NOT a substitute for the Website-Origin test.

## D. Website handoff (different chat/repository; do not upload from here)

1. Give the Website maintainer the separate **WEBSITE FRONTEND HANDOFF ZIP**. It has root folder `pvp/`. The Website maintainer extracts `pvp/` alongside `index.html`, `deck-builder/`, `card-art/` in `Grandis-Legacy-Website` root. Do not nest `pvp/pvp/`.
2. Before publishing, Website maintainer edits `pvp/config.js`:
   ```javascript
   wsBase: 'wss://<VERIFIED_NORTHFLANK_HOST>', // verified origin only, NO /ws suffix
   requireExternalWss: true,
   wsPath: '/ws',
   ```
   `wsBase` is intentionally blank in the ZIP; no unverified host has been hardcoded. The frontend refuses an unconfigured Website socket.
3. Both pages must be deployed together: `https://grandislegacytcg.web.id/pvp/` and `https://grandislegacytcg.web.id/pvp/battle/`. Static `pvp/build-meta.js` contains the exact same Build ID as backend `/health`; the backend rejects mismatched clients.
4. Existing root `/card-art/` contains **248 Season 0 cards** (Main R3.8, Legacy R3.7, Mana R2). Frontend handoff contains **zero duplicates** and uses `/card-art/` for cards. Missing images fall back to the matching local card-back UI. Check both Lobby and Battlefield image and Card Review paths.
5. Site Lobby nav still points to VS AI (`/`) and Deck Builder (`/deck-builder/`). Battlefield BACK TO LOBBY must return to `/pvp/`. Embedded Battlefield reuses the parent Lobby's **single WebSocket** with `postMessage` and does not create its own socket.
6. On the first update from old Patch 3.1, clear stale browser assets (hard refresh) and inspect the loaded `pvp/build-meta.js` to confirm Patch 3.2. Avoid mixing old P3.1 frontend with P3.2 backend.

## E. Required manual two-browser acceptance

Use two independent browsers/profiles (separate tab-scoped seat tokens) and the same actual Northflank WSS. Record results:

- Connect both; create/join room, select valid decks, READY twice, START, Coin Flip, turn order, opening, first turn; both views agree on match revision.
- Test Mana payment, Mana removal, Attack/Defense/Response/Counter, status/damage/heal, Tribute/Rank Up, Legacy/Revive, game over, post-match cleanup. Retest the six Item class restrictions and exact physical Discard choices from Patch 3.2.
- Inspect RAW WebSocket JSON: opponent Hand/Deck and unrevealed Mana identities must not leak. Verify a spectator receives masked information. Do not rely only on UI obfuscation.
- Check Seat Token reconnect on refresh, invalid token denial, duplicate request handling, local draft without per-tap network traffic, and return-to-lobby flow.
- Validate actual Desktop/Mobile Card Played details (VS AI RC40 renderer), Card Review, opponent Mana Pool stability, BLOCK/DODGE visuals and sound; ensure one WebSocket per session and no extra requests for Card Review.

**Do not declare production ready if the new GitHub Actions run or native Docker/WSS/two-browser staging gate fails or was not executed.**
