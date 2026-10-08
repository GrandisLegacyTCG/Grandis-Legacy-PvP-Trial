# Grandis Legacy PvP v3.39 - 2026-09-07

## Gameplay authority
- Manual Reposition is limited to once per active turn. Deploy and Reform share the same limit.
- The limit is consumed only after a legal manual Reposition resolves.
- Card/effect-driven Reposition does not consume or check the manual limit.
- Authoritative server runtime adopts Source Stack v1.7.5 / Runtime Foundation v1.91 / Runtime Core v0.59 / Sync v2.53.

## Presentation/runtime fixes
- Battle SFX starts from authoritative feedback before board import/render so damage/defense/heal audio no longer waits behind DOM/VFX work.
- Binding Light and other committed counter-response actions are retained in Card Played chain history through the generic chain-event path.
- PvP adopts the four-slot physical EXP stack presentation used by VS AI/Tutorial, including Exhausted bottom-to-top stack orientation.
- Existing SGH / Escape Arrow generic commit-payment framework remains preserved.

## Preserved
- Heal semantic transport remains end-to-end and maps to Heal VFX/audio.
- Grand Arbalest / Rapid Chamber actual draw counting and Physical-only +10 passive remain unchanged.
- Deck legality remains exactly 60 Main Deck cards, normal max 3, Ultimate max 1.
