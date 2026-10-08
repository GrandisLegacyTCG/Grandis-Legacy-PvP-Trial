# Grandis Legacy PvP v3.43 — Candidate 4 Final Release Audit

## Decision

**IMPLEMENTATION RESULT: PARTIAL**  
**RELEASE: Grandis Legacy PvP v3.43**  
**RELEASE READY: NO**

Candidate 4 completed the available final source/runtime/security/browser hardening and found no new application regression in the locked Candidate 3C implementation. The mandatory real-network release gate could not execute because the execution environment still cannot resolve `registry.npmjs.org`, so the locked production dependency `ws@8.21.0` could not be installed. Per the Candidate 4 release rule, Website `/pvp/` synchronization was not performed and no final production release ZIP names were produced.

## Baseline and authority lock

- Implementation baseline: `Grandis_Legacy_PvP_v3.43_Candidate3C_Full_Match_GitHub_Repository_2026-09-24.zip`
- Baseline SHA-256: `71ac1eec05e6b48a8d9429ee1d0ba78c2e0bcf0118b73268b7c830e3542b99c7`
- Historical network reference: PvP v3.42, read-only comparison only
- Source Authority: v1.9.5
- Canonical Card Authority: v1.6.0
- Canonical cards: 200 / 200
- Shared Runtime: v1.94.2
- Runtime Data: v0.16.2
- Effect Recipe: v0.15.2
- Effect Checkpoint: v0.15.2
- Hero Components: v1.1.0
- Starter Authority: v1.6.1
- Application Runtime Sync: v2.63
- Active Starters: 5 / 5

No authority version was bumped.

## Real WebSocket release gate

Environment:

- Node: v22.16.0
- npm: 10.9.2
- lockfile WebSocket package: `ws@8.21.0`
- lockfile integrity: `sha512-Vsp28b7DRcimFQvrqu2Wek3z1iYxDCWqHYB8Qsnk/S4RfaCQzPGPyBNuVjJV3cd6UiKtUtp6sNM77gWvzcCH+g==`

Bounded canonical install attempt:

```text
npm_config_fetch_retries=0 npm_config_fetch_timeout=10000 npm ci
```

Actual result:

```text
npm error code EAI_AGAIN
npm error syscall getaddrinfo
npm error errno EAI_AGAIN
npm error request to https://registry.npmjs.org/ws/-/ws-8.21.0.tgz failed, reason: getaddrinfo EAI_AGAIN registry.npmjs.org
```

Therefore the following mandatory real-transport release items remain **NOT EXECUTED** rather than being inferred PASS:

- production `server.js` boot with real `ws`
- `/health` over the production server process
- real HTTP -> WebSocket upgrade
- room create / join / legal deck / Ready / Start
- real Player A / Player B orientation over WebSocket
- real serialized payload privacy over WebSocket
- representative real gameplay intents
- representative Hero Component intents
- real defeat / Legacy replacement / terminal result over transport
- two reconnect cycles
- stale replaced-socket authority
- real spectator join / viewer safety / non-authority
- invalid room / room-full / malformed-message / stale-action / duplicate-action / post-match rejection over real transport
- custom-PORT real WebSocket acceptance

No fake `ws`, shim, dependency downgrade, lockfile bypass, vendored `node_modules`, or alternate transport was used.

## Network architecture review

PvP v3.42 was consulted only as a historical connection/session reference. The connection model remains recognizable and preserved: HTTP WebSocket upgrade at `/ws`, room/client query identity, two player seats, spectator role, seat-token reconnect, socket replacement, stale close-event guard, Ready/Start room flow, and deployment endpoint configuration.

Differences from v3.42 were classified as:

- **A — required server-authoritative migration:** centralized gameplay intent router, action ID/revision envelope, client-board publication disabled.
- **B — security improvement:** invalid room validation, centralized role/seat/turn authority, viewer-safe serialization, stale-socket ownership guards.
- **C — provider portability:** configurable `HOST`, default `0.0.0.0`, env `PORT` retained.
- **D — presentation/runtime adapter:** viewer-safe snapshots feed the shared Candidate 15 renderer through the PvP presentation adapter.
- **E — actual regression:** none identified by final static/source regression. Real transport certification remains unavailable because dependency installation is infrastructure-blocked.

No network/session architecture was redesigned in Candidate 4.

## Compact Candidate 3 regression

Current Candidate 4 compact regression PASS includes:

- Candidate 3A: one intent router, seat ownership, spectator rejection, turn/pending/Response ownership, duplicate action ID safety, stale revision safety, canonical rejection propagation.
- Candidate 3A canonical gameplay: Phase/Turn, representative Attack/Tactical/Item/Event Play, Targeting, Mana, Shard payment, Response backbone, Tribute, Rank Up, Ultimate Tribute, Reposition, invalid-action no mutation.
- Candidate 3B: 30 Hero compositions, 16 Class Abilities, 6 Racial Traits, 10 Legacy definitions, Draw Review, Quick Reload, Rapid Chamber, advanced Response, Status, Attachment, Casting, Search/Reveal, Blind Selection, Attack-vs-Damage, Triple Shot, Whirlwind, Ultimate Shard return.
- Card runtime coverage: 200 / 200.
- Candidate 3C: Hero defeat, ranked defeat, multi-Hero defeat, Stoneblood continuation, Legacy replacement, stale Hero Component rejection, terminal exactly once, Casting/EXP cleanup.
- Deterministic full match: PASS; 1 Rank Up, 3 Hero defeats, 2 Legacy replacements, 3 Response events, terminal Player A result.
- 30-turn soak: PASS; completed 30 turns, crossed 21 turns, Round 16, 13 Hand Limit cleanup commits, no pending/Response drift, Hero references stable.
- Stale/duplicate terminal safety: wrong-seat replacement rejected, post-match mutation rejected, duplicate lethal deduped, stale old-Hero revision rejected.

## Security / authority hardening

Static release audit PASS:

- Server gameplay authority remains centralized through `server/gameplay-intent-router.mjs`.
- Browser controller does not call `GL_LOCAL_AI_BRIDGE.applyServerIntent`.
- Client board publication is rejected server-side.
- Spectator gameplay mutation is centrally rejected.
- Player authority is derived from live server-side client/session/seat state.
- `clientActionId` and `baseRevision` protections remain active.
- Reconnect replaces the prior socket; close events from stale replaced sockets are ignored.
- Viewer-safe server masking remains active for Hand, Deck order, Legacy order, pending choice data, Response options, and draw identities.
- Core server/router/client network source contains no Northflank-specific dependency.
- Northflank endpoints remain isolated to deployment/frontend configuration.
- Duplicate PvP Draw Review gameplay authority remains retired.
- No `node_modules` is included in the repository.

## Final UI / responsive regression

Real Chromium source/presentation regression covered all 13 required viewport sizes:

- Desktop: 1366×768, 1440×900, 1920×1080
- Tablet Landscape: 1024×600, 1024×768, 1180×820, 1195×615, 1366×1024
- Tablet Portrait: 768×1024, 820×1180
- Phone: 360×800, 390×844, 412×915

Result:

- 13 / 13 geometry rows PASS
- maximum shared geometry delta: 0 CSS px in the geometry parity fixture
- no browser page errors
- shared Battlefield renderer remains active
- obsolete PvP Battlefield renderer remains inactive

Shard interaction regression PASS at Tablet Landscape, Tablet Portrait, and Phone: touch/tap opens quick preview, does not open Detail Popup, and produces no horizontal overflow in the direct current-PvP regression.

Candidate 3B UI corrections remain PASS:

- redundant card-art decorative border: absent
- functional selected/legal-target highlights: preserved
- Card Played three-card physical size equality: PASS across Desktop/Tablet/Phone test matrix
- maximum measured stack width variance: 0.015625 CSS px
- maximum measured stack height variance: 0 CSS px

VS AI source was not modified.

## Candidate 4 repository-only QA changes

No production gameplay, network/session, or shared presentation source was changed in Candidate 4.

QA/package metadata changes only:

- `package.json` / `package-lock.json`: identify the blocked Candidate 4 audit package while keeping v3.43 and the same locked dependency graph.
- `tests/run-package-check.cjs`: updated only so package self-check recognizes the Candidate 4 blocked package label.
- `tests/run-v343-candidate4-release-static.cjs`: final static release lock/security check.
- `tests/artifacts/candidate4/`: concise final-stage evidence.
- this audit report.

## Website gate

Website baseline available:

`Grandis_Legacy_Website_v1.31_GitHub_Pages_2026-09-13(1).zip`

Baseline SHA-256:

`810ef53f045ecb2f41a410aef8d3993f427a61b3c58ec4f0522af42cc636d154`

Website `/pvp/` synchronization: **NOT PERFORMED**.

Reason: Candidate 4 explicitly requires the real WebSocket final gate to PASS before final Website synchronization. The npm/DNS blocker prevented that gate from executing. The Website archive was not modified and no Website release package was produced.

## Final release decision

Candidate 4 source/runtime/browser hardening: **PASS** for all executable non-network-final-gate checks.

Mandatory real WebSocket release certification: **BLOCKED / NOT EXECUTED** due external DNS/npm infrastructure.

**FINAL DECISION: RELEASE READY NO.**

The correct failure output is a Candidate 4 blocked repository package plus an external Candidate 4 final-release audit. Final production PvP/Website ZIP names and Website mirror synchronization are intentionally withheld until real `ws@8.21.0` transport acceptance actually passes.

## Manifest result

Final blocked Candidate 4 repository manifests after all audit/test metadata were added:

- `FILE_MANIFEST_SHA256.csv`: 425 files, 0 missing, 0 hash mismatch, 0 size mismatch
- `public/PVP_FRONTEND_SHA256.csv`: 61 files, 0 missing, 0 hash mismatch, 0 size mismatch
