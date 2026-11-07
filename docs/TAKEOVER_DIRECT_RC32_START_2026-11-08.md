# PvP S0 RC32 — Direct Start Takeover / 8 November 2026

## Baseline and request
- Baseline: `Grandis_Legacy_PvP_S0_RC32_S1v3.80.17_UI_S0_Content_GitHub_Ready_2026-11-08.zip` (expanded working tree).
- Authoritative gameplay source: `Grandis_Legacy_VS_AI_Season0_v1.0_RC32_2026-11-07.zip`.
- Original lobby donor: `Grandis_Legacy_PvP_v3.80.17_2026-10-13.zip`.
- User found custom extra S0 Opening Coin Flip interstitial displaying three Heroes, face-down six Main cards and three Shards; user requires direct RC32 in-game start instead of sequential presentation.
- Authorization: remove invented stage and bridge immediately to S0; no changes to other gameplay or remote deployment.

## Root cause — CONFIRMED
- `public/pvp/pvp-host.js` `showS0Opening()` explicitly authored the **non-RC32** overlay and a 2.6 second timer before notifying server `opening-presented`.
- `server.js` `confirmCoin()` moved the match into a non-native `opening` network state requiring **two** separate `opening-presented` messages before moving to `started`.
- These combined delayed the RC32 battlefield and showed a user-unrequested, second opening screen.

## Narrow changes
- `server.js`: `confirmCoin()` completes the existing RC32 opening authority then immediately marks match `started`; drops the `opening-presented` RPC and staged `opening` status and no longer distributes a separate opening data payload. New build ID forces old cached clients to update.
- `public/pvp/pvp-host.js`: removes the fabricated presentation/2.6s timeout and its network acknowledgement; direct `/battle/` redirect on `started` without intermediate screen.
- `public/battle/runtime/pvp-network.js`: comment updated to match new handoff.
- `tests/s1-to-s0-transition.mjs`, `tests/s0-catalog-and-custom.mjs`: direct transition, full initial S0 board, hidden information, reconnect, S0 deck imports and gameplay smoke.
- S1 lobby layout/CSS and S0 gameplay engine **left unchanged**.

## QA
| Check | Result | Limits |
| --- | --- | --- |
| Node syntax / S1 original lobby HTML and CSS parity | PASS | Source and structural checks |
| S1 lobby → coin-result → direct `started` without opening state | PASS | Live two-seat WebSocket |
| Both S0 Heroes/Hand/Mana snapshots ready on first started message | PASS | Server/client-state integration |
| No fabricated S0 screen in active lobby code | PASS | Source check |
| S0 catalog and builder custom deck + S1 rejection | PASS | Tested v1.58 export sample |
| Wrong-seat action rejected, spectator masked, reconnect, surrender | PASS | WebSocket smoke, not full match |
| Real browser rendering / navigation | NOT VERIFIED | Chromium navigation ERR_BLOCKED_BY_ADMINISTRATOR |
| Northflank HTTPS/WSS | NOT VERIFIED | No live deployment performed |
| Every RC32 card, full combat victory | NOT VERIFIED | Out of scope for this bug fix |

## Deployment / handover
- Upload ZIP contents to GitHub PvP **S0** repo, then redeploy Northflank with one replica, HTTP 3000 and `/health`.
- Expect: original S1 v3.80.17 lobby; all deck/Hero data S0; coin flip & Start Game remain donor flow; **immediate full S0 RC32 battlefield** after Start Game.
- Old deployment continues to show the overlay until the new bundle is deployed; these changes are staging only.
