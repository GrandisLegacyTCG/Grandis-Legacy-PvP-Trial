# Grandis Legacy PvP v3.78.0 — Clean Three-Donor Integration

## Locked architecture
- Pre-match / Lobby presentation: **Grandis Legacy PvP v3.76.6**.
- Game client / gameplay presentation / timing / interaction: **Grandis Legacy VS AI v6.91.3**.
- Multiplayer network / server / authoritative gameplay: **Grandis Legacy PvP v3.51**.

This release is rebuilt from the locked donors. PvP v3.77.x is not used as the architectural base.

## Integration work only
- Added isolated `#pvpSetupOverlay` Lobby host using the v3.76.6 Lobby markup/CSS/assets.
- Installed the approved v6.91.3 game client and omitted the local-AI adapter in PvP mode.
- Added a thin PvP authority adapter that maps viewer-relative identity/state and routes all mutations to the v3.51 server.
- Mapped server-authoritative Coin Flip state into the existing v6.91.3 Coin Flip presentation.
- Mapped authoritative opening data/events into the existing v6.91.3 opening pipeline.
- Activated the existing v3.51 `pvpTurnReady` / `acknowledgePvpTurnStart` authority handshake so Draw Phase genuinely exists before authoritative Draw + Regen commits. This is an integration timing seam, not a new phase tracker or local gameplay mutation.

## Donor parity
- Lobby base markup: exact v3.76.6 donor hash match.
- Lobby CSS: exact after normalizing two CSS-relative `../assets/lobby/` path relocations; three required v3.76.6 `app.css` dependency rules were carried for swap-image sizing / seat positioning.
- Lobby assets: 5/5 copied lobby assets hash-identical to v3.76.6.
- VS AI v6.91.3 copied game tree: 290 files byte-identical; only `shared-app/app-runtime.js` and `runtime/adapters/pvp-adapter.js` differ for unavoidable PvP authority/identity seams. No donor game files are missing.
- Critical v6.91.3 battlefield CSS, UI renderer, static data, runtime authority, active starters, shared game engine bundle, and authority-adapter registry are byte-identical.
- v3.51 intent router, headless compatibility module, runtime card/effect data, private static data, and private runtime authority are byte-identical.
- Private v3.51 `app.bundle.js` differs only for the authoritative Draw handoff described above.

## Asset audit
- Broken CSS local URLs: **0**.
- Broken HTML local refs: **0**.
- Broken loaded-script asset refs: **0**.
- 29 SHA-256 duplicate groups remain (5,855,152 duplicated bytes). They are retained where the approved v6.91.3 donor uses distinct canonical paths (`assets/`, `card-art/`, `engine/assets/`) or where the exact v3.76.6 Lobby asset path must coexist. No speculative asset cleanup was done because donor correctness takes priority.

## Authority QA
PASS:
- intent router / invalid intent / wrong owner / stale revision / duplicate action / spectator rejection
- headless match boot + authoritative opening
- Attack / Tactical / Item / Event / targeting
- Mana / Shard payment
- Response
- Tribute / EXP / Rank Up / Ultimate Tribute
- Reposition
- Status / Attachment / Casting
- private search/reveal behavior
- defeat / cleanup / terminal state
- genuine authoritative Draw handoff (`Draw` -> server acknowledgement -> Draw+Regen -> `Deploy`)

## Deployment correction — no healthy upstream guard
The first packaged v3.78.0 Dockerfile omitted `authority/` even though `server.js` and the fail-closed runtime-sync verifier require `authority/browser-runtime/*` at process boot. In a Northflank Docker deployment this causes the Node process to exit before `server.listen(...)`, so `/health` never becomes available and the reverse proxy reports `no healthy upstream`.

Correction in the same v3.78.0 release line:
- `Dockerfile` now copies `authority/` into the production image.
- Root `README.md` now contains a mandatory deployment warning/checklist.
- Added `DEPLOYMENT_GUARDRAILS.md`; future PvP packages must preserve it.
- Added `tools/check-deployment-readiness.cjs`, which verifies Docker COPY coverage for every file in the runtime sync lock plus package/port/health requirements.
- Added `tests/run-deployment-startup-live.cjs`, which must be run after production dependencies are installed; it starts the real server and requires a real `/health` PASS.
- Added `release:seal`, `check:deployment`, `test:startup`, and `verify:deployment` npm scripts.

Static deployment topology now passes and a simulated Docker COPY context passes the runtime-sync verifier with all 104 locked files present. Real live startup with the actual `ws` package remains environment-dependent and must be executed in the deployment/CI context after `npm ci --omit=dev`.

## Browser QA
**UNVERIFIED for required real two-client end-to-end browser acceptance.** The build environment has Chromium available, but the production Node server cannot be started here because the external `ws` dependency is not installed and package installation is unavailable in this sandbox. Static/authority tests are not reported as browser PASS.

## Mobile / tablet
The approved v6.91.3 shared battlefield CSS/DOM strategy is preserved. No PvP-only touch overlay, mobile battlefield, alternate phase tracker, or tablet-specific gameplay control was added. Physical-device PASS is not claimed.

## Performance / server behavior
- No `brotliCompressSync()` or `gzipSync()` was introduced.
- No per-request compression cache was added.
- `node_modules` is excluded from the release package.

See also:
- `release/PVP_v3.78.0_DONOR_PARITY.json`
- `release/V378_ASSET_AUDIT.json`
- `release/V378_DUPLICATE_ASSET_AUDIT.json`
- `release/V378_CODE_HYGIENE.json`
- `release/PVP_v3.78.0_QA_REPORT.json`

## Same-version Lobby donor dependency correction
- Root cause verified against v3.76.6 donor: isolated Lobby CSS omitted inherited donor typography and Kick-control rules from `public/css/app.css`.
- `JOIN AS PLAYER` now uses the donor Noto Sans / 13px context and is browser-verified as one line at 1366x768, 1440x900, and 1024x768.
- Kick control now matches donor computed geometry: 28x28 button, 16x16 exit icon.
- Full `assets/lobby/` donor set is hash-identical (5/5).
- Donor-identical regular/italic Noto Sans font bytes are present in the approved v6 asset tree and reused without duplicating font files.
- Canonical 200-card thumbnail URL+SHA manifest matches the effective v3.76.6 donor manifest digest.
- Hero Progression presentation rules inherited from donor `app.css` are now explicitly included in the isolated Lobby stylesheet.
- Added mandatory static test `npm run test:v378:lobby-assets` and browser test `npm run test:v378:lobby-browser`.

## Same-version Coin Flip / Opening / active-asset correction

Confirmed runtime defects from deployed v3.78.0 were corrected without changing the release version:

1. `pvpOpeningStarted` was referenced by the approved-game presentation bridge but never declared. Clicking **Start Game** therefore threw `ReferenceError: pvpOpeningStarted is not defined`, which was caught and displayed inside the Coin Flip panel. The variable and its related local presentation gates are now explicitly declared/reset.
2. The server already requested `holdAtDraw:true, bridgeImmediate:false`, but the private v3.51 browser-runtime bridge ignored the third `completeOpeningFlow(...)` options argument and hard-forced `bridgeImmediate:true`. As a result, the first mandatory Main Deck Draw + Shard Regen could commit before the v6 opening presentation was allowed to own that sequence. The bridge now forwards the existing options and holds a genuine authoritative `Draw` state with `pvpTurnReady=true` after 6 Opening Hand cards + 3 Starting Shards.
3. `pvp-host` previously auto-sent `acknowledgePvpTurnStart` as soon as that Draw snapshot arrived. It is now gated by `GL_PVP_OPENING_PRESENTATION_COMPLETE === true`, which is set only after the v6 Opening Hand + Starting Shard presentation finishes. `beginFirstTurn()` sends the authoritative acknowledgement at that boundary.
4. Normal presentation-event processing is gated before local **Start Game**. This prevents a future authoritative Draw event from triggering `Card Sound.mp3` during Coin Flip/result presentation.
5. The authoritative `opening_sequence` event is cached by the PvP adapter so the second browser can press its own Start Game later even if the first browser has already advanced the server past the original opening event transport.

Asset wiring was re-audited from the **actual `public/index.html` production-loaded graph**, not by merely checking that asset files exist somewhere in the ZIP:

- broken loaded HTML refs: **0**
- broken loaded CSS `url(...)`: **0**
- broken active integration asset literals: **0**
- broken v6 `engine/assets/...` gameplay media refs: **0**
- broken dynamic Status/Shard/Counter/EXP/Coin/card-motion paths: **0**
- v6.91.3 card art tree: **200 files, locked donor fingerprint PASS**
- v6.91.3 engine asset tree: **36 files, locked donor fingerprint PASS**
- v6.91.3 shared asset tree: **32 files, locked donor fingerprint PASS**
- v3.76.6 Lobby assets: **5 files, donor hash PASS**

New permanent gates:

- `npm run test:v378:assets`
- `npm run test:v378:opening`

Real browser HTTP/network-404 smoke is **UNVERIFIED** in this environment because Chromium navigation to localhost is blocked by administrator policy. This is not reported as browser PASS.

### Asset-audit scope clarification
The loaded locked v6.91.3 engine bundle still contains two donor fallback URL conventions belonging to presentation owners that PvP explicitly disables: the donor standalone Lobby uses `assets/lobby/Swap.png`, and the donor native renderer has `assets/counters/Counter-{1..6}.png`. They are retained byte-identical as donor code and are **not active PvP requests** because PvP enables external-human UI and suppresses the donor native renderer. The active PvP game presentation uses the verified `engine/assets/...` counter/media paths in `shared-app/app-runtime.js`. These dormant references are reported explicitly in `V378_ACTIVE_ASSET_RESOLUTION_AUDIT.json` rather than silently counted as active assets.
