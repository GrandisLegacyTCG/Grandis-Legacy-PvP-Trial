# Grandis Legacy PvP v3.43 — Candidate 3A Gameplay Backbone

## Result

- **Implementation result:** PASS
- **Release ready:** NO
- **Next required pass:** Candidate 3B, then Candidate 3C
- **Real WebSocket acceptance:** BLOCKED by execution-environment DNS/npm registry access; not recorded as PASS
- **Baseline:** `Grandis_Legacy_PvP_v3.43_Candidate2R_C2_WebSocket_Acceptance_GitHub_Repository_2026-09-24.zip`

Candidate 3A establishes the server-authoritative gameplay transport/backbone without changing the Candidate 2 Battlefield presentation. The remaining real-network gate is explicitly infrastructure-blocked: `npm ci` cannot resolve `registry.npmjs.org`, so the locked production dependency `ws@8.21.0` cannot be installed in this execution environment. No shim or fake transport is used as acceptance evidence.

## Locked foundation

| Authority | Locked value | Result |
| --- | --- | --- |
| OSA | v1.9.5 | PASS |
| Canonical Card Authority | v1.6.0 | PASS |
| Shared Runtime | v1.94.2 | PASS |
| Runtime Data | v0.16.2 | PASS |
| Effect Recipe | v0.15.2 | PASS |
| Effect Checkpoint | v0.15.2 | PASS |
| Hero Components | v1.1.0 | PASS |
| Starter Authority | v1.6.1 | PASS |
| Application Runtime Sync | v2.63 | PASS |
| Canonical cards | 200 | PASS |
| Active starters | 5 | PASS |

Candidate 2 presentation ownership remains locked:

`viewer-safe server state -> public/js/pvp-presentation-adapter.js -> public/js/app.bundle.js Candidate 15 presentation`

Shared Candidate 15 presentation geometry was not redesigned. Candidate 2 UI parity hash-lock tests still pass.

## Existing action audit and classification

Classification key from the task: **A** canonical/server-authoritative, **B** server-authoritative but stale/custom gameplay logic, **C** client-authoritative, **D** partially wired, **E** UI-only/missing, **F** duplicate implementation.

| Gameplay area | Before 3A | Candidate 3A route / result | After 3A |
| --- | --- | --- | --- |
| Phase / turn / End Turn | D | `pvp-network.js -> runtime-intent -> gameplay-intent-router -> room.engine.applyIntent -> shared runtime` | A |
| Play from Hand | D | same one-router path; server derives legality/result | A |
| Tribute | D | same one-router path; canonical runtime determines EXP and progression | A |
| Rank Up | D | canonical progression is reached from authoritative Tribute/runtime state; client does not declare Rank/EXP | A backbone |
| Target selection | D | choice intent routed centrally; canonical runtime validates current authoritative target | A backbone |
| Mana / Shard payment | D | payment-choice intents routed centrally; canonical runtime owns pool/cost/result | A backbone |
| Reposition | D | manual/optional reposition intents routed centrally; canonical runtime validates/mutates | A |
| Response | D | generic response select/confirm/pass path centralized; advanced card combinations remain 3B | A backbone |
| Class Ability / Racial Trait / Legacy Effect | D | transport is server-authoritative through router; exhaustive semantic parity intentionally deferred | D -> 3B |
| Draw Review / Quick Reload / Rapid Chamber | B/F pre-existing | existing `runtime/pvp/draw-review-runtime.mjs` remains a specialized server adapter; it is not expanded in 3A | B -> 3B |

No Candidate 3A core gameplay rule is reimplemented in `pvp-network.js` or in the new router. The router owns transport/session validation and dispatch only. The pre-existing Draw Review adapter is documented rather than falsely certified as canonical; its Hero Component semantics are part of Candidate 3B scope.

## Canonical server intent router

Added `server/gameplay-intent-router.mjs` as the single gameplay-intent transport gate. It currently classifies and routes 40 runtime intent names while keeping card/effect rules out of the router.

The route is:

`UI interaction -> pvp-network.js runtimeIntent() -> WebSocket runtime-intent -> gameplay-intent-router.handle() -> room.engine.applyIntent() -> shared Candidate 15 runtime -> authoritative revision -> viewer-safe serialization -> presentation adapter -> shared UI`

Central router checks include:

- match/engine readiness;
- player-only gameplay submission (spectators rejected centrally);
- socket/client/session ownership of the authoritative seat;
- turn ownership for active-turn actions;
- pending-decision ownership;
- Response-window ownership;
- `engine.canSeatAct()` legal-window gate;
- optional client `baseRevision` stale-state rejection;
- `clientActionId` duplicate/idempotency ledger;
- action-ID reuse rejection when the same ID is reused for a different intent.

The client never supplies resulting HP, cards, position, Mana, Shards, Rank, phase, or deck order as authority.

## Client controller

`public/js/pvp-network.js` remains an intent-only controller for gameplay. Candidate 3A adds a unique `clientActionId`, sends the current server revision as `baseRevision`, and permits only one gameplay intent in flight at a time. Authoritative snapshots/acks clear the pending action safely.

Local client state remains presentation/interaction state only (selection, preview, modal/pending affordances). Candidate 3A found no client-side call that directly commits authoritative shared-runtime gameplay in the PvP controller.

## Headless production runtime compatibility correction

Static/unit execution found a genuine server-side compatibility defect that had been masked in browser presentation mode: the headless production server loads Runtime Data / Runtime Authority / Candidate 15 application code without the browser presentation adapter, while the Candidate 15 guard expects compatibility aliases normally provided by that adapter.

Added `server/headless-runtime-compat.mjs` to establish metadata aliases only:

- shared-runtime source-stack alias;
- canonical card definition alias;
- `families.ALL.cards` compatibility mirror when required;
- card/effect version aliases;
- active-starter alias.

This module contains no card rules and no presentation geometry. It allows the actual headless Candidate 15 bridge to initialize against the same locked authorities.

## Authoritative no-op rejection

The legacy bridge can return without throwing for an invalid/stale operation. The server previously could interpret such a call as a successful commit and advance its authoritative revision even though the shared state had not changed.

Candidate 3A now compares the canonical app-state before/after an intent. If no authoritative state mutation occurred for a mutating gameplay intent, the server rejects the intent instead of committing a false success. This supplies stale Hand / invalid target / invalid payment / invalid phase protection at the transport boundary without duplicating card semantics.

## Core gameplay implementation / verification

### Phase / turn

- Canonical `advancePhase` is routed through the server.
- Wrong-seat / out-of-turn requests are rejected centrally.
- Invalid phase actions that produce no canonical state change are rejected rather than committed.
- End/start-turn lifecycle remains owned by the shared runtime, not `server.js`.

### Play

- `beginPlayFromHand` is server-authoritative.
- Hand/card/source/target legality is evaluated by the canonical bridge/runtime.
- Representative canonical Attack, Tactical, Item, and Event cards were executed in the shared Candidate 15 runtime harness.

### Tribute / Rank Up

- `beginTributeFromHand` is routed through server authority.
- Normal Tribute was exercised and produced canonical Rank Up at the expected progression point.
- Ultimate Tribute was tested both invalid without the matching Class Shard and valid with the required matching Shard / owner.
- Client does not declare EXP or resulting Rank.

### Targeting

- Valid Attack target resolved through the canonical runtime.
- Wrong-side/invalid target produced no mutation and is rejected by the server commit gate.
- Target-choice intent families are routed through the same canonical server path.

### Mana / Shards

- Shared runtime payment behavior was exercised with canonical Mana/Shard rules, including matching/nonmatching values and return ordering through the existing runtime test helper.
- Insufficient payment produces no canonical mutation and therefore cannot be committed as success by the PvP server.

### Reposition

- Legal adjacent `LEFT|CENTER` reposition was accepted and moved/exhausted the expected Heroes.
- Illegal `LEFT|RIGHT` reposition produced no mutation and is rejected at the server boundary.

### Response backbone

- Response selection/confirm/pass intents are classified centrally as Response ownership actions.
- Canonical Attack test opened the Response state for the opposing side and the opposing-side pass continued authoritative resolution.
- Exhaustive Response/effect combinations remain Candidate 3B.

## Duplicate and stale input safety

- `clientActionId` creates a bounded per-room/per-client deduplication ledger.
- Replaying the same action ID and same intent returns the prior committed result without applying the mutation twice.
- Reusing an action ID for a different intent is rejected.
- A client `baseRevision` older/different from the authoritative revision is rejected before mutation.
- Stale/invalid operations that canonical runtime leaves unchanged are rejected and do not advance authoritative revision.

## Viewer-safe broadcast path

Candidate 3A does not change the established hidden-information boundary. Server commits still produce separate viewer-safe snapshots for Player A, Player B, and Spectator before the browser receives state. The shared renderer does not receive full authoritative room state as a substitute for security.

Static architecture verification confirms the Candidate 2 viewer-safe serializer / presentation adapter path remains present and no browser-authoritative gameplay fallback was introduced.

## Real WebSocket gate

**Result: BLOCKED — infrastructure only.**

Attempted canonical install:

```text
npm_config_fetch_retries=0 npm_config_fetch_timeout=10000 npm ci
```

Environment result:

```text
npm error code EAI_AGAIN
npm error syscall getaddrinfo
npm error request to https://registry.npmjs.org/ws/-/ws-8.21.0.tgz failed,
reason: getaddrinfo EAI_AGAIN registry.npmjs.org
```

Actual environment recorded:

- Node: v22.16.0
- npm: 10.9.2
- locked production WebSocket dependency: `ws@8.21.0`

Therefore server/WebSocket/two-real-seat/reconnect/spectator acceptance is **NOT EXECUTED** in this environment. It is not converted into PASS. No fake `ws`, shim, mock transport, or package-lock bypass was used.

Evidence: `tests/artifacts/candidate3a/real-websocket-gate.txt`.

## Tests executed

Candidate 3A source/runtime tests:

- `node tests/run-v343-candidate3a-intent-router.mjs` — PASS
- `node tests/run-v343-candidate3a-headless-runtime.mjs` — PASS
- `node tests/run-v343-candidate3a-canonical-gameplay.cjs` — PASS
- `node tests/run-v343-candidate3a-static-architecture.cjs` — PASS
- `node --check server.js` — PASS
- `node --check public/js/pvp-network.js` — PASS

Locked regression / authority tests:

- Candidate 2R source architecture — PASS
- Candidate 2 UI parity / Candidate 15 CSS hash lock — PASS
- Candidate 2R-C provider portability source checks — PASS
- OSA/runtime/cards/starters foundation checks — PASS
- Runtime bridge — PASS
- Application Runtime Sync v2.63 self-test — PASS
- Package/source lock checks — PASS

Consolidated evidence: `tests/artifacts/candidate3a/static-validation.log`.

## Files changed / added in Candidate 3A

Core implementation:

- `server.js`
- `server/gameplay-intent-router.mjs` (new)
- `server/headless-runtime-compat.mjs` (new)
- `public/js/pvp-network.js`
- `public/index.html` (network cache token only)

Package/sync metadata:

- `package.json`
- `package-lock.json`
- `tools/build-runtime-sync-lock.cjs`
- generated Application Runtime Sync lock
- `tests/run-package-check.cjs`

Tests/evidence:

- `tests/candidate3a-runtime-harness.cjs`
- `tests/run-v343-candidate3a-intent-router.mjs`
- `tests/run-v343-candidate3a-headless-runtime.mjs`
- `tests/run-v343-candidate3a-canonical-gameplay.cjs`
- `tests/run-v343-candidate3a-static-architecture.cjs`
- `tests/artifacts/candidate3a/real-websocket-gate.txt`
- `tests/artifacts/candidate3a/static-validation.log`

Reports/manifests are regenerated as the final packaging step.

## Deferred Candidate 3B work

- exhaustive Class Ability parity;
- exhaustive Racial Trait parity;
- exhaustive Legacy Effect parity;
- replacement of/verification for the pre-existing PvP Draw Review / Quick Reload / Rapid Chamber specialized adapter against canonical Hero Component semantics;
- all Response-card combinations;
- Attachment/Status advanced semantics;
- advanced effect recipes / casting chains / blind selections;
- card-specific edge cases across the 200-card authority.

## Deferred Candidate 3C work

- Hero defeat / Legacy replacement lifecycle;
- victory/draw completion;
- full-game reconnect;
- long-match soak;
- complete two-player game completion and regression.

## Decision

Candidate 3A **PASS**: the requested core server-authoritative gameplay backbone is established, the locked foundation and Candidate 2 UI remain intact, core gameplay paths are routed through one server intent gate into canonical shared runtime behavior, duplicate/stale safety is present, and relevant source/runtime tests pass.

The production WebSocket acceptance gate remains **BLOCKED by execution-environment npm/DNS access** and is not represented as an application PASS. This repository remains **NOT RELEASE READY**. Candidate 3B and Candidate 3C are required next.
