# Verification — PvP v3.22

Verified 2026-09-02 from the release source.

## Offline/runtime/gameplay result

- `npm run check`: **PASS**.
- Targeted v3.22 fix contract `node tests/run-v322-next-fixes.cjs`: **PASS**.
- 50/60 custom-deck validation and functional start/reject coverage: **PASS**.
- Cover Up redirect fresh Defense Window and pending Attack Direction Indicator: **PASS**.
- Canonical Defense, gameplay foundation, conditional follow-up/audio, Arcane Duelist legality, Card Played audit, attachment parity, defeat/Casting cleanup, Source Stack adoption, and UI/package/runtime bridge checks: **PASS**.
- Runtime sync lock generation: **PASS**.
- File manifest generation and verification: **PASS**.
- Responsive constrained-resolution browser audit: **PASS** at 1600×900, 1366×768, 1280×720, 1100×700, 1024×768, 900×700, and 800×650. Phase Tracker did not overlap Card Played or its own action controls; Card Played automatically reduced to 4 or 2 visible entries where required.

The browser audit data is stored in `release/RESPONSIVE_LAYOUT_VERIFICATION_v3.22.json`.

## Server/network integration environment note

The sandbox used for this release does not have the npm dependency `ws` installed, and outbound package-registry access is unavailable. Therefore `npm run test:server`, `npm run test:room`, and the live WebSocket network regression cannot execute in this sandbox because `server.js` cannot import `ws`.

The repository still declares and locks the `ws` dependency. This environment limitation does not replace those integration tests; run `npm ci` followed by `npm run verify` in a normal connected Node environment before production deployment.
