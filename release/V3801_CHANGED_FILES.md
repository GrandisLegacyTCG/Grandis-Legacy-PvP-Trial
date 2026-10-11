# v3.80.1 Intentional Integration Seams

The exact VS AI v6.91.4 gameplay trees listed in `V380_DONOR_PARITY.json` remain hash-locked except for the explicit PvP integration seams below:

- `public/index.html` — rebuilt from v6.91.4 neutral shell, then wired to PvP CSS/config/host and PVP app mode.
- `public/shared-app/app-runtime.js` — external PvP presentation seam, intent batching, authoritative result/lobby handling, no prototype identity badges, and PvP-safe opponent labels.
- `public/pvp/pvp-host.js` — WebSocket transport, tab-scoped reconnect identity, lobby ownership, asset facade.
- `public/pvp/pvp-integration.css` — PvP transport/lifecycle presentation boundary.
- `public/lobby/pvp-lobby-v3.76.6.css` — retained lobby donor seam.
- `server.js` — room, reconnect, revision, lifecycle and WebSocket authority.
- `server/v6914-authority.mjs` — seat localization plus viewer-safe projection around exact v6.91.4 gameplay sources.

Deleted because v6.91.4 removed the obsolete authored demo state that referenced them:

- `public/assets/cards/`
- `public/engine/index-original.html`
