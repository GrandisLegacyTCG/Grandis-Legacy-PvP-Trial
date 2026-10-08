# Grandis Legacy PvP v3.09

Date: 2026-08-24

## Scope

This patch adopts Source Authority Stack v1.7.1 and the generic Conditional Follow-up Component. Changes are limited to authoritative source data, the shared reducer and browser consumer, audio clone lifecycle safety, source/runtime locks, release metadata, and focused tests.

## Conditional follow-up authority

- Rage Blast resolves its 60 Physical Primary, then a separate automatic 20 Physical follow-up when Bleed is present. Primary Block does not carry over; Block-to-0 still triggers it.
- Venom Sovereign resolves Rogue 20 / Renegade 40 Magical Primary damage, then a separate automatic 40 Magical follow-up when Poison is present. The obsolete merged bonus route is removed.
- Tornado resolves a separate automatic 40 Magical follow-up after a Dodge for Elementalist or Elemental Lord.
- Dodge suppresses Rage Blast and Venom Sovereign follow-ups; Negate/Cancel suppress all three; no follow-up opens a second Response Window or creates a pending state.

## Preserved PvP authority

Server-authoritative first-player Turn 1 Attack rejection, defensive Halfling Second Chance, Resurrection at 3 Mana / 50 HP, Double Casting target routing, stale-revision resync, hidden information, seat authority, and spectator filtering remain intact.

## Audio lifecycle

Coin Flip and Card Sound clones are retained in an active pool until `ended`, `error`, or rejected playback, preventing premature garbage collection without changing their timing or volume.

Run `npm run verify` for the complete package, server, room, network, parity, and manifest suite.
