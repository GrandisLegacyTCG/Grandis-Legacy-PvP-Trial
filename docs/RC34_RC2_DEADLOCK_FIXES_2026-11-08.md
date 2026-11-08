# Grandis Legacy PvP Season 0 RC34 - Deadlock Fix RC2

**Date:** 8 November 2026 (Asia/Jakarta)  
**Build:** `gl-s0-rc34-github-rc2-2026-11-08`  
**Source base:** GitHub RC1 (RC34 engine, Season 0 rules)  
**Status:** staging/review candidate, **not** final public release. No GitHub writes have been made.

## Scope and verified fixes

| Audit ID | Root cause | RC2 change | Evidence | Residual limit |
| --- | --- | --- | --- | --- |
| **DL-01 Draw phase** | PvP disabled engine auto-advance and the browser disabled manual NEXT during Draw. | Headless authority performs Draw -> Deploy after mandatory Draw/Regen **only when resolved**; respects pending choices, responses, and game-over. Applies for both seats and each turn. | `tests/rc34-deadlock-engine.mjs` (both opening winners, repeated round transitions, Hand Limit choices). | All class-specific Draw choice combinations still need hosted browser coverage. |
| **DL-02 Coin deadlock** | Both presentation ACKs required indefinitely, and no pregame reset/reconnect escape. | Idempotent coin result, 12s visual-ACK grace, 90s stage timeout, 45s disconnected-player abort, safe RETURN TO LOBBY or host RESET. RNG result is never rerolled on duplicate choice. | `tests/rc34-deadlock-ws.py` (real two-seat WS). | Visual animation itself requires two-browser test. |
| **DL-03 Provoke End** | Engine schedules a zero-delay callback not executed in headless server. | Server resolves deferred End directly after mandatory opponent Mana selection, then settles the next Draw. Seat-2 perspective swap now preserves Provoke/End bookkeeping to prevent duplicate activation. | `tests/rc34-deadlock-engine.mjs` Provoke from both sides. | Additional card-specific interrupted End sequences require long-match testing. |
| **DL-04 Surrender** | Client rejected surrender during the opponent's Response/pending/opening lock. | Concede bypasses ownership/opening/inflight restrictions; server checks authenticated seat but permits stale revision for voluntary concession. | `tests/rc34-network-ack-race.mjs`, `tests/rc34-deadlock-ws.py`. | Real button interaction still needs hosted browser confirmation. |
| **DL-05 Opening watchdog** | Asynchronous opening presentation had no finalizer if a callback stalled. | 12s watchdog + single serial-controlled finalizer clear card/shard masks, stuck animations, and busy state. Old callbacks cannot close a newer animation. | `tests/rc34-opening-watchdog.mjs` tests production finalizer in VM. | No real dual-browser opening E2E was possible locally. |
| **DL-06 Late ACK** | Any old `intent-result` could release a newer request from the network action queue. | ACK accepted only for current `clientActionId`; stale/duplicate ACKs ignored, timeout triggers resync, unrelated errors cannot unblock actions. | `tests/rc34-network-ack-race.mjs`. | Network fault testing on actual mobile and cellular connections remains. |
| **DL-07 Idle policy** | Waiting player could be surrendered; backgrounded tabs have throttled heartbeats. | Timeout evaluated against **current decision owner only**, not passive seat. Connected owner: 10 min deadline with activity; disconnected decision owner: 3 min grace. Transport ping separated from activity. | `tests/rc34-deadlock-ws.py` with shortened injected thresholds. | Browser timers/background throttling still need hosted device tests. |

## Additional integration correction discovered during patch

The RC1 Seat 2 perspective swap handled basic `PLAYER`/`AI` values, but did not swap **composite bookkeeping keys** like `PLAYER:1` / `1|AI` in Provoke, End cleanup, Bard markers and other per-turn records. After a seat-2 opponent Mana selection, Provoke could trigger twice. RC2 remaps the relevant state records in the PvP-only bridge. A deterministic regression asserts the End effect occurs exactly once and the turn passes automatically for both seat combinations. The independent VS AI RC34 donor archive and card definition database remain unchanged.

## Timer defaults and environment overrides

| Setting | Default | Meaning |
| --- | --- | --- |
| `COIN_CHOICE_TIMEOUT_MS` | 90000 | Maximum time to choose Heads/Tails before resetting lobby. |
| `COIN_RESULT_TIMEOUT_MS` | 90000 | Maximum time awaiting Start Game at coin result. |
| `COIN_ACK_GRACE_MS` | 12000 | Presentational ACK wait before Start Game is allowed even when one animation confirmation was lost. |
| `COIN_DISCONNECT_GRACE_MS` | 45000 | Pregame disconnected-player recovery. |
| `MATCH_IDLE_MS` | 600000 | Inactivity of connected **decision owner**. |
| `MATCH_DISCONNECT_GRACE_MS` | 180000 | Reconnection grace when decision owner loses socket. |
| `IDLE_SWEEP_MS` | 5000 | Frequency of timeout checks. |

All defaults are configured in `server.js`. A server restart resets the single in-memory room; RC2 does not implement persistent matches or multireplica coordination.

## QA performed

- `npm run build:precompress`: PASS (regenerated compressed asset sidecars **after** app JS modifications).
- `npm run check`: PASS, includes RC34 game rules **20/20**, atomic Mana UID payment, two-seat WebSocket, privacy, reconnect, HTTP asset checks, Seat-2 Attack/PAY/Response and the new liveness test scripts.
- `tests/rc34-deadlock-engine.mjs`: Draw from either coin winner, repeated full phase cycles and Hand Limit choices, plus both Provoke directions with no duplicate trigger.
- `tests/rc34-deadlock-ws.py`: missing coin ACK, duplicate choice, manual reset, timeout, disconnect, surrender with stale revision, idle fairness and actor disconnect grace.
- `tests/rc34-network-ack-race.mjs`: dropped/late/duplicated ACK, mismatched request ID, and concede while opponent owns a decision.
- `tests/rc34-opening-watchdog.mjs`: finalizer cleanup and stale animation callback rejection (DOM VM scope).

**Still unverified:** a full PvP match through two real browsers, tablet/mobile portrait/landscape UI, browser-owned opening animation/reconnect during an action, hosted HTTPS/WSS, GitHub Actions Docker image build, Northflank staging performance, and unrelated visual bug reports (mobile lobby parity and Hero reveal art). These are staging release gates, **not** silently marked fixed.

## Deploy guidance

Use the **PvP Trial repo** (`GrandisLegacyTCG/Grandis-Legacy-PvP-Trial`) rather than the Season 1 PvP repository. Create branch `s0-rc34-github-rc2` from the ZIP contents. GitHub stores the source and runs Actions. The actual Node/WebSocket multiplayer host must be Northflank or an equivalent Docker/Node host; GitHub Pages alone cannot run it. Follow `docs/GITHUB_DEPLOY_RC34.md` and verify `/health` returns the RC2 build ID before testing.
