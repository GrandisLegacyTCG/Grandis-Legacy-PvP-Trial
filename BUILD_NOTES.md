# Grandis Legacy PvP v3.71 — Build Notes

Build date: 2026-10-03

## Release goal

v3.71 upgrades PvP v3.70 by combining three proven layers without replacing the authoritative PvP engine:

1. **PvP v3.70** remains the gameplay/server-authority baseline.
2. **PvP v3.51** is used as the stability reference for multiplayer intent flow, lobby roles, spectator behavior, and presentation orchestration.
3. **VS AI v6.88** supplies the final battlefield presentation/interaction layer only. AI turn/control logic is not ported into PvP.

This is deliberately a surgical merge rather than a wholesale replacement of the PvP engine with the VS AI engine.

## Network stabilization

### P2 Tribute → Next Phase regression

The v3.70 client could remain locked behind `intentInFlight` if the server committed an action but the matching authoritative snapshot was delayed/missed by the client. `intent-ack` was not being used as a recovery signal, and the old watchdog behavior was absent.

v3.71 adds:

- 12-second intent watchdog.
- `intent-ack` tracking by `clientActionId`.
- 2.5-second ACK-without-snapshot recovery path using `sync-request`.
- Authoritative snapshot resync before new gameplay intents continue.
- Queue cleanup on hard timeout/error to prevent replaying stale actions.
- Snapshot/revision-based unlock; ACK alone never mutates gameplay state locally.

Regression test now executes Player 2 through **Deploy → Battle → Reform → Tribute → choose target Hero → Next Phase** and verifies the canonical revision advances out of Reform.

## Spectator restoration

- `MAX_SPECTATORS = 4`.
- Third visitor becomes Spectator automatically when both seats are occupied.
- Explicit `SPECTATE` / `JOIN AS PLAYER` role switching is available during setup.
- Spectator has no seat token and cannot issue gameplay intents.
- Spectator Hands/private state are always masked as Card Backs.
- Public Teaching/Both-Hands mode is disabled; no public password/unlock path is retained.
- `sync-request` is allowed for read-only spectators so late joins/recovery can request the current authoritative snapshot.
- Spectators receive normal public authoritative presentation events; private Draw identities are masked before delivery.

### Low-memory spectator path

To respect the 256 MB service limit, spectator support does not create an engine or mutable match copy per viewer. `snapshotFor()` builds/caches one sanitized Player-1-oriented spectator battlefield for a canonical revision and reuses it across spectators. Player snapshots remain seat-specific and viewer-safe.

Gameplay broadcasts send player snapshots first; spectator serialization is deferred to the next event-loop turn for latency-sensitive player intents.

## Lobby update

The room panel follows the simpler PvP v3.51 role/button flow:

- SPECTATE / JOIN AS PLAYER
- READY / UNREADY
- START MATCH
- RECONNECT

Removed from the visible lobby:

- CURRENT ROOM
- room switch control
- PLAYERS count
- SPECTATORS count
- SPECTATORS VIEW / CARD BACKS row

The backend is still one fixed room (`GRANDIS_PVP`). Seat lifecycle, deck import/selection, formation, rank preview, Player 1 start authority, and reconnect remain intact.

## VS AI v6.88 battlefield presentation port

Ported/adapted into the existing PvP Option-B presentation boundary:

- Independent `hero-base`, `hero-layout`, visual Hero 120%, Standard 65%, Hand 75% sizing.
- Stable Hero lane geometry independent of Hero visual scale.
- Final Hand sizing + edge-only overlap.
- Body-level Hero/Hand/Shard/sidebar hover previews.
- Hidden deck/pile labels + compact rectangular counters.
- Mana Regen badge presentation while preserving live PvP value.
- Moving phase underline/diamond/tint.
- PLAY/PAY green + white/gold text treatment.
- 65% Payment and Response interaction focus.
- Item/Event connector source semantics from Active Card.
- Existing Hero Attack connector/source-card-id/Reposition behavior preserved.
- Fast targeted Item/Event connector hold (~900 ms presentation window).
- Fixed seven-column choice/search popup + right-side preview.
- Blind opponent-Shard single-option auto-commit through authoritative intent.
- Non-blocking Tribute Hand → Hero motion.
- Battlefield double-click Card Review suppression.

The PvP canonical match timer was intentionally retained; the VS AI local `Date.now()` match-timer implementation was not imported.

## Sound / animation authority

- Server remains authoritative for gameplay resolution and emits compact one-shot presentation event metadata.
- Browser clients continue to use the bundled battlefield assets for actual SFX/VFX/card motion.
- Event IDs are deduplicated so snapshots/reconnects do not replay settled effects.
- Spectators consume the same public presentation events, with hidden information sanitized first.
- Tribute presentation is non-blocking and never gates server phase progression.

## 256 MB deployment safeguards

- One fixed room / one authoritative runtime engine at a time.
- No per-spectator engine/state copy.
- Shared static runtime/card definitions.
- Spectator board cache by revision.
- `perMessageDeflate: false` for WebSocket server.
- Bounded room/public log history.
- Finished-match cleanup clears engine, gameplay ledger, one-shot events, and spectator cache.
- `/health` reports lightweight memory telemetry from `process.memoryUsage()`.
- The v3.71 server simulation with an active match, 2 players, and the full 4-spectator cap measured about **170 MB RSS** in the test container (environment-dependent, not a hard deployment guarantee).
- Presentation assets remain static/client-side and are not retained per connection by gameplay state.

## Verification

`npm test` passes the full v3.71 suite:

- `check:syntax` — PASS
- `test:static` — PASS
- `test:runtime` — PASS
- `test:server-sim` — PASS
  - Player 1 / Player 2 seat flow
  - coin flow
  - viewer-safe snapshots
  - P1 ↔ P2 human handoff
  - Shard ownership
  - **P2 Tribute → Next Phase**
  - spectator Card Backs / read-only / resync
- `test:battle-feedback` — PASS

The repository is packaged without `node_modules`; deployment/local browser play installs the normal `ws` dependency with `npm install`.

## Versioning / compatibility

- Release version: **v3.71**.
- Build ID: `gl-pvp-3.71-v351-net-v688-battlefield-2026-10-03`.
- Runtime files: `public/pvp/pvp-v371.js` and `public/pvp/pvp-v371.css`.
- Legacy `pvp370` DOM/CSS namespace and `gl_pvp370_*` Local Storage keys are intentionally retained to preserve browser state across the v3.70 → v3.71 upgrade.
