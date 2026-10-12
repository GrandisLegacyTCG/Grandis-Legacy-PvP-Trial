# Grandis Legacy PvP v3.80.14 — 2026-10-12

## Release blocker fix

- Fixed v3.80.13 client/server BUILD_ID mismatch that rejected every WebSocket connection before seat assignment.
- BUILD_ID now has one server-owned source derived from VERSION.
- `/build-meta.js` is served dynamically with `cache-control: no-store` and loads before `pvp-host.js`; the browser no longer carries an independent hard-coded BUILD_ID.
- Added release guards so a future client/server build handshake drift fails static tests/deployment readiness instead of shipping.

No gameplay, Mana Payment, response, seat, idle, or presentation rules were intentionally changed in this patch.
