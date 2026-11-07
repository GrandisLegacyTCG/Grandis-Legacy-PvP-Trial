# PvP Season 0 — Implementation Takeover (2026-11-07)

## Baseline, scope, authority

- Baseline: `Grandis_Legacy_VS_AI_Season0_v1.0_RC31_2026-11-07.zip` (source archive preserved).
- Architecture reference: PvP Season 1 **v3.51** archive only; v3.80.17 was described by the designer but its code was not supplied.
- Rulebook: **Player Rulebook v2.9 EN** (current supplied). Machine Rules v1.1.5 metadata still cites v2.8.2, so do not blindly treat it as newer than v2.9.
- OSA: Season 0 DEV45 as integrated by RC31; **Grand Finale** deliberately uses the RC31 override, 60 damage (Bard)/90 (Maestro). This choice is explicitly authorized by the user.
- Authorization: “kerjain ... sampe jadi” authorizes PvP S0 development. No explicit authorization to deploy the Northflank service, publish an official release, or overwrite original VS AI files.
- Status: **FIXED IN STAGING** for tested components; **NOT VERIFIED** for full gameplay/browser/production readiness.

## Implemented files

| Path | Change |
|---|---|
| `server.js` | Room lifecycle, HTTP assets, WebSocket, token seats, ready/coin, RC31 engine actions, revision gating, disconnect timeout, reset. |
| `server/headless-rc31.mjs` | Isolated Node VM using original RC31 gameplay engine, local Grand Finale override and two human-controlled seats; private canonical state, reject opponent-side ability spoofing. |
| `server/viewer-safe.mjs` | Per-seat projection, private Hand/Deck/Mana/Legacy protection; opaque shuffled shard handles. |
| `server/ws-lite.mjs` | Dependency-free Node WebSocket text framing, upgrade/close/ping and max payload. |
| `client/runtime/pvp-network.js` | Transport, reconnect, room/deck UI and server-only intent forwarding. |
| `client/index.html` | PvP adapter bootstrap, otherwise RC31 battlefield and assets. |
| `client/shared-app/app-runtime.js` | PvP bootstrap, Draw-phase action button, opponent shard always shows card back, local-AI lobby hidden. |
| `client/engine/shared-app/app.bundle.js` | PvP seat2 Mana mirroring; prevent double-flip of `presentationEvents` (previously leaked opponent drawn card IDs); headless surrender UI guard. |
| `Dockerfile`, `.dockerignore`, `package.json`, `README.md`, `tests/*` | GitHub/Northflank staging structure and repeatable QA. |

## QA evidence

`npm run check` **PASS** locally using Node v22.16.0. Validated: bootstrap and Grand Finale 60/90; Season1 starter rejection; two independent VMs; custom starter JSON reject/accept; WebSocket two-room seats, token reconnect, coin, game start; seat-specific privacy/opaque face-down Mana; wrong-seat/stale turn rejection; 12 successive phase transitions/round and nine network-alternating transitions; surrender and room reset.

**Discovered/fixed privacy regression:** Initial seat2 perspective double-swapped `presentationEvents.side`, exposing opponent Opening Hand IDs via CARD_DRAWN events despite `aiHand` being masked. Regression privacy test failed first, then passed after removing the redundant swap. Also masked opponent Shard kind/class/UID and adjusted PvP rendering to show backs only.

**NOT VERIFIED:** real browser E2E (Chromium navigation blocked by current environment policy); Attack/Response/Defeat multi-browser, Casting, all cards, server restart state loss and 5-minute disconnect forfeit, performance, rule parity with v2.9, Northflank deployment, mobile/desktop cross-browser. The remote UI has not been certified to be fully playable; do not describe this as FINAL.

## Risk / next acceptance gate

1. Open the built UI in two separate actual browsers and confirm first-pair room/lobby/coin and battlefield display after Start.
2. Run full manual match: attacks, defenses, casting, all targeting, tribute/rank, legacy/revive, statuses, win/loss and draw, both who-acts and hidden-info restrictions.
3. Test custom deck from latest Deck Builder v1.61 (sample validated by the RC31 engine came from bundled v1.58 format); verify version/schema compatibility independently.
4. Inspect full opponent-private `pending` and `responseWindow` in every card-specific context for information leaks; masks intentionally disable unsafe logs/animations until verified.
5. Verify browser animation/VFX (public play history currently reduced for privacy), reconnect under network loss, timeout, Northflank proxy behavior, and scaling constraints.
6. After acceptance, user may authorize a separate Northflank staging deploy/release; keep original VS AI RC31, OSA and PvP S1 archives untouched.

Do not equate positive smoke tests with a complete playable PvP certification. A ZIP snapshot of this **staging checkout** may be provided for QA; it must not be represented as an official release or final build.

## Additional functional-parity QA checkpoint — 2026-11-07 (current)

### Mode, baseline, scope

- User explicitly requested continuing PvP S0 toward a playable two-human experience and studying how PvP Season 1 shares gameplay with VS AI. Development remains in **separate staging**, NOT a public release or Northflank deployment.
- S1 v3.51's crucial design is a **shared gameplay-runtime/bridge**, with headless authoritative server, recipient-masked board and UI-only PvP transport/presentation adapter. The specific S1 v3.80.17 mentioned previously is unavailable for inspection. S0 RC31 engine remains the sole gameplay/card-effects implementation; do **not** import S1 gameplay or older OSA Grand Finale.
- Grand Finale (`S0-CLE-031`) intentionally uses RC31's approved Bard 60 / Maestro 90 values.

### New confirmed findings and fixes

| ID | Symptom / expected vs actual | Cause | Scoped change | Status |
|---|---|---|---|---|
| S0-PVP-ROUND | During mandatory Hand Limit cleanup, each player changed turns but Round stopped advancing from Round 3; expected +1 after each complete two-turn pair. | Shared-RC31 PvP-only `commitHandLimitDiscard` bypassed `advanceRoundAfterCompletedTurnPair`, unlike normal End transition. | `client/engine/shared-app/app.bundle.js`: call round advancement before switching to next side in PvP hand-limit branch. VS AI path unchanged. | FIXED IN STAGING, tested first seat 1 and 2. |
| S0-PVP-RESULT | Seat2 terminal reason said `AI loses` while mirrored winner was `AI`, inconsistent result presentation. | `glPvpSwapKeys` mirrored winner enum but not side-labelled `gameEndReason`. | Same app bundle: mirror side-labelled end reason as well. Browser result translates `AI` → Opponent, `PLAYER` → You in PvP only. | FIXED IN STAGING, deck-out dual-seat test PASS. |
| S0-PVP-ORIGIN | Cross-origin web clients could connect when `PVP_ALLOWED_ORIGINS` unset; default should not permit arbitrary origins. | WebSocket upgrade guarded Origin only if configured list nonempty. | `server/ws-lite.mjs`: default same-origin; explicit cross-origin allowlist is required for GitHub Pages / separate frontend. | FIXED IN STAGING, raw-handshake test PASS. |
| S0-PVP-ROOM-GC | A finished room with expired seat placeholders was never reaped, could consume room cap indefinitely. | Idle cleanup checked absent seat objects instead of any *connected* seats. | `server.js`: remove inactive rooms after 1 hour of no connected clients. | FIXED IN STAGING, logic inspected; 1-hour wall-time expiry NOT VERIFIED. |
| S0-PVP-QUEUE | RC31 UI issued select+confirm in one gesture; second intent was dropped by old single-inflight adapter. | Transport lacked serialization/queue. | `client/runtime/pvp-network.js`: 4-entry revision-synchronized queue, aborts on errors/disconnect. | FIXED IN STAGING, two-Chromium simulated transport UI test PASS. |
| S0-PVP-NOOP | Seat2 illegal/no-op could appear as state change because mirror import normalizes render-only fields. | Comparison before perspective restore. | `server/headless-rc31.mjs`: compare after restore; invalid action does not bump revision. | FIXED IN STAGING, headless negative test PASS. |

### QA completed with code execution

- `npm run check` **PASS** (Node v22): server/frontend syntax including large RC31 app bundle, headless RC31+Grand Finale, privacy both seats, positive/negative actions, actual card Attack/target/Mana/Response, a paid Defense Response, custom deck/starter, reconnect, surrender, WebSocket origin policy and per-room isolation.
- `tests/deckout-complete-match.mjs` **PASS for BOTH starting seat choices**, 520 and 519 actual RC31 intents respectively, forced Hand Limit choices resolved, correct game-over reason/winner, **Round 45**.
- `tests/pvp-network-full-match.mjs` **PASS for an entire true two-client WebSocket match**: lobby → decks → Ready → server coin → alternating phase intents → Hand Limit discard → final mandatory deck-out. Sample run: **520** server-validated intents, **168** Hand Limit selection/commit actions, **260** Player 2 actions, Round **45**, Player 2 winner, identical final result from both masked perspectives. This path has **no Attack**; Attack and paid Defense separately tested by real RC31 engine.
- `tests/long-match-probe.mjs` exploratory **observed** full ordinary 3-Hero defeat victory during actual player-vs-player engine simulation (Round **15**, 10 Response windows, 28 Tribute attempts accepted). Probe uses randomized hands, is **not repeatably deterministic** and is **not part of mandatory check**; some sampled combinations require additional card-choice navigation/cancellation.
- `tests/browser-bridge-smoke.py` **PASS** two Chromium renderer contexts, original UI, real local server over test-only WebSocket relay; both seats room/decks/Ready/coin, each own hand rendered, turn/phase synchronized, two same-event intents sequenced, zero JS page errors. Test cannot load real HTTP/art assets and cannot establish native WSS because of admin network restrictions in browser environment.

### Remaining acceptance and release conditions

- **NOT VERIFIED:** direct HTTP(S) + WebSocket browser-to-Northflank (or normal local two-browser native connections), media/animations, full manually controlled three-Hero victory from both browser UIs, all Casting/Status/Revive/Card effects, mobile/cross-device, public-host origin/proxy config and real reconnect timeout.
- Do not interpret a successful deck-out match as exhaustive gameplay certification. Prefer running a **full real browser match** in Northflank staging before promotion.
- No Northflank account was accessed, no running service deployed, no original VS AI/OSA/Season1 source overwritten and no new official release published.
