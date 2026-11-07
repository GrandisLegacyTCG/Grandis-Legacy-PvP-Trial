# Grandis Legacy — VS AI Season 0 | Keyword/Status Audit — Follow-up 05

**Audit date:** 2026-11-06  
**Immutable distributable baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Tested cumulative staging:** `keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Source authority:** OSA Season 0 DEV45 (current DEV44 consumer exports), Player Rulebook v2.9, authorized designer rulings.  
**Action this session:** Investigated additional previously-open REACTION and CONDITION/Status/Ultimate cases; **no new application or OSA code changes, no version increment, no release ZIP**.

## New direct Chromium test coverage (constructed legal states; not normal-match acceptance)

| Test set | Assertions | Detailed tested behavior | Outcome |
|---|---:|---|---|
| Four-depth REACTION counter chains | **109/109 PASS** | Freeze Bomb → 1, 2, 3 or 4 sequential Flashpowder Bomb counters, testing both initial attacker sides; actual response payment/discard, continuation order, original Freeze applying iff parity permits it, 12-physical-Mana conservation, and window closure. Also tests paid Tactical Adaptation counter against non-Ultimate Blessing of Might when PLAYER is responder. | No reproduced defect |
| CONDITION / frozen target | **80/80 PASS** | Permafrost denied without Freeze, zero Mana loss on denial, permitted with Freeze, Damage by Elementalist and Elemental Lord (+10 passive Magical Attack bonus at Rank III), and DODGE unavailable against Frozen Hero. Also source-backed atomic physical Return/PAY for Midnight Lullaby, Resonance Burst, Blessing of Accuracy, and Grand Finale on both sides; required notes absent → denied; committed notes removed from Discard; counted Mana costs; targeted Sleep and Grand Finale INVINCIBLE; Response closures. | No reproduced defect |
| Ultimate exception / defense / real-AI reactive cancel | **22/22 PASS** | Confirm 15 unique Ultimate identities; Double Casting (Ultimate Tactical) cannot be canceled by Tactical Adaptation; Absolute Defense (Arcane Warrior/Vanguard) offered as Defense, 5-Mana PAY, cannot be countered by Binding Light; real VS AI-mode AI Tactical Adaptation successfully counters ordinary non-Ultimate Blessing of Might. | No reproduced defect |
| **Combined new** | **211/211 PASS** | Counts are individual test assertions **not** 211 distinct cards or full playthroughs. Affected source-card identity count is below 40. | No new bug |

**Technical QA:** All three probes ran in headless Chromium loading the actual staged engine (inline-loaded index and asset routes). Zero reported JavaScript page errors. `node --check` on staged `app.bundle.js` PASS. Test evidence is saved as the three `FOLLOWUP05_*_QA.json` files under this folder. Test scripts/runners live outside the distributable app folder: `/mnt/data/keyword_audit/followup05_*_probe.js` and matching `*_runner.py`.

### Invalid initial fixture assumptions, explicitly corrected before reporting

- **Elemental Lord Permafrost:** Expected 100 from the card's own Rank III printed damage, but actual **110** incorporates Elemental Sovereignty's separate **+10 Magical Attack** passive in canonical S0 Hero source. After correcting expected total to 110, both PLAYER/AI scenarios PASS. This is not a game bug.
- **Artificial PvP-mode AI responder:** An initial diagnostic forced the AI side into `pvpHumanVsHuman=true` and manually tried to pay a 3-Mana Tactical Adaptation with human-style controls; this is not a valid VS AI-mode AI payment scenario. The test was replaced by (a) PLAYER-as-responder click/payment-engine test in synthetic PvP mode, and (b) a separate `pvpHumanVsHuman=false` **real AI-side** committed Tactical Adaptation test, which PASSED. No VS AI bug is inferred from the invalid mode fixture.

## Cumulative fix ledger, unchanged from previous staged sessions

1. Opponent Poison ticks did not respect active INVINCIBLE — staged fix present.
2. Opponent non-Attack Item/Tactical Status bypassed INVINCIBLE — staged fix present.
3. MANA STEAL removed opponent Mana beyond the source owner's physically available receiving capacity — staged fix present.
4. Soul Charged Shot previously used an unnecessary intrinsic RANGE exception rather than Marksman/Grand Ranger passive — staged correction present.
5. Escape Arrow mandatory discard-1-from-Hand CONDITION on Response was bypassed — staged fix present.

**New confirmed bugs this session: 0. New fixes this session: 0.** No previously released ZIP changed.

## Acceptance still open

- Full **13 CONDITION** identities through **normal mouse UI** including CANCEL, exact Mana payment, delayed effects, shuffle, response interruption. Current test covers a targeted subset, not blanket 13/13 end-to-end.
- Three-plus level countering has now been tested in an isolated constructed response state; it is not evidence for 3+ nested Responses in a natural Human-vs-AI match, or for all possible Reaction Card families/targeting.
- Extend cross-Keyword Status, attached BUFF, AI decision / card-use sequencing, multi-target Response and Hero/Legacy edge cases with legal normal state progression.
- At least one full, normal Human-vs-AI match to Win/Loss/Draw screen **without Surrender**, and Firefox / real-hosted/UI scroll/responsiveness checks.
- Pending UI backlog: Class Ability selection card enlargement on hover, matching existing Legacy-style popup.

**Release policy:** Keep RC24 as the last distributable. Preserve staged changes and tests, complete audit/combined QA first; package a single new RC only after the designer-requested acceptance work is complete.
