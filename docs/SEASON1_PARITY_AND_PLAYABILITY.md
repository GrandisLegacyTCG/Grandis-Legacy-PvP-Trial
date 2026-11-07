# PvP S0 RC31 — Season 1 parity review and integration status

## What “VS AI and PvP are the same” means, technically

Inspected the available Season 1 reference **PvP v3.51**, not v3.80.17 (not supplied). That reference uses **the shared browser runtime bridge** (`GL_LOCAL_AI_BRIDGE`) for its Node match authority, and a **presentation adapter** to hand viewer-safe network snapshots to the browser renderer. Its `server/gameplay-intent-router.mjs` handles actor/turn/window/session/duplicate checks, while the runtime still owns card rules. The browser's `pvp-network.js` manages room and transport; `public/js/pvp-presentation-adapter.js` handles the viewing boundary. Season 1 is *not* evidence that every later VS AI build is automatically identical: PvP v3.51 identifies earlier Candidate/shared-runtime baselines.

S0 follows that architecture **without copying Season 1 card effects or Season 1 gameplay data**:

- **Single RC31 game model:** `client/engine/shared-app/app.bundle.js` is the RC31 gameplay runtime, loaded both in the browser and as a headless VM in each Node room. Only three RC31 files were modified in the PvP staging copy (engine presentation corrections, `index.html` PvP bootstrap, and minimal UI handling). All original RC31 assets are retained.
- **Authority:** `server/headless-rc31.mjs` stores the fixed PLAYER=seat1/AI=seat2 canonical board, switches to the acting seat's local PLAYER viewpoint only while executing the genuine RC31 intent and returns to fixed canonical. No simulated-AI opponent actions are scheduled.
- **Transport and access:** `server.js` authorizes room seats, revisions, legal turns/Responses, deck choice, reconnect and surrender. Browser intent calls cannot directly mutate the authoritative game state. `server/viewer-safe.mjs` masks private data. `client/runtime/pvp-network.js` imports only the recipient-specific board into the RC31 renderer.
- **UI reuse:** `client/shared-app/app-runtime.js` and battlefield assets are RC31, preserving the original layout and on-card interactions; PvP-only network overlay is separate.
- **Card authority:** S0 DEV45 through RC31 with the single authorized **Grand Finale (`S0-CLE-031`) local override (Bard 60 / Maestro 90)**. Never silently import older OSA values.

## Review findings (2026-11-07)

| Issue / test | Status | Evidence |
|---|---|---|
| RC31 game engine and UI baseline retained | CONFIRMED | Original RC31 ZIP compared to staging: 658 identical files, 3 modified, 0 missing. |
| Seat 2 invalid action accepted due import-only normalization | FIXED IN STAGING | Comparison now taken after restoring actor perspective; tested with `beginPlayFromHand` in Draw Phase and no revision change. |
| RC31 multi-intent UI handler could drop subsequent action | FIXED IN STAGING | Revision-serialized client queue in `client/runtime/pvp-network.js`; exercised with two Chromium renderer contexts and real server through test-only WS relay. |
| Actual cross-seat Attack, source/target, Mana and opponent Response/pass | PASS — tested path | `tests/actual-card-exchange.mjs` finds a legal attack with real randomized opening hands and resolves all steps through RC31. Network card exchange was also observed successfully once; optional test remains randomized. |
| Real UI — lobby, 2 decks, ready, coin, both hands, turn and queued phase intents | PASS — controlled harness | `tests/browser-bridge-smoke.py` loads the original JS into two Chromium contexts; connects to a running real local server via test-only Python WebSocket relay because the browser is administratively blocked from localhost network navigation in this environment. This **does not verify native browser WebSocket connectivity**. |
| Full 3-Hero win, Status, Casting, Revive, all card effects | NOT VERIFIED | Requires exhaustive end-to-end gameplay and rule-parity tests. |
| Direct two-browser HTTP+WSS / Northflank proxy / cross-device | NOT VERIFIED | No public deployment; browser native outbound network blocked here. |

## Remaining acceptance criteria before a production playable release

1. Direct HTTP+WSS between two browser devices, with the real art/audio loaded from the live origin; verify animations, player names, action UI, private opponent events and reconnection.
2. Full three-Hero match until ordinary victory, losing by mandatory deck-out, draw and surrender; multiple archetypes/cards.
3. Negative and edge cases: simultaneous defeat, pending target/Response cancel, STUN/Freeze/Sleep and Casting while swappable, hand-limit discard, Class Shard selection, Revive, Rank Up and Ultimate Tribute.
4. Northflank single-replica staging deployment with correct environment/proxy, observable logs, reconnect and restart policy. Maintain a separate PvP S0 repository and preserve VS AI RC31.

**This document records verified capabilities and unverified acceptance gates separately.** Not a certified Season 0 multiplayer release.

## 2026-11-07 integration advancement

Verified additional PvP-only RC31 parity defects and fixed them **without forking card rules**: the forced Hand Limit cleanup missed Round advancement, and seat2 result reasons were not mirrored with winners. Both were caught by full two-human deck-out testing: two first-seat choices now end on Round 45 with correct loser-reason mapping. Also fixed default WebSocket Origin policy and idle room reclaim. Actual full-match WebSocket QA completes 520 human-seat intents from lobby to winner, and exploratory RC31 combat reached a standard three-Hero victory. These are **limited verified scenarios**, not proof of complete card-by-card parity or production readiness.
