# Grandis Legacy PvP v3.50 — Same-Version Maintenance Correction

Date: 2026-09-27

- Semantic version remains **PvP v3.50** / package **3.0.50**.
- Website target remains **v1.39**.
- Cache/build revision: `gl-pvp-3.50-maint-correction-r2-2026-09-27`.
- Steal blind selection is isolated to the popup; visible Battlefield Shards remain normal.
- Server creates an independently ordered, revision-bound opaque popup mapping without reordering the canonical Shard Pool.
- Tactical Adaptation can Negate Execute while Execute's Block/Dodge restrictions remain response-type-specific.
- PvP headless runtime now records authoritative battle-feedback events before render suppression so hit/Block/Dodge/Negate presentation reaches clients; existing approved VFX/SFX assets/helpers are reused.
- Tribute flight uses normalized Hero-card geometry so rotated/Exhausted target bounds do not stretch the flying card; shared EXP geometry sync is retained.
- Player 2 Kick uses `public/assets/lobby/exit.png` at the far right of connection status.
- Player 1 pre-match grace remains exactly 60 seconds; expired former Player 1 reconnects as Spectator and has no Kick authority.
- PvP custom imported Main Decks accept 50–60 cards; official Starter Decks remain 60.
- No popup removal, Battlefield Swap redesign, VS AI change, Tutorial change, or semantic version bump.
