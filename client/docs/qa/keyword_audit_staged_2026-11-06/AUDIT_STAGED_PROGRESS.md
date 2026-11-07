# Grandis Legacy — VS AI Season 0
## Keyword / Status Audit — Staged Progress, No Release

**Date:** 2026-11-06  
**Immutable release baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**State:** Local **STAGED** working tree derived from RC24. **NO RC25, no ZIP, no version bump**, no modification to original RC24 archive or official OSA.  
**Rule authority:** Season 0 Player Rulebook v2.9 and official OSA Season 0 DEV45; existing S1 engine behavior is not card/rule authority.

## Important workflow correction

The preceding RC24 package was released too early, after only the first two of the seven planned keyword/status audit phases. The designer explicitly rejected such incremental RC packaging. From this session onward, all approved fixes remain in the **staging working tree** until the remaining audit, targeted regression tests, and final packaging gate are complete. The release pointer remains RC24, which does **not** contain the staged fixes described below.

## Confirmed issues and repairs staged

| # | Area | Confirmed RC24 fault / reproduction | Staged correction | Evidence |
|---|---|---|---|---|
| STAGED-01 | `INVINCIBLE` + existing Poison | A Hero with active **Grand Finale** `S0-CLE-031` or Rank III **Absolute Defense** `S0-MAG-031` lost 10 HP to opponent Poison on their own End Phase despite being INVINCIBLE. Baseline controlled state HP80 became HP70; older Mage defenses were already covered. | Recognize both current S0 INVINCIBLE attachments in the Poison-tick immunity path; Absolute Defense immunity only for Arcane Vanguard Rank III. Duration still decreases normally. | `INVINCIBLE_BEFORE_QA.json`, `INVINCIBLE_AFTER_QA.json` |
| STAGED-02 | `INVINCIBLE` + new non-Attack Status | Opponent **Wildfire** could add Burn, and **Freeze Bomb**/direct status could apply Freeze to an INVINCIBLE Hero. Attack-path Status was already protected; non-Attack status resolver was missing source-opponent immunity check. | Reject *new opponent-inflicted* Status in the shared nonattack status helper when protected by INVINCIBLE, preserving allied/self-inflicted Status such as Ice Block's self Freeze. | Before: 3/8 focused cases passed; after: **8/8 PASS**. |
| STAGED-03 | `MANA STEAL` physical conservation / capacity | When owner had 11 Mana cards in Pool and 1 in Deck, and opponent had >=2 in Pool, `MANA STEAL 2` removed 2 opposing physical cards but gained only 1 own Mana card. At own Pool12/Deck0, effect-only **Steal** was incorrectly playable. | Cap the number *before opposing Mana selection* by opponent physical Pool, own physical Deck, and remaining own Pool capacity. On resolution, remove up to that count and draw **exactly the number removed** from the owner's **own** Mana Deck. Refuse effect-only Steal when no physical exchange possible; preserve damaging Mana Absorption as playable. | `MANA_STEAL_DEEP_QA.json` 6/6; `MANA_STEAL_BOTH_SIDES_QA.json` **16/16 PASS**, PLAYER and AI. |

**Source changed in staging:** `engine/shared-app/app.bundle.js` only. No OSA, Deck Builder, PvP, card definitions, artwork, or shipped RC24 ZIP was changed.

## Complete planned inventory and honest coverage

Original seven-stage matrix contained **126 distinct S0 card identities**. Several cards appear in more than one phase. The original Status phase listed 44 identities, but **six were false positives**: `S0-MAG-020`, `022`, `023`, `024`, `026`, and `028` mention **MANA BURN**, *not the Burn Status*. They remain in the Mana Burn phase, leaving **38 genuine Status identities**. This is a correction to the **audit inventory**, not a mutation of official OSA card data.

| Stage | Scope | Distinct identities | Current verification level |
|---|---|---:|---|
| 1 | MELEE, RANGE, ALL OPPONENTS | 22 | Previously audited and retested on staged engine: **312/312 focused** target/commit checks. Other complex gameplay interactions still possible. |
| 2 | PIERCING, SURE HIT, BLOCK, DODGE | 38 | Previously audited and retested on staged engine: **111/111 focused** checks. |
| 3 | REACTION, REFLECT, INVINCIBLE | 13 | Source/handler survey and selected Response checks, plus INVINCIBLE repairs. No claim all physical response interactions exhaustively tested. |
| 4 | CONDITION, BUFF | 23 | Source/handler survey and selected legal-target/condition/expiry checks. No claim every atomic CONDITION cost/commit path is verified. |
| 5 | HEAL, REVIVE | 14 | Source/handler inspection, **6/6 selected helper assertions** including Bleed, full HP and HP cap. Full Revive-from-Legacy flows remain unverified by this round. |
| 6 | MANA BURN, MANA STEAL | 8 | Source/handler inspection; MANA BURN **20/20** source-branch/hit gating/aggregation checks; MANA STEAL **16/16** bilateral transfer/capacity checks. Normal UI payment and nested Response remain open. |
| 7 | Bleed, Burn, Freeze, Poison, Sleep, Stun | **38 actual** (was 44) | 59 printed Class branches inspected; 51 mention inflicted Status; three triggered effects (Poison Vial, Ice Block, Fire Wall) separately exercised **10/10 PASS** after correct passive handling. Comprehensive End Phase, immunity and ability interaction coverage remains open. |

Because stages overlap, stage-card counts cannot be added to obtain unique identities. The combined stage-3–7 base survey contains 87 distinct identities and **73/73 targeted assertions**; six audit-matrix warning entries were the false positives described above. Additional REACTION/CONDITION/BUFF focused QA: **54/54 PASS**.

**Test design correction, not a gameplay fault:** An initial Fire Wall fixture expected Burn duration 2 from Elementalist, but the same Hero's printed **Elemental Mastery** adds +1 Burn duration, so actual 3 was correct. Adjusted the fixture; do not change gameplay to force 2.

**Test limits:** Focused browser-executed engine probes use controlled states rather than one naturally completed Human-vs-AI match. JavaScript syntax PASS; reported Chromium page exceptions 0 in these scenarios. The older S1 historical regression hooks still contain some stale expectations and are not blanket S0 failures. The full normal game through Win/Loss/Draw, all combinations of 126 card identities and all nested Response/Attachment/AI tactical behaviors are **not proven**.

## Still open before a new release

1. Finish **card-by-card natural PLAY → payment/CONDITION → Response → resolution** verification, especially Status/Heal/Revive and high-interaction cases. Keep batches **<=40 identities**; after inventory cleanup, split 38 Status cards into two batches of **19**.
2. Independently reproduce/triage historical S1 test failures against S0 (without changing engine based solely on stale fixture expectations).
3. Confirm both player and AI choices through live browser UI, particularly blind Mana selection and multi-target Response; include complete match to terminal Win/Loss/Draw and Firefox UI pass.
4. Existing UI backlog: Legacy-style hover enlarged preview in Class Ability card selection. **Not implemented** in this audit.
5. Preserve source authority (OSA DEV45 read-only); resolve pre-existing Soul Charged Shot RANGE/lineage watch item with designer if needed.
6. Only after the full acceptance gate: update version and build **one** consolidated ZIP with matching `docs/TAKEOVER_NOTE.md`, clean folder structure and integrity check.

### Source / evidence artifacts

Local staged application tree: `/mnt/data/keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
QA proof files: `docs/qa/keyword_audit_staged_2026-11-06/` inside the staged tree.  
Standalone source diff against immutable RC24: `/mnt/data/keyword_audit/STAGED_KEYWORD_BUGFIX.patch`.


> **Subsequent 2026-11-06 correction:** Soul Charged Shot RANGE watch item is RESOLVED by designer: no printed RANGE on card; effective RANGE is from Marksman Sharpshooter / Grand Ranger Dead Eye passive. See `AUDIT_STAGED_FOLLOWUP.md`. Original unresolved note above is historical.
