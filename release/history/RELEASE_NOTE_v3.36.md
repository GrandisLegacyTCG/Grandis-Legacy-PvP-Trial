# Grandis Legacy PvP v3.36 — Release Note

- Replaces indirect canonical-ledger battle VFX/audio recovery with one exact server `battle_feedback` animation-event path.
- Plays authoritative battle feedback only after board import/render, using the shared VS AI renderer/assets.
- Preserves exact-once playback via authoritative event IDs.
- Removes recipient `pvpBattleFeedbackEvents` ledger payload; server keeps internal authority for event generation.
- Moves each player's internet signal indicator outside the bordered name + deck box.
- Keeps local and opponent signal measurements separate by player/seat.
- Preserves lobby-only mobile hamburger, lobby-name battlefield binding, mobile Racial action, Hero/Legacy parity, Card Played parity, Quick Reload/Aura counter, and 60/3/1 PvP deck validation.
- No additional gameplay polling/broadcast is introduced.

Production `/pvp/` is still served by the Website repository mirror. Deploy the matching Website release together with this frontend, and deploy both Northflank room services from this PvP release.
