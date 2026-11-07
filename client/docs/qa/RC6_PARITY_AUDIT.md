# GRANDIS LEGACY — VS AI SEASON 0 RC6
## S1 v6.91.9 vs S0 DEV45 — Gameplay Legality, UI Choice & Draw Regression
**Date:** 2026-11-04  |  **Baseline:** RC5 S0 app  |  **S1 reference:** original v6.91.9

### Verified structural defect: Skill Class/Rank eligibility
- Original S1 card runtime: **128/128 Skills have explicit `legal_active_classes`**.
- S0 DEV45-derived RC5 runtime: **0/155 Skills carried `legal_active_classes`**, but all 155 have current official `requirement.printed_class_rank_requirements`.
- The preserved v6.91.9 `GL_RULES_RUNTIME.cardLegalForLineage()` treats an empty legal class list as unrestricted. This is a genuine S0 adapter defect, NOT a request to change the official card database.
- RC6 builds app-only eligibility caches from the **S0 printed Class/Rank rows and S0 official 45 Hero progressions**. No S1 card ID, name, cost, effect, damage or eligibility list is imported. No OSA files changed.
- Measured official class/rank matrix: 155 Skills x 45 Heroes = **6,975 cases**: **935 legal**, **6,040 illegal**. For the 27 Defense Skills specifically: 1,215 pairs, 166 legal and 1,049 illegal. Browser QA compared all 6,975 outcomes to the S0 printed rows: **PASS**.
- Both player/AI Response option paths were tested with **nonzero physical Mana**, ruling out the false-positive test where all options disappear only because no Mana is available. Wrong-lineage Warrior Parry on Mage: denied. Wrong-lineage Mage Mana Shield on Warrior: denied. Correct-lineage counterpart: offered. Mage Rank I denied Elementalist Ice Block, Elementalist Rank II allowed Ice Block and inherited Mana Shield.
- Neutral **Protection Items** remain neutral unless their own S0 instructions require a Class; the class restriction above is for **Skill Defense**, not a blanket Item restriction.

### Magic Compass selection UI
- The legacy fixed `repeat(7, 96px)` grid left unused horizontal room inside the 788px popup.
- RC6 retains the established 7-column list and popup, but lets the 7 thumbnails grow equally to fill their container (`repeat(7, minmax(0,1fr))`, tile width 100%).
- Chromium DOM/CSS fixture: 7 x 102px columns, grid width 762px, **unused right grid space 0px**, 14 sample tiles in two rows. No JavaScript page errors or missing assets. Fixture screenshot in this folder. **This is a layout test, not a full in-match Magic Compass transaction.**

### Market Bargain (from preceding issue)
- S0 EVT-002 has an empty row `text`, but current `s0_authority.printed_branches[].semantics.sourceExtractedParameters` confirms Draw 2.
- RC6 materializes one `draw_cards: 2` effect from the current S0 source recipe. In a Chromium-hosted genuine engine scenario, AI commits the card and Mana, player passes Response, AI hand gains 2 cards, Main Deck loses 2, card enters Discard. **PASS**. No double draw.

### Targeted RC6 browser QA
- S0 Class/Rank matrix + player/AI legal Response routes: **PASS**.
- RC5 S0 Target Selection QA: **13/13 PASS** after new class checks.
- Magic Compass 7-column width: **PASS**.
- Market Bargain actual AI draw + Response PASS: **PASS**.
- Chromium boot JS errors: **0** in these targeted runs.

### Unresolved / no false PASS
The following *older* self-tests still return failure on RC6, and must not be represented as PASS:
- `GL_V6919_MANA_COMMIT_RESPONSE_CANCEL_QA_SELF_TEST`: S1 Intercept response expectation (S0 Intercept trigger changed, so this fixture must be made S0-specific before treating it as gameplay evidence).
- `GL_PVP_V220_GAMEPLAY_UI_QA_SELF_TEST`: Magical Block / Venom response fixture (needs source-specific reproduction).
- `GL_LOCAL_AI_V534_TACTICAL_AI_QA_SELF_TEST`: Ring follow-up / Heal planner fixture (needs actual S0-legal setup check).
- `GL_LEGACY_RACIAL_TAUNT_QA_SELF_TEST`: Legacy resolver data mismatch.
- `GL_V648_AI_QA_SELF_TEST`: legacy Heaven Fury AI setup not matching expected planner.
- `GL_V647_CORRECTION_QA_SELF_TEST`: fails (inspect subcases and expected data).
- `GL_PHASE16_ELIXIR_LEGACY_IDENTITY_QA_SELF_TEST`: Legacy UI panel expected content missing in fixture.
- `GL_PHASE10_LEGACY_TARGET_PURIFY_RESULT_QA_SELF_TEST`: Purify + Bleed target fixture invalid/unavailable.
- `GL_PHASE5_LEGACY_ABILITIES_PATCH_QA_SELF_TEST`: Warrior Legacy ability fixture unavailable.

These are **open investigations**, not proof that every associated live S0 gameplay mechanic is wrong. Do not hardcode S1-specific names, card IDs or effects just to make an old S1 fixture green. Investigate each against its genuine S0 legality/trigger/hand state and actual UI before asserting a regression fix.

**Final Human-vs-AI browser match to normal Game Over remains UNVERIFIED.** This RC is not a production-final certification. No OSA, Deck Builder, or PvP sources changed.
