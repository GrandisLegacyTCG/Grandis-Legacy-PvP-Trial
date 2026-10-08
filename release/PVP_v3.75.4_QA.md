# Grandis Legacy PvP v3.75.4 — QA Record

Date: 2026-10-08

## Automated checks

`npm test` covers:

- syntax checks for server, intent router, PvP network, PvP UI runtime, animator, and presentation adapter;
- release/version wiring;
- static guard that the v3.73.20 `intentQueue` / `pumpIntent` gameplay model is absent;
- static guard that PvP `sendIntent()` does not immediately force a local gameplay render;
- v3.51-style single in-flight action lock and `applyingServer` guard;
- authoritative pending synchronization after board import;
- opaque `selectOpponentManaChoiceHandle + revision` routing for hidden opponent Shards;
- exact Mana payment and Class Shard handling;
- two-human Player 1 <-> Player 2 turn handoff and Player 2 Tribute -> next phase;
- viewer-safe spectator masking/read-only behavior and spectator cap;
- authoritative opening/battle presentation transport;
- no Windows case-collision duplicate for the lobby Swap asset.

## Manual two-browser regression

Required before live deployment:

1. **Meditation** — play, choose the source Hero if prompted, and confirm both browsers reach the resolved state.
2. **Steal** — reach blind opponent-Shard choice, select/confirm, and confirm both browsers receive the same resolved revision.
3. **Paid Skill** — select source/target as applicable, select exact Mana, PAY, and confirm both browsers close/advance payment together.
4. Repeat at least one of the above from Player 2's browser to verify seat mirroring.
5. During an in-flight action, click again rapidly; the second gameplay intent must be rejected locally until the authoritative snapshot arrives.

## Status

**Candidate build. Automated QA passes; real two-browser gameplay sync verification is still required.**
