# Grandis Legacy — VS AI Season 0
## Keyword/Status Audit: Remaining-Path Follow-up 02 (Staging Only)

**Date:** 2026-11-06  
**Immutable distribution baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Working tree:** `/mnt/data/keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Official card authority:** OSA Season 0 DEV45; rules: Player Rulebook v2.9.  
**Release decision:** **No new RC, no ZIP, no version change**. No source/engine/gameplay changes were made in this follow-up. The four earlier staged corrections (two INVINCIBLE areas, MANA STEAL capacity, and the Soul Charged Shot/Marksman RANGE source path) are retained, but remain **unreleased**.

### New deep checks

| Focus | Executed in Chromium (controlled source-backed state) | Assertions | Result |
|---|---|---:|---|
| CONDITION, non-Attack Status, BUFF life cycle | Physical X Cross Slash hand cost and Mana commit, missing-cost rejection; physical Lun+Vae Return-to-Deck for Blooming Harmony; God's Blessing / Bard pre-commit cancel without Mana or zone mutation; Freeze Bomb, Dazed and Wildfire actual card commit and Response PASS; five Attachment BUFF life cycles via active authority checkpoints for PLAYER and AI | 94 | **94 PASS** |
| REACTION counter flow and real Defeat → REVIVE | Flashpowder Bomb cancels Freeze Bomb with paid costs, both directions; nested counter-response with a second Flashpowder and underlying Item continuing; defeat a coherent Warrior Hero to a matching Legacy then revive through Phoenix Feather, clearing old Status and restoring Legacy Deck | 20 | **20 PASS** |
| Blessing of Divinity Response, expanded to AI | Paladin (6 Mana) and Crusader (4 Mana), actual Response-payment branch, Invincible and Rank III Heal; 10 previously verified PLAYER cases and 10 additional AI-side cases | 20 | **20 PASS** |
| Saint Holy Rejuvenation follow-up | Heal creates an *obligatory* choice when the healed Hero has two negative Statuses; chooses and removes one only; AI auto-choice does not leave a pending modal; tests with PLAYER and AI controlled sides | 16 | **16 PASS** |

**Total:** 150 assertions, 150 PASS across the four current JSON result files. Note that 10 of the Blessing Response cases had already been checked in the earlier follow-up; **140 are additional assertions** (94 + 20 + 10 + 16). `node --check` PASS on current staged `engine/shared-app/app.bundle.js`; zero Chromium page JS errors in these runs.

### Meaning and proof boundaries

1. These assertions execute actual application engine functions in a Chromium page with an injected DOM, physical card/Mana lists, commit/response/transition functions, and source-backed fixtures. They **do not** represent completed normal mouse-driven Human vs AI matches or full Firefox verification.
2. The BUFF tests confirm the authoritative Attachment is removed at its specified later checkpoint and the physical card reaches Discard. They do **not** prove all ongoing damage/targeting modifiers for all 12 BUFF cards in every combo.
3. The two-level counter test exercises a nested Flashpowder response and restoration of the underlying Item. It does **not** exhaust all five REACTION keyword identities, their combination with every Defense and Ultimate, or more than two counter levels.
4. Phoenix Feather's roundtrip uses a legitimate `applyDefeatCheck` transition from a coherent Rank I Warrior fixture into its Legacy slot and the standard item commit to revive; other REVIVE ranks and real mouse choice remain separate follow-ups. The earlier 128/128 HEAL/REVIVE commits in the preceding report continue to stand as focused evidence.
5. AI Blessing Response runs the AI payment branch (a controlled test switches the fixture out of human-vs-human before accepting the Response). This does not test whether the live AI *chooses* the card optimally in natural play.
6. The Saint auto-cleanse behavior is specifically AI-owned; PLAYER retains a choice in normal AI matches. An early test expecting PLAYER to auto-cleanse was an invalid fixture assumption, corrected without engine changes.
7. An early local test mistakenly evaluated non-Attack status before its Reaction PASS, used Mage Rank I for Elementalist-only Wildfire, and counted an Attachment's creation checkpoint as an expiration checkpoint. All were invalid fixture assumptions corrected before final results; **not new engine bugs**.

### Bug accounting for this follow-up

**New confirmed bugs:** none in the tested routes.  
**New fixes applied to game code:** none; existing staged fixes remain unchanged.  
**Unresolved suspected problems promoted to confirmed:** none.  
**No OSA edits. No UI feature edits. No release package rebuilt.**

### Still required to finish the full seven-stage audit

- Expand actual CONDITION + payment + cancel testing to the remaining CONDITION card identities (13 total) and RESPONSE CONDITION (especially Bard Swift Movement / Escape Arrow / Spectral Grappling Hook), with physical zone conservation and insufficient-Mana negative cases, both sides.
- Test remaining REACTION types (Tactical Adaptation, Intercept, Binding Light, Defensive Formation) through complete nested Response PAY, counters, and effect resolution, including correct non-NEGATE of Ultimates.
- Test all BUFF damage/target/attack-shape consequences and actual turn-bound expiration, not only authoritative countdowns; examine remaining Status non-Attack/End Phase/cleanse/cross-status cases.
- Verify other REVIVE cards with a natural Defeat/Legacy/Rank progression, and full manual mouse UI choice behavior; preserve class eligibility.
- Validate AI decisions during natural turns (not only whether AI card payments can resolve), mobile and Firefox UI, and at least one complete Human-vs-AI match to Win/Loss/Draw without Surrender.
- Preserve the separate **Legacy-style hover enlarged card preview for Class Ability card selections** as an unimplemented UI backlog item.
- Only after completion and integrated regression may one consolidated RC/release ZIP be built; never increment the RC number as a side-effect of a partial audit.

### Reproducible local audit artifacts

- `REMAINING_AUDIT_QA.json` / `remaining_probe.js` / `remaining_runner.py`
- `REACTION_REVIVE_QA.json` / `reaction_revive_probe.js` / `reaction_revive_runner.py`
- `BLESSING_RESPONSE_AI_QA.json` / `blessing_divinity_response_AI_probe.js` / `blessing_divinity_response_AI_runner.py`
- `SAINT_STATUS_QA.json` / `saint_status_probe.js` / `saint_status_runner.py`

The JSON summaries are copied under `docs/qa/keyword_audit_staged_2026-11-06/` in the **staging working tree**, not an RC ZIP. The original RC24 ZIP is unchanged.
