# VS AI Season 0 — RC24 Keyword/Status Audit (6 batches, maximum 40 cards)

**Baseline:** Original RC23 (2026-11-05), OSA Season 0 DEV45 / consumer DEV44, Player Rulebook v2.9. **Application release:** RC24, RELEASE CANDIDATE / NOT FINAL. OSA, card text/artwork, Deck Builder, and other apps unchanged.

## Progress, separated by evidence standard

| Batch | Original Stage | Scope | Identities | Result |
|---|---|---|---:|---|
| 01 | 1 | MELEE / RANGE / ALL OPPONENTS | 22 | TARGETED-QA-DONE |
| 02 | 2 | PIERCING / SURE HIT / BLOCK / DODGE | 38 | TARGETED-QA-DONE |
| 03 | 3 + 4 | REACTION / REFLECT / INVINCIBLE / CONDITION / BUFF | 35 | PENDING |
| 04 | 5 + 6 | HEAL / REVIVE / MANA BURN / MANA STEAL | 22 | PENDING |
| 05 | 7 part A | Status Bleed/Burn/Freeze/Poison/Sleep/Stun — A | 22 | PENDING |
| 06 | 7 part B | Status Bleed/Burn/Freeze/Poison/Sleep/Stun — B | 22 | PENDING |

- Original keyword/status inventory contains **126 distinct card identities**. The batch row totals overlap: an identity can belong to more than one keyword/stage, and test cases are NOT card counts. **57 distinct identities** appear in the first two completed batches (22+38 with 3 duplicates); **69 additional identities** remain in Batches 03–06. The remaining overlap is deliberately retained for keyword interaction coverage.
- Batches 01–02 are **targeted engine QA complete**, not exhaustive end-to-end gameplay certification. Batches 03–06 are **NOT AUDITED IN RC24**; do not mark all seven stages complete.

## Found defect and authorized fix

**B02-F01 — Execute `S0-WAR-018` generic SURE HIT detection (confirmed helper-level defect, FIXED):**

- Source: Gladiator (Rank II) has `MANA COST +2`, defeats eligible <=50% HP Hero but **does not have SURE HIT**; Conqueror (Rank III) has **SURE HIT**.
- **Before:** `attackCannotBeDodged(card, gladiatorHero)` incorrectly returned `true` because it read the union-level `SURE HIT` runtime tag from the whole card. The actual `commitPlayedCard` Execute override already correctly permitted legal DODGE at Rank II. Thus the bug was **a helper inconsistency**, not proof that live Rank II Execute was undodgeable.
- **After:** helper checks `branchEffectText(card, sourceHero)` for `SURE HIT`, like existing Rank III-only Mana Void handling. Gladiator `false`, Conqueror `true`. Existing actual Play -> Response continues to offer Mirror Image DODGE at Rank II and withhold it for Conqueror Rank III, with correct 7/5-Mana cost code untouched.
- Files changed: `engine/shared-app/app.bundle.js` only, and documentation / README. No global modification to SURE HIT or OSA data.

## Batch 01: 22 identities, MELEE / RANGE / ALL OPPONENTS

- **234** targeted legality checks (all three source lanes, two sides, printed Class/Rank branches): **234 PASS**.
- **78** direct card-commit/resolve fixtures across PLAYER and AI, actual physical Mana payment, target HP changes and representative status/attachment outcomes: **78 PASS**.
- Included non-Attack ALL OPPONENTS (Wildfire applies Burn to all; Taunt attaches to user and limits targets) and ALL OPPONENTS attacks (Flame Dragon's Wrath, Venom Detonation with seeded Poison). Verified single-target cards affect one legal lane, and multi-target cards affect intended lanes with response-pass continuations.
- All 22 identities exercised in source-backed fixtures; no new confirmed stage-1 gameplay defect in the tested scenarios. **Scope limit:** no manual natural browser UI, no every possible nested Response/expiry/double-attack/draw combination.
- **Owner ruling watch item:** `S0-ARC-018 Soul Charged Shot` does **not** carry an unconditional printed RANGE permission, but v6.91.9's inherited special-case can target outside normal AoA and doubles damage there. This was deliberately preserved in earlier source-integration work. **Do not silently remove it** without an explicit designer ruling; the existing official wording alone does not independently authorize unrestricted RANGE.

## Batch 02: 38 identities, PIERCING / SURE HIT / BLOCK / DODGE

- **111** focused source/engine cases (107 class/rank / response-type checks, 4 additional Execute helper/real Response checks): **111 PASS after 1 helper correction**; pre-fix **110 PASS / 1 FAIL**.
- Tested class/rank SURE HIT union-tag handling, PIERCING cannot-BLOCK flag evaluation, BLOCK/DODGE Response type availability for both incoming Physical/Magical, PLAYER/AI source classes and eligible Rank variants. Selected direct Execute PLAY-to-Response cases verify Gladiator DODGE option and Conqueror SURE HIT.
- **Scope limit:** Response-choice availability is not proof of full physical Response payment/expiry/negation for every one of the 23 Defense/Item identities; those normal UI tests remain to be done.

## Existing regression hooks AFTER the patch

- Target Selection: 13/13 PASS; Class/Lineage 6,975/6,975 PASS; Ultimate Tribute 30/30 PASS; Hero Racial targeted hook PASS. JavaScript syntax PASS. Chromium inline-load page errors 0; missing requests 0 in this harness.
- Four historical S1 self-tests still FAIL (`GL_CONDITIONAL_FOLLOW_UP_V611...`, `GL_V615_CANONICAL_DEFENSE...`, `GL_V510_DOUBLE_CASTING...`, `GL_PHASE11_BURN_OPPONENT_PLAYED_ARROW...`). **Do not call them four confirmed S0 bugs.** Prior triage isolated at least one stale S1 expected block value; rest require S0-specific retesting.

## Open and excluded

- **Batches 03–06** pending deeper audit. They contain the remaining 7-stage keyword/status groups, each with <=40 identities. Do not claim these are fixed.
- `S0-ARC-018` special-range behavior pending designer/source decision; no forced rule interpretation.
- Full Human-vs-AI UI gameplay to non-Surrender terminal result, Firefox field checks, nested Response, complete all-card skill/condition/attachment/expiry combinations remain unverified.
- **UI backlog:** Legacy-style enlarged hover preview for foreground Class Ability card-choice windows (Prolonged Symphony etc.), **NOT implemented**.

**Raw reproducible evidence:** `BATCH01_STAGE1_22_CARDS_QA.json`, `BATCH02_STAGE2_38_CARDS_QA.json`, `BATCH02_EXISTING_SELFTEST_RESULTS.json`, `SIX_BATCH_CARD_TRACKER.csv` in this directory.
