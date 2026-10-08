# Verification — PvP v3.26

Date: 2026-09-03

## Targeted Card Played parity
`tests/run-v326-card-played-ui-parity.cjs` checks the VS AI v6.24 Card Played preview contract:

- six latest combined actions on normal desktop;
- 2-column × 3-row normal desktop grid;
- 3-row shorter-desktop layout;
- six-card shared/mobile cap;
- max-4 constrained-height fallback;
- shared Card Played history/detail component remains present.

## Preservation regressions
The v3.25 audiovisual/detail regression remains in the check chain, together with the v3.24 Quick Reload / Aura counter test and earlier PvP regressions.

## Scope statement
No gameplay authority was changed for this release. The fix is limited to Card Played presentation parity and release/version metadata.

## Executed verification
- `npm run check` — PASS.
- `npm run test:package` — PASS.
- `npm run test:bridge` — PASS.
- `npm run test:ui` — PASS.
- Source comparison against the bundled VS AI v6.24 reference during release preparation: `v96CardPlayedPanel` function matched exactly and no Card Played CSS differences remained.

Live WebSocket room integration was not claimed in this pass because the repository does not include installed `node_modules` in the packaged source environment.
