# Grandis Legacy — VS AI Season 0 | 7-Stage Keyword/Status Audit — Follow-up 04

**Date:** 2026-11-06  
**Immutable release baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Existing staged working source:** `keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Authority:** OSA Season 0 DEV45 official card print + Player Rulebook v2.9 + designer rulings.  
**This session:** Audit-only. **No gameplay code, official OSA, RC archive, ZIP, or version bump was made.** Previously staged fixes are preserved.

## Scope: BUFF consequences and Status across owner End / next turn

Ran a NEW source-backed Chromium engine test fixture against the actual staged `app.bundle.js`. It performs normal `commitPlayedCard()` payment/activation for the noted buffs, then invokes the same authoritative `resolveEndPhaseCleanupForSide()` and `removeStartOfTurnTargetPreventionForSide()` handlers used by the application. Attack damage uses `currentClassDamage()`; status damage uses real `applyResolvedAttackDamage()` and End Phase status cleanup. PLAYER and AI are each exercised in a coherent controlled state.

| Card / mechanic | Printed S0 behavior and checked consequence | Finding |
|---|---|---|
| `S0-CLE-004` Blessing of Might | +20 Physical Attack to chosen Hero this turn, not Magical; attachment held until owner's End, then removed and discarded | PASS both sides |
| `S0-CLE-005` Blessing of Wisdom | +20 Magical Attack this turn, not Physical; expires and goes to Discard at owner End | PASS both sides |
| `S0-CLE-018` Wings of Valor | Priest +20, Saint +40 Attack damage to **all allied Heroes** for Physical and Magical Attack; effect ends at owner End | PASS both sides, both ranks |
| `S0-MAG-022` Aether Infusion | Spell Blade turns own Physical Attack into Magical through **end of next turn**, including surviving first owner End then expiring at second End | PASS both sides; MANA BURN effect beyond this typing/duration was tested separately in earlier probes |
| `S0-EVT-005` Last Resort | Requires only one active Hero; double Attack damage for **two turns**, including next owner's turn, then restores normal damage | PASS both sides; opponent Reaction window explicitly passed before measuring BUFF |
| `S0-MAG-030` Invincible Stance | Prevent existing Poison damage while INVINCIBLE, but advance Poison duration; protection expires at owner Draw; remaining Poison damages next owner End | PASS both sides, staged protection fix preserved |
| Poison, Burn, Sleep | Poison ticks exactly 10 each owner End then duration decreases; Burn does not tick at End, adds 10 only when Attack actually deals damage; Sleep expires when duration reaches 0; Burn duration reapplication caps at 6 | PASS both sides |
| Burn + BLOCK | 20 Physical Attack with Burn: unblocked 30 HP damage; fully BLOCKed 20 Attack 0 HP damage and 0 Burn extra; Burn duration not consumed by Attack | PASS both sides |

### QA accounting

- **100/100 focused assertions PASS** in Chromium for this set, **0 page JS errors**, no fatal. This is an assertion count, **not** 100 distinct cards or 100 full games.
- **312/312** Stage 1 MELEE/RANGE/ALL OPPONENTS focused regression assertions PASS on current staged source.
- **111/111** Stage 2 PIERCING/SURE HIT/BLOCK/DODGE focused regression assertions PASS.
- `node --check` on the staged engine bundle PASS.
- This run exercises **9 identifiable Main Deck card IDs** (`S0-CLE-004`, `S0-CLE-005`, `S0-CLE-018`, `S0-MAG-022`, `S0-EVT-005`, `S0-MAG-030`, `S0-WAR-001`, `S0-MAG-003`, `S0-THF-001`), so it stays under the designer's maximum 40 cards per group.

### Invalid early QA assumptions — **not game bugs**

First run showed six apparent failures. The fixture initially reapplied Burn *after* its existing duration had expired (expected 6 instead of correct 4), and manually registered INVINCIBLE during End Phase then tried to expire it without moving the fixture's phase to the next Draw. Runtime's creation-checkpoint guard correctly refused that artificial early expiry. The fixture was corrected to reapply Burn while duration remained, attach during Deploy, advance to End, then next Draw. The corrected fixture passed 66/66 before extension.

Second extended run showed six apparent Last Resort failures: the fixture measured damage before the normal Event opponent REACTION window had been passed. After resolving the proper `incoming_card` Response window using PASS, the effect activated and all **100/100** final assertions passed. **No engine change was justified by these invalid fixture states.**

### Bug/fix ledger

**New confirmed gameplay bug in follow-up 04: 0. New code fixes in follow-up 04: 0.** Existing five staged issues remain:
1. Opponent Poison damage ignored INVINCIBLE — fixed in staging.
2. Opponent non-Attack Status bypassed INVINCIBLE — fixed in staging.
3. MANA STEAL exceeded own physical receiving capacity — fixed in staging.
4. Soul Charged Shot no longer carries a redundant unconditional RANGE bypass; Marksman/Grand Ranger passive supplies RANGE — corrected in staging per designer.
5. Escape Arrow mandatory Hand-discard CONDITION was bypassed — fixed in staging.

### Remaining acceptance and audit work

- More card-specific BUFF cross-products under real UI action sequencing (including ability follow-up choices, expired benefits and multi-attachment interactions).
- CONDITION: finish all affected card identities and real mouse-driven modal selection/cancel/payment; REACTION: 3+ nested Responses, Ultimate exceptions and payment both sides.
- Status: opponent non-Attack status, mixed Status interactions and real turn/UI validation beyond these selected fixtures; test ordinary match AI decisions rather than constructed choices.
- Complete at least one **normal** human vs AI browser game to real Win/Loss/Draw without Surrender, then Firefox testing.
- Pending UI backlog: **Legacy-style enlarged hover preview** for Class Ability card-selection overlays — not yet implemented.
- **No new RC or distributable ZIP** until the designer-requested full audit, fixes, integration QA and consolidated packaging have been completed.

**Evidence:** `docs/qa/keyword_audit_staged_2026-11-06/FOLLOWUP04B_BUFF_STATUS_QA.json`. Reproducible test source `/mnt/data/keyword_audit/followup04_buff_status_probe.js` and runner `followup04b_runner.py` are outside the app's distributable root.
