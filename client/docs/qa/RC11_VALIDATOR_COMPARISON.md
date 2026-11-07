# RC11 — Validator and Double Casting Compatibility

**Date:** 2026-11-04  
**Baseline:** Original VS AI Season 1 v6.91.9 compared to S0 RC10.  
**Authority:** OSA Season 0 DEV45 and current S0 card print; S1 supplies only existing handler mechanics. No OSA changes.

## Confirmed causes and fixes

1. **Full-HP Healing** — the existing `legalPlayStateFor` checks cost/phase/source but did not reject plays with zero eligible healing recipients; `legalTargetLanesFor` already rejects full-HP/Bleed single targets only at selection time, and all-Hero healing has no target picker. **This preplay gap also exists in the actual S1 v6.91.9 baseline** (demonstrated using Health Potion and Sanctuary with an eligible active Hero and sufficient physical Mana). It is an application validator issue, not an OSA source defect. RC11 now prevents pure targeted and all-Hero Heal when all allied active Heroes are full HP, or all potential recipients are blocked by Bleed; applies symmetrically to PLAYER and AI. The shared commit validator calls this check again. Hybrid Attack+Heal remains playable as an Attack even if all allies are at full HP. Likewise independent defensive effects are not blocked by the heal-only condition.

2. **Double Casting Rank II (`S0-MAG-018`)** — RC10 still used S1-specific `5 Mana / next-turn / Exhaust` behavior. Current S0 DEV45 Elementalist Rank II row reads `BUFF MANA COST +2 This turn, your Magical Attack counts twice on target(s) of your choice.` It has printed cost **1**, so effective Rank II cost is **3**, not S1's 5. Rank III has no surcharge (cost **1**). Both rows have `BUFF` and `This turn`: neither changes Ready/Exhausted state, and both attach for the current owner turn and expire at its End Phase if unused. An eligible Magical Attack resolves with two separate Response windows and can select a different legal target on the second activation, using the existing v6.91.9 mechanism. AI planning is adjusted to reserve a same-turn follow-up rather than mistakenly waiting until the next round.

## Checks executed in Chromium's real JavaScript engine (script-injected source; not a complete match)

- **RC11 targeted checks: 9/9 PASS**, with zero page JavaScript errors in this test. Checks include both sides full-HP heal gating for 8 cards, damaged/Bleed legality, Heal All, Attack+Heal exception, both Double Casting class cost/ready/expiry branches, actual Rank II PLAY/payment/Attachment, two separate Attack Response resolutions and AI same-turn planning. One Fireball case expected 70 total damage because Burn adds +10 to the second connected hit; gameplay produced 70 and Double Casting was consumed correctly.
- `GL_S0_TARGET_SELECTION_QA_SELF_TEST`: **13/13 PASS**.
- `GL_S0_ULTIMATE_TRIBUTE_QA_SELF_TEST`: **30/30 successful commit cases**, 15 cards on PLAYER + AI.
- `GL_S0_RC6_LINEAGE_EFFECT_REGRESSION_QA_SELF_TEST`: **PASS, 6,975 Skill/Hero combinations**.
- **Not all historical self-tests pass:** `GL_V6919_MANA_COMMIT_RESPONSE_CANCEL_QA_SELF_TEST` still fails at old Intercept response fixture; `GL_V510_DOUBLE_CASTING_QA_SELF_TEST` fails in a historical first-window fixture; `GL_V642_FINAL_STABILITY_HERO_COMPONENT_QA_SELF_TEST` expects S1's 30 Heroes vs S0's 45. These failures remain listed for S0-aware triage, **not** claimed to be new gameplay bugs or PASS. RC11 targeted same-turn real Double Casting resolution succeeds.
- **Full normal Human-vs-AI UI game through Game Over remains UNVERIFIED.** Manual production-browser visual verification is not asserted.

## Verification

Run from extracted app root: `python docs/tools/rc11_validator_qa.py` (requires Chromium `/usr/bin/chromium` and Playwright in the verification environment). This executes bundled browser JavaScript including targeted test injection; does not alter the shipped gameplay engine.

**Unchanged:** Main game engine architecture, S0 card data, artwork, OSA DEV45, Deck Builder, PvP, and overall UI design.
