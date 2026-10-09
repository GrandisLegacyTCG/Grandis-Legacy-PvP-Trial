# Grandis Legacy PvP v3.76.3 — Boot / Low-Memory Stabilization

Date: 2026-10-09

## Scope

Targeted stabilization only. PvP v3.51 remains the server/network/gameplay authority. VS AI v6.90.7 remains a presentation reference. No v3.73.20 gameplay/runtime architecture was reintroduced.

## Confirmed root cause of permanent LOADING

v3.76.2 coupled the initial boot veil to `gl-runtime-ready`, which was emitted only after the external gameplay-presentation layer finished booting. That layer also retried missing dependencies every 50 ms with no terminal state. If any dependency never became available, the Lobby could be healthy while the page still remained behind the loading veil indefinitely.

The v3.76.2 HTTP hot path also read complete static files into memory and synchronously Brotli/Gzip-compressed them per request. Large files such as `public/js/static-data.js` could therefore block the event loop and create avoidable transient memory pressure during initial load.

Browser QA of the new bridge also exposed an independent presentation blocker: `EXTERNAL_HUMAN_UI` was referenced before explicit initialization in `app.bundle.js`. v3.76.3 initializes this presentation flag explicitly.

## Boot-flow changes

- Added an explicit PvP Lobby-ready signal in `public/js/pvp-network.js`.
- `#glBootVeil` now represents only “Lobby not ready”; it disappears on `gl-lobby-ready`, not on full gameplay-presentation readiness.
- Critical Lobby boot has a 12-second visible failure state with a user-controlled Retry button. There is no automatic reload loop.
- External gameplay presentation now retries dependencies only within an 8-second bounded deadline.
- On presentation timeout, the Lobby remains usable, a diagnostic is logged, `gl-presentation-degraded` is set, and a manual `GL_PVP_RETRY_GAMEPLAY_PRESENTATION()` recovery path is exposed.
- Initial authored battlefield sample state was removed. The initial gameplay DOM is a structural shell with no card/Hero image sources.

## Static-delivery changes

- Removed request-time `brotliCompressSync()` and `gzipSync()` from production HTTP handling.
- Ordinary static files are served with `createReadStream(...).pipe(res)` instead of whole-file request buffers.
- `index.html` and `config.js` remain `no-store`.
- Versioned static resources use immutable long-cache headers; unversioned ordinary static resources use a bounded cache policy.
- `/health` now includes `process.memoryUsage()` fields for deployment diagnostics; this does not alter gameplay state or authority.

## Asset de-duplication / canonical paths

Removed complete duplicate trees:

- `public/engine/` — removed.
- `public/card-art/` — removed.
- `public/assets/cards/` — removed because those files were only used by authored dummy battlefield content.
- `public/assets/shards/` — removed; canonical `public/assets/mana-shards/` is used.
- duplicate `public/assets/ui/Background.png` — removed.
- duplicate `public/assets/fonts/NotoSans-Variable.woff2` — removed.

Production path migration:

- `engine/assets/lobby/grandis-legacy-logo.webp` -> `assets/lobby/grandis-legacy-logo.webp`
- `engine/assets/lobby/Swap.png` -> `assets/lobby/swap.png` (actual case-sensitive filename)
- `engine/assets/counters/*` -> `assets/counters/*`
- `engine/assets/status-icons/*` -> `assets/status-icons/*`
- `engine/assets/lobby/background.webp` -> `assets/lobby/background.webp`
- duplicate `assets/shards/*` -> canonical `assets/mana-shards/*`
- duplicate CSS `assets/ui/Background.png` -> canonical `assets/Background.png`
- duplicate CSS font path -> `assets/fonts/noto-sans/NotoSans-Variable.woff2`
- hardcoded `card-art/<CARD_ID>.webp` -> canonical `GL_OPTION_B_ENGINE.cardView(id).full || .thumb`

The final duplicate audit must report zero duplicate SHA-256 groups under `public/`.

## Size / duplicate audit

Baseline v3.76.2:

- ZIP: 63,135,276 bytes.
- repository uncompressed: 84,197,910 bytes.
- `public/`: 63,817,603 bytes.
- `public/assets/`: 21,737,269 bytes.
- `public/card-art/`: 14,335,118 bytes.
- `public/engine/`: 16,287,273 bytes.
- public duplicate SHA-256 groups: 61.
- public duplicate wasted bytes: 21,222,107 bytes.

v3.76.3 production public tree after migration:

- `public/`: 28,229,164 bytes.
- `public/assets/`: 16,802,435 bytes.
- `public/card-art/`: 0 bytes / removed.
- `public/engine/`: 0 bytes / removed.
- public duplicate groups: 0.
- public duplicate wasted bytes: 0.

Exact final repository and ZIP sizes are reported with the final artifact after manifests/release metadata are generated.

## Memory observation

HTTP/static smoke test used a temporary QA-only `ws` module stub because package installation is blocked by network policy in the execution environment. The stub was sufficient only to boot the production HTTP server; it did not simulate WebSocket gameplay and is not included in the release ZIP.

Representative repeated static sequence (15 requests including the ~8.95 MB `static-data.js`) kept `/health` responsive and returned no Node content encoding:

- RSS before: 178,397,184 bytes.
- RSS after: 179,040,256 bytes.
- RSS delta: +643,072 bytes.
- heapUsed before: 87,387,536 bytes.
- heapUsed after: 87,319,520 bytes.
- heapUsed delta: -68,016 bytes.

This is an observation, not an OS-independent hard memory guarantee. The important regression fix is removal of per-request whole-file synchronous compression/buffer duplication.

## QA actually executed

### Static / automated

PASS:

- JavaScript syntax checks for server, app bundle, PvP network, presentation bridge, and presentation adapter.
- runtime sync lock generation: 94 authoritative/runtime files.
- runtime sync verifier self-test: 94 files, 5 starters, 200 canonical cards.
- v3.76.3 stabilization static checks: 16 checks.
- public SHA-256 duplicate audit: 0 groups / 0 wasted bytes.
- intent-router authority test.
- headless authoritative runtime boot/opening-flow test.
- advanced runtime test (statuses, Response, attachments, Casting, search/reveal, area flows, viewer-safe state).
- defeat/lifecycle test (cleanup, Legacy replacement, terminal handling, Casting/EXP cleanup).
- canonical gameplay legacy harness passed on rerun. One earlier run hit a nondeterministic Market Bargain shard-count assertion; it did not reproduce on the immediate rerun, so that harness is not treated as sole proof.

Known historical harness issue: `tests/run-v343-candidate3c-full-match.cjs` rejects `responsePassNoStuck` in both untouched v3.76.2 and v3.76.3 at the same flow. It is therefore not introduced by this stabilization patch, but it remains a test-suite issue.

### Server / static delivery

PASS in the local HTTP smoke environment:

- server process starts with runtime sync gate enabled.
- `/health` stays responsive while large static files are repeatedly requested.
- `index.html`, `static-data.js`, `app.bundle.js`, presentation JS and presentation CSS are served.
- request-time `Content-Encoding` is absent; Node is not dynamically compressing the payload.

### Browser

A real Chromium process was executed. Direct navigation to local HTTP URLs is blocked by administrator policy in this execution environment, so the test loads the production DOM/CSS/scripts into `about:blank` rather than claiming a true network cold-load acceptance.

PASS in that Chromium harness:

- Lobby-ready condition reached.
- boot veil became hidden.
- Lobby overlay became visible.
- initial gameplay shell had no image `src` values.
- gameplay presentation reached runtime-ready in the normal path.
- no browser page errors were observed.
- simulated missing gameplay-presentation dependency timed out in a bounded manner.
- Lobby remained usable during that failure.
- diagnostic logging was observed.
- manual retry recovered after the dependency was restored.

### Two-client gameplay

NOT EXECUTED as a real WebSocket two-browser session in this environment. The real `ws` dependency could not be installed because external package-network access is blocked. No two-client PASS is claimed.

## Intentionally unchanged

- PvP v3.51 authoritative reducer/runtime.
- server match state semantics.
- payment rules and Shard payment contract.
- pending choices, Response, Steal, privacy, reconnect, timer authority and synchronization semantics.
- Coin Flip authority and pre-game choreography.
- Round 1 rule.
- responsive architecture.
- v3.76.2 Sound bridge, authoritative Timer presentation and Tribute/EXP presentation, except for canonical asset-path migration where necessary.

## Known remaining limitations

1. A true clean-profile Chromium `http://localhost/...` cold-load could not be executed because the sandbox blocks direct local navigation. The production HTTP path itself was exercised separately by the static/memory smoke test.
2. A real two-client WebSocket match was not executed here. It remains required deployment acceptance before calling the build production-verified.
3. The historical `run-v343-candidate3c-full-match.cjs` failure described above remains present in the donor line as well.
