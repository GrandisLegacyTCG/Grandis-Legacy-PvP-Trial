# Grandis Legacy PvP Season 0 — S1 v3.80.17 Full Pregame → RC32 Battlefield

**Status: staging for GitHub / Northflank playtest, NOT a final validated release.**

This package replaces the previous faux-S1 Season 0 lobby with the actual `Grandis_Legacy_PvP_v3.80.17_2026-10-13` frontend **from page load through lobby, player/spectator roles, Ready, START MATCH, coin choice, coin result and the original S1 opening presentation**. Season 0 loads **only once both players have completed the S1 opening presentation**. The browser then navigates to `/battle/`, loading the Season 0 RC32 game client (not a fork of the Season 1 battle client).

## Page boundaries

| URL / phase | Active application | Card and deck presentation |
|---|---|---|
| `/` — initial lobby | **Unchanged S1 v3.80.17 index.html, lobby stylesheet, lobby images** | Season 1 source set (as expressly requested) |
| Room / Ready / spectator / coin / opening | **S1 v3.80.17 original pregame client, server protocol and presenter** | Season 1 opening display |
| `opening-presented` acknowledged by BOTH players | **One server-side transition to S0 RC32 authority** | New Season 0 match opening is created |
| `/battle/` — playing / finished | **Season 0 RC32 gameplay engine, card effects, art and battlefield UI** | Season 0 cards |

### Source parity

- `public/index.html`: **SHA-256 identical** to S1 v3.80.17.
- `public/lobby/pvp-lobby-v3.76.6.css`: **SHA-256 identical** to S1 v3.80.17.
- `public/assets/lobby/*`: copied untouched from S1 v3.80.17.
- `public/pvp/pvp-host.js`: S1 host with exactly one narrow handoff hook added to redirect to `/battle/` on `started` / `finished` status.
- `server.js`: S1 v3.80.17 pregame room/coin/start controller plus a boundary adapter to the actual S0 RC32 engine. No explicit Room Code or JOIN ROOM form exists.
- `public/battle`: the existing Season 0 RC32 battlefield, with its old S0 lobby disconnected (no imported S0 lobby elements).

### **Known deck compatibility limitation — IMPORTANT**

Strictly keeping **Season 1's full pregame source** means the pregame deck selector and opening animation display *Season 1* cards, which **cannot be played directly by the Season 0 engine**. To allow a playable Season 0 battle, the server currently maps starter selections **by position**: S1 Starter 1 → S0 Starter 1, ..., S1 Starter 5 → S0 Starter 5.

This is a **deliberate transition scaffold, not deck equivalence**. The player will see S1 hero/cards in pregame and different S0 hero/cards after handoff. This should be considered unresolved for a final public game. Season 1 imported custom decks are rejected with a clear error at match start, because they are not legal S0 game decks. There is no silent cross-season conversion.

To make pregame deck selection match the eventual S0 cards, the Season 1 lobby's data source must be switched to S0 — **which would change the strict full-S1 pregame requirement**. This change has not been made without authorization.

## Run / Northflank

- Node.js >= 18; **no npm dependencies required** (the S1 WebSocket protocol uses the pre-existing dependency-free S0 transport wrapper for this staged build).
- `npm start` or `node server.js`.
- Northflank: Dockerfile build, public port HTTP 3000, healthcheck `/health`. Same-origin WebSocket upgrades on `/ws`. Deploy only this **Season 0** repository, not the real Season 1 repository.
- If Northflank sets `PORT`, this server respects it automatically.
- All players should use the **same website URL**, no Room Code. First two players are seats 1/2; additional visitors enter as spectators per S1 mechanics.
- `/battle/` only works with the tab session previously established by the S1 lobby. Direct visitors are redirected to `/`.

## Tests actually performed

Run: `npm run check:syntax && npm run test:transition`

- PASS: exact S1 lobby HTML and CSS SHA-256 parity; no ROOM CODE / JOIN ROOM markup.
- PASS: server responds at `/health`; both routes `/` and `/battle/` serve the correct application.
- PASS: two actual WebSocket clients connect without a room code and receive two S1 seats.
- PASS: S1 deck selection, both Ready, START MATCH, Player 2 coin choice, coin result, coin acknowledgements, **S1 opening payload** and both `opening-presented` acknowledgements.
- PASS: S0 RC32 authority becomes active only at handoff, each player receives own S0 opening Hand and masked opponent Hand.
- PASS: wrong-seat S0 gameplay action rejected; legitimate S0 phase action committed; surrender ends the match.
- **NOT VERIFIED:** real two-browser visual walkthrough (the browser in this execution environment refuses HTTP and `file:` navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`).
- **NOT VERIFIED:** complete 3-Hero combat victory through Northflank (no live deployment performed here).
- **NOT VERIFIED:** all custom deck flows / all RC32 card interactions / spectator rendering across the transition.

## Scope, safety and provenance

The source ZIPs for **Season 1 v3.80.17** and **Season 0 RC32** were not changed. The previous staging builds remain untouched. Source transition is isolated in server + S1 client handoff + S0 game-only WS client.

See `docs/TAKEOVER_S1_FULL_LOBBY_RC32.md` and `tests/s1-to-s0-transition.mjs`.
