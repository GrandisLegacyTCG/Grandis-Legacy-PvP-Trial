# Grandis Legacy PvP Season 0 - RC40 Patch 3.2 (PvP-Trial)

**Release target:** `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial`, branch `main`. This is a **complete repository root package**, not a GitHub patch or nested project folder. Deployments/commits are performed manually by the project owner.

## What changed from RC40 Patch 3.1

Latest VS AI RC40 (14 November 2026) Item / physical Discard hotfix was ported into the authoritative PvP Season 0 engine:

- Exactly six restricted Items use the approved printed Base Class permissions, including when an eligible Item user protects a different-class allied Hero; Rank II/III lineage remains legal.
- Response extra Hand Discard / Legacy L001/L002 / Hand Limit costs use exact physical Hand/Pile indices and IDs, without stale substitute or duplicate payment.
- Legacy Deck inspection `CLOSE` only, committed Magic Compass selection no `CANCEL`, precommit conditions keep `CANCEL`, opponent draw stays concealed, local draw flips face-up in flight, coin flip text sentence case.
- Existing **VS AI RC40 Card Played renderer** (`v94EventDetailHtml`), PvP viewer-safe adapter, and local single WebSocket protocol are retained.
- CI metadata and old test expectations updated to assert current RC40 architecture and approved 248/248 card-art hashes, preserving behavioral coverage.

## Run standalone locally

Requirements: Node.js 22, npm, Python 3.12+ with `websocket-client` for the real WebSocket QA, and Docker (optional locally; required for release verification).

```sh
npm ci --omit=dev --ignore-scripts --no-audit --no-fund
npm run build:precompress
npm run check:rc40-p32
npm run check
npm start
```

Open `http://localhost:3000/` for PvP lobby; `http://localhost:3000/battle/` for battlefield; `http://localhost:3000/health` for health; `ws://localhost:3000/ws` for the single player session socket.

**WARNING:** `npm run check` is a long-running historical suite; tests updated for current RC40 still assert real invariants. In offline containers where `npm ci` cannot fetch `ws`, tests can exercise the included RFC6455 fallback, but that is **not** verification of the mandatory production `ws` dependency.

## Production setup

- Node 22 Docker image in `Dockerfile`, binds `0.0.0.0`, uses `PORT` from the environment (default 3000).
- `PVP_REQUIRE_WS=1` is mandatory in Northflank (native WebSocket transport; do not ship the fallback).
- `PVP_ALLOWED_ORIGINS=https://grandislegacytcg.web.id` allows the GitHub Pages frontend.
- **One replica only** while lobby/match/seat state lives in memory.
- Check `GET /health` and test `wss://<verified-Northflank-host>/ws` after the user configures a live Northflank hostname.
- Frontend handoff is separate: Website's `/pvp/` and `/pvp/battle/` pages, without Node backend or duplicated `/card-art/` image files.

Read `docs/RC40_PATCH32_DEPLOY_NORTHFLANK.md` and `docs/RC40_PATCH32_AUDIT.md` before publishing. No GitHub or Northflank write was performed by this build.

**Status:** candidate for manually-run staging QA, not certified production-ready. Native `ws` Docker build, live Northflank/WSS and two-browser end-to-end play need validation on the deployed infrastructure.
