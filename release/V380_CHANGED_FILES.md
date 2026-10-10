# v3.80.0 Intentional Integration Seams

The exact VS AI v6.91.3 donor gameplay sources listed in `V380_DONOR_PARITY.json` remain hash-locked. v3.80.0 intentionally changes only the PvP integration/release seams:

- `public/index.html` — active PvP layout cleanup.
- `public/shared-app/app-runtime.js` — external presentation/lifecycle UI integration and removal of prototype Local-AI labels.
- `public/pvp/pvp-host.js` — reconnect, deck persistence, build recovery, and lobby/runtime transport behavior.
- `public/pvp/pvp-integration.css` — PvP integration presentation.
- `server.js` — authoritative room lifecycle, reconnect/build guards, cache policy, and setup reset protection.
- `server/v6913-authority.mjs` — seat localization plus viewer-safe privacy projection/sanitization around the exact v6.91.3 authority.
- `tests/run-v380-*.{cjs,mjs}` — regression coverage for authority, privacy, handshake, assets, and lobby parity.
- release docs/tools/manifests.

No PvP v3.51 runtime implementation is copied into the release. The existing Custom Deck 50-60 Main Deck rule is intentionally unchanged.
