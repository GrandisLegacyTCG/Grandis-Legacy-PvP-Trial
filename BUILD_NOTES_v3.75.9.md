# Grandis Legacy PvP v3.75.9

## Purpose

Structural correction of the two-donor rebuild. PvP v3.51 owns the entire pre-game path and authoritative multiplayer/gameplay contract; VS AI v6.90.7 does not mount as the gameplay surface until the authoritative opening presentation is complete.

## Active donors

- **Grandis Legacy PvP v3.51** — lobby/session lifecycle, Ready/Kick, Start Match, Coin Flip/Result, Opening Hand/Starting Shards/first Draw+Regen, WebSocket protocol, authoritative gameplay, Mana payment, pending choices, Response, privacy, reconnect, spectator and surrender.
- **Grandis Legacy VS AI v6.90.7** — gameplay presentation/UX after opening: battlefield layout, Hand/Shard presentation, phase tracker, side panels, payment/choice visuals, animation, VFX/SFX and interaction styling.

No third integration repository is an active runtime donor.

## Main corrections

- Removed double ownership of Coin Flip/Opening presentation. During PvP pre-game the v6 gameplay surface stays disabled; the canonical v3.51 battlefield and Coin Flip overlay remain visible.
- Hero Rank I is present as setup state before Coin Flip. No Hero/Legacy Deck flight animation is run during Coin Flip.
- VS AI v6.90.7 gameplay UI activates only after the full authoritative opening presentation callback completes.
- Opening presentation is sequential and readable: P1 card -> P2 card x6, then P1 Shard -> P2 Shard x3, then the first player's normal Draw + Regen. Opening card/starting-Shard travel uses the approved faster timing; normal first-turn Draw/Regen keeps normal timing.
- Desktop lobby is viewport-locked without a low-height scroll fallback. Header sizing is unchanged.
- The original PvP v3.51 compact circular kick control is retained; only permission/timing is changed.
- Single visible lobby, hidden cross-app buttons, 20-character player-name cap, and mirrored two-line player/deck identity blocks are retained.
- Card Played remains sourced from public played-card history only; Opening/Draw does not populate it.

## Release status

Candidate for real two-browser acceptance testing. Automated browser acceptance now exercises the actual Lobby -> Coin Flip -> Opening -> v6 gameplay-surface handoff, but live network latency/reconnect behavior still requires a human two-browser pass before promotion.
