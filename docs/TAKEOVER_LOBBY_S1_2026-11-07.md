# Grandis Legacy PvP Season 0 — Season 1-style Lobby Takeover

## Baseline / request

- Baseline: `Grandis_Legacy_PvP_S0_RC32_GitHub_Ready_2026-11-07.zip`, extracted working tree.
- Request: replace the centered PvP S0 lobby screenshot with the existing Season 1 PvP lobby layout; retain the RC32 in-game UI and all RC32 gameplay.
- Exact requested reference: `Grandis_Legacy_PvP_v3.80.17_2026-10-13` **not available** in accessible files. Verified reference used: `Grandis_Legacy_PvP_v3.51_GitHub_Repository_2026-09-28.zip` (`public/js/pvp-network.js`, lobby styling and assets). **Do not claim exact parity with v3.80.17**.

## Implemented in separate working tree

- Full-screen Season 1 v3.51-style lobby frame with branded header, deck picker, Hero formation cards, rank preview, deck statistics, import, room panel, seats, readiness, reconnect, invitation link, and coin controls.
- S0 starter deck card previews and Hero rank progression from current RC32 `GL_ACTIVE_STARTER_DECKS`. No Season 1 card art, data, rules or engine integrated.
- Adjacent Hero swap controls produce a new S0 deck payload that is validated and loaded through existing server-authoritative `custom-deck` handling. The original RC32 in-game engine and rendering remain unchanged.
- Preserved previous headless server, WebSocket protocol, local hero engine and security boundaries.

## Verification

| Test | Result | Evidence / limit |
| --- | --- | --- |
| `npm run check:repo` | PASS | Asset presence + original repo integrity |
| `npm run check:syntax` | PASS | JS/Node parse |
| `npm run check` | PASS | Existing RC32 engine and network regression suite, game-over by deck-out |
| `tests/lobby-s1-style-browser.py` | PASS | Chromium injected HTML/CSS/assets, desktop and mobile geometry |
| `tests/browser-bridge-smoke.py` | PASS | 2 Chromium renderer contexts + real Node server through test-only WS relay |
| `tests/lobby-s1-formation-network.py` | PASS | Formation swap persists to server at match start, 2-player coin/phase |
| Native HTTP Chromium navigation | BLOCKED | Browser policy blocks localhost; app-server HTTP paths verified separately |
| Northflank two-device testing | NOT VERIFIED | Requires GitHub upload and hosting |
| Exact v3.80.17 lobby replication | NOT VERIFIED | Requested source unavailable |
| Full victory by 3 defeated Heroes | NOT VERIFIED | Not part of this UI-only change verification |

## Packaging / release

- Separate GitHub-ready ZIP can be generated from this working tree; original source archives remain unchanged.
- Do not call production-ready or replace a deployed Northflank instance before hosted acceptance.
- If exact UI parity is required, obtain the actual v3.80.17 source and compare first.
