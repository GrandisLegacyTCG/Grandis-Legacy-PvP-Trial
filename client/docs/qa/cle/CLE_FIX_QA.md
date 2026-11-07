# VS AI Season 0 — CLE Stage 4/6 Authorized Fix QA

**Date:** 2026-11-05  
**Mode:** Staged application-only fix, no application version increase or release ZIP.  
**Base:** RC13 UI plus previously approved ARC/WAR/THF code fixes.  
**Authority:** OSA Season 0 DEV45 current printed data (DEV44 consumer) and official Player Rulebook v2.9; OSA itself remains READ-ONLY.

## Approved fixes

| ID | Card/system | Corrected implementation |
|---|---|---|
| CLE-01 | Purify (`S0-CLE-003`) | Source-backed Support cleanse handler despite empty derived `effect[]`. Require one allied living Hero with a negative Status before PLAY. If multiple negatives are present, select the specific Status *before* Mana. A successful 1-Mana commit removes exactly one chosen negative Status and sends Purify to Discard. Reject play without a legal status/target. |
| CLE-02 | Negative Status classifier | Recognize **Sleep** alongside Bleed, Burn, Freeze, Poison, Stun. Saint's Holy Rejuvenation and the existing Elixir negative-status picker now include Sleep. Invalid explicit status choices do not erase unrelated positive markers. |
| CLE-03 | Binding Light (`S0-CLE-012`) | S0 Defense Skill classification is literally `Defense`; route non-Ultimate Defenses into the existing nested `DefendSkill` counter-response path. Preserve exclusion of Ultimate Defense. Original Response payment and last-played-first-resolution architecture retained. |
| CLE-04 | Lun (`S0-CLE-026`) | Rank/Lineage-aware 20 BLOCK: Cleric Rank I Magical only; Bard Rank II and Maestro Rank III Physical **or** Magical. No new BLOCK permission against un-blockable attacks. |
| CLE-05 | God's Blessing (`S0-CLE-013`) | Hand-card CONDITION now selected and validated *before* Mana selection. Tentative selection and CANCEL perform no moves/payments. After Mana is successfully committed, the selected card physically goes to Discard before source resolution; Draw **exactly up to 3**, not a fourth incidental inferred Draw. AI auto-selects a legal other card and commits the same physical cost. A second identical God's Blessing copy can be selected as the other Hand card. |

## Chromium source-engine regression evidence

- `CLE_FIX_QA.json`: **23 / 23 focused assertions PASS; page JavaScript errors 0**. Includes paid Purify removal against every one of the six official Statuses, negative-only/no-target rejection, multi-status player choice before Mana, Saint Sleep cleanse, six Lun type/Rank combinations, Defense and nested counter-window routing, non-negatable Ultimate, God's Blessing cancel/commit/AI/duplicate-copy scenarios.
- Existing THF focused suite **35 / 35 PASS** and WAR suite **36 / 36 PASS** after CLE changes.
- ARC status stacks (all six, cap six), Sleep hit/wake, and 96 attack damage-type classifications still match the previous ARC regression checks (40 Magical/56 Physical; 0 classifications failed).
- Existing Season 0 self-tests: **Target 13 / 13**, **Lineage 6,975 combinations**, **Ultimate Tribute 30 / 30** PASS, page errors 0.
- `node --check` on `engine/shared-app/app.bundle.js`: PASS.

### Scope limits

These are focused browser-executed engine/DOM tests, including some click-like selection functions; not a full manually played Human-vs-AI game to Game Over. The nested Binding Light check proves option family and opening of the committed-response counter window; complete mouse-driven Attack → Defense → Binding Light PAY → underlying Attack continuation still deserves independent live confirmation. Other CLE cards/combos have not been exhaustively played end-to-end. The six-stage audit is ongoing and **not FINAL**. No OSA, rulebook, Deck Builder, PvP, or Season 1 code was modified.

### Pitfalls / preserve

- Sleep is a removable **negative Status** even though a Sleeping Hero cannot use Skills other than DODGE itself; an *allied* Cleric may remove Sleep from that Hero.
- `effect[]` may be blank for printed S0 cards; check the card's official printed text before declaring it nonfunctional or backfilling from S1.
- Purify must remove precisely one *negative* status, never blindly `shift()` the first status.
- Lun's incoming-type gate is class-row-sensitive. Keep Cleric Magical-only.
- Ultimate Defense cannot be Negated by Binding Light; do not generalize a Defense counter into blanket Ultimate negation.
- God's Blessing CONDITION selection belongs before payment; do not restore the obsolete post-Mana Hand picker or permit duplicate Draw handling.

**Next:** MAG Stage 5/6 audit only until approval to fix its findings; then EVT/ITM Stage 6/6, combined regression and a single later version/release decision.
