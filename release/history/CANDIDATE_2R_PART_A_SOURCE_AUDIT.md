# GRANDIS LEGACY — PvP v3.43 Candidate 2R-A
## Source / Architecture Audit — Battlefield Authority Cleanup + Presentation Adapter Verification

**Audit date:** 2026-09-23  
**Baseline:** `Grandis_Legacy_PvP_v3.43_Candidate2_UI_Parity_GitHub_Repository_2026-09-23(1).zip`  
**Foundation authority:** `Grandis_Legacy_Source_Authority_v1.9.5_2026-09-22.zip`  
**Result:** **PASS**  
**Ready for Candidate 2R-B:** **YES**  
**Ready for Step 3:** **NO**  
**Release ready:** **NO**

> Scope lock: this pass is source ownership / architecture only. No large real-browser responsive matrix, no geometry screenshot matrix, and no Candidate 3 gameplay implementation were performed.

---

## 1. Executive result

Candidate 2R-A now has one production PvP presentation boundary:

`viewer-safe server snapshot -> public/js/pvp-presentation-adapter.js -> shared Candidate 15 app.bundle.js renderer`

The PvP network layer no longer contains the direct shared-bridge fallback that could bypass the adapter. If the adapter is unavailable, Battlefield import fails closed instead of selecting a second/legacy renderer.

The active in-match renderer family is `public/js/app.bundle.js::render()`. Desktop/tablet-landscape and phone/tablet-portrait use responsive branches inside that same renderer family (`field()` and `mobileField()`); there is no second network-owned Battlefield DOM generator.

The active desktop Battlefield geometry authority is `public/css/battlefield-authority.css`. `public/css/app.css` remains the shared Candidate 15 component/mobile/responsive presentation source, and `public/shared-ui/battlefield-ui.css` remains shared preview/count-badge support. No new CSS override layer and no new `!important` were added.

---

## 2. Authority input note

The exact external visual-reference archive named by the brief — `Grandis_Legacy_VS_AI_Tutorial_v6.42_v0.68_GitHub_Repository_2026-09-22(15).zip` — was not present in the supplied execution workspace. An older `(11)` archive exists, but it was **not** substituted as proof because its presentation hashes differ.

Therefore the Candidate 15 presentation conclusion in this pass is based on the **actual active Candidate 2 production source**, its existing Candidate 15 hash locks, and direct source/call-path inspection. The shared presentation files were intentionally left byte-identical to the Candidate 2 baseline. Candidate 2R-B remains responsible for real-browser rendered verification.

---

## 3. Foundation preflight

### Active foundation versions

| Authority | Verified active value | Result |
|---|---:|---|
| One Source Authority | v1.9.5 | PASS |
| Shared Runtime | v1.94.2 | PASS |
| Runtime Data | v0.16.2 | PASS |
| Effect Recipe | v0.15.2 | PASS |
| Effect Checkpoint | v0.15.2 | PASS |
| Hero Components | v1.1.0 | PASS |
| Starter Authority | v1.6.1 | PASS |
| Application Runtime Sync | v2.63 | PASS |
| Canonical cards | 200 | PASS |
| Active starters | 5 | PASS |
| Website shared asset root | `https://grandislegacytcg.github.io/shared/season1/v1/` | PASS |

### Direct foundation hash comparison

The active consumer data was compared against the supplied v1.9.5 Foundation files, not only version strings.

| Active consumer file | SHA-256 | Foundation byte parity |
|---|---|---|
| `data/season1/cards.runtime.v0.16.2.json` | `79f090fb78fb45b6fc48646c664438d5d4c3bab67f72aa36bc89bbccbd89f0` | IDENTICAL |
| `data/season1/effect-recipes.runtime.v0.15.2.json` | `173728d564f93d95afda938426492ce853f88179e67ca4147a5fb9c530255b3d` | IDENTICAL |
| `data/season1/effect-checkpoint.v0.15.2.json` | `c76b681025136f39d4600871f3240a599abd4e015477889d2123fc8dc9ff9918` | IDENTICAL |
| `data/season1/hero-components.runtime.v1.1.0.json` | `dd9214ff354b42a644c98d0b30d1b3535db404a36f12c1550a181bf51b505a45` | IDENTICAL |
| `data/starter-decks/ACTIVE_STARTERS_v1.6.1.json` | `d818646d13bf41414d81aedeb14495e8308b2882c7f9bd2e50215be5e615dd10` | IDENTICAL |

`sync/runtime-sync-verifier.mjs --self-test` verifies 93 synchronized files, 5 active starters, and 200 canonical cards.

---

## 4. PvP foundation preservation

The source still contains the Candidate 1 PvP foundation systems and this pass did not redesign them:

- HTTP server + WebSocket upgrade endpoint.
- Room creation/state, two player seats, spectator capacity.
- Ready/start flow and coin-flow infrastructure.
- Player identity, seat tokens, reconnect reservation behavior.
- Spectator mode and teaching-view authorization.
- Server-side runtime intent validation / authoritative engine.
- Viewer-specific serialization and source-side hidden-information masking.

Candidate 2R-A changes in `server.js` are build/version identity only. No protocol/gameplay implementation was introduced there.

---

## 5. Active production load graph

`public/index.html` loads the in-match presentation in this order:

### Active Battlefield stylesheets

1. `public/css/app.css`
2. `public/css/battlefield-authority.css`
3. `public/shared-ui/battlefield-ui.css`

### Active presentation/network scripts

1. `public/shared-ui/battlefield-ui.js`
2. `public/config.js`
3. `public/js/static-data.js`
4. `public/js/pvp-presentation-adapter.js`
5. `public/js/runtime-authority.js`
6. `public/js/app.bundle.js`
7. `public/js/pvp-network.js`
8. `public/js/mobile-app-nav.js`

The adapter is available before the network layer consumes server snapshots.

---

## 6. Battlefield entry-point map

| Entry point | Production path | Runtime condition | Final renderer |
|---|---|---|---|
| Normal match start | `pvp-network.js::ws.onmessage` -> `handleSnapshot()` -> `importServerBoard(false)` -> adapter | Snapshot match status active | `app.bundle.js::render()` |
| State update | same path | New authoritative snapshot / revision | `app.bundle.js::render()` |
| Reconnect | `connect()` establishes a new socket -> first snapshot -> `handleSnapshot()` -> `importServerBoard(false)` | reconnect / socket replacement | `app.bundle.js::render()` |
| Spectator Battlefield entry | setup Spectator button -> `importServerBoard(true)` | active match + spectator enters Battlefield | `app.bundle.js::render()` |
| Later spectator updates | snapshot -> `handleSnapshot()` -> `importServerBoard(false)` | spectator already in active Battlefield | `app.bundle.js::render()` |
| Desktop | `render()` -> `desktopMarkup` -> `field()` | `isMobileViewport() === false` | same renderer family |
| Phone | `render()` -> `mobileMarkup` -> `mobileField()` | mobile viewport | same renderer family |
| Tablet portrait | responsive mobile branch | portrait/mobile viewport | same renderer family |
| Tablet landscape | desktop/tablet branch | not mobile branch | same renderer family |
| Adapter/error fallback | `importServerBoard()` refuses import when adapter is missing | adapter unavailable | **no legacy renderer fallback** |

Exact source anchors in the final package include:

- `public/js/pvp-network.js::importServerBoard()` around line 254.
- `public/js/pvp-network.js::handleSnapshot()` around line 594.
- `public/js/pvp-network.js::connect()` / `ws.onmessage` around line 629.
- `public/js/app.bundle.js::mobileField()` around line 7098.
- `public/js/app.bundle.js::field()` around line 7125.
- `public/js/app.bundle.js::render()` around line 7229.
- Responsive branch assignment around line 7279.

---

## 7. Legacy / old PvP structure classification

The audit distinguishes **old class names** from an **old renderer family**. Some names survived because Candidate 15 itself uses them in the mobile branch; they are not a parallel PvP renderer.

| Structure / path | Classification | Finding |
|---|---|---|
| `.battlefield-app` | ACTIVE — shared Candidate 15 mobile shell | Emitted by `app.bundle.js::render()` mobile branch only; not network-generated. |
| `.field` | ACTIVE — shared Candidate 15 mobile field | Emitted by `mobileField()`; same renderer family. |
| `.hand-area` | ACTIVE — shared Candidate 15 mobile hand | Emitted by the same shared bundle; network only preserves mobile hand scroll position. |
| `.center-board` | DEAD / OBSOLETE selector | Present in inherited shared CSS, but not emitted by active `app.bundle.js` or network DOM. |
| `.player-hand-panel` | DEAD / OBSOLETE selector | Present in inherited shared CSS, no active production markup path. |
| Lobby DOM created in `pvp-network.js` | LOBBY ONLY | Allowed to remain separate; not an in-match Battlefield renderer. |
| Old release/history files under `docs/` / prior release notes | HISTORICAL | Not runtime authority. |
| Candidate 1 pre-Candidate15 Battlefield implementation | INACTIVE / REPLACED | No separate network-side in-match DOM generator is active in Candidate 2R-A. |

Old Hero/Hand/Shard/Deck/Pile/Phase/Preview **network renderers** were not found as active parallel production renderers. The active component implementations live in the shared Candidate 15 bundle and shared UI files.

---

## 8. Candidate 15 shared presentation source

The Candidate 2 baseline shared presentation files were preserved byte-for-byte by Candidate 2R-A:

| File | SHA-256 | Same as Candidate 2 baseline |
|---|---|---|
| `public/js/app.bundle.js` | `73eaf9393699290301abb5144e51f5bdff6fc5c8a3c140641d3f2c5f30b4ffc8` | YES |
| `public/css/app.css` | `a4bd309daf2904dc08020606e5ff690cbee8e2c064e6785eb2f1398cd239bdbd` | YES |
| `public/css/battlefield-authority.css` | `916a82f96b88fb6523d14646e6740d95b0ba2be86306b0cc457a49351eff565d` | YES |
| `public/shared-ui/battlefield-ui.js` | `110394df12e3052bbcc961de24dad29b5734af65d0a7c0afdd2c8ffdaf8a81cb` | YES |
| `public/shared-ui/battlefield-ui.css` | `2b70d63c74081a8809b2a2d456ec1b620a9a078ab84f597c0607a928503a9378` | YES |

`tests/run-v343-candidate2-ui-parity.cjs` continues to pin the Candidate 15 presentation hashes and passes with the stricter adapter boundary.

---

## 9. One renderer family

**Active Battlefield renderer:** `public/js/app.bundle.js::render()`.

`render()` owns both desktop and mobile markup branches. The device decision changes responsive markup inside the same shared presentation source; it does not select an obsolete PvP renderer.

`public/js/pvp-network.js` contains Lobby rendering and network/controller behavior, but Candidate 2R-A's architecture regression test verifies that it does not contain a second in-match Battlefield root renderer or direct `#app.innerHTML` Battlefield generator.

**Duplicate active Battlefield renderer families: NO.**

---

## 10. CSS authority audit

### Active stylesheets and classification

| Stylesheet | Classification | Ownership |
|---|---|---|
| `public/css/battlefield-authority.css` | **SHARED CANDIDATE 15 AUTHORITY** | Desktop/tablet-landscape `.gl-lab-*` Battlefield geometry. |
| `public/css/app.css` | **SHARED CANDIDATE 15 AUTHORITY** | Shared component styling plus mobile/portrait responsive layout. |
| `public/shared-ui/battlefield-ui.css` | **PVP-SAFE SHARED UI / NON-CORE GEOMETRY** | Quick-preview/count badge presentation; not a second Battlefield geometry system. |
| Lobby styles generated/used by network setup UI | **LOBBY ONLY** | Not in-match Battlefield geometry authority. |
| Dead selectors such as `.center-board` / `.player-hand-panel` | **OBSOLETE / INACTIVE** | No matching active production Battlefield markup. |

Core desktop `.gl-lab-authority`, `.gl-lab-shell`, and `.gl-lab-battlefield` geometry is owned by `battlefield-authority.css`, not duplicated by the PvP network layer.

### `!important` audit

All `!important` occurrences in the three active Battlefield-loaded CSS sources were counted:

| File | Existing `!important` occurrences |
|---|---:|
| `public/css/app.css` | 4,415 |
| `public/css/battlefield-authority.css` | 1,126 |
| `public/shared-ui/battlefield-ui.css` | 14 |
| **Total** | **5,555** |

These are inherited Candidate 15 declarations. Candidate 2R-A changed **zero** of those CSS files and introduced **0 new `!important` declarations**. No Part-A patch-on-patch block was added.

### Duplicate selector audit

The shared Candidate 15 CSS intentionally repeats some selectors under different responsive/media contexts. Exact-selector parsing found, for example:

- `.v96-app .hero-stage` — 7 declarations in `app.css`.
- `.v96-app .hero-row` — 5 in `app.css`.
- `.v96-app .hand-card` — 13 in `app.css`.
- `.v96-app .zoneCard` — 6 in `app.css`.
- `.v96-app .phase-panel` — 7 in `app.css`.
- `.v96-app .heroActions .actionBtn` — 4 in `app.css`.
- `.gl-lab-mana-pool` — 2 in `battlefield-authority.css`.
- `.gl-lab-zone` — 2 in `app.css` and 2 in `battlefield-authority.css`; the active desktop geometry role is constrained by the `.gl-lab-*` authority context, while mobile/shared component rules remain in `app.css`.

These repeats are responsive/context declarations inside the shared authority sources, not an old PvP stylesheet independently overriding the same Battlefield with another source-of-truth. Candidate 2R-A therefore does not add a consolidation patch that would fork Candidate 15.

**Duplicate active geometry authority: NO.**

---

## 11. PvP presentation adapter

**File/function:** `public/js/pvp-presentation-adapter.js::importViewerSafeSnapshot()`.

Candidate 2 previously had a thin adapter but `pvp-network.js` could still bypass it and call the shared bridge directly. Candidate 2R-A removes that bypass.

The adapter now:

1. Normalizes the approved browser source aliases needed by the shared presentation.
2. Requires the server snapshot marker `pvpPrivateStateMasked === true`.
3. Rejects an unmarked/non-viewer-safe snapshot.
4. Normalizes the local seat for orientation handoff.
5. Delegates to `GL_LOCAL_AI_BRIDGE.importCanonicalSnapshot()`.
6. Delegates shared-board mode to the shared bridge.

The adapter does **not** own CSS geometry, pixel coordinates, responsive positioning, WebSocket protocol, room packets, reconnect tokens, or server-only hidden maps.

---

## 12. Reconnect, spectator, and device ownership

- **Reconnect:** same socket snapshot handler -> `importServerBoard()` -> adapter -> shared renderer. No legacy fallback.
- **Spectator:** explicit Battlefield entry calls `importServerBoard(true)`; later snapshots use the same import path.
- **Phone:** shared renderer mobile branch.
- **Tablet portrait:** shared renderer responsive/mobile branch.
- **Tablet landscape:** shared renderer desktop/tablet branch.
- **Desktop:** shared renderer desktop branch.

No device family is routed to a network-owned obsolete Battlefield generator.

---

## 13. Hidden-information source audit

**Result: PASS.**

Source-side masking occurs before the presentation adapter receives data:

- `server.js::maskAppStateForSeat()` masks unauthorized hands, all deck order, legacy identities, pending choice data, response options, and draw-card identities.
- `server.js::maskCanonicalBoardForRecipient()` sets `pvpPrivateStateMasked = true` after recipient-specific masking.
- `server.js::snapshotFor()` obtains the authoritative canonical board and passes it through recipient masking before transmission.
- Animation transport separately masks opponent draw identities.
- The presentation adapter refuses a board without the viewer-safe marker.

Opponent private identity is therefore not made available merely to be hidden by CSS/DOM/JavaScript display conditions.

Existing teaching-view behavior is explicitly authorized: a spectator may see both hands only after the configured teaching-view password is unlocked. Candidate 2R-A did not broaden that capability.

---

## 14. Self / opponent orientation

**Result: PASS.**

`GL_LOCAL_AI_BRIDGE.importCanonicalSnapshot(canonical, seat, opts)` swaps canonical PLAYER/AI keyed state when `seat === 2`. Therefore:

- Player A browser: seat A becomes local PLAYER / bottom; B becomes opponent / top.
- Player B browser: seat B becomes local PLAYER / bottom; A becomes opponent / top.

The new architecture regression test executes the bridge in a VM and verifies the seat-2 swap. The PvP adapter passes the local seat into that same bridge; it does not hardcode seat 1 as bottom.

Real two-client visual confirmation remains a Candidate 2R-B browser task.

---

## 15. Shared component source audit

The active implementations for the in-match presentation remain in the shared Candidate 15 bundle / shared UI source:

- Hero card geometry, HP, status, attachment, Class Ability, Racial Trait, Legacy Effect.
- Hand presentation.
- Shard Pool / Racial Token presentation.
- Legacy Deck / Shard Deck / Discard Pile / Main Deck presentation.
- Phase Tracker.
- Card Played presentation.
- Quick preview / detail / inspection presentation.

No parallel network-owned in-match renderer was introduced for these components.

---

## 16. Source changes made in Candidate 2R-A

1. **`public/js/pvp-presentation-adapter.js`** — made the viewer-safe adapter boundary explicit and fail-closed.
2. **`public/js/pvp-network.js`** — removed direct shared-bridge fallback; all server boards now enter through the adapter. Network/lobby authority retained.
3. **`tests/run-v343-candidate2r-part-a-architecture.cjs`** — added source/call-path regression test for one renderer family, one desktop geometry authority, strict adapter ownership, source-side hidden masking, reconnect/spectator/device convergence, and seat-2 orientation.
4. **`tests/run-v343-candidate2-ui-parity.cjs`** — updated identity/cache expectations and verifies the stricter adapter without changing Candidate 15 presentation hashes.
5. Build/package identity files updated to Candidate 2R-A: `package.json`, `package-lock.json`, `public/config.js`, `public/PVP_FRONTEND_BUILD.json`, `server.js`, `public/index.html` cache token.
6. Runtime sync lock regenerated with Candidate 2R-A application identity; authoritative runtime contents remain preserved.
7. Internal audit report added.

No Website source and no VS AI source archive were modified.

---

## 17. Architecture regression test

Added `tests/run-v343-candidate2r-part-a-architecture.cjs`.

It checks actual source/import/call behavior rather than a version-string-only presence test:

- Exactly one active app bundle and one PvP adapter in production script load graph.
- Adapter load position before network consumption.
- One shared `render()` renderer family with desktop/mobile branches.
- No network-owned Battlefield root renderer.
- No direct network -> shared bridge board-import bypass.
- Viewer-safe marker required at adapter boundary.
- Reconnect/state update/spectator routes converge on `importServerBoard()`.
- Device routing stays inside the shared renderer.
- Core desktop geometry selectors are owned by `battlefield-authority.css`.
- Server source contains recipient masking before serialization.
- Seat-2 orientation swap works at runtime.
- Unsafe/unmarked snapshots are rejected by the adapter.

Result: **PASS**.

---

## 18. Lightweight validation executed

| Check | Result |
|---|---|
| `npm run check` | PASS |
| Syntax checks for server, production JS, runtime JS/MJS | PASS |
| Runtime Sync v2.63 self-test | PASS — 93 files, 5 starters, 200 cards |
| Candidate 1 authority test | PASS |
| Candidate 1 asset/root test | PASS |
| Shared runtime bridge test | PASS |
| Candidate 2R-A architecture regression test | PASS |
| Package check | PASS |
| Candidate 2 presentation/hash/adapter static test | PASS |
| Server HTTP boot + `/health` + Room 2 config + static audio routes | PASS |

### Test-environment note

The execution container did not have the production `ws` npm package installed and outbound package installation was unavailable. For the **HTTP boot/health-only** check, a temporary local protocol-import shim was used solely so Node could import `server.js`; it was removed before packaging. It was **not** accepted as proof of real WebSocket transport behavior.

A temporary WebSocket-server shim attempt against the live room integration test timed out at the same coin-flip point in both the untouched Candidate 2 baseline and Candidate 2R-A. Because that shim is not the real `ws` library, that result is not treated as a Candidate 2R-A regression and is not claimed as an integration PASS. Real transport/two-client behavior should be exercised with installed dependencies in the next environment / Candidate 2R-B.

Historical `check:legacy` scripts are not used as Part-A proof; at least one historical script hardcodes an older package version and is therefore unsuitable as a current Candidate 2R-A gate without changing historical evidence.

The required Part-A source-integrity/architecture gate itself passes.

---

## 19. Manifest status

Final packaging regenerates both:

- `FILE_MANIFEST_SHA256.csv`
- `public/PVP_FRONTEND_SHA256.csv`

The final package verification result is required to be:

- Missing: 0
- Hash mismatch: 0
- Size mismatch: 0

Final verified package status: **PASS**.

---

## 20. Candidate 3 lock

No broad network gameplay implementation or redesign was performed for Play, Tribute, Response, targeting, Mana/Shard payment, Rank Up, Reposition, Class Ability, Racial Trait, Legacy Effect, Casting, defeat, or win/loss.

No local gameplay authority fallback was introduced.

**CANDIDATE 3 WORK PERFORMED: NO.**

---

## 21. Remaining Candidate 2R-B work

Candidate 2R-B should perform the intentionally deferred real-browser validation:

- Desktop rendered screenshot/geometry matrix.
- Phone responsive matrix.
- Tablet portrait matrix.
- Tablet landscape matrix.
- Two real player clients and spectator rendered orientation.
- Reconnect rendered state.
- Touch/pointer behavior and detail/preview flows.
- Shard transition/stress checks.
- Geometry/pixel parity against the intended Candidate 15 visual reference in an environment where the exact `(15)` reference archive is available.

This work is **not** required to reopen source ownership unless it exposes a real architecture defect.

---

## 22. Decision gate

| Gate | Result |
|---|---|
| Foundation intact | PASS |
| One active Battlefield renderer family | PASS |
| One active desktop Battlefield geometry authority | PASS |
| Candidate 15 shared presentation active | PASS |
| Old PvP Battlefield runtime path inactive | PASS |
| PvP presentation adapter exists and is mandatory | PASS |
| Reconnect routes to shared renderer | PASS |
| Spectator routes to shared renderer | PASS |
| Phone/tablet/desktop route to shared renderer family | PASS |
| Hidden-information boundary source-safe | PASS |
| Self/opponent orientation logic | PASS |
| No local gameplay authority introduced | PASS |
| Required Part-A lightweight source tests | PASS |
| Manifest | PASS |

**READY FOR PART B: YES**  
**READY FOR STEP 3: NO**
