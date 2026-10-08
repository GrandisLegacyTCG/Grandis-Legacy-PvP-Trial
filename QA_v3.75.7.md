# QA — Grandis Legacy PvP v3.75.7

Automated checks completed for this candidate:

- JavaScript syntax: server, v3.51 browser gameplay core, network client, presentation adapter, v6.90.7 UI controller.
- Donor architecture lock: PASS.
  - stripped browser gameplay core SHA-256 matches PvP v3.51 exactly: `ff42da9f22fedb80dda944df28699a6d3eeae9d1fa8fb5aa05321abd766713e7`
  - no v3.73 `intentQueue` / `pumpIntent` gameplay model in the active network client
  - no v6 `computeExactManaPayment()` gameplay authority in the active browser core
  - v3.51 Shard/Mana rules self-test PASS
  - opaque opponent-Shard choice protocol present
  - approved opening choreography present
  - Card Played presentation reads public played-card events only
  - new-match presentation/history state reset present
- Canonical gameplay representative test: PASS.
  - Attack + Response backbone
  - Meditation
  - Item
  - Event
  - Mana/Shard payment
  - Tribute / Rank Up
  - Reposition
- Gameplay intent router ownership/revision/deduplication test: PASS.
- Defeat/casting/terminal lifecycle test: PASS.
- Router stale/wrong-seat/post-match mutation test: PASS.

## Manual release gate

This candidate is not declared live-ready until it passes a real two-browser session for:

1. opening animation and first-player Draw Phase separation,
2. Round 1 Event,
3. Meditation on both screens,
4. paid Skill/payment on both screens,
5. Steal/opponent Shard selection on both screens,
6. Card Played privacy (opponent private draws never shown).
