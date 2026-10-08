# PvP v3.45 — Server / Lobby Fix

## Northflank root cause

The canonical router exists in the v3.44 repository and final ZIP as `server/gameplay-intent-router.mjs` and is the same approved router lineage used by v3.43/Candidate 3. The production `Dockerfile`, however, copied `server.js`, `public/`, `data/`, `runtime/`, and `sync/` but **did not copy `server/`**. Therefore Node started `/app/server.js`, reached `import './server/gameplay-intent-router.mjs'`, and failed with `ERR_MODULE_NOT_FOUND` because `/app/server/` was absent from the image.

v3.45 fixes the owning deployment rule by adding `COPY server ./server`. No fake router or incomplete replacement was created.

A deployment-integrity regression test now walks the production local import graph from `server.js` and verifies both source-tree presence and Docker build-context coverage.

## Lobby controls

- Player Name is edited directly; no separate Change Name button.
- Formation uses Deck Builder v1.31 Style 1 circular blue swap controls between Heroes.
- Starter formation order is server-validated and applied at match start.
- Rank selector uses the Deck Builder Style 1 compact `‹ RANK I ›` control below the complete formation and remains preview-only.
- Deck dropdown reuses the exact Deck Builder `chevron-down.png` asset bytes.
- Current Battlefield and gameplay remain locked.

## Deployment

Redeploy v3.45 to both Northflank Room services. Validate HTTPS `/health`, then WSS `/ws`, then real player count/Ready/second-player/Start Match. If the public endpoint still returns `no healthy upstream`, inspect the new Northflank runtime log before changing frontend endpoints.
