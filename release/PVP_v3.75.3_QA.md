# Grandis Legacy PvP v3.75.3 — QA Record

Date: 2026-10-08

## Automated target

`npm test` covers:

- syntax checks for server, intent router, PvP network, PvP UI runtime, animator, and presentation adapter;
- v3.75.3 release/version wiring;
- authoritative exact Mana calculation and Class Shard payment;
- payment transport contract: queued intent returns `clientActionId`, UI uses submit-first PAY, and network failure/timeout/socket-close paths notify the centered decision layer so it can unlock;
- opening choreography: Player -> Opponent interleaving for all 6 Opening Hand cards and all 3 Starting Shards;
- opening setup timing: 190 ms visible travel, zero added inter-card gap, then 280 ms separation before the first-turn Draw;
- first-turn +1 Main Deck then +1 Shard at normal 360 ms presentation speed;
- Player 1 / Player 2 authoritative handoff and Player 2 Tribute -> next phase;
- viewer-safe hidden-info spectators, spectator read-only enforcement, and four-spectator cap;
- authoritative battle-feedback transport;
- no Windows case-collision duplicate for the lobby Swap asset.

## Manual verification requested

1. Run two real browser clients.
2. Confirm Opening Hand 6 and Starting Shard 3 remain interleaved and visibly travel instead of appearing to teleport.
3. Play a paid card, confirm the centered Mana dialog reaches exact cost, press PAY, and verify the authoritative snapshot removes the spent Shards and closes/advances the dialog.
4. If a payment intent is intentionally made stale or the socket is interrupted, verify the dialog unlocks after authoritative recovery rather than remaining stuck.

## Live-readiness status

**Candidate build pending the two-browser payment/opening visual check.**
