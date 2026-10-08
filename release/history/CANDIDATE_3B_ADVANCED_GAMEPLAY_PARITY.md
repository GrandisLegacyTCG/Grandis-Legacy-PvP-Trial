# Candidate 3B — Advanced Gameplay / Hero Component Parity

**Candidate:** PvP v3.43 Candidate 3B  
**Implementation result:** PASS  
**Release ready:** NO  
**Next stage:** Candidate 3C

## Baseline and locked authorities

- Baseline: Candidate 3A Gameplay Backbone (2026-09-24).
- OSA v1.9.5; Canonical Card Authority v1.6.0; 200 canonical cards.
- Shared Runtime v1.94.2; Runtime Data v0.16.2.
- Effect Recipe v0.15.2; Effect Checkpoint v0.15.2.
- Hero Components v1.1.0; Starter Authority v1.6.1; Application Runtime Sync v2.63; 5 active starters.
- Candidate 2 shared Battlefield/presentation architecture remains locked.

## Candidate 3A backbone preservation

- One centralized server gameplay intent router remains active.
- Socket/session seat ownership, spectator central rejection, active-turn validation, pending/Response ownership, duplicate `clientActionId`, stale revision handling, and viewer-safe broadcasts remain server-authoritative.
- Candidate 3A intent-router and headless runtime regressions PASS.
- Candidate 3A canonical representative gameplay regression PASS on final rerun. Historical Candidate 3A static hash-lock is intentionally superseded because Candidate 3B changes package identity and the two explicitly authorized UI styles.

## Network/session preservation

Candidate 3B did not redesign room creation/join, WebSocket framing, reconnect, spectator session model, endpoint selection, or deployment behavior. Locked network/presentation files remained byte-identical to Candidate 3A baseline:

| File | Candidate 3B SHA-256 | Candidate 3A SHA-256 | Status |
|---|---|---|---|
| `public/js/pvp-network.js` | `1f8a23fae9d573a4a1a038e56003e52bbc966eb406c6e248e9f017621910dfaf` | `1f8a23fae9d573a4a1a038e56003e52bbc966eb406c6e248e9f017621910dfaf` | UNCHANGED |
| `server/gameplay-intent-router.mjs` | `ac36cef76f8ee9e57996eed9d9c79a3174a9806d798792cc5ff70e15b3e7394b` | `ac36cef76f8ee9e57996eed9d9c79a3174a9806d798792cc5ff70e15b3e7394b` | UNCHANGED |
| `public/js/app.bundle.js` | `73eaf9393699290301abb5144e51f5bdff6fc5c8a3c140641d3f2c5f30b4ffc8` | `73eaf9393699290301abb5144e51f5bdff6fc5c8a3c140641d3f2c5f30b4ffc8` | UNCHANGED |
| `public/js/pvp-presentation-adapter.js` | `ef18a8803d9783262241125c512fcbdffe290b60d0c8728254363ee070997530` | `ef18a8803d9783262241125c512fcbdffe290b60d0c8728254363ee070997530` | UNCHANGED |
| `public/shared-ui/battlefield-ui.js` | `110394df12e3052bbcc961de24dad29b5734af65d0a7c0afdd2c8ffdaf8a81cb` | `110394df12e3052bbcc961de24dad29b5734af65d0a7c0afdd2c8ffdaf8a81cb` | UNCHANGED |
| `public/shared-ui/battlefield-ui.css` | `2b70d63c74081a8809b2a2d456ec1b620a9a078ab84f597c0607a928503a9378` | `2b70d63c74081a8809b2a2d456ec1b620a9a078ab84f597c0607a928503a9378` | UNCHANGED |

`server.js` changed only at the gameplay ownership boundary to retire duplicate Draw Review logic and route the legacy transport name to the canonical shared runtime intent.

## Hero Component reconciliation

- `runtime/pvp/draw-review-runtime.mjs`: **retired**. Before: DUPLICATE gameplay authority. After: no active duplicate module.
- `confirmDrawReplacement`: thin transport alias → canonical `commitDrawReplacementChoice`.
- Hero Component inventory: 30 hero-rank compositions, 16 Class Ability definitions, 6 Racial Trait definitions, 10 Legacy Mode definitions.
- Draw Review / Quick Reload / Rapid Chamber: PASS.
- Class Ability parity: PASS. Racial Trait parity: PASS. Legacy Effect parity: PASS.
- Detailed matrix: `release/CANDIDATE_3B_HERO_COMPONENT_PARITY.md`.

## Advanced Response

- Authoritative Response window owner, pass/continue, representative response legality, sequential Area Response order, and resolution continuation: PASS.
- Verified sequential Area Response order: LEFT → CENTER → RIGHT.
- Client remains choice UI only; server/shared runtime owns legality and outcome.

## Status

- Actual current canonical status records discovered from runtime data: **Bleed, Burn, Freeze, Poison, Stun**.
- Apply/stack-duration semantics and representative lifecycle/restriction QA: PASS.
- Freeze movement/Dodge restrictions and lifecycle: PASS.
- The prompt mentioned Blessing as a known example; source inspection shows **Blessing of Divinity is canonical persistent Attachment/effect behavior, not a Status record**. Its canonical attack-label/damage-prevention behavior is covered through shared runtime QA rather than misclassified as a Status.

## Attachment / Casting / Search / Reveal / Blind selection

- Attachment authority, lifecycle, coexistence with status, and hidden-information policy: PASS.
- Casting authoritative lifecycle and defeat-cancel integration: PASS.
- Search/reveal and shuffle behavior: PASS.
- Opponent blind Hand/Shard selection: PASS; hidden identities remain absent from unauthorized viewer state.
- Sequential reveal regression: PASS.

## Advanced effect recipes / card coverage

- Canonical card runtime coverage: **200/200 executable**, 0 unsupported active paths.
- Effect recipe coverage: **200/200**.
- Attack vs Damage distinction: PASS.
- Triple Shot regression: PASS.
- Whirlwind regression: PASS (canonical result 50).
- Ultimate / matching Class Shard return batch semantics: PASS.
- Detailed 200-card matrix: `release/CANDIDATE_3B_CARD_RUNTIME_COVERAGE.md`.

## Viewer-safe advanced state

- Player A safe snapshot: PASS.
- Player B safe snapshot: PASS.
- Spectator safe snapshot: PASS.
- Search, blind choice, Response, pending selection, and Shard choice retain never-send/private serialization boundaries.

## Two authorized UI corrections

1. Redundant decorative card strokes removed from physical card artwork/wrapper owners; functional state outlines and structural separators preserved.
2. Card Played stacks retain equal physical card scale on desktop/tablet/phone; overlap remains allowed.
- Real Chromium test: all 8 required viewports PASS; maximum measured card-to-card difference remains within 1 CSS px (actual worst case 0.016px).
- Detailed report: `release/CANDIDATE_3B_MINOR_UI_CORRECTIONS.md`.

## Real WebSocket environment

One bounded canonical `npm ci` attempt was made. It failed before dependency installation because the execution environment could not resolve npm registry DNS:
```text
npm error code EAI_AGAIN
npm error syscall getaddrinfo
npm error errno EAI_AGAIN
npm error request to https://registry.npmjs.org/ws/-/ws-8.21.0.tgz failed, reason: getaddrinfo EAI_AGAIN registry.npmjs.org
npm error A complete log of this run can be found in: /home/oai/.npm/_logs/2026-09-23T20_28_57_924Z-debug-0.log
```
- Locked production dependency remains `ws@8.21.0` in `package-lock.json`.
- No shim, vendored fake WebSocket, dependency bypass, or application workaround was introduced.
- **REAL WEBSOCKET: BLOCKED — EXECUTION ENVIRONMENT**.
- This is not an identified application defect and therefore does not, by itself, fail Candidate 3B under the acceptance rule.

## Tests executed

- `npm run sync-lock` — PASS; runtime lock verifies 94 files.
- `npm run check:syntax` — PASS.
- Candidate 1 authority/assets + runtime sync verifier — PASS.
- Candidate 3A intent router — PASS.
- Candidate 3A headless shared runtime — PASS.
- Candidate 3A canonical representative gameplay — PASS on final rerun.
- Candidate 3B Hero Component matrix — PASS.
- Draw Review / Quick Reload / Rapid Chamber compatibility — PASS.
- Candidate 3B advanced runtime QA — PASS.
- 200-card structured coverage — PASS.
- Candidate 3B static architecture — PASS.
- Candidate 3B real-browser UI corrections — PASS across all required viewports.
- `npm ci` / real WebSocket integration — BLOCKED by `EAI_AGAIN` before `ws@8.21.0` could install.

## Files changed / added

Gameplay ownership / metadata:
- `server.js` — Draw Review compatibility alias now routes to canonical shared runtime.
- `runtime/pvp/draw-review-runtime.mjs` — removed duplicate authority.
- `package.json`, `package-lock.json` — Candidate 3B package identity; dependency lock unchanged at `ws@8.21.0`.
- `sync/runtime-sync-lock.v2.63.json` — regenerated after duplicate runtime retirement.

Authorized UI only:
- `public/css/app.css`
- `public/css/battlefield-authority.css`
- `public/index.html` cache tokens

Candidate 3B tests/reports/artifacts were added under `tests/`, `tests/artifacts/candidate3b/`, and `release/`.

## Deferred to Candidate 3C

- Hero defeat lifecycle.
- Legacy replacement lifecycle.
- all-Hero defeat, victory/draw.
- full-match disconnect/reconnect.
- long-match soak.
- complete two-player match completion.

## Decision

**CANDIDATE 3B: PASS**  
**RELEASE READY: NO**  
**CANDIDATE 3C REQUIRED: YES**
