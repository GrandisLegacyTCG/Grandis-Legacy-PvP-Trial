# Candidate 2R-B Browser Parity Report

## Scope

Candidate: **PvP v3.43 Candidate 2R-B**. This pass continues only from Candidate 2R-A and does not enter Candidate 3. Exact visual authority used: `Grandis_Legacy_VS_AI_Tutorial_v6.42_v0.68_GitHub_Repository_2026-09-22(15).zip`.

## Result

- Exact Candidate 15 source available: **YES**
- Part A architecture preserved: **PASS**
- Real Chromium geometry/computed-style parity: **PASS**
- Desktop: **PASS**
- Tablet Landscape: **PASS**
- Tablet Portrait: **PASS**
- Phone: **PASS** for shared geometry and required Shard quick-preview behavior in the PvP browser; exact-source authority tests also passed.
- Hidden-information source boundary: **PASS**
- Server authority preserved: **YES**
- Two-seat orientation: **NOT EXECUTED — ENVIRONMENT BLOCKED**
- Reconnect: **NOT EXECUTED — ENVIRONMENT BLOCKED**
- Spectator: **NOT EXECUTED — ENVIRONMENT BLOCKED**

The integration blocker is environmental: `server.js` requires the npm `ws` package; package installation was unavailable/timed out in this execution environment, and direct server boot therefore terminated with `ERR_MODULE_NOT_FOUND: Cannot find package 'ws'`. No transport shim was used as substitute evidence.

## Exact Candidate 15 parity locks

| PvP file | Candidate 15 file | SHA-256 parity |
|---|---|---|
| `public/css/app.css` | `shared-app/app.css` | MATCH |
| `public/css/battlefield-authority.css` | `shared-app/battlefield-authority.css` | MATCH |
| `public/shared-ui/battlefield-ui.css` | `shared-ui/battlefield-ui.css` | MATCH |
| `public/shared-ui/battlefield-ui.js` | `shared-ui/battlefield-ui.js` | MATCH |

`public/js/app.bundle.js` is intentionally not byte-identical because Candidate 2R-A contains the small PvP-specific version/starter/draw-phase bridge deltas documented in Part A. Preview/geometry implementation was not changed in Part B.

## Browser geometry matrix

| Viewport | Family | Max shared rect delta | Horizontal overflow | Result |
|---|---|---:|---|---|
| 1366x768 | desktop | 0.00px | NO | PASS |
| 1440x900 | desktop | 0.00px | NO | PASS |
| 1920x1080 | desktop | 0.00px | NO | PASS |
| 1024x600 | tablet-landscape | 0.00px | NO | PASS |
| 1024x768 | tablet-landscape | 0.00px | NO | PASS |
| 1180x820 | tablet-landscape | 0.00px | NO | PASS |
| 1195x615 | tablet-landscape | 0.00px | NO | PASS |
| 1366x1024 | tablet-landscape | 0.00px | NO | PASS |
| 768x1024 | tablet-portrait | 0.00px | NO | PASS |
| 820x1180 | tablet-portrait | 0.00px | NO | PASS |
| 360x800 | phone | 0.00px | NO | PASS |
| 390x844 | phone | 0.00px | NO | PASS |
| 412x915 | phone | 0.00px | NO | PASS |

Across all required viewports, every measured shared component had a maximum `getBoundingClientRect()` delta of **0.00 CSS px** between exact Candidate 15 and PvP Candidate 2R-B under the same viewer-safe deterministic fixture.

## Shared component results

- `shell`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `p_left`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `p_center`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `p_right`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `o_left`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `o_center`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `o_right`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `hp`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `hero_control`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `status`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `attachment`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `hand`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `hand_card`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `shard_pool`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `shard`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `racial`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `legacy`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `shard_deck`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `discard`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `main_deck`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `mana_regen`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `phase`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `card_played`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.

## Interaction evidence

### Desktop 1440×900

The browser harness compared Candidate 15 and PvP on the same production renderer. Hand hover quick-preview behavior matched; preview `pointer-events` was `none` in both. The shared preview implementation is unchanged from Candidate 15, and Candidate 15 authority tests passed.

### Tablet Landscape 1180×820 — native touch emulation

- Shard sequence: 20 transitions
- Candidate 15 Shard failures: 0
- PvP Shard failures: 0
- Candidate 15 unexpected Shard Detail: 0
- PvP unexpected Shard Detail: 0
- Hero tap stage behavior matched Candidate 15.

### Tablet Portrait 768×1024 — native touch emulation

- Shard transitions: 6
- failures: 0 / 0
- unexpected Detail: 0 / 0
- Hero and Hand first-tap behavior matched Candidate 15.

### Phone 390×844

The stable A/B interaction harness recorded 12 Shard transitions with 0 failures and 0 unexpected Detail on both exact Candidate 15 and PvP. A separate native-touch diagnostic produced a reference-side harness artifact after forced scrolling, while the PvP side itself retained quick-preview-only behavior; that diagnostic is not used as parity certification. Candidate 15's own authority test passed the touch-first Shard preview ownership contract.

## Screenshots

Representative paired screenshots are retained under `tests/artifacts/candidate2r-partb/screenshots/` for 1440×900 and 390×844. They are supplemental only; parity certification is based on DOM, geometry, computed CSS, and interaction checks.

## Production corrections

**None required.** No presentation mismatch requiring a production patch was found. Candidate 2R-A's renderer, adapter, geometry authority, hidden-information boundary, and server-authoritative separation were preserved.

## Candidate 3 lock

No broad Play/Tribute/Response/targeting/payment/Rank Up/Reposition/Class Ability/Racial Trait/Legacy/Casting/defeat/win-loss network redesign was performed.

## Lightweight/source validation executed

- `node --check server.js`: PASS
- `node --check public/js/app.bundle.js`: PASS
- `node --check public/js/pvp-presentation-adapter.js`: PASS
- `node --check public/js/pvp-network.js`: PASS
- `tests/run-v343-candidate2r-part-a-architecture.cjs`: PASS
- `tests/run-v343-candidate2-ui-parity.cjs`: PASS
- `tests/run-v343-candidate1-authority.cjs`: PASS — OSA 1.9.5 / Shared Runtime 1.94.2 / Runtime Data 0.16.2 / Effect Recipe 0.15.2 / Effect Checkpoint 0.15.2 / Hero Components 1.1.0 / Starter Authority 1.6.1 / 200 cards / 5 starters
- `tests/run-v343-candidate1-assets.cjs`: PASS
- exact Candidate 15 `tests/run-v642-candidate15-authority-ui.cjs`: PASS
- exact Candidate 15 `tests/run-v642-final-stability-hero-components.cjs`: PASS
- final package check: PASS

## Manifest verification

Final regenerated manifests:

- `FILE_MANIFEST_SHA256.csv`: 362 tracked files; 0 missing; 0 hash mismatch; 0 size mismatch.
- `public/PVP_FRONTEND_SHA256.csv`: 61 tracked files; 0 missing; 0 hash mismatch; 0 size mismatch.
