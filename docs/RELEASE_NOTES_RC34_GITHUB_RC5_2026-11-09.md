# RC34 PvP GitHub RC5 — Mana Payment Transport (2026-11-09)

**Release:** `gl-s0-rc34-github-rc5-2026-11-09`. **Upgrades:** RC4 without changing donor RC34 gameplay/card data. **Status:** STAGING, not FINAL.

- S1-style local Mana/Surge draft (no WebSocket request or local engine mutation per Shard click).
- PAY sent immediately as an atomic physical-UID server transaction; non-blocking visual flight kept.
- Response Mana and mandatory additional discard submitted atomically, including zero-Mana Responses.
- Strict one-intent in-flight with ACK identity, no silent four-action queue; buttons requiring multiple sequential changes grouped into server-verified single actions.
- Mana-specific modal repaint instead of repeated whole-board redraw on Shard toggles; `?pvpPerf=1` paint diagnostics.
- Added `npm run test:mana-transport` to core suite.

**Retained:** RC2 deadlock fixes, RC3 Response/Postmatch/touch fixes, RC4 Tune Up and opponent Mana, entire Season 0 RC34 donor card set/art/audio.

**Open:** mobile lobby redesign and Coin Flip/Back-of-Card opening. Real hosted match/latency and all mobile input combinations not yet verified. No repository or hosting changes were made.
