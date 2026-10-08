# Grandis Legacy PvP v3.08

Date: 2026-08-24

## Scope

This patch only renames the two public audio assets and updates their client references, runtime lock, package markers, and tests. The corrected v3.07 gameplay authority is unchanged.

## Audio rename

- `freesound_community-coin-flip-37787.mp3` becomes `Coin Flip.mp3`.
- `freesound_community-flipcard-91468.mp3` becomes `Card Sound.mp3`.
- Original bytes, triggers, timing, and volume are preserved.
- Server-health tests verify both percent-encoded audio URLs.

## Preserved behavior

First-player Turn 1 Attack rejection, defensive Halfling Second Chance, Resurrection at 3 Mana / 50 HP, Double Casting routing, stale-revision resync, hidden information, seat authority, and spectator filtering remain intact.

Run `npm run verify` for the complete package and server suite.
