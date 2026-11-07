# RC8 — Side-by-Side v6.91.9 vs Season 0 DEV45: UI / Keyword / Legality Audit

**Date:** 2026-11-04  
**Sources inspected:** original VS AI Season 1 v6.91.9; VS AI S0 RC7; OSA Season 0 DEV45 active consumer.  
**Status:** source regression fixes + targeted VM checks PASS; **NOT** proof of full normal human-vs-AI browser playability. No changes to OSA, Deck Builder, PvP, or printed card data.

## A. User-reported temporary hover preview layering

S1's engine has `#hoverCardZoom` (`z-index: 2147482000`) while S0's app UI also has three competing body-portal hover previews (battlefield `24000`, sidebar/Active Card `26000`, modal `25500`). These independent previews can stack over one another and obscure the newly hovered card (consistent with the screenshot). The RC8 fix normalizes transient preview priority to **2147483000**, promotes the active portal to the final body child, hides previous preview layers, and suppresses the second non-click `#hoverCardZoom` while an S0 transient preview is open. Pinned/click-selected preview is excluded from this suppression. Changes are isolated to `shared-app/app-runtime.js` and `shared-ui/battlefield-ui.css`.

**UI visual check:** Static CSS/DOM source check PASS. Actual Chromium pixel/interaction revalidation **UNVERIFIED**: browser navigation in this environment failed with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Do not call visual layout PASS yet.

## B. Keyword audit — all **16** official Season 0 keywords

The keyword inventory was taken from the actual 242-card S0 runtime data and checked against the existing app handler paths, rather than interpreting Rulebook alone.

| Keyword | S0 tagged cards* | S1 engine mechanism | RC8 side-by-side finding |
|---|---:|---|---|
| MELEE | 11 | Original attack legality/targeting; S0 direct opposite only | FIX: 11 cards use directly opposite lane, not ordinary adjacent AoA |
| RANGE | 7 | Original v6.91.9 range targeting | FIX: explicitly granted RANGE reaches outside AoA; condition mentioning Range alone does not grant keyword |
| PIERCING | 4 | Original unBLOCKable attack guard | REUSED; verified attackCannotBeBlocked recognises S0 PIERCING tags |
| SURE HIT | 11 | Original unDODGEable guard | REUSED; checks include Bard Resonance Burst and Aim Shot |
| BLOCK | 13 | Original Response/payment BLOCK reducer | REUSED; historical Shield Bash/Dragon Scale fixtures still need S0 retest |
| DODGE | 10 | Original Response/dodge reducer | REUSED; 3 Defense cards checked Response-only; Swift Movement full Response UI still pending |
| BUFF | 12 | Original setup/attachment and Exhaust flow | FIX: Blessing of Might/Wisdom valid Hero target, Enrage not enemy Status; Double Casting inherits special S1 exhaustion |
| CONDITION | 13 | Original condition legality + atomic PAY | FIX: recover 9 omitted CONDITION metadata flags; physical Bard discard return previously tested |
| REACTION | 5 | Original out-of-phase Response Window | REUSED; card-specific Event triggers must follow S0; old Intercept test obsolete |
| HEAL | 11 | Original HP cap/healing targeting | REUSED; Health Potion/Greater Potion target verified; Holy Blast/Slash heal separately handled on Hit |
| REVIVE | 3 | Original Legacy-mode restore path | FIX: Resurrection target recognized; Final Grit remains existing bespoke Legacy-target route |
| INVINCIBLE | 5 | Original lasting protection/attachment | FIX: official Grand Finale keyword flag recovered; full complex resolution not certified here |
| ALL OPPONENTS | 4 | Original attack set resolver / tactical all-opponent route | FIX: Flame Dragon’s Wrath and Venom Detonation recognized as all-target Attacks; Wildfire remains Tactical |
| REFLECT | 4 | Original connected-Hit and Response settlement | REUSED; 0-damage/NEGATE/reflect cornercases not exhaustive browser tested |
| MANA BURN | 6 | Original up-to-X Mana return | REUSED; full shortage/per-hit aggregation not exhaustive browser tested |
| MANA STEAL | 2 | Original return-opponent then draw-own Mana loop | REUSED; preserve S0 mana parameters; full browser test pending |

*Counts are runtime tag occurrences in the 242 non-Mana S0 records, NOT independent end-to-end tests for every card. The 7 RANGE-tagged attacking cards include `Soul Charged Shot`, whose conditional phrase references a Range Attack; that phrase does **not** independently grant the RANGE keyword. Original v6.91.9 has a **separate Charged Shot special-case** that is deliberately preserved for Soul Charged Shot per owner instruction to retain existing S1 execution; record as an inherited special behavior, not a new keyword rule.

## C. Verified source bugs fixed

1. **MELEE target selection:** `legalTargetLanesFor()` previously offered normal AoA for S0 MELEE, which could permit wrong lanes. Enforces facing/opposite lane.
2. **RANGE classification/targeting:** S0 printed `RANGE` was ignored by S1 subtype checking. Now use explicit printed RANGE declaration and existing range/target legality; avoid falsely treating the conditional phrase in Soul Charged Shot as keyword.
3. **ALL OPPONENTS attack resolution:** S0 cards `S0-MAG-019` and `S0-THF-018` missed the original S1 `All Target` classification. Route through existing all-target attack handler; non-Attack `S0-MAG-013` Wildfire remains separate.
4. **Missing keyword flags in derived S0 runtime:** **9 CONDITION declarations** and **Grand Finale's INVINCIBLE** are printed officially but absent from Stage3 runtime tags. Recover exact uppercase tokens from S0 card print text at app consumption, without changing OSA.
5. **Blessing of Might/Wisdom target:** Both official S0 Skill BUFF cards had empty normalized `effect` arrays; generic `isBuffCard()` failed to open allied Hero target. Bound to existing BUFF target selector.
6. **Resurrection target:** S0 `S0-CLE-015` had REVIVE printed but no normalized `revive` effect, so `isReviveCard()` failed. Bound to original Legacy target path. `S0-WAR-014 Final Grit` already has a *distinct* explicit Legacy handling path and is not converted to generic REVIVE.
7. **Enrage self-buff:** An extracted `inflict_status` descriptor incorrectly made `S0-WAR-013` a target-enemy Status Tactical. BUFF now excludes that misclassification; existing self-buff path retained.
8. **Hover/card preview:** Temporary overlay now takes precedence over other transient card presentations (as described above).

## D. Testing performed (newly run on patched RC8)

- **213 / 213** S0 runtime keyword/MELEE/RANGE/target/response/attack restriction assertions PASS in real `app.bundle.js` under Node VM. The unmodified RC7 baseline failed **49 / 185** original assertions. The corrected engine passed those same **185**, plus 28 additional targeted checks.
- Original S0 `GL_S0_RC6_LINEAGE_EFFECT_REGRESSION_QA_SELF_TEST`: **6,975 Skill×Hero legality checks PASS**; includes S0 Market Bargain Draw 2 regression PASS.
- Original S0 `GL_S0_TARGET_SELECTION_QA_SELF_TEST`: **13 / 13 PASS**.
- Ten isolated current/legacy targeted self-test hooks **10 / 10 PASS** in VM after the patch (including Stoneblood, Casting cancel on Defeat, Poison Vial multi-Hit, attachment, EXPRankUp, game over on Poison). See per-hook triage file.
- `node --check` on the two modified JavaScript modules: **PASS**.
- Original UI framework and original adapter modules compared at SHA level: **6 identical** and **7 changed** of 13 selected high-value source files. Report: `RC8_S1_V6919_VS_S0_SOURCE_DIFF.csv`.
- Card inventory produced for **all 242 non-Mana official S0 records**: `RC8_ALL_242_CARD_RUNTIME_INVENTORY.csv`.
- **119** records outside Hero have no normalized `effect[]` despite printed text; many correctly use the legacy handler/attack profile, so this is **not** equivalent to 119 bugs. It remains a risk reason to require effects-oriented scenario testing.

## E. Remaining risks — not concealed

- **Legacy self-tests:** 67 historical VM hooks evaluated in a previous audit: **10 PASS, 57 FAIL** under the old test fixture. Categorization: Older S1 fixture/source expectation: 12; PASS in Node VM: 10; Unresolved: needs S0 retest: 27; VM DOM fixture missing: 18. These failures must **not** be reinterpreted collectively as 57 defects or collectively dismissed as outdated: some use S1-only card IDs/deck sizes; some are DOM-dependent; others remain unexplained without an S0-migrated scenario. Individual evidence in `RC8_LEGACY_SELF_TEST_TRIAGE.csv`.
- Not all printed effects, 426 S0 effect branches, or repeated multi-target/nested Response sequences have been independently played through a browser. UI-induced bugs, timing, and special Status/REFLECT/MANA STEAL interactions could remain.
- **Double Casting** is printed BUFF but has an **existing S1 special Class-based Exhaust override** (Elementalist Exhaust, Elemental Lord not). It has been intentionally retained in RC8 rather than silently imposing a universal BUFF rule over the existing S1 handler. Designer decision required only if the intended S0 behavior conflicts.
- Full normal Human-vs-AI browser match until win/loss/draw is **NOT VERIFIED**; this remains a release gate. Existing engine simulations from previous checkpoint do not replace it.
- OSA data is unchanged. Historical Health Potion artwork-versus-consumer wording discrepancy stays documented separately under `docs/qa/OSA_DISCREPANCIES_PENDING_REVIEW.md` and is **not** silently 'corrected' here.

## F. Change scope and release recommendation

Changed runtime/application files: `engine/shared-app/app.bundle.js`, `shared-app/app-runtime.js`, `shared-ui/battlefield-ui.css`. Other files are inherited from RC7 except RC8 audit/QA documentation. **Status: RC8, keyword/target source audit PASS with explicit browser and old-fixture validation gaps; NOT FINAL.**
