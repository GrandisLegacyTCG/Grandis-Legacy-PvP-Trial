# Grandis Legacy PvP v3.49 — Shard System Parity Part 1

Status: **PASS — Part 1 complete. Final release packaging intentionally NOT performed.**

Baseline: `Grandis_Legacy_PvP_v3.48_GitHub_Repository_2026-09-26.zip`  
Behavioral reference: VS AI v6.45 / Tutorial v0.69 (reference only; not modified)  
Scope: Shard gameplay / interaction / authoritative pending-choice parity only.

## Executive result

The v3.48 Shard failures were traced to three PvP integration gaps rather than to Shard gameplay rules themselves:

1. Normal/Response Class Shard controls existed in the shared renderer, but PvP's capture/router layer did not route `data-mana-class-uid` / `data-response-mana-uid` through authoritative network intents. The corresponding shared bridge functions also were not exported for server invocation.
2. PvP only rehydrated the Draw Review pending popup after authoritative snapshots. Other valid shared pending types, including `mana_shard_payment_choice`, `response_payment_choice`, and `opponent_mana_selection`, could exist on the server but fail to reappear on the client. PvP now calls the shared `renderCurrentAuthoritativePendingChoice()` dispatcher after every authoritative board import.
3. Shard preview is a local read-only interaction. PvP's capture layer did not classify `[data-shard-preview-src]` as local UI, so valid touch inspection could be swallowed as an unmapped gameplay control. It is now explicitly local-only while canonical gameplay remains server-authoritative.

The existing v3.48 opaque opponent-Shard handle design was retained and hardened so a face-down selection is tied to a current canonical physical Shard, filtered against the actual target pool, and rejected/reconciled when stale. Hidden identity is not added to client payloads.

## Source changes

| Area | Change |
|---|---|
| `public/js/pvp-network.js` | Added authoritative routes for normal Class Shard and Response Class Shard choices; replaced Draw-only pending rehydration with generic shared pending rehydration; added Shard preview to local read-only UI allowlist. |
| `public/js/app.bundle.js` | Exported `toggleManaShardPaymentChoice` and `toggleResponseManaShardChoice` through the shared PvP bridge. No Shard payment rules were rewritten. |
| `server/gameplay-intent-router.mjs` | Registered the two Shard-toggle intents as server-authoritative PAYMENT decisions. |
| `server.js` | Hardened opponent Shard canonical mapping: current target-pool filtering, opaque handle generation from canonical physical UID, selected-index remap, stale-pool reconciliation, and stale-handle rejection. |
| metadata / cache / sync | Working target promoted to v3.49 Part 1; cache build ID updated; Runtime Sync lock regenerated from final Part 1 source bytes. |
| popup presentation | **UNCHANGED.** No popup redesign/removal was performed. |

## Complete Shard parity map

| # | Feature | VS AI owner/reference | PvP v3.49 Part 1 authority path | Result / classification |
|---:|---|---|---|---|
| 1 | Starting Shard acquisition | `buildInitialMatchState`, opening sequence, Mana draw reservation/commit | shared runtime on server → viewer-safe snapshot → existing renderer | **PARITY** |
| 2 | Draw Phase Mana Regen Shard acquisition | Mana deck reservation/commit functions | shared runtime on server → authoritative snapshot | **PARITY** |
| 3 | effect-based Shard gain | shared runtime Shard mutation helpers | shared runtime via gameplay intent router | **PARITY** |
| 4 | physical Shard Pool rendering | `labManaPool` / responsive Shard renderer | viewer-localized `playerManaPoolCards` / `aiManaPoolCards` → same renderer | **PARITY** |
| 5 | physical Shard Deck rendering/count | Shard Deck zone renderer + deck counts | viewer-localized deck arrays/counts → same renderer | **PARITY** |
| 6 | Mana Shard payment | `computeManaPayment`, `spendManaPayment` | authoritative server runtime | **PARITY** |
| 7 | matching Class Shard payment | `renderManaShardPaymentChoice`, `toggleManaShardPaymentChoice` | DOM → `toggleManaShardPaymentChoice` → WS → router → shared runtime | **FIXED: MISSING ROUTE** |
| 8 | nonmatching Class Shard payment | same payment functions, value=1 | same authoritative route | **PASS** |
| 9 | normal Skill payment | shared payment runtime | server-authoritative runtime | **PASS** |
| 10 | Item/Event/non-Skill payment | shared payment runtime, Class Shard value=1 | server-authoritative runtime | **PASS** |
| 11 | Response payment | `renderResponsePaymentChoice`, `toggleResponseManaShardChoice`, `commitResponsePaymentChoice` | DOM → WS → router → shared runtime | **FIXED: MISSING ROUTE** |
| 12 | Ultimate Tribute Class Shard spend | `beginTributeFromHand` + matching Class Shard spend | existing PvP Tribute intent → shared authoritative runtime | **PARITY / PASS** |
| 13 | opponent Shard selection | `startOpponentManaSelection`, `renderOpponentManaSelection`, `selectOpponentManaChoice` | pending snapshot → generic rehydration → opaque handle → server resolves canonical index | **FIXED: MISSING PENDING REHYDRATION** |
| 14 | opponent Shard Steal/remove/discard | shared runtime effect semantics | server-authoritative intent + opaque choice-handle adapter | **PASS BOTH SEATS** |
| 15 | Shard return to bottom | `returnManaShardToOwnerDeck` | same shared runtime on server | **PARITY** |
| 16 | payment batch ordering | `returnManaPaymentBatchToOwnerDeck` | same shared runtime on server | **PARITY / PASS** |
| 17 | Pool maximum behavior | shared runtime pool cap | same shared runtime on server | **PARITY** |
| 18 | Seat 1 viewer mapping | PLAYER=Seat1, AI=Seat2 | viewer-safe transform | **PASS** |
| 19 | Seat 2 viewer mapping | localized PLAYER=Seat2, AI=Seat1 | viewer-safe transform | **PASS** |
| 20 | reconnect | state rebuilt from authoritative snapshot | generic pending rehydration after snapshot | **PASS by authoritative state path** |
| 21 | spectator-safe Shard state | hidden remote representation | existing spectator-safe serializer | **PARITY** |
| 22 | mobile/tablet Shard inspection | `v642TabletShardTap` / responsive preview | local read-only click allowed through PvP capture | **FIXED: WRONG INPUT ROUTING** |
| 23 | desktop Shard inspection | desktop asset hover/focus preview | local read-only click/hover path | **PASS** |
| 24 | pending-choice restoration | `renderCurrentAuthoritativePendingChoice` | PvP now invokes shared dispatcher on every imported server board | **FIXED: MISSING PENDING REHYDRATION** |
| 25 | stale Shard choice recovery | current pending rebuilt from canonical state | server validates current pool/handle and returns fresh snapshot on stale choice | **PASS** |

## Real two-client browser evidence

`tests/run-v349-shard-parity-browser.py` used the real production PvP page, real WebSocket server, shared runtime, authoritative snapshots, and two Chromium clients. The only QA-only capability is deterministic canonical state seeding; clicks and gameplay resolution use the normal production DOM/network/server path.

Observed PASS results:

- Physical Seat mapping: PASS.
- Normal Class Shard payment Seat 1: PASS.
- Normal Class Shard payment Seat 2: PASS.
- Mana-only payment: PASS.
- Nonmatching Class Shard payment: PASS (1 Mana).
- Multiple Class Shard choices: PASS.
- Insufficient Mana rejection: PASS.
- Response Class Shard payment Seat 1: PASS.
- Response Class Shard payment Seat 2: PASS.
- Ultimate Tribute matching Class Shard Seat 1: PASS.
- Ultimate Tribute matching Class Shard Seat 2: PASS.
- Seat 1 opponent-Shard selection from Seat 2: PASS.
- Seat 2 opponent-Shard selection from Seat 1: PASS.
- Stale opponent-Shard choice Seat 1: PASS.
- Stale opponent-Shard choice Seat 2: PASS.
- Hidden opponent Shard information security: PASS.

Latest machine result is stored at `tests/artifacts/v349-shard-parity-part1/results.json` and reports `realBrowser: true`, `twoClient: true`, `physicalSeatMapping: true`, both Steal directions PASS, both stale-choice directions PASS, and `hiddenShardInfo: true`.

## Shard preview real Chromium evidence

Real Chromium production pointer/touch tests were executed against the actual PvP Shard renderer. The test waits through legitimate opening presentation input locks and then uses a real pointer/tap on `[data-shard-preview-src]`; it does not call the preview handler directly.

- Phone 390×844: PASS — `is-phone-shard-preview is-visible`.
- Tablet Portrait 768×1024: PASS — `is-tablet-portrait-shard-preview is-visible`.
- Tablet Landscape 1024×768: PASS — readable Shard preview visible.
- Desktop 1366×768: PASS — readable Shard hover preview visible.
- In every preview test, remote Shards remained hidden (`hiddenRemote: true`).

Screenshots are stored under `tests/artifacts/v349-shard-parity-part1/preview-*.png`; aggregate evidence is stored in `preview-results.json`.

## Canonical opponent-Shard mapping / security

FACE-DOWN PRESENTATION PRESERVED: **PASS**  
VISUAL ARRAY INDEX USED AS CANONICAL ID: **NO**  
CANONICAL PHYSICAL SHARD IDENTITY: canonical server-side physical Shard `uid`, never exposed as the selectable client identity  
VIEWER-SAFE OPAQUE CHOICE HANDLE: SHA-256-derived opaque handle scoped by server secret + authoritative revision + recipient seat + canonical Shard UID  
SEAT 1 OPPONENT POOL SOURCE: canonical Seat 2 / AI-side physical Shard Pool before viewer masking  
SEAT 2 OPPONENT POOL SOURCE: canonical Seat 1 / PLAYER-side physical Shard Pool before viewer masking  
COUNT / POOL / CHOICE HANDLE SAME REMOTE OWNER: **PASS**  
INDEX-SHIFT / STALE TEST: **PASS**  
STALE HANDLE: **REJECTED / RECONCILED**  
STALE CHOICE CAN DEADLOCK MATCH: **NO**  
HIDDEN SHARD IDENTITY LEAK: **NO**  
SEAT 1 STEALS FROM SEAT 2: **PASS**  
SEAT 2 STEALS FROM SEAT 1: **PASS**  
BOTH CLIENTS RENDER SAME CANONICAL RESULT: **PASS**

## Mana rules / physical state evidence

The retained shared runtime audit confirms:

- Shard Deck size: 12.
- Matching Class Shard for matching Skill: 2 Mana.
- Nonmatching Class Shard: 1 Mana.
- Mana Shard: 1 Mana.
- Return batch ordering: Mana Shard → nonmatching Class Shard → matching Class Shard deepest/last.
- Later payment batch is below the complete earlier batch.
- Starting Mana Regen: 1.

No payment semantics were changed in Part 1; only missing PvP authority/routing/rehydration integration was corrected.

## Required Part 1 acceptance

NORMAL SKILL CLASS SHARD: **PASS**  
RESPONSE CLASS SHARD: **PASS**  
ULTIMATE TRIBUTE CLASS SHARD: **PASS**  
OPPONENT SHARD PENDING CREATED: **PASS**  
OPPONENT SHARD UI APPEARS: **PASS**  
SEAT 1 STEAL: **PASS**  
SEAT 2 STEAL: **PASS**  
STALE CHOICE RECOVERY: **PASS**  
PHYSICAL SEAT MAPPING: **PASS**  
RETURN BATCH ORDER: **PASS**  
MOBILE SHARD PREVIEW: **PASS**  
TABLET SHARD PREVIEW: **PASS**  
DESKTOP SHARD PREVIEW: **PASS**  
HIDDEN SHARD INFO: **PASS**  
POPUP REDESIGN PERFORMED: **NO**  
VS AI MODIFIED: **NO**  
TUTORIAL MODIFIED: **NO**

## Integrity checkpoint

Runtime Sync lock was regenerated after final Part 1 source changes and self-verification reports **PASS**, with 94 tracked runtime files, 200 canonical cards, and 5 active Starter Decks.

## Stop condition

**PART 1 COMPLETE.**

Per the task instruction, no final v3.49 release ZIP, Website sync, or Part 2 animation work is performed here. Part 2 may begin from this completed Part 1 source state.
