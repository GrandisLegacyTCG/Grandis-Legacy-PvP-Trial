# Grandis Legacy PvP S0 RC38 — Beta 2, Batch 1 (Staging)

Date: 2026-11-11
Baseline: `Grandis_Legacy_PvP_S0_RC38_Beta1_Network_RC6_2026-11-11.zip`

## Scope — client lobby only

1. Card Review: retain the same iframe / 19 CSS files / renderer across close, reopen and Rank switches. Update the printed card content and lineage buttons with a same-origin parent-to-iframe message; no duplicate review DOM is created each click.
2. Room snapshots and `JOIN AS PLAYER`: keep the chosen deck's formation art, summary and select options mounted when only the room/seat state changes. Refresh deck visuals when the actual deck composition, rank, formation or selected deck changes. Do not overwrite the Player Name field while the user is editing it.
3. Battlefield prefetch: the query string remains exactly aligned with the existing RC38 Beta 1 version used by the actual battlefield HTML; there are no new gameplay asset cache-busting URLs in Batch 1.
4. Keep all existing server code, the lobby-owned single WebSocket transport (RC6 Stage 2), Mana draft/atomic payment (RC5), RC38 gameplay, opponent Mana face-up and Coin winner turn choice untouched.

## QA and caveats

- `node --check` on modified browser sources: PASS.
- `npm run test:lobby-batch1`: PASS (reuse one review frame, switch cards via postMessage, avoid redundant rebuilds, retain prefetch URL).
- `npm run check`: PASS (includes RC38 rules, S0 privacy, Stage 2 networking, response, Mana and Coin result regressions).
- Real desktop/mobile browser test: NOT completed — local browser network access was blocked by the test environment. This is not evidence of live two-device functionality.
- Live cold-load/Join/Card Review latency before/after: NOT measured. This is a structural optimization, not a quantified speedup.
- This interim batch deliberately retains Beta 1's network BUILD_ID. Use it as a staging artifact; bump ID only in a coordinated final beta release to avoid unnecessarily redownloading large unchanged assets.

## Next batches (not implemented in this package)

- Batch 2: Start Match/initial battlefield optimization (server runtime compile caching plus measured cold vs warm startup; independent per-match VM state).
- Batch 3: Local Draft for Rank Up/Scouting/Bard/Hand Limit/Crystal Ball, with one atomic server-side commit and illegal-action/rollback/reconnect regression; preserve server authority.
- Final integration: merge all validated batches, update build metadata, full QA and two-device deployment testing. No GitHub upload by this build.
