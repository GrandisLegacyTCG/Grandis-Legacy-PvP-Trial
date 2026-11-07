# Grandis Legacy — VS AI S0 side-by-side review vs original v6.91.9

**Review date:** 2026-11-04  
**S1 baseline:** `Grandis_Legacy_VS_AI_v6.91.9_2026-10-13.zip` (SHA256 `d919b2f3a85c61b0194a1f35029e80a35fb3e950f12a2b80091c5ecdf921c765`).  
**S0 baseline reviewed:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC2_QA_2026-11-04.zip` (SHA256 `e5761d243d103104bb1201055d8b76d6ded5b2521d7bca7939276ca8fbb62051`).  
**New output:** RC3 — side-by-side fixes and renewed tests.  
**Game data authority:** OSA Season 0 DEV45 + DEV44 pinned consumer exports, never S1 card payloads.

## 1. Files compared, byte-for-byte

| Status | Number |
|---|---:|
| Original S1 source files | 277 |
| S0 RC2 source files, before RC3 side-by-side reports | 388 |
| Identical-path unchanged files | 54 |
| Identical-path changed files | 10 |
| New paths in S0 including QA artifacts | 324 |
| Paths removed from S1 including historical artwork | 213 |

Detailed per-file SHA256 comparisons: `SIDE_BY_SIDE_V6919_TO_S0_FILE_DIFF.csv`. New QA reports will add files after this count.

## 2. Functional differences and design disposition

| Component | Original S1 v6.91.9 | S0 reviewed | Decision |
|---|---|---|---|
| Gameplay authority | S1 registry of 200 non-Mana cards | S0: 242 non-Mana runtime records + 6 Mana faces = 248 catalog IDs | **Required** S0 data-only replacement. |
| Skills / Hero growth | 128 Skills; 30 Hero cards | 155 Skills; 45 Hero cards | **Required** S0 identities/rows and Rank lineage. |
| Item / Event / Legacy | 20 / 12 / 10 | 20 / 12 / 10 | **Required** S0 effects; preserve engine mechanism where compatible. |
| Starter decks | Five S1 starter presets, previous Main Deck rules | Five DEV45 S0 starters, exactly 50 Main / 12 Mana / 12 Legacy | **Required**. |
| Card fronts | 200 `S1-*` card-art files | 248 `S0-*` official card-art files | **Required**. |
| Backs / shard art | Old S1 backs and shard assets | Three S0 current backs and S0 Mana faces mapped locally | **Required**. |
| App runtime guard | S1 expected counts and hashes | S0 expected counts, hashes and component references | **Required**. |
| Combat foundation | v6.91.9 engine | Same engine with S0 handler routing, values and source-specific features | **Retain existing** transaction / Response / damage engine, modify only needed S0 branches. |
| CONDITION | Existing Permafrost/Escape Arrow flow | Existing UI + new Discard selection with atomic commit | **Targeted extension**. |
| Casting UI | Time-1 countdown / Draw counter | Casting progress starts at displayed 0; owner End +1; Runeforged forced release | **User-approved behavior**. |
| Bard | No S0 note-exchange ability UI | Bard/Maestro optional Draw-phase discard/draw UI and AI choice | **Targeted addition**. |
| Local AI | Existing action planner | Retained planner + BUFF follow-up, Ultimate reserve, Bard resource decisions | **Targeted addition**. |
| Desktop battlefield HTML/CSS | Existing | Layout and style unchanged. `index.html` only title and two SHARD DECK → MANA DECK captions changed | **Retain UX**. |
| Shared UI / mobile navigation | Existing | Exact source bytes unchanged | **Retain**. |
| Runtime adapters / AI bridge | Existing | Exact source bytes unchanged | **Retain**. |
| Historical `engine/js/app.bundle.js` | Duplicate, not loaded by root index | Excluded; active `engine/shared-app/app.bundle.js` retained | **Safe cleanup**, not engine replacement. |
| Test/QA artifacts | S1-specific fixtures/hooks | S0 targeted tests, snapshots and source handoff added | **QA data only**, do not treat stale S1 test assertions as S0 failures or successes. |

## 3. Bugs / compatibility risks found and corrected in RC3

1. **S0 Hero package lineage import normalization.** `normalizePackageSlots()` only recognized an `S1-...-H###` string as a Hero-ID-shaped (not final lineage) input. It now recognizes `S0-...-H###` as well. A concrete import-style fixture of the official Red–White S0 starter passed after normalization; deck validator accepted the normalized deck. No official starter data changed.
2. **Obsolete full-art override for S0 Aim Shot.** `fullFor()` had copied a legacy special-case from S1 Ambush Shot, forcing a thumbnail for `S0-ARC-008` despite the active S0 full-art entry being SHA verified. Removed that special-case, so all S0 artwork resolves through the official current manifest. This is future-proofing: in the supplied RC2 package the thumb and full paths were identical, so the fix is **not** a claim that an observable wrong image had already been shown.

Only `engine/shared-app/app.bundle.js` gameplay/UI-runtime code changed relative to RC2. No new effect system, UI redesign, OSA/Deck Builder/PvP edits.

## 4. Results after corrections

- Five active JS syntaxes: **PASS**.
- 7 SHA256-pinned S0 consumer exports, 248 identities, 426 branches, 36 compound bindings: **PASS**.
- 5 approved S0 starters and 251 SHA-verified art references: **PASS**.
- Deck validator, Stage5 42 targeted, Stage6 20 targeted checks: **PASS**.
- New S0 lineage and official Aim Shot full-art regression: **PASS**.
- Five complete Node-VM matches of existing game engine (AI vs passive human), rounds 17, 20, 11, 15, 24: **PASS**.
- Actual **full normal browser Human vs AI match**: **UNVERIFIED** in this run. Previous partial Chromium UI and Surrender smoke evidence does not count as normal terminal. Local/virtual origin navigation in this environment produced `ERR_BLOCKED_BY_ADMINISTRATOR`.

## 5. Remaining known risks / boundaries

- The side-by-side audit proves file-level and targeted engine continuity, not every possible card interaction or tactical AI strength.
- Some original built-in QA functions still encode Season 1 card IDs/counts/Heaven's Fury assumptions. They are historical tests, not active runtime rules. Do not certify S0 from them without source-appropriate expectations.
- Legacy `GL_SHARED_CARD_BASE` string names an S1 remote URL, but active S0 card lookup is local, all S0 images are pinned and pass current manifest checks. Do not substitute S1 remote art/data if an S0 asset becomes missing; treat that as an integration defect.
- **Production-ready is not proven:** at least one completed normal interactive full match via the real browser UI is still required. Do not label RC3 FINAL.

## 6. Commands

```
node --check engine/shared-app/app.bundle.js
node runtime/season0-generated/check-consumer-stage3.cjs
node runtime/season0-generated/check-stage4-assets-starters.cjs
node runtime/season0-generated/check-stage4-engine-deck-guard.cjs
node runtime/season0-generated/check-stage5-gameplay-targeted.cjs
node runtime/season0-generated/check-stage5-completion-targeted.cjs
node runtime/season0-generated/check-stage6-ai-bard-targeted.cjs
node runtime/season0-generated/stage7-match-simulation.cjs
```

Detailed latest check receipts: `SIDE_BY_SIDE_QA_RESULT.json`.

Targeted follow-up script included in this package: `node runtime/season0-generated/check-side-by-side-fixes.cjs`.
