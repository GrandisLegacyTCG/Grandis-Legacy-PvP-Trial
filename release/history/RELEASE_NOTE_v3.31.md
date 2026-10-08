# Grandis Legacy PvP v3.31 — Battlefield player-name binding fix

Date: 2026-09-04

## Fixed

- Battlefield player headers now use the **live PvP room/lobby snapshot names** as the display-name authority.
- A stale/default canonical `appState.pvpPlayerNames` value such as `OPPONENT`, `Player 1`, or `Player 2` can no longer override a valid current room name.
- Both local and remote battlefield name headers follow the same live-name priority.
- This also covers snapshots where the authoritative gameplay board revision has not changed but the room/player identity snapshot already contains the correct name.

## Preserved

- v3.30 mobile active-match hamburger hiding.
- v3.30 mobile Hero action star / authoritative Racial, Class, and Legacy action routing.
- Hero / Legacy display-size parity guards.
- P.Atk / M.Atk / P.Def / M.Def post-render VFX/audio path.
- VS AI-style Card Played UI.
- Quick Reload → Aura Infusion Bolt Draw This Turn counter fix.
- PvP deck validation: exactly 60 Main Deck cards, normal max 3 copies, Ultimate max 1.
- Source Stack v1.7.3.

## Scope

PvP only. Website, VS AI, Tutorial, Deck Builder, and Source Stack are unchanged.
