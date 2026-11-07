# Grandis Legacy — VS AI Season 0
## Seven-Stage Keyword/Status Audit — Follow-up 03 (STAGING, no release)

**Date:** 2026-11-06  
**Immutable distribution:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Working source:** `/mnt/data/keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Authority:** OSA Season 0 DEV45 official printed card text and Player Rulebook v2.9; no OSA edits.  
**Packaging:** NO RC25, NO new ZIP, NO version increment.

## Confirmed NEW defect: Escape Arrow mandatory CONDITION (STAGED-04)

**Card:** `S0-ARC-003` — Escape Arrow (0 Mana, Defense).  
**Printed S0 effect:** `CONDITION: Discard 1 card from your hand. DODGE incoming Physical or Magical damage.`

**Before patch (real staged engine, controlled Chromium Response window):** With Escape Arrow as the *only* card in the defender's Hand, the card still appeared as an eligible Response and could proceed to Dodge without discarding an additional Hand card. The existing `responseExtraDiscardCount(rc)` included a one-off physical Hand-discard binding for Spectral Grappling Hook (`S0-ITM-012`), but not Escape Arrow. The OSA adapter did not otherwise populate the engine's additional response payment count for Escape Arrow. This is an app payment/eligibility integration bug, not a reason to modify the official card text.

**Authorized standing-work staged repair:** In `engine/shared-app/app.bundle.js`, `responseExtraDiscardCount(rc)` now returns one mandatory extra Hand discard for both `S0-ARC-003` Escape Arrow and the previously handled `S0-ITM-012` Spectral Grappling Hook. The existing response payment workflow performs the actual selection, physical discard, and Dodge; no card values, keyword text, or UI layout changed.

**After patch, tested in actual engine Response/PAY path:**
- Escape Arrow cannot be offered as Response without a different Hand card to pay its CONDITION.
- With an extra Hand card, choosing Escape Arrow enters the existing **Response payment choice** instead of bypassing payment.
- The Hand card is physically moved to Discard at PAY; Escape Arrow Dodges the incoming Attack. Its printed Mana cost remains zero.
- Spectral Grappling Hook's own discard-and-Dodge path still works (regression).

Pre-fix evidence: `FOLLOWUP03B_BEFORE_QA.json` (two failing expected assertions for Escape Arrow); post-fix: `FOLLOWUP03B_QA.json` (**25/25 PASS**).

## Broader focused checks in this session

| Scope | Checks | Result | Evidence |
|---|---|---:|---|
| REACTION: Tactical Adaptation against Event, Intercept against Physical Attack, Defensive Formation offered for Area Attack and class-family condition | 31 | **31/31 PASS** | `FOLLOWUP03_QA.json` |
| Response CONDITION: Escape Arrow and Spectral Grappling Hook Hand costs, Swift Movement Lun from Discard, cancel-before-PAY rollback, actual Dodge | 25 | **25/25 PASS after STAGED-04** | `FOLLOWUP03B_QA.json` |
| Genuine Defeat → mandatory Legacy selection → Revive using Resurrection (Priest / Saint) or Final Grit (Gladiator), with HP, Mana, exhaustion, cleared Poison and Legacy card return | 24 | **24/24 PASS** | `FOLLOWUP03C_QA.json` |
| Defensive Formation 20/40 area damage reduction, distinct vs repeated base-Class compositions, actual Response payment and damage through area-sequence continuation | 10 | **10/10 PASS** | `FOLLOWUP03D_QA.json` |
| Existing CONDITION/BUFF and other focused routes rerun | 94 + 20 + 10 | **124/124 PASS** | existing `REMAINING_AUDIT_QA.json`, `REACTION_REVIVE_QA.json`, `STATUS_SPECIAL_QA.json` |

**90/90 current new-probe assertions PASS.** JavaScript `node --check` PASS; Chromium page errors **0** in all four new probes. The 124 other assertions are reruns, **not 124 newly created scenarios**. Multiple assertions may examine the same card/transaction: these are assertion counts, not 90 unique cards.

### Test-design caveats, not bugs

- Some early exploratory probes tried manually committing an `AI` Response while forcing human-vs-human state. The VS AI UI ownership gate rejected that synthetic manual interaction. Final payable Response cases use actual **PLAYER defense against AI attack**; AI cases in these probes are only options/legality where appropriate. Separate prior AI-side Blessing of Divinity and Flashpowder tests remain their own evidence.
- A first Defeat→Legacy fixture expected an immediate Legacy transition for a human-owned Hero, but the correct rule/UI requires a **mandatory Legacy choice**. The final fixture explicitly selects and confirms that choice. Final Grit also requires a coherent defeated **Gladiator/Conqueror**, not merely a rank-I Warrior. No code was changed for either fixture issue.
- Area attacks can be represented as **sequential multi-target windows** (`multi_sequence`), not necessarily one `affected_lanes` array. The corrected Defensive Formation fixture checks the actual area sequence, Response payment, and each lane's HP result; no engine alteration was necessary.

## Cumulative staged issue ledger

1. INVINCIBLE: existing opponent Poison tick incorrectly reduced HP — fixed in staging.
2. INVINCIBLE: opponent non-Attack effects could inflict new Status — fixed in staging.
3. MANA STEAL: opposing Mana removal could exceed receiver's physical capacity — fixed in staging.
4. Soul Charged Shot: removed redundant intrinsic targeting exception; RANGE permission comes from Marksman / Grand Ranger passive — corrected in staging per designer ruling.
5. **Escape Arrow: mandatory one-card Hand discard on Defense Response bypassed — fixed in this session (STAGED-04).**

All staging-only changes are in `engine/shared-app/app.bundle.js`. Cumulative diff versus immutable RC24: `/mnt/data/keyword_audit/STAGED_KEYWORD_BUGFIX.patch`.

## Still open before the requested consolidated release

- Complete remaining card-specific BUFF consequences during natural turn progression, remaining CONDITION and REACTION cross-products (including more than two Response levels and Ultimate exceptions), broader Status + End Phase interactions and more human-facing mandatory modal paths.
- Prove AI decisions in ordinary games rather than just controlled commits. Perform a **normal human-vs-AI browser match to real Win/Loss/Draw** (not Surrender) and Firefox verification.
- Complete UI backlog: **Legacy-style card hover enlargement for Class Ability card selections** (not yet implemented).
- Keep tests in batches of **no more than 40 unique card identities**. Do **not** create a new RC or distribution ZIP until audits, integration regression and acceptance are complete.

**Evidence location:** All four current QA JSON files plus before-fix evidence are stored under staged `docs/qa/keyword_audit_staged_2026-11-06/`. Probe source and runners reside under `/mnt/data/keyword_audit/` outside the distributable app folder. `docs/TAKEOVER_NOTE.md` receives the same decision and bug/fix accounting.
