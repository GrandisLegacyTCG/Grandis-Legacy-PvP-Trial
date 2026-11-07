# Grandis Legacy PvP S0 — S1 UI shell / network only, S0 RC32 game content

## Baseline / authority
- Integration baseline: `pvp_s0_rc32_coin_boundary_work` (prior S1 lobby + S0 at coin flip).
- S1 reference: `Grandis_Legacy_PvP_v3.80.17_2026-10-13.zip`.
- S0 authority: `Grandis_Legacy_VS_AI_Season0_v1.0_RC32_2026-11-07.zip`.
- All gameplay from coin flip forward stays S0 RC32; Grand Finale and Poison Vial follow RC32.

## Approved boundary
S1 is permitted ONLY for lobby shell/geometry/branding, seat assignment, connection/reconnect, Ready, Kick, Spectate, and Start Match networking. No S1 hero, card, deck, rank, formation rules, coin UI or combat UI are authoritative.
S0 RC32 is authoritative for deck choices, Hero preview, Rank progression preview, Formation Swap component, card content/artwork, coin flip presentation and battle.

## Implementation (staging)
- `public/pvp/pvp-host.js`: replace S1 `.pvp-v260-hero`, `.pvp-v260-swap-button`, `.rank-control` component with RC32 `formation-card`, `vsai-v643-swap-button`, `vsai-v643-rank-control` and RC32 swap asset `engine/assets/lobby/Swap.png`. Preserve server-synced formation and lobby interactions.
- `public/pvp/s0-rc32-hero-setup.css`: RC32-equivalent setup component rules scoped to existing S1 lobby container; no global S1 CSS modifications.
- `public/index.html`: load new scoped stylesheet.
- `tests/s1-source-parity.mjs`: allow ONLY the new RC32 component stylesheet as intentional S1 HTML divergence while checking existing donor HTML parity and CSS hash. Check RC32 component markup/asset.
- **Not modified:** server.js networking/gameplay, S0 engine and battlefield, Season 1 repository, VS AI RC32 release.

## QA (actual execution)
- `npm run check` => PASS: syntax, S1 HTML/CSS parity, S0 catalog/artwork and 2-seat WebSocket coin → S0 battlefield.
- Visual Chromium test: **NOT VERIFIED**: this execution environment blocks navigation to local HTTP and file URLs (`ERR_BLOCKED_BY_ADMINISTRATOR`).
- Northflank hosted multiplayer: **NOT VERIFIED**.
- End-to-end complete full combat match via browser: **NOT VERIFIED**.

## Follow-up
- Upload extracted package to the S0 PvP GitHub repository and redeploy Northflank staging. Verify three S0 Heroes/Rank previews, adjacent formation swap, both seats including Kick/Ready, RC32 coin and Start, and one match end-to-end. Do not publish FINAL until browser and hosted acceptance pass.
