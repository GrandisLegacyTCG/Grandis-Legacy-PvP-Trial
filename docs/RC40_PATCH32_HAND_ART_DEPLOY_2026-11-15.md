# Manual deployment / verification — RC40 Patch 3.2 Hand artwork hotfix

## Repository staging

1. In GitHub Desktop, clone or open `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` on `main`. The source baseline was commit `6e16d410617aace6d8190e31af448e35b3ee4dba`.
2. Extract the FULL REPO ZIP **directly into that repository root** (not into an added top-level subfolder). Review/delete stale tracked files that are not required by the new archive carefully; preserve Git metadata and repository settings.
3. Ensure root files `.github/workflows/qa.yml`, `Dockerfile`, `server.js`, `package.json`, `package-lock.json`, `public/`, `server/`, `scripts/`, and `tests/` are present. No `node_modules` is shipped.
4. The project owner alone performs commit/push. No GitHub writes were performed by this build.
5. Check Actions: `npm ci`, `build:precompress`, `check:rc40-p32`, **full historical `check`**, Docker build, and native `ws` Docker `/health` must ALL pass, including new `test:hand-artwork`.

## Northflank backend

1. Deploy the updated PvP-Trial repository via **Dockerfile at repo root**. Node.js **22** image already specified.
2. Set **one replica**, port **3000**, protocol HTTP/WebSocket upgrade compatible ingress; use `PORT=3000` and `HOST=0.0.0.0`.
3. Environment variables:

```text
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
PVP_REQUIRE_WS=1
PVP_ALLOWED_ORIGINS=https://grandislegacytcg.web.id
```

4. Verify `https://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run/health`. It **must** report `ok:true`, `transport:"ws"`, `version:"S0-RC40-PVP-NET-RC6-STAGE2-PATCH3.2"`, `buildId:"gl-s0-pvp-rc40-patch32-item-discard-2026-11-14"`.
5. Verify authorized Origin `https://grandislegacytcg.web.id` can upgrade WSS at `/ws`; an unauthorized Origin must NOT upgrade. Use a real WebSocket client/DevTools rather than plain HTTP GET to `/ws`.
6. Do not scale beyond **one replica** until room/seat/match state is externalized.

## Website handoff / staging

1. Give the FRONTEND HANDOFF ZIP to the **separate Website maintainer**. The `pvp/` folder is designed to merge at Website repository root, next to `/card-art/` and `/deck-builder/`. Never upload the backend into GitHub Pages.
2. The Website `main` already showed Patch 3.2 metadata during this audit; reconcile existing `/pvp/` files instead of deleting current working assets by assumption.
3. The handoff `pvp/config.js` is prefilled with the **owner-provided** `wss://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run`, `wsPath:'/ws'`, `requireExternalWss:true`; verify the actual backend and change ONLY if required.
4. Keep `pvp/build-meta.js` in sync with backend. Runtime cache-buster `hotfix=handart-20261115` is deliberate: browsers must fetch the corrected JS even though the protocol Build ID stays Patch 3.2.
5. The HTML must resolve from `/pvp/` and `/pvp/battle/`; image art should load from Website-owned `/card-art/`, not copied 248 card files; fallbacks from `pvp/battle/assets/ui/`.

## Acceptance scenario (manual real browser, must be performed)

- Browser A and B open `https://grandislegacytcg.web.id/pvp/` with separate tab/session IDs, select decks, READY, coin flip, select turn order and Start Match.
- Verify **each player's own Hand has visible face images**, opponent Hand remains face-down and has no hidden card IDs in received WebSocket data. Open Card Review and Card Played.
- Draw on both turns: Back-to-Front animation and no permanent blank art or flicker; failed image URL should show the correct Back of Card.
- Test Attack + Response, Mana, Legacy, Reconnect/Seat Token, ending match, cleanup and navigation returning to `/pvp/`.
- Desktop and mobile browser; inspect Console for `ReferenceError` and Network for erroneous `/battle/`, `/build-meta.js` or second WebSocket connections.
- **Do not declare production-ready before these tests and a new GitHub Actions run succeed.**
