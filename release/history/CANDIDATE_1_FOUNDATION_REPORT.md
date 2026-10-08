# PvP v3.43 Candidate 1 — Foundation Report

## Candidate status

- **Candidate:** PvP v3.43 Candidate 1
- **Release Ready:** NO
- **Baseline:** PvP v3.42
- **Purpose:** Foundation + current authority/data + remote asset authority + working Lobby
- **Battlefield UI Final:** NO — deferred to Candidate 2

## Authority before → after

| Component | PvP v3.42 baseline | Candidate 1 |
|---|---|---|
| Source Authority | v1.8.2 era | **v1.9.5** |
| Canonical Card Authority | older active stack | **v1.6.0** |
| Shared Runtime | v1.93 | **v1.94.2** |
| Runtime Data | v0.15.0 | **v0.16.2** |
| Effect Recipe | v0.14.0 | **v0.15.2** |
| Effect Checkpoint | v0.14.0 | **v0.15.2** |
| Hero Components | v1.0.0 | **v1.1.0** |
| Starter Authority | old v1.4/v1.5-era consumer | **v1.6.1** |
| UI Contract metadata | older | **v2.53** |
| Application Runtime Sync | v2.57 | **v2.63** |

Canonical registry hash: `7ac1f90f6a9654cf575ac41db64a052901005905b1cf01f3bfc7532873cc9389`  
Hero Component registry hash: `f36f1cc83eb9845743176c3af71f7823125353eae73e832588e9d8b42c6818be`

## Canonical data

- Canonical Cards: **expected 200 / actual 200 — PASS**
- Hero Components: **v1.1.0 — 6 Racial Traits / 16 Class Abilities / 10 Hero Profiles / 30 Hero Compositions — PASS**
- Starter Authority: **v1.6.1 — PASS**
- Active Starter Count: **expected 5 / actual 5 — PASS**

Exact active starter IDs:

1. `starter_01_elemental_lord_conqueror_renegade`
2. `starter_02_saint_crusader_grand_ranger`
3. `starter_03_arcane_duelist_elemental_lord_saint`
4. `starter_04_grand_ranger_grand_arbalest_renegade`
5. `starter_05_renegade_arcane_duelist_elemental_lord`

All five Main Decks = **60 cards**. All five Legacy Decks = **12 cards**. Retired Starter 3–5 IDs are absent from active client/server consumer paths.

## Asset authority

- Website Asset Root: `https://grandislegacytcg.github.io/shared/season1/v1/`
- Shared Card Assets: **expected 200 / actual resolvable 200 — PASS**
- Hero Assets: **expected 30 / actual resolvable 30 — PASS**
- PvP local duplicated `public/assets/cards/thumbs/`: **absent**
- False `local_thumb_exists: true`: **removed; current generated manifest reports false**
- Browser image resolver: **canonical remote URL first; broken local-path priority removed**
- Website modified: **NO**

The read-only Website repository was validated as the source for all 200 card thumbnail files. A real Chromium Lobby regression loaded the canonical remote image URLs; in the restricted QA environment, those URL requests were fulfilled byte-for-byte from the read-only Website repository through CDP interception. Natural image dimensions were positive for all tested Lobby Hero images and Hero Progression images.

## Lobby

- Lobby Hero Rendering: **PASS**
- Starter 1 formation: **PASS**
- Starter 2 formation: **PASS**
- Starter 3 formation: **PASS**
- Starter 4 formation: **PASS**
- Starter 5 formation: **PASS**
- Repeated deck switching updates Hero artwork: **PASS**
- Hero Progression Rank I/II/III images: **PASS**
- Custom-deck Hero image resolver: **preserved through the same canonical card ID → remote asset authority**
- Duplicate/shadowed text-only Lobby formation renderer: **removed; one active canonical renderer remains**

## Network / security

- Server start: **PASS**
- `/health`: **PASS**
- Room create/join: **PASS**
- Ready flow: **PASS**
- Current Starter 3 + Starter 4 match start: **PASS**
- Current Starter 5 server acceptance: **PASS**
- Hidden opponent deck identity in Lobby: **PASS**
- Hidden spectator Hands/card backs: **PASS**
- Teaching View password gate: **PASS**
- Spectator read-only authority: **PASS**
- Reconnect architecture preserved: **YES**
- Spectator architecture preserved: **YES**
- Authoritative server state / client intent model preserved: **YES**

## Files materially changed

### AUTHORITY / RUNTIME
- `runtime/**` — active common runtime replaced/synchronized from OSA v1.9.5 Shared Runtime v1.94.2; PvP adapter path retained in the current authority tree.
- `data/config/active-runtime-source-stack.v1.94.2.json` (new current config; v1.93 active config removed)
- `data/season1/cards.runtime.v0.16.2.json`
- `data/season1/hero-components.runtime.v1.1.0.json`
- `data/season1/effect-recipes.runtime.v0.15.2.json`
- `data/season1/effect-checkpoint.v0.15.2.json`
- `data/season1/card-preview.generated.v0.16.2.json`
- `public/js/runtime-authority.js`
- `sync/runtime-sync-lock.v2.63.json` (v2.57 current lock removed)
- `sync/runtime-sync-verifier.mjs`

### STARTER DATA
- `data/starter-decks/ACTIVE_STARTERS_v1.6.1.json`
- `data/starter-decks/active/*.json` — exact five OSA-generated Starter60 files
- `data/starter-decks/Grandis_Legacy_Starter_Deck_Presets_v1.6.1_LocalAI_PvP.json`
- `public/starter_deck_examples/Grandis_Legacy_Starter_Deck_Presets_v1.6.1_PvP.json`
- `public/starter_deck_examples/<five current starter JSONs>`; retired Starter 3–5 files removed

### ASSET CONFIG / GENERATED BROWSER DATA
- `tools/build-candidate1-data.cjs`
- `public/js/static-data.js`
- `public/js/app.bundle.js` — current source guards/metadata + generated Starter source consumption; battlefield presentation remains Candidate-2 deferred
- `public/PVP_FRONTEND_BUILD.json`

### LOBBY
- `public/js/pvp-network.js` — current five starter options, one active formation renderer, remote-first canonical thumbnail resolver
- `public/index.html` / `public/config.js` — Candidate 1 build/cache metadata only

### SERVER
- `server.js` — current runtime/data/starter authority load and fail-closed hash/version agreement

### TESTS
- `tests/run-v343-candidate1-authority.cjs`
- `tests/run-v343-candidate1-assets.cjs`
- `tests/run-v343-candidate1-current-deck-network.cjs`
- `tests/run-v343-candidate1-lobby-browser.cjs`
- `tests/run-server-health-test.cjs`
- `tests/run-package-check.cjs`
- `tests/run-ui-contract-test.cjs`
- Historical v3.42 regression command chain retained as `check:historical-v342`; it is no longer an active authority gate.

### BUILD / MANIFESTS
- `package.json` / `package-lock.json`
- `tools/build-runtime-sync-lock.cjs`
- `tools/build-file-manifest.cjs`
- `tools/verify-package.cjs`
- `FILE_MANIFEST_SHA256.csv`
- `public/PVP_FRONTEND_SHA256.csv`

## Commands executed / validation

The final package validation includes:

- `npm run build:data` — **PASS**
- `npm run sync-lock` — **PASS**
- `npm run check:syntax` — **PASS**
- `node sync/runtime-sync-verifier.mjs --self-test` — **PASS**
- `GL_OSA_SOURCE=... node tests/run-v343-candidate1-authority.cjs` — **PASS**
- `GL_WEBSITE_SOURCE=... node tests/run-v343-candidate1-assets.cjs` — **PASS**
- `node tests/run-runtime-bridge-test.cjs` — **PASS**
- `node tests/run-package-check.cjs` — **PASS**
- `node tests/run-ui-contract-test.cjs` — **PASS**
- `node tests/run-server-health-test.cjs` — **PASS**
- `node tests/run-pvp-room-sync-test.cjs` — **PASS**
- `node tests/run-v343-candidate1-current-deck-network.cjs` — **PASS**
- `GL_WEBSITE_SOURCE=... node tests/run-v343-candidate1-lobby-browser.cjs` — **PASS (real Chromium)**
- `npm test` — included in final verification gate
- `npm run verify` — included in final verification gate
- Root + frontend manifest verification — included in final verification gate

Dependency note: the QA container cannot reach the public npm registry, so dependency download via `npm ci` is environment-blocked. Network/server QA used the already-defined `ws` API through a test-only local validation shim; `node_modules` is excluded from and removed before the candidate package. The repository continues to declare the normal `ws` dependency in `package.json`/`package-lock.json`.

## Strict scope

- Website repository modified: **NO**
- Website `/pvp/` mirror updated: **NO**
- VS AI Candidate 15 modified/repackaged: **NO**
- Full battlefield UI parity attempted: **NO**
- CSS responsive redesign/patch campaign: **NO**

The old-looking PvP battlefield remains an allowed Candidate 1 deferred item.

## Next required stage

**Candidate 2 — VS AI Candidate 15 Battlefield/UI/Responsive Parity**
