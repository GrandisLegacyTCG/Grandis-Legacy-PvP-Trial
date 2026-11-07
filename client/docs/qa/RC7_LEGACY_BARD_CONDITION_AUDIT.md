# RC7 — Defeat → Legacy + Bard/Maestro CONDITION audit
**Date:** 2026-11-04  
**Scope:** VS AI RC6 → RC7, targeted code correction and Chromium state probes. Not a full-playability certification.

## A. Confirmed RC6 bug: defeated Hero can remain at 0 HP without Legacy
`eligibleLegacyCardIdsForDefeatedHero` required `card.eligibility.base_class_family`, a v6.91.9/S1 compatibility field that does **not** exist on current S0 Legacy definitions. Every active starter's matching Legacy query returned an empty candidate list, so `applyDefeatCheck` could leave an original Hero face visible at 0 HP. This matches the screenshot symptom; the screenshot alone does not prove an exact prior attack sequence.

**RC7 correction:** keep the original Legacy transition/selection engine. Resolve the eligibility from the official S0 card text `LEGACY_REPLACEMENT: When your <Class> base class Hero dies`, validating `<Class>` against `class_group`, and use the already-existing explicit `eligibility.base_class_family` when present. No generic prefix-only guess or S1 card data fallback. Only `engine/shared-app/app.bundle.js` changed for this bug.

**Tests:** Original RC6 showed 0 candidate(s) for all six heroes inspected across two starters. RC7 checked five official starter presets × 2 sides × 3 formation Heroes = **30/30 found at least one compatible Legacy**, then tested player mandatory Legacy selection and AI automatic Legacy transition. Both transitions PASS; expected Legacy Deck decrements by 1, previous Hero is stored under Legacy for Revive.

## B. Bard / Maestro discard CONDITION — tested after return and shuffle

| Current S0 card | Required return from Discard | Handler probe | AI full PLAY |
|---|---|---|---|
| S0-ARC-028 Midnight Lullaby | 1 Zol + 1 Lun | PASS | PASS |
| S0-ARC-029 Swift Movement | 1 Lun | PASS | Defense Response UI not exercised |
| S0-ARC-030 Crimson Crescendo | 1 or more Zol | PASS (2 chosen via direct handler) | PASS (AI auto-selected 1) |
| S0-ARC-031 Resonance Burst | 1 Zol + 1 Vae | PASS | PASS |
| S0-CLE-028 Blessing of Accuracy | 1 Vae | PASS | PASS |
| S0-CLE-030 Blooming Harmony | 1 Lun + 1 Vae | PASS | PASS |
| S0-CLE-031 Grand Finale | 1 Zol + 1 Lun + 1 Vae | PASS | PASS |

**Result:** all seven `consumeS0DiscardCondition` handler scenarios physically remove the correct note card(s) from the Discard array and insert into the owner's Main Deck followed by `shufflePile`. Duplicate invocation returns 0, and invalid discard indices reject. Six legal AI played-card scenarios reached a real Mana payment and committed note-return action. A real **player choice → exact Mana PAY → effect** scenario for Blessing of Accuracy confirmed that Discard, Deck, and Mana do NOT change before PAY and then update on PAY. After return/shuffle a Draw may immediately draw the same returned note into Hand; this is expected behavior and is not a missed return.

**Not claimed:** a full manually clicked Response-UI scenario for Swift Movement has not been completed. Its shared discard/return logic was directly verified; Response timing/AI source rules need their own targeted browser test before complete coverage is claimed.

**AI observation:** Crimson Crescendo currently auto-returns only the minimum one Zol even if two or more are available. This is legal (at least one) but may be tactically suboptimal; no speculative change to the AI decision policy was made in RC7.

## C. Additional discovered RC6 bug: Blessing of Accuracy draws four instead of two
The existing runtime materializer already adds `draw_cards: 2` from the S0 printed row, then its S0-specific branch added a second identical `draw_cards: 2`. The existing generic `firstDrawCount` summed them to four. RC7 adds the source-specific entry only if no `draw_cards` descriptor exists. **AI and Player runtime checks now draw 2 cards**, consistent with DEV45. OSA unchanged.

## D. Known open validation
Older S1-specific self-tests for Intercept and Shield Bash/Dragon Scale still return failures on S0; determining outdated fixtures vs genuine regression remains open. One normal full match played via browser to Game Over is still **UNVERIFIED**. RC7 is a Release Candidate only.
