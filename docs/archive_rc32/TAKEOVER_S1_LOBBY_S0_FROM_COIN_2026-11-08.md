# PvP S0 RC32 — Takeover: S0 Owns Coin Flip Onward

Date: 2026-11-08

## Baseline and authorization

- Baseline: `Grandis_Legacy_PvP_S0_RC32_S1v3.80.17_DirectStart_GitHub_Ready_2026-11-08.zip` (contents used as source).
- UI donor: `Grandis_Legacy_PvP_v3.80.17_2026-10-13.zip`.
- Gameplay donor: `Grandis_Legacy_VS_AI_Season0_v1.0_RC32_2026-11-07.zip`.
- User correction: **S0 starts at the Coin Flip**; earlier handoff after S1 Coin Flip was wrong.
- Approved scope: retain Season 1 lobby through READY/START MATCH with S0 data; use S0 RC32 coin UI/result, S0 opening and complete game thereafter. Do not touch donors or deploy.

## Implementation

1. `public/pvp/pvp-host.js` redirects to `/battle/` immediately on `coin-flip`, or `coin-result` on late reconnect, instead of waiting for `started`.
2. `public/battle/shared-app/app-runtime.js` exposes multiplayer coin presentation using the **RC32 coin overlay CSS/HTML/card art and flip animation**. Only server provides outcome and controls Start Game availability; no new client RNG or extra Season 0 opening panel.
3. `public/battle/runtime/pvp-network.js` receives server coin state, calls the S0 coin UI, sends coin choice/ack/confirm to server; after started it imports the S0 battlefield snapshot.
4. `server.js` updates build identity and architecture label, leaving its authoritative coin RNG and gameplay engine untouched.
5. `tests/ws-gate.py` runs actual 2-client WebSocket start-to-game validation. CI installs QA-only Python dependency. The prior unreliable Node WebSocket experimental-client integration scripts are retained only as reference, not executed by `npm run check`.

## Expected versus actual

- Previously: S1 lobby -> **S1 coin animation/result** -> Start Game -> S0 battlefield.
- Now: S1 lobby through START MATCH -> **S0 RC32 coin animation/result/Start Game** -> S0 RC32 battlefield.
- No fabricated `SEASON 0 · OPENING` modal and no staged single-Hero intro.

## Validated

- PASS: `npm run check` syntax of server and both client shells; S1 index/CSS source parity; S0 starter keys/artwork validation; two WS clients connect and choose S0 decks; READY; S0 coin selection and result (same server outcome for both); both ACK; Start Game; full S0 board snapshot (all three Heroes, six Hand cards, three Mana Shards), opponent Hand secrecy.
- NOT VERIFIED: visually rendering exact S0 coin in Chromium (navigation blocked by environment), Northflank deployment, full real-world 2-browser combat flow, audio playback in hosted browsers, all RC32 skill interactions.

## Release/deployment status

- GitHub-upload candidate ZIP only, NOT a proven live gameplay release; no deployment performed.
- Previous release/staging folders and original donor files are preserved.
