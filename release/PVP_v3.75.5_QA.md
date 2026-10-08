# Grandis Legacy PvP v3.75.5 — QA Record

Date: 2026-10-08

## Automated checks

`npm test` covers:

- syntax and production wiring;
- SHA-256 lock of the exact v3.51 `static-data.js`, `runtime-authority.js`, `app.bundle.js`, and gameplay intent router used by the server;
- guard that the v3.73.20 gameplay queue and newer authoritative exact-Shard engine are absent from server authority;
- v3.51 Mana/Class-Shard rules;
- Round-1 Deploy Event legality under the first-player rule;
- Meditation source-selection -> full authoritative resolution with no stale pending state;
- v3.51 Class-Shard payment through `handleChoiceConfirm` plus authoritative battle feedback;
- one-intent-in-flight client/network handshake;
- opaque opponent-Shard handle + revision routing;
- two-human P1↔P2 turn handoff;
- Player 2 Tribute -> next phase regression;
- viewer-safe/read-only spectators and cap 4;
- opening-sequence transport;
- no Windows case-collision duplicate for the lobby Swap asset.

## Manual two-browser regression required before live

1. **Meditation** — play and select source; both browsers must resolve/clear the same pending state.
2. **Steal** — choose the blind opponent Shard; both browsers must receive the same resulting revision.
3. **Paid Skill** — choose source/target/Class Shard if applicable; PAY must resolve and close on both browsers.
4. **Round-1 Event** — first player can use a legal Event in Deploy/Reform; only Attack is blocked on first turn.
5. Repeat Meditation/paid Skill from Player 2 to verify seat mirroring.

## Status

**Candidate build. Automated QA passes. Real two-browser gameplay testing is still required before live deployment.**
