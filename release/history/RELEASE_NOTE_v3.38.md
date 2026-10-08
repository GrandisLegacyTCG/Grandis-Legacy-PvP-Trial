# Grandis Legacy PvP v3.38 — 2026-09-05

- Introduces the generic Response commit/payment framework from Source Stack v1.7.4.
- Spectral Grappling Hook and Escape Arrow now use one linear hierarchy: availability precheck -> Confirm Response commit -> old Response Window closes -> mandatory payment -> new counter-Response Window.
- Exact source-card instance cannot pay its own additional discard cost; another copy remains a separate legal instance.
- Hero and Legacy card size parity is structural: Legacy uses the same `hero-card-anchor` stage as Hero.
- Game Over changes the permanent SURRENDER control to BACK TO LOBBY.
- Authoritative PvP battle feedback preserves semantic `heal` end-to-end and maps it to Heal.png + Heal.mp3.
- Authoritative server source loading is synchronized to Runtime Data v0.14.3 / Effect Recipe v0.13.3 / Runtime Foundation v1.90 / Core v0.58 / Sync v2.52.
- Grand Arbalest / Rapid Chamber draw replacement flow is preserved: actual mandatory draw + replacement draw counts as Draw This Turn 2, then proceeds to Deploy. +10 applies only to Physical Attack damage.
- Match deck legality remains exactly 60 Main Deck cards, normal max 3, Ultimate max 1.
