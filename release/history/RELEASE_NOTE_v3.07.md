# Grandis Legacy PvP v3.07

Date: 2026-08-24

## Scope

This patch adopts the corrected Source Authority Stack after the v1.6.1 hotfix. The application change is limited to canonical data, generated authority bundle, source pins, runtime lock, release markers, and tests required by the upstream correction.

## Authority update

- 198 canonical Card IDs.
- Canonical registry SHA-256: `b185307752fd523d6c1e4a450f8bdd82b96b4d4cbfbb884fca8a619e8c5c8057`.
- Hero Component SHA-256 remains `487aa2620b5be99480a81d462082f1a35ee637ec2cc38ebf42b1bcf1103d06c9`.
- Resurrection (`S1-CLE-015`) is consistently 3 Mana / 50 HP in runtime and descriptive metadata.
- Back Slash and all 30 revised-card records remain canonical.

## Runtime and network verification

- First-player Turn 1 Attack is rejected by the server-authoritative reducer.
- Halfling Second Chance remains a defensive Dodge; no replay route exists in client, server, or shared reducer.
- Double Casting target routing remains authoritative.
- Stale-revision recovery still emits a filtered authoritative snapshot.
- Hidden information, seat-token authority, spectator read-only behavior, and recipient filtering remain intact.

## Exclusions

No unrelated gameplay, UI, deployment, or networking change was made.

Run `npm run verify` for the complete package, server, room, network, and manifest suite.
