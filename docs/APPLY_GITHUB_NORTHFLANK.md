# Grandis Legacy PvP v3.44 — GitHub Pages + Northflank Deployment

Grandis Legacy PvP uses three deployment targets:

1. **Static frontend**: `https://grandislegacytcg.github.io/pvp/`
2. **Room 1 WebSocket service**: `wss://p01--grandis-legacy-pvp--2kwws8nzlcc2.code.run/ws`
3. **Room 2 WebSocket service**: `wss://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run/ws`

The browser must not open a WebSocket against GitHub Pages itself. `public/config.js` supplies the explicit remote room bases and `wsPath: '/ws'`.

## Release deployment order

1. Deploy/redeploy this repository's production server (`node server.js`, or Dockerfile) to both room services.
2. Confirm each service `/health` endpoint.
3. Confirm each service accepts WebSocket upgrade on `/ws`.
4. Mirror this repository's `public/` directory byte-for-byte into Website `/pvp/`.
5. Publish Website v1.33.
6. Test Room 1 and Room 2 from the deployed Website, then Ready/Start with two independent browsers.

The core server remains provider-agnostic: environment `PORT`, configurable `HOST`, ordinary HTTP/WebSocket upgrade, no provider API dependency.
