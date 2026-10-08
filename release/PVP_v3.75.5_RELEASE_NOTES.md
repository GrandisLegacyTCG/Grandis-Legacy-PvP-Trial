# Grandis Legacy PvP v3.75.5 — Release Notes

Date: 2026-10-08

## Purpose

Stop trying to repair the v3.73.20 gameplay transaction layer. Keep its useful lobby/start-game work, but run the actual online match on the proven PvP v3.51 gameplay backend while preserving the VS AI v6.90.7 UI/UX in the browser.

## Main architectural change

- Added a dedicated `server/runtime/` containing exact PvP v3.51 gameplay artifacts.
- `server.js` now executes that v3.51 runtime for canonical match state/rules.
- Replaced the authoritative gameplay intent router with the exact v3.51 router.
- The browser still loads the v6.90.7-derived runtime/UI for presentation.
- `pvp-network.js` keeps one authoritative intent in flight and does not let the newer local pending renderer control canonical PvP progression.

## Mana/payment correction

The server is back on v3.51 payment behavior:

- Event/Item/non-Skill payment is automatic; Mana Shards are used first, Class Shards only when necessary.
- Skill payment exposes optional Class Shard use when applicable; Mana Shards fill the remaining cost automatically.
- Normal Skill PAY confirms the v3.51 pending choice with `handleChoiceConfirm`.
- The v3.73+/v6 universal exact-Shard transaction is not part of server authority.

The v6.90.7-style payment visuals remain in the browser, adapted to show the authoritative v3.51 plan.

## Rule regression covered

The first player is blocked from **Attack** on the first turn; a Round-1 Event in its legal Deploy/Reform timing is not globally blocked.

## Reported sync regressions targeted

1. Meditation resolving only on the acting browser.
2. Steal stalling at opponent Shard selection.
3. Paid Skills stalling at Mana payment.

The underlying fix is the gameplay authority boundary, not a card-specific patch.

## Lineage

This release follows the actual v3.75.4 candidate. The earlier discarded `.4` experiment is not relevant to this package. Future maintenance versions continue with v3.75.6, v3.75.7, and so on.
