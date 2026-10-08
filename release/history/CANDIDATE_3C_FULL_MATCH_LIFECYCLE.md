# Grandis Legacy PvP v3.43 — Candidate 3C Full Match Lifecycle

## Result

**IMPLEMENTATION RESULT: PASS**  
**RELEASE READY: NO**  
**NEXT REQUIRED STAGE: Candidate 4**

Candidate 3C completes source/runtime lifecycle work on top of Candidate 3B. The real WebSocket acceptance gate remains **BLOCKED — EXECUTION ENVIRONMENT** because the single bounded canonical `npm ci` attempt could not resolve `registry.npmjs.org` (`EAI_AGAIN`) and therefore could not install locked `ws@8.21.0`. No transport shim, vendored replacement, dependency downgrade, or package-lock bypass was used.

## Locked baseline

- OSA: v1.9.5
- Canonical Card Authority: v1.6.0
- Canonical cards: 200
- Shared Runtime: v1.94.2
- Runtime Data: v0.16.2
- Effect Recipe: v0.15.2
- Effect Checkpoint: v0.15.2
- Hero Components: v1.1.0
- Starter Authority: v1.6.1
- Application Runtime Sync: v2.63
- Active starters: 5
- Candidate 3A server-authoritative intent backbone: preserved
- Candidate 3B advanced gameplay and UI corrections: preserved

## Candidate 3B preflight corrections found by lifecycle testing

Three concrete lifecycle regressions were reproduced against the actual Candidate 3B source and corrected in the shared canonical presentation/runtime bundle without redesigning transport or UI.

1. **Area Attack + Stoneblood + Legacy continuation** — a lethal multi-target Attack could place a Stoneblood defeat gate in `pending`, but the response resolver stored the continuation as a Legacy-only continuation. Declining Stoneblood and entering Legacy could therefore lose the remaining Area Attack target queue. Candidate 3C now distinguishes Stoneblood and Legacy defeat gates and resumes the original multi-target sequence through either path.
2. **PvP hand-limit turn completion** — confirming mandatory Hand Limit cleanup in shared PvP switched the active side but did not run canonical round-pair advancement and left the next side in Draw instead of completing the same automatic Draw-to-Deploy transition used by the normal shared-board turn path. This caused long matches to stop advancing `round`. Candidate 3C advances the completed turn pair and finishes Draw-to-Deploy when no new mandatory choice opens.
3. **Viewer-relative terminal reason** — seat mirroring already swapped structured `winner`, but the human-readable `gameEndReason` string remained in the opposite seat's PLAYER/AI vocabulary. Candidate 3C applies the existing side-text mirroring helper to that terminal reason so both seats receive coherent result text.

No network/session source file was changed for these fixes.

## Defeat ownership and checkpoint sequence

Hero defeat remains server/canonical-runtime authoritative. The tested path is:

`effect / Response resolution -> final applied HP -> defeat check -> Stoneblood / mandatory defeat gate -> defeat cleanup -> Legacy choice or terminal evaluation -> viewer-safe state`

Candidate 3C re-ran existing canonical defeat audits and added lifecycle integration coverage. Verified cleanup includes EXP cards, Status, Attachments, Casting/pending Casting, and Hero-local transient state. A Ranked Hero defeat was also exercised before Legacy replacement.

## Legacy replacement

- Legal replacement choices continue to originate from canonical Legacy eligibility.
- Wrong-seat replacement is rejected centrally by the gameplay intent router.
- A replaced Hero slot enters canonical `LEGACY` mode and preserves only the sanitized defeated-Hero snapshot required by the existing revive/Legacy flow.
- Stale old-Hero component actions are rejected after replacement and do not mutate authoritative gameplay state.
- Server-side viewer masking for Hand, Deck order, Legacy Deck and private pending choices remains unchanged from Candidate 3B.

## Match end

A deterministic canonical full-match harness used real Starter, Hero and card IDs and drove the match through:

- opening complete
- repeated phase/turn ownership
- canonical Tribute
- Rank Up
- three real Attack Skill resolutions
- Response windows
- Stoneblood defeat-prevention choice
- two Legacy replacements
- third Hero defeat
- terminal match result

Observed terminal result: `winner = PLAYER`, one and only one `GAME END` event, `pending = null`, `responseWindow = null`. Seat 1 renders PLAYER as winner with `AI loses...`; the mirrored seat 2 view renders AI as winner with `PLAYER loses...`, preserving self/opponent orientation through terminal state.

The current canonical runtime exposes a single-winner terminal path for defeat/deck-out and does not expose a separate canonical simultaneous-draw rule in this stage. Candidate 3C therefore reports **SIMULTANEOUS END / DRAW: N/A** rather than inventing one.

## Post-match lock and stale/duplicate protection

The central gameplay router was regression-tested for:

- finished match rejects mutating gameplay intent
- wrong seat cannot commit another side's Legacy choice
- duplicate `clientActionId` is idempotent and commits once
- stale pre-replacement revision is rejected before runtime mutation
- stale old-Hero component action on a Legacy slot is rejected by canonical runtime

## Repeated turn lifecycle / soak

A deterministic **30 completed-turn** shared-runtime soak was executed. It crossed 21 turns and intentionally exercised mandatory hand-limit cleanup 13 times.

Result:

- completed turns: 30
- final round: 16 (correct pair-based round progression from Round 1)
- successful runtime intents: 116
- hand-limit commits: 13
- no game-over drift
- no stale Response window
- no stale pending choice after each completed turn boundary
- Hero references remained stable
- Draw / End / turn ownership remained coherent

This test directly caught and then verified the hand-limit round-progression correction described above.

## Reconnect / spectator continuity

Real reconnect and spectator continuity over the production WebSocket transport were **not executed** because the real `ws@8.21.0` dependency could not be installed in this execution environment. The network/session implementation was not redesigned. Candidate 3B network/session source hashes remain byte-identical for:

- `server.js`
- `public/js/pvp-network.js`
- `server/gameplay-intent-router.mjs`
- `public/js/pvp-presentation-adapter.js`

Candidate 4 must retain real-network verification as a mandatory final release gate.

## Privacy

Candidate 3B viewer-safe regression tests were re-run after the lifecycle changes and remain PASS. Candidate 3C additionally locks the active server masking source that:

- never sends Main Deck order in viewer snapshots
- masks opponent Hand identities
- masks opponent Legacy Deck identities
- masks spectator pending choices / Response options
- does not automatically reveal hidden state at match end

## UI regression lock

Candidate 3B browser regression was re-run across the existing eight required UI-fix viewports. Both locked corrections remain PASS:

- redundant decorative card artwork strokes remain removed
- Card Played physical scale remains equal within each phone/tablet stack
- functional selected/target highlights remain present

No new UI redesign was performed. VS AI and Website were not modified.

## Tests executed

- `npm run test:candidate3c` — PASS
- Candidate 3A intent router regression — PASS
- Candidate 3A headless runtime regression — PASS
- Candidate 3A canonical gameplay regression — PASS
- Candidate 3B Hero Component regression — PASS
- Quick Reload / Rapid Chamber regression — PASS
- Candidate 3B advanced runtime regression — PASS
- Candidate 3B 200-card runtime coverage — PASS (200/200)
- Candidate 3B UI correction browser regression — PASS
- `npm run check:syntax` — PASS
- Runtime sync verifier v2.63 self-test — PASS, 94 verified files
- Candidate 3C deterministic full match — PASS
- Candidate 3C 30-turn soak — PASS
- Candidate 3C lifecycle / defeat / Legacy tests — PASS
- Candidate 3C router stale/duplicate/post-match tests — PASS
- Candidate 3C static architecture / hash lock — PASS

## Real WebSocket status

Environment:

- Node: v22.16.0
- npm: 10.9.2
- locked dependency: `ws@8.21.0`

Single bounded install attempt:

`npm_config_fetch_retries=0 npm_config_fetch_timeout=10000 npm ci`

Result:

`EAI_AGAIN getaddrinfo registry.npmjs.org`

**REAL WEBSOCKET ACCEPTANCE: BLOCKED — EXECUTION ENVIRONMENT**

## Deferred final release gate

Candidate 4 remains mandatory. It must include real production WebSocket / reconnect / spectator verification once dependencies can be installed, plus final release hardening and Website `/pvp/` synchronization only after all final gates pass.
