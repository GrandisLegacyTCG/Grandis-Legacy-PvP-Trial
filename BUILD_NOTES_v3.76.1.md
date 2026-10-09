# Grandis Legacy PvP v3.76.1

## Purpose

Lock the final two-donor boundary and remove the visible UI jump between Coin Flip and gameplay.

## Active donors

- **Grandis Legacy PvP v3.51** — lobby/session lifecycle, Ready/Kick, Start Match, Coin Flip/Result, WebSocket protocol, authoritative gameplay, Mana payment, pending choices, Response, privacy, reconnect, spectator and surrender.
- **Grandis Legacy VS AI v6.90.7** — visible gameplay presentation starting with Opening Hand/Starting Shards, then all normal gameplay UI/UX.

No third integration repository is an active runtime donor.

## v3.76.1 changes

- Coin Flip stays on the v3.51 battlefield and its background is intentionally darkened.
- When Coin Flip finishes, a full dark handoff veil covers the screen while the v6.90.7 surface mounts and hydrates from the authoritative snapshot.
- Opening Hand 6, Starting Shards 3, and first-player Draw + Regen now run on the v6.90.7 surface; the player never sees a raw v3.51-to-v6 battlefield skin swap.
- Hero Rank I remains setup state; no Hero/Legacy Deck draw animation is introduced.
- Opening choreography remains P1 -> P2 alternating x6 Hand, then P1 -> P2 alternating x3 Shards, followed by normal-speed first-player Draw + Regen.
- Lobby remains single-room, no-scroll, with hidden cross-app buttons, 20-character player names, canonical compact v3.51 kick control, and the approved kick permissions.
- Opponent/local identity blocks retain the approved mirrored connection-bar placement.
- Mobile/tablet portrait UI is removed. Portrait is a hard rotate-to-landscape gate; desktop/tablet/phone share one landscape composition and responsive scale system.

## Release status

Candidate for real two-browser and physical mobile/tablet landscape acceptance testing.
