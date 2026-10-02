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
- Opening coin flip is human-vs-human: Player 2 calls Heads/Tails; the winner starts.
- Battlefield identity format: `[Player Name] - [Deck Name]` with a shared **40-character display budget including ` - `**.
- Connection signal appears to the **left** of each battlefield identity label.
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
