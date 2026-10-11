# v3.80.2 Intentional Integration Seams

The exact VS AI v6.91.4 gameplay trees listed in `V380_DONOR_PARITY.json` remain hash-locked except for the explicit PvP integration seams below:

- `public/index.html` — neutral v6.91.4 shell wired to PvP CSS/config/host and PVP app mode.
- `public/shared-app/app-runtime.js` — external PvP presentation seam; Coin Flip/opening lifecycle follows the donor while remote intent/result handling remains PvP-specific.
- `public/pvp/pvp-host.js` — WebSocket transport, tab-scoped reconnect identity, single-owner opening sequencing, lobby ownership, asset facade.
- `public/pvp/pvp-integration.css` — PvP interaction gate only; no donor Coin Flip backdrop or battlefield-visibility override.
- `public/lobby/pvp-lobby-v3.76.6.css` — retained lobby donor seam.
- `server.js` — room, reconnect, revision, lifecycle and WebSocket authority.
- `server/v6914-authority.mjs` — seat localization, server-side Draw->Deploy transition, and viewer-safe projection around exact v6.91.4 gameplay sources.
- `tests/run-v380-authority-native.mjs` — real two-seat opponent-Shard and Mana-payment gameplay regressions.
- `tests/run-v380-handshake-static.cjs` — presentation/lifecycle boundary regressions.
