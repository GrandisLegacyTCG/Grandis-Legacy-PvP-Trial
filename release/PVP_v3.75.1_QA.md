# Grandis Legacy PvP v3.75.1 — QA Record

Date: 2026-10-08

## Automated result

`npm test` passes in the build workspace.

Covered regression gates:

- syntax checks for server, intent router, PvP network, PvP UI runtime, animator, and presentation adapter;
- canonical file/path wiring after the v3.51-style repository cleanup;
- no player-facing `LOCAL AI` / `VS AI LOBBY` donor labels in the active PvP shell/runtime;
- server-authoritative shared runtime boot;
- exact Mana payment including matching Class Shard selection;
- Player 1 / Player 2 turn handoff;
- Player 2 Tribute -> next phase regression;
- opening sequence transport;
- viewer-safe hidden-info spectators;
- spectator read-only enforcement and four-spectator cap;
- authoritative battle-feedback event transport.

The server simulation reported approximately **170 MB RSS** during its active-match test run in this container. Deployment memory can differ.

## Live-readiness status

**Candidate baseline, not auto-promoted to live.**

The automated suite confirms the rebuilt source structure and the covered network/gameplay contracts. A real two-browser/two-device network smoke test is still recommended before replacing the current v3.51 live deployment, especially for UI interaction flow, reconnect behavior through the production proxy, and visual animation timing.
