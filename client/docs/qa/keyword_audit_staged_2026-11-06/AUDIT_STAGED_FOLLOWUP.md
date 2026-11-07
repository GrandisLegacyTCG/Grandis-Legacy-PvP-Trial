# Grandis Legacy VS AI Season 0 — Keyword/Status Audit: Follow-up (Staging Only)

**Date:** 2026-11-06  
**Immutable packaged baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Current working copy:** `/mnt/data/keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Release policy:** **NO new RC, no ZIP, no version bump.** The RC24 file is unchanged. OSA Season 0 DEV45 remains read-only. This builds on the previously staged three INVINCIBLE/MANA STEAL repairs; those were not shipped in RC24.

## Designer ruling: Soul Charged Shot (S0-ARC-018)

Designer confirmed: **Do not add RANGE keyword to Soul Charged Shot.** The ability to target outside normal AoA comes from the **Marksman Class Ability — Sharpshooter** (and is retained at Grand Ranger through **Dead Eye**), because Soul Charged Shot is a **Physical Attack**. The conditional text on Soul Charged Shot doubles damage when the Attack actually occurs as a Range Attack; the condition is not an independent grant of RANGE.

**Staged source correction:** In `engine/shared-app/app.bundle.js` > `legalTargetLanesFor()`, removed the redundant unconditional `isChargedShotCard(c)` targeting bypass. Range extension now depends on `attackHasRangeForSource(c,sourceHero)`, derived from the current S0 Hero Class Ability (or a printed RANGE keyword). No printed card, cost, passive definition or S0 OSA was changed.

**Verified in Chromium:** 12/12 checks PASS: Soul Charged Shot has no intrinsic RANGE; Archer Rank I does not acquire the passive / cannot use the Rank II card; Marksman Rank II and Grand Ranger Rank III each gain effective RANGE from their Class Ability, can target RIGHT from LEFT, and get 2× Attack damage outside normal AoA relative to an otherwise comparable in-AoA target. Stage-1 312/312 and Stage-2 111/111 focused regressions still PASS after this source change. **This is a targeting source/contract cleanup, not evidence of a previously user-observed incorrect hit.**

## Deep audit: HEAL / REVIVE (14 identities)

New controlled, browser-executed *actual card commit*, physical Mana PAY and resolution checks for **13 of the 14** HEAL/REVIVE identities (including all printed class branches) on both PLAYER and AI: **128/128 PASS**. Checks cover pre-play/commit legality, actual Mana card consumption, HP effects and/or REVIVE HP + Exhaust state. Tested Holy Blast and Holy Slash damage-triggered healing, direct healing, all-Hero healing, item healing and Phoenix Feather, Priest/Saint Resurrection, and Final Grit. **Blooming Harmony** uses its physical Lun + Vae CONDITION precommit (not a fabricated free cast). Final Grit fixtures use coherent Gladiator lineage + Legacy snapshots.

The 14th, **Blessing of Divinity (S0-CLE-025)**, is a Defense/Response Ultimate and cannot be judged by a normal PLAY route. Separate actual PLAYER Response → payment → resolve checks for Paladin and Crusader: **10/10 PASS**. Paladin consumes 6 Mana and gives INVINCIBLE to allies without the extra heal; Crusader consumes 4 and heals allies by 20 as printed. The constructed AI-side direct Response fixture did not complete its manual payment flow under the human-vs-human harness; **AI-side full Response PAY is NOT claimed verified by this round**. Prior RC23/RC24 AI tests are not a substitute for this new deep test.

Early versions of the new HEAL/REVIVE QA fixture generated apparent failures: missing required Bard notes and mismatched Gladiator Legacy lineage. Correcting the *fixtures*, not the engine, yielded 128/128. These were **not gameplay defects**. Separate Source Class healing modifiers and Saint cleanse-choice UI are not comprehensively tested by the new 128 cases.

## Status phase: two batches, 19 identities each

The corrected official-status inventory contains **38 distinct identities**. Direct connected-attack STATUS handler checks were executed in two fixed 19-identity batches, per the designer's <=40-card limit:

| Status batch | Identities in inventory | Explicit connected `Inflict` branches, across PLAYER/AI (including DODGE negative tests) | Result |
|---|---:|---:|---|
| A | 19 | 84 assertions; 8 non-attack / reference-only printed branches excluded from *this route* | **84/84 PASS** |
| B | 19 | 92 assertions; 7 non-attack / reference-only printed branches excluded from *this route* | **92/92 PASS** |

The test asserts that a connected Attack applies its printed Status, while a Dodged Attack does not. For Ultimates, the fixture uses the **specific owning Hero progression**, not simply the first Hero with the same Class name. The initial 16 ownership failures were *invalid test fixtures*, fixed before reporting; no engine changes were made because of them.

**Coverage limitation:** The 15 excluded *branch cases* include non-Attack effects (Freeze Bomb, Ice Block, Wildfire, Dazed, Poison Vial, etc.) and cards that mention a status as a prerequisite/multiplier rather than inflicting it (e.g., Permafrost, Venom Sovereign, Venom Detonation). These need their appropriate distinct routes. Prior special-path QA already covered Poison Vial, Fire Wall and Ice Block 10/10 in selected cases; that is not equivalent to full normal-match UI coverage. Status duration, expiry, cleansing, nested Response and invincibility cross-product tests remain open.

Additional staged repeat: Stage 3–4 source/handler focused checks **54/54 PASS**; no page JavaScript errors in the new Chromium fixtures.

## Confirmed defects in this staging cycle

New user-informed **source-of-RANGE permission correction** above: fixed in staging. **No additional card-effect gameplay defect was confirmed in the new HEAL/REVIVE or connected-hit Status probes.** Previously confirmed INVINCIBLE (2 groups) and MANA STEAL (1 group) defects and their staged fixes remain as documented in the prior `AUDIT_STAGED_PROGRESS.md`.

## What still blocks a new RC

1. Complete real/choice UI testing of 14th Heal/Revive Ultimate on AI Response payment, and targeted stronger validation for printed exact Heal values and Saint follow-up cleanse.
2. Test other Status routes (not `Inflict` from connected Attack), entire CONDITION discard-choice + atomic PAY flow, REACTION nesting, lasting BUFF expiration, and full Revive through legitimate Hero defeat/Legacy transitions. Keep batches <=40 identities.
3. Inspect AI strategic behavior and complete a normal Human vs AI match through actual Win/Loss/Draw (not Surrender); Firefox browser validation.
4. Preserve the separate approved UI backlog **Legacy-style hover enlarged preview on Class Ability card choice**; it has **not** been implemented.
5. After all audit/QA acceptance criteria, build **one** consolidated distribution ZIP/version. Do not package RC25 or bump the version prematurely.

### Machine-readable focused evidence

Staged app `docs/qa/keyword_audit_staged_2026-11-06/` now also includes `MARKSMAN_PASSIVE_QA.json`, `HEAL_REVIVE_ACTUAL_COMMIT_QA.json`, `BLESSING_RESPONSE_QA.json`, `STATUS_CONNECTED_HIT_BATCH_A_QA.json`, `STATUS_CONNECTED_HIT_BATCH_B_QA.json`. The test probes/runners are retained in `/mnt/data/keyword_audit/` outside the release package for reproducibility. The cumulative source diff relative to original RC24 is `STAGED_KEYWORD_BUGFIX.patch` (no new ZIP).
