# GRANDIS LEGACY — PvP v3.43 Candidate 2R-C
## Real WebSocket Integration Gate

**Status:** PARTIAL  
**READY FOR STEP 3:** NO  
**Release readiness:** NOT RELEASE READY

## Scope

Candidate 2R-C was limited to the transport/session verification gap left by Candidate 2R-B: real two-seat orientation, reconnect, spectator, and real WebSocket execution. Candidate 3 gameplay expansion was not performed.

Candidate 2R-A architecture remains the source contract:

`viewer-safe server state -> public/js/pvp-presentation-adapter.js -> public/js/app.bundle.js::render()`

Candidate 2R-B UI parity remains locked; no shared Battlefield presentation file was changed in this pass.

## Dependency installation result

- Actual Node: `v22.16.0`
- Actual npm: `10.9.2`
- Canonical dependency command attempted: `npm ci --ignore-scripts`
- Locked production dependency: `ws 8.21.0` (`package.json` declares `^8.18.0`)
- Online install: **ENVIRONMENT BLOCKED**. The bounded install did not complete and was terminated by the execution environment.
- Offline install: **ENVIRONMENT BLOCKED** with npm `ENOTCACHED` for `https://registry.npmjs.org/ws/-/ws-8.21.0.tgz`.
- No WebSocket shim, fake transport, vendored replacement, or manually injected network snapshot was used.

Evidence:

- `tests/artifacts/candidate2r-partc/dependency-install.log`
- `tests/artifacts/candidate2r-partc/dependency-offline-check.log`

## Production server boot

Canonical command: `node server.js`

Attempted with:

`PORT=39123 HOST=0.0.0.0 node server.js`

Result: **FAIL — execution dependency unavailable**. Node exits at production import resolution with `ERR_MODULE_NOT_FOUND: Cannot find package 'ws'`.

Because the production server cannot reach application startup in this execution environment, the following real integration checks are **NOT EXECUTED** rather than inferred PASS:

- HTTP `/health`
- real WebSocket upgrade
- room create/join
- ready/start
- Player A / Player B two-seat browser orientation
- real A/B payload hidden-information isolation
- disconnect/reconnect
- second reconnect cycle
- duplicate socket replacement
- spectator join/render/non-authority/hidden information
- invalid-room runtime behavior
- room-full runtime behavior
- malformed-message runtime behavior
- custom-PORT runtime boot
- runtime external-bind verification

Evidence:

- `tests/artifacts/candidate2r-partc/server-boot.log`
- `tests/artifacts/candidate2r-partc/real-websocket-gate.log`

## Real integration test added

`tests/run-v343-candidate2r-part-c-websocket.mjs` was added as a real production acceptance test. It boots the actual `server.js` and uses real WebSocket clients; it does not replace the production transport. When the canonical `ws` dependency is available, the test executes:

- `/health`
- Player A room creation / seat 1
- Player B room join / seat 2
- legal Starter selection via current Starter IDs
- ready/start and opening coin flow
- viewer-relative A/B orientation
- A/B hidden-Hand isolation
- two real reconnect cycles
- duplicate socket replacement
- real spectator join
- spectator read-only rejection
- spectator hidden-information isolation
- third-player room-full route according to current protocol
- malformed message rejection
- spectator reconnect seat stability
- invalid room rejection

The test was executed here, but its production child server fails before startup because `ws` cannot be resolved. Therefore the integration cases remain **NOT EXECUTED**.

## Minimal Candidate 2R-C source corrections

### Server portability

`server.js` now uses environment-driven binding:

- `PORT = process.env.PORT || 3000`
- `HOST = process.env.HOST || process.env.GL_PVP_HOST || 0.0.0.0`
- `server.listen(PORT, HOST, ...)`

This keeps local/container/VPS/cloud deployment portable and does not hardcode a provider hostname, service ID, API, internal domain, or provider-specific WebSocket protocol in core server source.

### Invalid room input

The WebSocket upgrade path now rejects malformed room IDs before creating/looking up room state. This is a minimal session-boundary correction; it does not redesign gameplay or room semantics for valid IDs.

### Provider-neutral core source

Northflank-specific current endpoint values remain isolated to deployment configuration/documentation (`public/config.js`, package deployment metadata, docs/history). Core `server.js` contains no Northflank-specific hostname/API/service dependency. The production frontend network controller still supports configured WebSocket bases and same-origin `ws://` / `wss://` fallback.

### Candidate diagnostics

Server diagnostic version/build identifiers were advanced to Candidate 2R-C. They remain diagnostic only and are not used as an authority gate.

## Portability / Northflank compatibility source audit

Static portability test: **PASS**

Verified in source:

- environment-driven PORT
- configurable HOST with `0.0.0.0` default
- lightweight `/health` route exists
- actual production `WebSocketServer` from `ws` is used
- standard HTTP `/ws` upgrade path exists
- frontend consumes deployment config
- frontend derives `wss://` under HTTPS and `ws://` under HTTP when explicit bases are absent
- Docker uses canonical `npm ci --omit=dev --ignore-scripts`
- Docker starts actual `node server.js`
- core server has no Northflank-specific source dependency
- current Northflank WSS endpoints are deployment configuration, not gameplay/server authority

Architecture result:

- **PUBLIC WS ENDPOINT CONFIGURABLE: YES**
- **CORE SERVER PROVIDER-AGNOSTIC: YES**
- **NORTHFLANK COMPATIBLE: YES (architecture/source contract)**
- **NORTHFLANK-SPECIFIC CORE DEPENDENCY: NO**

Live custom-port/WebSocket execution is still NOT EXECUTED locally because the actual server cannot boot without the installed `ws` package.

Evidence:

- `tests/run-v343-candidate2r-part-c-portability.cjs`
- `tests/artifacts/candidate2r-partc/provider-portability-audit.txt`
- `tests/artifacts/candidate2r-partc/static-validation.log`

## Part A architecture lock

**PASS**

Static architecture regression confirms:

- active renderer: `public/js/app.bundle.js::render`
- presentation adapter: `public/js/pvp-presentation-adapter.js::importViewerSafeSnapshot`
- shared Battlefield geometry authority remains active
- reconnect/spectator/device paths remain mapped to the shared renderer family in source
- source hidden-information masking remains present
- seat-relative orientation logic remains present

No old PvP Battlefield renderer was reactivated and no second geometry authority was added.

## Part B UI parity lock

**PASS**

No `public/` file changed relative to the Candidate 2R-B input baseline before manifest regeneration. Locked hashes for the following are unchanged:

- `public/js/app.bundle.js`
- `public/js/pvp-presentation-adapter.js`
- `public/js/pvp-network.js`
- `public/css/app.css`
- `public/css/battlefield-authority.css`

Exact Candidate 15 authority tests also still pass. The 13-viewport browser geometry matrix was not rerun because Candidate 2R-C did not change shared presentation source.

Evidence:

- `tests/artifacts/candidate2r-partc/partb_locked_ui_sha256_before.txt`
- `tests/artifacts/candidate2r-partc/partb_locked_ui_sha256_after.txt`
- `tests/artifacts/candidate2r-partc/ui-lock-validation.log`
- `tests/artifacts/candidate2r-partc/candidate15-locked-file-hashes.csv`

## Foundation lock

**PASS**

Verified:

- OSA `v1.9.5`
- Shared Runtime `v1.94.2`
- Runtime Data `v0.16.2`
- Effect Recipe `v0.15.2`
- Effect Checkpoint `v0.15.2`
- Hero Components `v1.1.0`
- Starter Authority `v1.6.1`
- Application Runtime Sync `v2.63`
- canonical cards: `200`
- active starters: `5`

Runtime sync self-test passes after regenerating the sync lock for the intentional server/package/test changes.

## Hidden information

Source boundary: **PASS**  
Real A/B WebSocket payload acceptance test: **NOT EXECUTED**

Candidate 2R-C did not loosen viewer-safe serialization or send hidden identity to the client to support tests. The existing Part A/B source boundary remains intact. The newly added real integration test explicitly checks each player's opponent Hand masking and spectator Hand masking once the production `ws` dependency is available.

## Server authority

**PASS — source/architecture preserved**

The authority flow remains:

`client intent -> server validation -> authoritative server state -> viewer-safe serialization -> presentation adapter -> shared renderer`

No browser-authoritative gameplay fallback was added.

## Files changed from Candidate 2R-B baseline

Production / metadata:

- `server.js`
- `package.json`
- `package-lock.json`
- `sync/runtime-sync-lock.v2.63.json`

Verification/tooling:

- `tests/run-package-check.cjs`
- `tools/build-file-manifest.cjs`
- `tools/build-runtime-sync-lock.cjs`
- `tests/run-v343-candidate2r-part-c-portability.cjs` (new)
- `tests/run-v343-candidate2r-part-c-websocket.mjs` (new)
- `tests/artifacts/candidate2r-partc/*` (new concise evidence)
- `release/CANDIDATE_2R_PART_C_WEBSOCKET_GATE.md` (this report)

No shared Battlefield UI source was modified. Website and VS AI repositories were not modified.

## Tests executed

Passed:

- Candidate 2R-C portability/static contract
- Candidate 2R-A architecture regression
- Candidate 1 foundation authority
- Candidate 1 asset authority
- runtime bridge
- runtime sync self-test
- package structure check
- Candidate 2 UI source lock
- exact Candidate 15 UI authority
- exact Candidate 15 Hero Component stability
- syntax checks for production and new Candidate 2R-C tests

Attempted but blocked before application startup:

- canonical `npm ci --ignore-scripts`
- production `node server.js`
- real Candidate 2R-C WebSocket integration suite

## Decision gate

**IMPLEMENTATION RESULT: PARTIAL**

**READY FOR STEP 3: NO**

Reason: Candidate 2R-C requires real production WebSocket execution. The actual `ws` package cannot be installed/resolved in this execution environment, so server boot fails before `/health` or WebSocket integration can execute. The prompt explicitly forbids substituting a shim or inferred/report-only PASS.

The repository is still packageable and auditable, but Candidate 2R-C verification is not closed until the real integration suite runs with canonical dependencies installed.

## Remaining work before Step 3 can be approved

In an environment where `npm ci` can install the locked `ws` dependency, run:

1. `npm ci`
2. `npm run test:partc`
3. confirm server boot + `/health`
4. confirm real two-seat orientation for both viewers
5. confirm real A/B payload hidden-information isolation
6. confirm two reconnect cycles and stale-socket replacement
7. confirm spectator shared rendering, non-authority, and hidden-info isolation
8. confirm invalid room / room full / malformed message behavior
9. confirm custom PORT and external bind at runtime
10. regenerate/verify manifests if any source correction becomes necessary

Do not enter Candidate 3 until those Candidate 2R-C acceptance tests execute successfully.
