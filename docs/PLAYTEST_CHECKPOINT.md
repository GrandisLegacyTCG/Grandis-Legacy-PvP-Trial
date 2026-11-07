# Grandis Legacy PvP Season 0 — RC31 playtest checkpoint

Status: **STAGING PLAYTEST SNAPSHOT; NOT OFFICIAL RELEASE**.

Source gameplay: **VS AI Season 0 RC31**. Multiplayer pattern inspected from **PvP Season 1 v3.51** (not the unavailable v3.80.17). Approved one-card override from RC31: **Grand Finale S0-CLE-031 Bard 60 / Maestro 90**.

Acceptance evidence in current checkout:
- `npm run check`: PASS, including real RC31 Attack/Response/paid Defense, two headless full matches with both first-seat orders, and one full **true-WebSocket** two-human deck-out match through Round 45.
- Two separate Chromium UI contexts: PASS lobby/deck/ready/coin/hand render/phase/queued intents via *test-only* WS relay to real Node server. Native direct two-browser WSS and visual assets remain NOT VERIFIED.
- One exploratory randomized headless combat match: ordinary three-Hero defeat victory observed; not proof of exhaustive cards.

Run `npm start` on Node 22+, then open `http://localhost:3000/` in two distinct browser profiles and join the same room code. Both select a deck and Ready; P1 starts; P2 chooses the opening coin. See `README.md` for Northflank instructions and important limitations.

Do **not** deploy as certified production PvP until direct real-browser/full gameplay QA is completed. Never overwrite the supplied VS AI RC31 archive or Season 0 OSA to deploy this staging code. No service has been deployed by the assistant.
