# Grandis Legacy PvP S0 RC32 — S1 lobby shell + networking only

**Status:** deployment candidate (lobby blank-page bug fixed; not deployed). WebSocket contract and source/syntax checks PASS; full visual browser and actual Northflank gameplay are **NOT VERIFIED**.

## Exact ownership boundary

| Stage | Presentation / UI | Content & rules |
| --- | --- | --- |
| Lobby layout, room seats, name/Ready/Spectate/Kick/Start Match | **PvP S1 v3.80.17 visual shell + multiplayer seat protocol** | Season 0 RC32 decks only |
| **Deck Picker, Hero preview, Rank I–III, Formation Swap** | **Season 0 RC32 components and artwork** embedded inside the S1 lobby shell | S0 RC32 card database and actual selected deck |
| **Opening Coin Flip (from the moment Start Match is accepted)** | **Season 0 RC32 coin UI, art, sound and animation** | Server chooses one authoritative coin outcome for both players |
| Coin result and Start Game | **Season 0 RC32 coin result UI** | Server validates both client presentation acknowledgments |
| Opening setup and battlefield | **Season 0 RC32** — no invented Season 0 Opening modal, no Hero-by-Hero lobby transition | Three Heroes, Opening Hand and 3 starting Mana cards committed by the Season 0 RC32 engine |
| Rest of game | **Season 0 RC32 battlefield** | Season 0 RC32 engine and card effects; including RC32 Grand Finale and Poison Vial changes |

**Important:** PvP S1 v3.80.17 supplies ONLY the *lobby container/layout* and seat/Ready/Spectate/Kick/Start-Match networking pattern. Hero progression/formation controls now use RC32 component classes, layout and Swap art (vsai-v643-*), not S1 Hero widgets. It does **not** supply coin presentation, card effects, S1 deck lists, Hero identities or battlefield. `/` redirects to `/battle/` at the `coin-flip` state; previously it waited until `started`. This is a control-point change, not merely a CSS copy.

The S0 RC32 coin appearance is adapted to multiplayer: Player 2 chooses heads/tails, server picks the result, the same outcome is shown to both clients. Neither browser is allowed to draw a random second outcome. After Start Game, the authoritative full RC32 battlefield is imported directly. We do not insert a custom summary/intro screen.

## GitHub and Northflank staging

1. Upload **the extracted contents** of the ZIP into the **PvP S0** repository root. Do not overwrite the PvP S1 repository.
2. On Northflank, use the supplied `Dockerfile`; expose application HTTP port **3000**, HTTPS/WebSocket pass-through via the Northflank public endpoint; use `/health` for readiness and run **one instance** (single-process in-memory match state).
3. Open in two browser profiles or devices. Both connect to one room automatically, with no Room Code. Choose S0 decks and READY, then Player 1 clicks START MATCH.
4. Check that both clients leave S1 lobby **at coin flip** and use **RC32 Coin Flip**. Player 2 chooses, both see the same result, then Start Game opens the RC32 battlefield with all three Heroes immediately present.
5. Validate one real Attack/Response and complete a full match on Northflank. Do not call the build final until those pass.

## QA

`npm run check` requires Node.js 22+ plus Python 3 and the **QA-only** `websocket-client==1.8.0` package (`python3 -m pip install websocket-client==1.8.0`). It runs JS syntax checks, S1 lobby source-parity checks, S0 starter catalog checks, and a live two-seat RFC6455 WebSocket transition scenario. GitHub Actions installs the Python QA dependency automatically. The application server itself has no added Python runtime dependency.

Current verification: **PASS** for source/syntax + local WebSocket two-seat lifecycle, S1 shell CSS hash unchanged, RC32 Hero formation markup/asset checks, Season 0 Hero/Hand/Mana, private-hand masking. **NOT VERIFIED**: browser visual parity, all RC32 opening audio in hosted browser, full combat win, Northflank live deployment, all card interactions. User-side local testing remains waived; this waiver does not count as PASS.

See `docs/TAKEOVER_S1_LOBBY_S0_FROM_COIN_2026-11-08.md`.

## 2026-11-08 — Blank lobby correction (staging)

Removed a stale `openingPresented` reference from `public/pvp/pvp-host.js` that threw a `ReferenceError` before the lobby initialized. Added `tests/lobby-init.mjs` as part of `npm run check`; all checks PASS. Real Northflank/browser-over-HTTP playability remains NOT VERIFIED. See `docs/TAKEOVER_LOBBY_BLANK_FIX_2026-11-08.md`. No release ZIP produced.


## Complete deployment candidate (2026-11-08)

This bundle includes the blank-lobby fix and all repository files. See `docs/DEPLOYMENT_HANDOFF_2026-11-08.md`. GitHub push and Northflank deployment have **not** been performed; do not mistake a deployment-ready ZIP for a running service.
