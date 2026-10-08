# Grandis Legacy PvP v3.50 — Same-Version Maintenance Correction

Date: 2026-09-27

## Version policy

- PvP semantic version: **v3.50** — unchanged.
- npm/package version: **3.0.50** — unchanged.
- Website target: **v1.39** — unchanged.
- No PvP v3.51 or Website v1.40 release was created.
- Maintenance build/cache revision: `gl-pvp-3.50-maint-reconnect-kick-r1-2026-09-27`.

## Allowed maintenance changes implemented

### Kick icon layout correction

The existing Player 1 → Player 2 pre-match Kick action is preserved. The visual control is now an icon-only circular `×` button with an accessible label/title. It occupies its own third grid column in the Player 2 lobby row instead of using absolute positioning over the seat content.

Real Chromium production-DOM checks passed at 1366×768, 1024×768, 768×1024, and 390×844. The icon remains circular, stays inside the Seat 2 card, does not overlap the seat status content, and a physical DOM click emits the existing `kick-seat-2` intent.

### Player 1 pre-match reconnect grace

While the room is still in setup, disconnected Player 1 now receives an exact **60,000 ms** reconnect grace. Active-match reconnect/forfeit behavior is unchanged. Player 2 keeps the existing lobby reconnect policy.

Before reconnect identity/seat recovery, the server synchronously reconciles expired disconnect reservations. This prevents a reconnect that arrives after the 60-second deadline from reclaiming Player 1 merely because the periodic sweeper has not run yet.

### Late reconnect becomes Spectator

When Player 1's pre-match 60-second grace expires, the seat is released and the expired authority is recorded as a bounded room-scoped tombstone. A later connection that presents the expired Player 1 identity/token is admitted as **Spectator**, not silently restored to Player 1, and receives `PLAYER1_RECONNECT_GRACE_EXPIRED`.

### Stale Player 1 authority invalidation

When the expired Player 1 seat is released, the detached client object loses its `seat`, `seatToken`, and `seatTokenHash`, and its role becomes `spectator`. Current Player 1 reconnect also requires the current seat token. Existing Kick authority continues to require the live Seat 1 client/socket and rejects stale Seat 1 sessions.

## Locked systems

No gameplay/Shards/non-Shard animation implementation was intentionally changed. The shared v3.50 animation bundle, Shard behavior, gameplay intent router, card authority, Hero Components, Main Deck timing, Seat 2 Kick semantics, Surrender, Lobby Swap, and Battlefield systems remain locked.

Source comparison against the prior v3.50 package showed production code changes only in the server reconnect authority owner, PvP lobby/network UI owner, lobby CSS, production cache/build metadata, and generated integrity metadata, plus related maintenance tests/reporting.

## Verification

PASS:

- Same-version maintenance focused logic test.
- Real Chromium Kick layout/click test on four required viewports.
- v3.50 animation-parity static regression.
- v3.49 locked Shard regression retained under v3.50.
- Server local-import/Docker build-context integrity audit.
- 200/200 canonical card coverage.
- Lifecycle regression.
- Package authority check: 200 cards, 30 Hero compositions, 200 remote asset mappings.
- Runtime Sync self-test: 94 verified files, 5 active Starter Decks, 200 canonical cards.
- Website v1.39 production-sync test after exact `/pvp/` mirror.
- Website manifest verification.

Environment note: the clean source package intentionally excludes `node_modules`. This sandbox cannot currently fetch the `ws` npm package because package-registry DNS/network access is unavailable, so a fresh live Node WebSocket server boot/two-client reconnect run could not be repeated here. The server import graph, authority logic test, production Chromium lobby test, Runtime Sync, manifests, and fresh-package checks are still run from the final bytes.
