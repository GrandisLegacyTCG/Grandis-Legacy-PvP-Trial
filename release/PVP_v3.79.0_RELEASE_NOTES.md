# Grandis Legacy PvP v3.79.0 Release Notes

## Architecture reset

v3.79.0 replaces the v3.78.x compatibility approach with a new native handshake around the current VS AI runtime.

Locked direction:

- Presentation: VS AI v6.91.3
- Lobby: PvP v3.76.6
- Handshake design reference: VS AI Tutorial v6.48 ↔ PvP v3.51
- Runtime authority: exact VS AI v6.91.3 gameplay engine executed headlessly on the server

PvP v3.51 is no longer an implementation/authority donor. No v3.51 runtime is shipped.

## Multiplayer contract

- remote players send v6 runtime intents;
- the server validates/applies those intents against one authoritative v6.91.3 state;
- the current remote actor is localized as v6 `PLAYER` regardless of seat;
- stale revisions are rejected;
- client action IDs are deduplicated;
- dependent same-action UI writes can use an authoritative intent batch;
- viewer-safe snapshots mask private hand/deck/pending data;
- spectators remain read-only.

## Presentation

- v6.91.3 remains the gameplay presentation owner on desktop, tablet, and mobile;
- authoritative state imports are silent to prevent duplicate presentation;
- the external v6 presentation runtime handles visible Draw/card/Shard/rank/reposition/battle presentation and native v6 sound;
- Coin Flip is an opaque black popup gate over a mounted field; underlying field interaction is inert until Start Game/opening handoff completes.

## Assets

The standalone package keeps the local Season 1 WebP/media library. Visible PvP card and Shard resolvers explicitly point to packaged local assets. Exact v6 donor engine CDN strings are allowed only as dormant donor internals, not as the active standalone visible resolver.

## Lobby

The v3.76.6 Lobby presentation is retained with previously audited parity constraints, including one-line `JOIN AS PLAYER` and the compact 28×28 kick control with 16×16 icon.

## Deployment and workflow

Permanent deployment guardrails and project workflow rules are retained. Bug reports do not authorize automatic packaging; future candidate packages require explicit user permission, and those rules must be included in future Takeover Notes.
