# Grandis Legacy PvP Season 0 RC32 — PvP S1 v3.80.17 Lobby UI / S0 Content

**Status: GitHub/Northflank staging candidate; gameplay not fully verified in two live remote browsers.**

## Exact source boundaries

| Screen or behavior | Source | Actual content |
| --- | --- | --- |
| Lobby structure, visuals, CSS, responsive layout, room/seat management, Ready, Spectate, Start Match | **PvP Season 1 v3.80.17** | **Season 0** decks, Heroes, class names, deck counts, artwork |
| Starter Deck 1–5 and hero rank/progression preview | Layout from S1 v3.80.17 | **Exact S0 RC32 starter catalog** in `public/battle/engine/shared-app/active-starters.js` |
| Custom deck import | S1 lobby control | S0 Deck Builder JSON or S0 canonical starter JSON; S1 cards rejected |
| Coin selection and coin result | S1 v3.80.17 original UX/controls | First-player choice sent to S0 authority |
| Opening presentation | S1 coin overlay styling and back-of-card assets, custom lightweight S0 content display | **S0 RC32 authoritative Opening Hand and Mana** (6 + 3) and selected S0 Heroes; no S1 match is started |
| Game board, cards, effects, authority, victory, reconnect | **VS AI Season 0 RC32** and PvP multiplayer adapter | Season 0 only, including Grand Finale RC32 override |

**Important:** This release does **not** use the former "S1 Starter 1 -> S0 Starter 1" positional mapping. The lobby sends the real `s0_starter_*` ID; the server constructs its RC32 match using that exact selected S0 deck (plus any valid Hero formation changes). The S1 starter registry is not read by the lobby or S0 server.

Source-specific details:
- `public/index.html` preserves original v3.80.17 markup with only **two S0 catalog script tags** inserted; removing them reproduces donor's original HTML SHA-256.
- `public/lobby/pvp-lobby-v3.76.6.css` is **byte-identical** to S1 v3.80.17.
- `public/pvp/pvp-host.js` retains S1 lobby skeleton, coin controls, connection; its **data readers** now use the S0 catalog / card data and `/battle/card-art/`.
- `server/s0-pregame-catalog.mjs` loads S0 RC32 starter source into an isolated VM and rejects unexpected season or deck size.
- `server.js` uses S1 server room/pregame protocol but **prepares RC32 authority at START MATCH**, which rejects invalid S0 decks before the coin flip; the S0 authority itself draws and controls the Opening Hand/Mana.
- After S0 opening both clients navigate to `/battle/`, and use the existing S0 RC32 battle client.

## Usage / Northflank

1. **For GitHub:** unzip this package and upload the **contents** directly to the root of the *PvP Season 0* repository; do not upload a single ZIP and do not overwrite the existing PvP Season 1 repository.
2. Connect Northflank to the PvP S0 repository; use Dockerfile build, public HTTP port **3000**, health URL `/health` and single instance for the in-memory room model.
3. Use the service's HTTPS URL in two different browsers or devices. One player joins automatically as Player 1, the other as Player 2; additional visitors are spectators (S1 protocol). There is **no Room Code**.
4. Select S0 Starter 1–5 (or import an S0 Deck Builder JSON), Ready both seats, click START MATCH, complete the coin flip, and proceed to the S0 board.
5. Avoid scaling to multiple server instances while the room and match are in memory; reconnects must reach the original running instance.

## Tests

Run `npm run check` (Node.js 22 recommended). This executes syntax, S1 UI parity, WebSocket transition, and extra S0 catalog/custom-deck tests. No external npm dependencies required for runtime.

**Verified in this staging build:**
- Original S1 layout and CSS parity, with zero Room Code or manual Join Room.
- Exactly five selected S0 starter decks with 50 Main Deck cards, 12 Legacy cards, and 12 Mana, and all referenced artwork present.
- Both player seats, Deck/Ready, coin flip, S0 opening payload, both acknowledgements, and automatic S0 game handoff.
- Imported S0 v1.58 Deck Builder export works in the authoritative server; an attempted S1 deck import is rejected.
- Correct S0 Hero cards in Player 2's battlefield, seat-specific hidden hand protections, wrong-seat action rejection, reconnect, surrender.

**Not verified:** two-browser visual walkthrough (Chromium rejects localhost navigation here with `ERR_BLOCKED_BY_ADMINISTRATOR`), Northflank deployment, full combat match win, every S0 card interaction, imports of all possible Deck Builder v1.62 export variants. The new opening is **not** pixel-identical to Season 1's original in-battle flying-card animation: the canonical game draw is performed by RC32 and presented using an S1-style card-back sequence so no S1 cards appear during the transition.

See `docs/TAKEOVER_S0_PREGAME_CONTENT_2026-11-08.md` for changed files, QA, open items and deployment checkpoints.
