# Grandis Legacy PvP v3.80.10 — 2026-10-12

Stabilization batch built on the real-browser-confirmed Mana Payment path from v3.80.8/v3.80.9.

## Gameplay/input

- Keeps v6.91.6 center Mana draft + single final-UID PAY commit unchanged.
- CANCEL is local-owner-only.
- Removes the old Response full-local-snapshot rollback path.
- Gates donor delegated gameplay clicks plus donor Choice Confirm/Close gameplay mutation while PvP owns input.
- Restricts `intentBatch` to approved two-step atomic UI pairs and revalidates ownership before every step.

## Presentation

- Restores player/opponent battlefield names.
- Adds heartbeat-based connection bars: local on the left of the name; opponent on the right.
- Transports server-resolved Attack / Block / Dodge / Heal feedback to both browsers as stable presentation events, then replays v6.91.6 VFX/SFX once.
- Keeps automatic Draw -> Deploy authoritative while visually holding the Draw tracker until committed Draw/Mana Regen presentation finishes.
- Makes legal active Racial/Class buttons visibly available.

## Preserved

- VS AI v6.91.6 Mana exact-replacement / normal-Mana preference.
- Steal auto-resolve when opponent Shard choice is meaningless.
- Seat-localized privacy and public normal Shard Pool visibility.
- 50–60 card Custom Main Deck acceptance.
- no-text-before-art asset behavior and no top-deck-order preload.

## QA boundary

Automated source/authority/transport/asset/manifest checks can be run locally. Real two-browser WebSocket gameplay remains the final acceptance test for presentation timing and device behavior.
