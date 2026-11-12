# Grandis Legacy PvP Season 0 RC38 — Beta 2 / Batch 2

**Date:** 2026-11-11  
**Baseline:** RC38 Beta 2 Batch 1 (`Grandis_Legacy_PvP_S0_RC38_Beta2_Batch1_Lobby_2026-11-11.zip`)  
**Scope:** START MATCH, initial Battlefield loading, safe server compile cache.  
**Status:** staging only, not a verified hosted two-device release.

## Changes

1. **Compile RC38 runtime once per server process.** `primeSeason0Runtime()` reads and compiles the same five donor runtime files once before the HTTP / WebSocket port starts accepting players. Every match uses a *fresh `vm.createContext()`*, then executes those immutable `vm.Script` objects in that independent context. No match state, Hero, Hand, Mana, RNG or other game globals are reused. No rule, AI, card data or engine source code was modified.
2. **Eliminate redundant per-START deck copies.** Both selected decks are normalized once each in `Season0BattleAuthority.prepare`; the engine still validates full legality and receives each deck under its normal authority contract. The server enters Coin Flip only after successful preparation; rollback behavior is unchanged.
3. **Warm actual embedded Battlefield during READY idle (when safe).** The lobby can preload and parse its existing same-origin `/battle/?embedded=1` iframe after the client has become READY, during `requestIdleCallback`. Before START it is **hidden, inert and non-clickable**, with the normal lobby left visible. At the first `coin-flip` snapshot the same iframe is revealed, not recreated. If player cancels READY, spectates, disconnects or returns from the match, the stale iframe is disposed. Lobby errors and reconnection notices remain routed to the **parent lobby**, never the hidden child. Memory-constrained devices (`navigator.deviceMemory <= 2`) and data-saver connections keep the original simple prefetch path. No additional WebSocket is opened: the existing lobby owns the single RC6 Stage 2 socket and relays state with the same origin-gated `postMessage` protocol.
4. **Startup-only diagnostics.** `window.GL_PVP_STARTUP_PERF` records click-to-coin and iframe-ready timings. Opening lobby URL with `?pvpPerf=1` enables console timing messages. Optional `PVP_PERF_LOG=1` on the server logs isolated RC38 authority preparation time. None of these add UI or networking packets.

## Local evidence, **not** hosted performance guarantees

- Baseline (same lab machine, separate fresh Node process): first authority constructor ~423 ms, following constructors ~69–113 ms.
- After optimization, compiling the donor runtime happens at process startup (observed ~152–341 ms across local runs); subsequent **match context creation** was ~27–50 ms in local samples. Both match instances then ran the original RC38 `start()` / `completeOpening()` successfully without sharing state. These numbers are influenced by filesystem cache, CPU scheduling and test order; do **not** extrapolate them to Northflank/mobile.
- Browser READY warmup is behaviorally tested with a mocked DOM/iframe; actual Chrome navigation to local server is blocked in this environment by `ERR_BLOCKED_BY_ADMINISTRATOR`. Therefore **we cannot claim a measured faster mobile/desktop START latency** yet.
- The server was tested locally using lite WS fallback (per existing offline QA). Native `ws` on Northflank Docker still needs live verification.

## Regression and limits

- `npm run check`: PASS, including old S0/RC38 gameplay, RC6 single-socket, both-seats Response, privacy, RC5 Mana, Coin turn choice, Batch 1 lobby, new Batch 2 VM isolation and warmframe lifecycle/disconnect/error-routing tests.
- `npm run build:precompress`: PASS; modified `pvp-host.js.br` and `.gz` regenerated. This also corrects Batch 1’s stale `db158-card-review.js.br`/`.gz` sidecars (decompressed bytes now exactly match the unchanged Batch 1 review source).
- **NOT changed:** authoritative engine byte-for-byte, RC38 official starter decks, face-up opponent Mana, blind opponent Mana selection, UI geometry, SFX/BGM policy, RC6 lobby networking messages, RC5 Mana, Card Review Batch 1 or Hotfix 3 attack/target animation.
- **Risk to check manually:** READY may cause a brief background CPU burst on higher-memory mobile devices because the real Battlefield is now parsed before START. On low-memory/data-saver devices prewarm is disabled. Confirm two-device mobile portrait + Coin Flip, leave/return lobby, READY/UNREADY, reconnect and match replay after deployment.
- This interim batch **keeps Beta 1 BUILD_ID** deliberately, consistent with Batch 1, to avoid redownloading unchanged immutable engine assets before final integration. Final Beta 2 should update build version and matching script URLs together.

## Next batch

Batch 3: local draft of multi-choice card actions + one atomic server commit with authorization/revision/rollback tests; then merge all batches and perform browser two-device QA. No GitHub commit or Northflank deploy was performed by this artifact generation.
