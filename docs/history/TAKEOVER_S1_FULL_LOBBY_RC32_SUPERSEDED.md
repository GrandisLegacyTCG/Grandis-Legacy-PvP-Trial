# Grandis PvP S0 — Full S1 Pregame Takeover (2026-11-07)

## Baselines and instruction

- **Source of all pregame UI/logic:** `Grandis_Legacy_PvP_v3.80.17_2026-10-13.zip`.
- **Source of all battle UI/gameplay:** `Grandis_Legacy_PvP_S0_RC32_Lobby_v3.80.17_GitHub_Ready_2026-11-07.zip` RC32 battlefield + its canonical headless RC32 engine.
- User required: *From lobby until game start use S1 v3.80.17, nothing from S0; after game starts use S0.*
- No upload/deployment to GitHub or Northflank performed.

## Changes made (isolated staging)

1. Copied original S1 `public/*` to served website root. Index and lobby CSS bit-for-bit unchanged.
2. Copied original S0 RC32 game frontend to `public/battle/`; removed usage of S0 lobby styles and implementation. Replaced only battle networking with S1 websocket protocol adapter.
3. S1 client `pvp-host.js` gets tiny redirect on `started`/`finished`, prior to any import of the S0 board by the S1 runtime.
4. S1 `server.js` remains pregame controller, coin flip authority and opening presenter; on second `opening-presented`, creates S0 RC32 headless authority, establishes the new game using first-player coin result, and swaps only the poststart authority.
5. Reused S0 per-seat masking and server-side blind Mana choice handles for the RC32 board. Spectators receive both hands masked.
6. A small `server/ws-compat.mjs` adapter carries the same S1 network protocol using bundled RFC6455 server logic. Avoided external npm install to enable local Node and Docker startup.
7. S1 starter selection indices map to S0 starter indices at the seam **because Season 1 cards cannot be played in S0**. Not a gameplay equivalence; author confirmation needed before calling this complete.

## Verified

- S1 `index.html` SHA-256: `3e05bd53c43830ce1d7113cc7d4d19e8edf5d4a430f2644d6d666e71678828f4` (same as donor).
- S1 lobby CSS SHA-256: `7175fb9ddf54f7d173d05e5a3d569fd4391d0e378c81f559f5c7c8bdbae138eb` (same as donor).
- Syntax: PASS.
- Node HTTP health, root lobby and `/battle/` routes: PASS.
- S1 WebSocket setup → coin → S1 opening → S0 game handoff: PASS with two simulated peers.
- S0 masking both players: PASS.
- S0 legal action, wrong-seat denial, surrender: PASS.

## Unverified and open

- **Browser navigation/screenshot** BLOCKED by environment's navigation security policy (ERR_BLOCKED_BY_ADMINISTRATOR), not counted PASS.
- **Northflank production** NOT VERIFIED.
- **S1 deck display vs S0 actual match** deliberately mismatched, high priority gameplay UX inconsistency. No unsupported conversion was invented; position-only starter mapping is transparent and documented. S1 custom decks rejected on START MATCH.
- **Full actual combat path, card interactions, reconnect across browser navigation and spectator animations** NOT VERIFIED end-to-end.

## Next action

Northflank staging run with two browser tabs. Check exact S1 lobby with no Room Code and no scroll at supported viewport; Ready, coin, opening and automatic transfer to S0 battlefield; compare chosen decks and decide whether a narrow S0-data-only pregame substitution is authorized. Then run full combat QA. No release claim before acceptance.
