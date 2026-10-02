# Grandis Legacy PvP v3.70

Testing branch for the new Grandis Legacy two-player PvP build. Fresh rebuild from the current supplied VS AI v6.80 package.

## Architecture lock

This repository is a **fresh build from Grandis Legacy VS AI v6.80**. It is not an upgrade of PvP v3.51.

- Battlefield, gameplay runtime, card behavior, animations, VFX, sound, responsive battlefield UI, and presentation come from **VS AI v6.80**.
- PvP v3.51 is used only as the donor/reference for the server-authoritative multiplayer/lobby layer.
- The second VS AI seat remains the runtime `AI` side internally for compatibility, but `pvpHumanVsHuman` is enabled and both seats are controlled by human players.
- Clients send gameplay intents; the Node server owns the canonical match state and returns viewer-safe snapshots.

## PvP v3.70 scope

- Exactly **1 fixed room**: `GRANDIS_PVP`.
- Exactly **2 human player seats**.
- No Room 1 / Room 2 switching.
- No `Go To` navigation buttons.
- Spectator and Teaching View are parked for this branch.
- Lobby: player name, deck selection/import, formation swap, rank preview, Ready/Unready, player seats, Start Match.
- Seat controls in setup: either player may **Leave Seat**; Player 1 may remove Player 2; Player 2 may remove Player 1 only while Player 1 is offline.
- Opening coin flip is human-vs-human: Player 2 calls Heads/Tails; the winner starts.
- Battlefield identity uses two lines: local side shows **Player Name / Deck Name**; opponent side shows **Deck Name / Player Name**. Desktop display limit is **25 characters per line**; phone/tablet display limit is **20 characters per line**.
- Connection signal sits **outside** the identity container: left of the local Deck Name line, right of the opponent Deck Name line.
- Match duration timer is added to the existing v6.80 sidebar action row.
- Result/turn wording is humanized for PvP while gameplay semantics remain v6.80.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start
```

Then open the shown local URL in two browser sessions/tabs. The first connected client receives Player 1; the second receives Player 2.

## Tests

The repository includes architecture/runtime checks plus a two-human authoritative server simulation:

```bash
npm test
```

The test suite verifies the v3.70 wiring, executes the VS AI v6.80 shared runtime headlessly, checks the human-vs-human bridge/opening flow/viewer-safe snapshots, and simulates Player 1 + Player 2 through the fixed-room server including coin flip, turn handoff, second-player action, and rejection of a third client. The server simulation uses a temporary local `ws` test stub and removes it afterward, so the repository is not shipped with `node_modules`.

Actual local/deployed browser play still requires `npm install` so the real `ws` package is available, followed by a two-browser end-to-end check.


## Mobile PvP behavior

- Phone and tablet share one **landscape gameplay layout**. If the device is physically portrait, the whole app is rotated as a virtual landscape canvas instead of showing a separate portrait layout or a rotate-device gate.
- On mobile, tapping a battlefield card shows the standard desktop-position hover preview. Tapping outside the card dismisses it.
- The mobile double-click/double-tap Card Review popup is disabled. Desktop Card Review behavior is unchanged.
- The PvP lobby follows the v3.51 visual baseline and is compacted to fit one viewport with no lobby scrolling.
- Starter Deck 1 is the immediate default lobby selection, so formation/title/Your Deck counts stay synchronized from first render.
- Mobile and desktop both connect to the same-origin `/ws`; the client guards against stale socket close events and reconnects cleanly after network/background resume.
- Phone/tablet viewport is fixed: pinch zoom, page scrolling, and overscroll are blocked. Shard Pool containers stay fixed; only card sizing/stacking is adjusted for compact layouts.


## Current PvP regression guards

- Player 1 ↔ Player 2 turn handoff is fully human-authoritative; the internal `AI` side name is retained only as a v6.80 data-side identifier and does not run AI progression.
- Physical Shard state (`Mana Deck`, `Shard Pool`, Class Shard classes/counts) mirrors with the seat, preventing Player 2 Draw/Mana Regen from modifying Player 1 resources.
- Remote/private pending actions may not render local `CANCEL`; only the player who owns the pending choice can cancel it.
- First browser hydration imports state-only before re-enabling normal v6.80 snapshot animations.
- Gameplay/card/shard assets are bundled locally; deployed PvP does not depend on the public website for match assets.

## Northflank deployment

- Builder: **Dockerfile** at repository root.
- Container port: `3000` by default; Northflank may inject `PORT` and the server honors it.
- Health check: `/health`.
- The Docker image copies only `server.js`, `server/`, `public/`, and `data/`. The removed legacy `runtime/` and `sync/` folders are not required by this v6.80-based build.
