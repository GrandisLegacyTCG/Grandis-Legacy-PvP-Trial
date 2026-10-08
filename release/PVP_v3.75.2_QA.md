# Grandis Legacy PvP v3.75.2 — QA Record

Date: 2026-10-08

## Automated result

`npm test` passes in the build workspace.

Covered regression gates:

- syntax checks for server, intent router, PvP network, PvP UI runtime, animator, and presentation adapter;
- v3.75.2 release/version wiring;
- opening choreography contract: local Player then Opponent for each Opening Hand index and each Starting Shard `group_index`;
- opening setup timing constants: 110 ms motion + 10 ms gap, followed by a 280 ms separation before first-turn Draw;
- first-turn +1 Main Deck then +1 Shard kept at normal 360 ms presentation speed;
- authoritative opening sequence transport remains intact;
- exact Mana payment including matching Class Shard selection;
- Player 1 / Player 2 turn handoff;
- Player 2 Tribute -> next phase regression;
- viewer-safe hidden-info spectators;
- spectator read-only enforcement and four-spectator cap;
- authoritative battle-feedback event transport.

Server simulation result in this container: approximately **170.5 MB RSS** during the active-match regression run.

## Scope note

The v3.75.2 patch changes opening presentation choreography only. It does not change authoritative draw counts, opening hand size, Starting Shard count, first-player ownership, or gameplay state transitions.

## Live-readiness status

**Candidate build for visual two-browser verification.**

Automated tests pass. The next check should be a real two-browser Start Game recording to confirm the intended visual order and pacing before any further gameplay changes.
