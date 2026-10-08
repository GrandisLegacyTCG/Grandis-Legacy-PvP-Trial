# Grandis Legacy PvP v3.06

## 1. Source Stack adoption

- Source Authority Stack 2026-08-24 / One Source Authority v1.6.0.
- Runtime Data v0.13.1, Effect Recipe and Checkpoint v0.12.0, Legality Map v0.11.8.
- Runtime Foundation v1.84, Runtime Core v0.52, Shared Manual v1.41, Sync v2.46.
- Canonical registry: 198 cards, SHA-256 `f6560b21206a4f50670d9801442933d026768c3c704215f443d58a568980a3db`.
- Hero Component Authority v1.0.0, SHA-256 `487aa2620b5be99480a81d462082f1a35ee637ec2cc38ebf42b1bcf1103d06c9`.

## 2. Gameplay/card changes

- All 30 revised card records are adopted; Back Slash is the only title change.
- PvP uses the same corrected non-trivial effect execution as VS AI v6.8, including Replenish, Brilliant Radiance, Resurrection, Spectral Grappling Hook, Fire Wall, Deflect, Second Chance, Stoneblood, Dragon Scale, Mana Catalyst, and Magic Scope.
- Racial Trait and Class Ability resolution now consumes the shared Hero Component Authority model.

## 3. Bug fixes

- `double_casting_target_selection` now reaches the server-authoritative Hero selection route, allowing activation 2 to resolve and close the pending state.
- Stale-revision intents receive a filtered authoritative snapshot immediately after rejection, so play can continue without reconnecting.
- The first player's Turn 1 Attack is rejected by shared runtime legality while Battle Phase entry remains legal.

## 4. UI changes

- Cache revisions and visible version labels advance to v3.06.
- No lobby or battlefield redesign.

## 5. Preserved behavior

- Two fixed public rooms, GA4, same-tab navigation, 2 players plus 4 spectators, spectator read-only mode, hidden-hand masking, Teaching View, and 60-second result cleanup remain unchanged.

## 6. QA results

- Added executable authority/hash/component checks and all 30 revised-ID parity checks.
- Added Double Casting bridge plus network-route regression coverage.
- Added stale-revision rejection → filtered snapshot → continued-intent coverage.
- Added shared runtime Turn 1 Attack rejection coverage.
- Existing package, UI, server-health, room, gameplay, and lifecycle suites remain enabled.
