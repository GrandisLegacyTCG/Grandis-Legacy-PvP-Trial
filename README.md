# Grandis Legacy PvP — v3.75.7

## Release identity

- PvP Version: **v3.75.7**
- Package Version: **3.75.7**
- Date: **2026-10-09**
- Status: **two-browser candidate; not yet promoted to live**

## Donor architecture

v3.75.7 is rebuilt from the proven **PvP v3.51** gameplay/network contract instead of continuing to patch the experimental v3.73.20 gameplay bridge.

- **PvP v3.51** — authoritative server/runtime, browser gameplay contract, one-intent-in-flight network lifecycle, pending-choice lifecycle, hidden-information protocol, payment rules, reconnect/spectator behavior.
- **VS AI v6.90.7** — battlefield UI/UX, interaction presentation, center-choice visuals, card/shard presentation, animation/audio presentation.
- **pvp-fresh v3.73.20** — presentation reference only for lobby/start/opening. Its gameplay intent queue, local-first render flow, and exact-payment backend are intentionally excluded.

The intended player experience is simple: the match should look and feel like the newest VS AI UI while behaving like the proven online PvP runtime underneath.

## Important gameplay/network decisions

- PvP gameplay is **server authoritative**.
- Only **one gameplay intent may be in flight** at a time; the next interaction waits for the next authoritative board revision.
- Browser UI does not advance gameplay locally after sending a PvP intent.
- Pending choices are rehydrated/closed from each authoritative snapshot.
- Normal v3.51 Mana payment is preserved: Class Shards are the optional player choice for Skills; Mana Shards fill the remaining cost automatically. Event/Item payment does not use the experimental universal exact-Shard payment backend.
- Opponent Shard selection uses the v3.51 opaque `choice_handle + board revision` protocol so hidden Shard identity stays private.
- Card Played/History reads only public played-card event streams; opening/draw-to-Hand is not used as Card Played history.

## Opening presentation

The presentation layer uses the approved opening choreography without changing authoritative setup state:

1. Opening Hand: Player #1 → Opponent #1 → ... alternating until both have 6.
2. Starting Shards: Player #1 → Opponent #1 → ... alternating until both have 3.
3. Opening setup completes for both players.
4. The first player then performs the normal Draw Phase presentation: +1 Main Deck card, then +1 Shard at normal speed.

Opening card/shard flight is approximately 2× normal speed while remaining visually readable.

## First manual acceptance pass

Before live promotion, test with two real browser clients in this order:

1. Opening choreography and first-player Draw Phase separation.
2. Round 1 Event use (only the first player's Attack is restricted on that first turn).
3. Meditation — resolve completely and identically on both clients.
4. A paid Skill — payment → resolution → popup closes on both clients.
5. Steal/opponent Shard selection — hidden selection and resolution on both clients.
6. Card Played privacy — opponent opening/normal draws must never reveal card identity in history.

See `ARCHITECTURE_DONOR_MAP.md` and `BUILD_NOTES_v3.75.7.md`.
