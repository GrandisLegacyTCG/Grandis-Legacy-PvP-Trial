# RC32 — Escape Arrow regression correction (same-version)

**Date:** 2026-11-07. **Baseline:** the most recent designer-approved RC32 ZIP. **Mode:** targeted correction and re-release under the same RC32 name. The previous RC32 ZIP is backed up separately. OSA source and exported data are unchanged.

## Why the previous 26/27 QA failed

The test `GL_V511_ESCAPE_ARROW_QA_SELF_TEST` built a synthetic match using `buildInitialMatchState()` (which correctly begins before Opening Hand and Mana setup with empty physical Mana Pools). Its fixture then assigned `s.aiMana=30`, but this legacy numeric field is not a real payment resource: the engine validates/spends **physical Mana Shards** in `aiManaPoolCards` / `aiManaDeck`. As a result, the attempted AI Slash never committed, and no Response Window opened. The fixture also overwrote `hero.card_id` alone without updating the corresponding Hero instance/lineage identity. The report "Escape Arrow response unavailable" was caused by an invalid test setup, **not proof of an Escape Arrow gameplay bug**. The old failure also reproduced on the untouched previous RC32.

## Correction (test fixture only)

- Instantiate the attacking Warrior and defending Archer with `heroState(...)`, so the object carries consistent identity/lineage metadata.
- Move **three** owned physical Mana Shards from the AI Mana Deck into the AI Mana Pool via `splice`, preserving the 12-card total (deck+pool). Recalculate the pool count through `syncManaCountForSide`. No artificial 30-Mana shortcut.
- Fail explicitly if `commitPlayedCard` cannot commit the legal Slash; do not misattribute that to a missing Response Window.
- Keep the actual Escape Arrow Response flow unchanged: `Response` → mandatory choice of another Hand card → `DISCARD & CONFIRM` → `DODGE`, no pending/stuck state and both cards in Discard.

**Production impact:** only the embedded self-test fixture in `engine/shared-app/app.bundle.js` changed. No live card effect, cost, AI policy, phase rule, UI or OSA data was modified. Source bundle syntax and existing game paths are preserved.

## Verified checks

- Unified Discard / Legacy / Escape Arrow / payment / rollback / hand limit / Bard selectors / compact viewport: **27/27 PASS** (actual app scripts with controlled Chromium fixture).
- Actual embedded Escape Arrow regression: **PASS** through attack commit, genuine Response Window, discard payment, Dodge, and closed pending/Response state.
- EXP Stack geometry: **5/5 PASS** (controlled Chromium).
- Deck Counters & Mana Regen: **15/15 PASS** (controlled Chromium).
- Poison Vial / Grand Finale Card Review plus unrelated Review smokes: **8/8 PASS** (controlled Chromium).
- Primal Strike Physical VFX/SFX routing: **PASS** (controlled Chromium engine path; hardware audible sound not verified).
- `node --check` on engine and app runtime: **PASS**.
- ZIP CRC and source diff: see package verification report.

## Limitations

These passing tests prove their **specific scoped assertions**, not a fully played natural Human-vs-AI match or all card effects. **Full natural match, native Firefox, actual audio output and fully hosted browser navigation remain NOT VERIFIED.** The prior 26/27 result remains in historical notes as superseded evidence, rather than being erased.

**Status:** RC32 RELEASE CANDIDATE — NOT FINAL.
