# Grandis Legacy — PvP v3.43 Candidate 2R-C2

## Real WebSocket Acceptance Rerun

### Final result

**IMPLEMENTATION RESULT: BLOCKED**

**READY FOR STEP 3: NO**

Candidate 2R-C2 was executed strictly from the Candidate 2R-C baseline. The first acceptance action was the canonical dependency install. The execution environment could not resolve the npm registry host, so the real locked production `ws` dependency could not be installed. Per the Candidate 2R-C2 gate, application code was not changed to work around this infrastructure limitation, and no real integration item was falsely marked PASS.

## Environment

- Node: `v22.16.0`
- npm: `10.9.2`
- Canonical install command: `npm ci`
- `package-lock.json` production WebSocket package: `ws@8.21.0`
- `package.json` dependency range: `ws ^8.18.0`
- Production server entry point: `server.js`
- Existing real integration suite: `tests/run-v343-candidate2r-part-c-websocket.mjs`

## Dependency installation

**BLOCKED**

Actual canonical command executed:

`npm ci`

Exact npm error:

```text
npm error code EAI_AGAIN
npm error syscall getaddrinfo
npm error errno EAI_AGAIN
npm error request to https://registry.npmjs.org/ws/-/ws-8.21.0.tgz failed, reason: getaddrinfo EAI_AGAIN registry.npmjs.org
```

The error is DNS/network resolution failure in the execution environment, not an application failure. The locked tarball URL is the canonical registry package for `ws@8.21.0`.

No dependency version was changed. No package-lock bypass was used. No vendored `ws`, fake WebSocket, transport shim, mock server, or manually injected server snapshot was introduced.

Concise evidence is retained at:

`tests/artifacts/candidate2r-c2/dependency-install-evidence.txt`

## Real acceptance execution status

Because `npm ci` did not install `ws@8.21.0`, the actual production server could not be booted with its canonical dependency graph. Candidate 2R-C2 therefore does not treat any downstream runtime test as executed.

| Acceptance item | Result | Reason |
| --- | --- | --- |
| Dependency install | BLOCKED | npm registry DNS resolution returned `EAI_AGAIN` |
| Installed ws version | NOT AVAILABLE | canonical package could not be installed |
| Production server boot | NOT EXECUTED | dependency gate failed first |
| `/health` | NOT EXECUTED | production server not booted |
| Real WebSocket | NOT EXECUTED | production server not booted |
| Room create | NOT EXECUTED | real transport unavailable |
| Room join | NOT EXECUTED | real transport unavailable |
| Ready / start | NOT EXECUTED | real transport unavailable |
| Player A self-bottom | NOT EXECUTED | real two-seat session unavailable |
| Player B self-bottom | NOT EXECUTED | real two-seat session unavailable |
| Two-seat orientation | NOT EXECUTED | real two-seat session unavailable |
| Player A hidden-info payload | NOT EXECUTED | real payload unavailable |
| Player B hidden-info payload | NOT EXECUTED | real payload unavailable |
| Reconnect | NOT EXECUTED | real socket unavailable |
| Second reconnect | NOT EXECUTED | real socket unavailable |
| Stale socket ownership | NOT EXECUTED | real socket unavailable |
| Spectator | NOT EXECUTED | real socket unavailable |
| Spectator shared renderer | NOT EXECUTED | real spectator session unavailable |
| Spectator non-authority | NOT EXECUTED | real spectator session unavailable |
| Spectator hidden-info | NOT EXECUTED | real spectator payload unavailable |
| Invalid room runtime test | NOT EXECUTED | real transport unavailable |
| Room full runtime test | NOT EXECUTED | real transport unavailable |
| Malformed message runtime test | NOT EXECUTED | real transport unavailable |
| Unauthorized intent runtime test | NOT EXECUTED | real transport unavailable |
| Custom PORT runtime test | NOT EXECUTED | production server not booted |

This is intentionally not an inferred PASS.

## Existing real integration suite audit

The existing Candidate 2R-C suite remains the correct starting point:

`tests/run-v343-candidate2r-part-c-websocket.mjs`

It boots the real `server.js`, uses real WebSocket clients, and covers the intended two-seat, hidden-information, reconnect, stale-socket, spectator, invalid-room, room-full, and malformed-message paths. It was not replaced or weakened because the failure occurred before the suite could execute against an installed canonical production dependency.

## Locked baseline preservation

No production application source was changed in Candidate 2R-C2.

Static rechecks performed after the blocked install:

- package structure/source authority check: **PASS**
- Candidate 2R-A architecture regression: **PASS**
- Candidate 2R-C portability/static contract: **PASS**
- Candidate 2 shared UI source lock: **PASS**

Preserved verified baseline:

- Candidate 2R-A source architecture: **PASS**
- Candidate 2R-B browser/UI parity: **PASS**
- Candidate 2R-C provider portability source contract: **PASS**
- Candidate 2R-C Northflank compatibility source contract: **PASS**
- server-authority architecture: **PASS**
- hidden-information source boundary: **PASS**

The blocked C2 rerun does not downgrade those already-verified source/UI results; it leaves the remaining real transport/session acceptance unresolved.

## Provider portability lock

Source/static contract remains:

- public WebSocket endpoint configurable: **YES**
- core server provider-agnostic: **YES**
- Northflank-compatible: **YES**
- Northflank-specific core dependency: **NO**
- configurable `HOST`; external-bind default remains suitable for container deployment
- environment-driven `PORT`
- normal HTTP/WebSocket upgrade architecture
- no Northflank gameplay/session lock-in

These are preserved source-contract results, not substitutes for the blocked real runtime acceptance.

## Files changed in Candidate 2R-C2

No production application source, verified UI source, gameplay source, server source, package dependency metadata, Website repository, or VS AI repository was modified.

Candidate 2R-C2 adds only acceptance/audit evidence and regenerates package manifests:

- `release/CANDIDATE_2R_C2_REAL_WEBSOCKET_ACCEPTANCE.md`
- `tests/artifacts/candidate2r-c2/dependency-install-evidence.txt`
- `FILE_MANIFEST_SHA256.csv`
- `public/PVP_FRONTEND_SHA256.csv` (regenerated; public content unchanged)

## Candidate 3 lock

Candidate 3 work performed: **NO**

No gameplay expansion or protocol rewrite was performed.

## Final decision

**IMPLEMENTATION RESULT: BLOCKED**

**READY FOR STEP 3: NO**

Reason: the required real dependency installation was blocked by execution-environment DNS/network failure. The Candidate 2R-C2 specification explicitly requires real `npm ci`, real `ws`, real production server boot, and real WebSocket execution before Step 3 may be approved.

The correct next action is to rerun Candidate 2R-C2 in an execution environment where `registry.npmjs.org` is reachable and `npm ci` can install the exact locked `ws@8.21.0`, then run the existing real integration suite without changing the acceptance criteria.
