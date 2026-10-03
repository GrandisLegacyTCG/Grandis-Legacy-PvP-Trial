# Grandis Legacy PvP v3.72 — Build Notes

Build date: 2026-10-04

## Release goal

v3.72 combines three layers without replacing the authoritative PvP architecture:

1. **PvP v3.70** remains the gameplay/server-authority baseline.
2. **PvP v3.51** is the multiplayer reliability reference for intent lifecycle, ACK/snapshot recovery, role/lobby flow, spectator behavior, and human-vs-human orchestration.
3. **VS AI v6.90.7** supplies the current battlefield/decision UX and exact Mana-payment semantics that are safe to port to PvP.

AI control is not imported. Known-broken donor implementations are not treated as approved just because they exist in v6.90.7.

## Opening Draw / Card Sound fix

### Root cause addressed

The server opening event was already correct. The regression lived in presentation ownership:

- authoritative opening Draws could be queued into `#glAnimationLayer` inside the hidden shared-engine host;
- that hidden engine DOM did not share the visible Option-B Hand anchors;
- the first sequence also waited on Hero-image hydration that was unrelated to Draw anchors;
- animation IDs could be consumed before the visible presentation actually started;
- first Card Sound playback relied on a weak muted HTMLAudio warm-up path.

### v3.72 implementation

- Opening presentation is routed to `window.GL_OPTION_B_PRESENTATION.queueAuthoritativeOpeningSequence()`.
- Visible Option-B Main Deck/Hand/Shard Deck/Pool are the animation anchors.
- Only required Draw/Shard anchors are awaited; there is no six-Hero / ~1100 ms gate.
- `claimedAnimationIds` separates claimed events from completed/seen events.
- Draw/Shard/rank events handled by Option-B are not also replayed through the hidden shared-engine presentation path.
- Web Audio assets are primed client-side; the AudioContext is resumed and a zero-gain source is started during a real user gesture. HTMLAudio remains fallback.
- Gameplay progression never waits for the presentation queue.

## Exact Mana payment / center decision UX

The shared runtime now includes the v6.90.7 exact-payment semantics:

- `computeExactManaPayment()`
- `recommendedExactManaShardUids()`
- `manaSelectionAfterToggle()`
- `spendExactManaPayment()`

Normal and paid Response pending state uses exact `selected_shard_uids`. Payment is legal only when selected value equals cost. FIFO replacement keeps the newly clicked Shard while dropping oldest selected Shards as needed; a manual unselect remains underpaid until the player fills it manually.

The same `public/engine/shared-app/app.bundle.js` is loaded by the Node headless runtime, so these are server-authoritative rules, not client-only decoration.

### Center UI

The selective v6.90.7 center decision layer was adapted to PvP ownership:

- only the local decision owner gets interactive controls;
- spectator mode never becomes a decision owner;
- normal/Response PAY buttons send PvP intents rather than applying local gameplay mutations;
- hidden opponent Shard choices use server-provided opaque handles rather than revealing private Shard UIDs;
- background hover is suppressed while the center decision is active;
- session/busy state is reset between repeated payment decisions.

The reported broken donor selected-Shard → Shard Deck animation was **not copied as trusted code**. PvP uses a detached fixed-position presentation clone so selected cards remain visible during travel while authoritative counts still change only from server snapshots.

## Network stabilization

- 12-second intent watchdog.
- `intent-ack` tracking via `clientActionId`.
- 2.5-second ACK-without-snapshot recovery via `sync-request`.
- Revision/snapshot unlock remains authoritative.
- Regression test verifies Player 2 **Reform → Tribute → Hero target → Next Phase**.

## Spectator / lobby

- `MAX_SPECTATORS = 4`.
- Full seats automatically route additional visitors to read-only spectator mode.
- Spectator private information is masked; public Both-Hands/Teaching mode is disabled.
- One sanitized spectator board cache is reused per revision/view rather than creating a per-spectator engine.
- Lobby visible controls follow the simpler PvP v3.51-style SPECTATE/JOIN, READY/UNREADY, START MATCH, RECONNECT flow.
- Current Room / Switch Room / counts / Spectator View block remains removed.

## v6.90.7 selective port boundaries

Kept/adapted:

- center choice layer and exact-payment UX;
- canonical Shard visual order;
- current battlefield sizing/hover/focus/phase presentation inherited from the previous parity work;
- Card Review on relevant battlefield surfaces;
- updated client-side card-motion capability where safe.

Intentionally not treated as validated donor code:

- known-broken selected Shard → Shard Deck implementation (reimplemented in PvP presentation instead);
- unresolved Chain Mail defensive connector patch;
- rejected Legacy/Discard popup hover placement.

PvP timer, hidden-information rules, turn ownership, room/seat lifecycle, reconnect, and network protocol remain PvP-owned.

## 256 MB deployment safeguards

- One fixed room / one authoritative runtime engine.
- No per-spectator engine.
- Shared static runtime/card definitions.
- Spectator board cache by revision.
- `perMessageDeflate: false`.
- Bounded room/public logs.
- Client-side animation/audio/VFX.
- `/health` memory telemetry.
- Latest server simulation: roughly **170 MB RSS** for an active match with 2 players + 4 spectators in the test container (environment-dependent).

## Verification

`npm test` passes:

- `check:syntax` — PASS
- `test:static` — PASS
- `test:runtime` — PASS
  - human-vs-human shared runtime
  - exact payment / FIFO internal QA
- `test:server-sim` — PASS
  - Player 1 / Player 2 lifecycle
  - coin flow
  - authoritative `opening_sequence`
  - viewer-safe state
  - P1 ↔ P2 human handoff
  - Shard ownership
  - **P2 Tribute → Next Phase**
  - spectator Card Backs / read-only / cap 4
- `test:battle-feedback` — PASS
  - authoritative Class Shard toggle
  - exact PAY commit
  - battle-feedback transport

## Version / compatibility

- Release: **v3.72**
- Build ID: `gl-pvp-3.72-v351-net-v6907-battlefield-2026-10-04`
- Runtime files: `public/pvp/pvp-v372.js`, `public/pvp/pvp-v372.css`
- Legacy `pvp370` DOM/CSS namespace and `gl_pvp370_*` Local Storage keys remain intentionally for browser-state compatibility.
