# Grandis Legacy — VS AI Season 0 | EVT/ITM Code Audit (Stage 6/6)

**Date:** 2026-11-05  
**Authorization:** Designer said **“terakhir”** to proceed to the final audit stage. This authorizes **inspection and reporting only**; no code fix, version change, new ZIP or release.  
**Baseline:** RC13 staged working copy carrying the authorized ARC, WAR, THF, CLE and MAG patches. S0 official OSA DEV45/DEV44 consumers read-only.  
**App bundle SHA-256:** `f2a5d37b448ef37d7452c3decb831a2fcd46d77a8328d6eb3ddc49e4d8e94a15`.  
**Scope:** All **32** current S0 records: **12 Events + 20 Items**. Keywords, Status, Reaction, Response, physical cost, target legality, Buff/Attachment, and source/AI handling prioritized.

## Audit method and evidence boundaries

1. Inventory printed OSA S0 card text, IDs, subtypes, source requirements, runtime tags, adapter `effect[]`, and active handler contracts. An empty `effect[]` is **not** alone proof that a card fails: special handlers exist.
2. Trace the actual VS AI bundle through `responseKind`, `responseOptionsFor`, `responsePaymentSpec`, `validateCardPreconditions`, `getLegalActions`, `commitPlayedCard`, `applyImmediateEventItemEffects`, `skillEffectSwapPairEligible`, and relevant registration/expiry routines.
3. Run isolated Chromium **in-memory injected** probes using the real bundled app source and 12 physical Mana cards conserved per side (Mana Pool + Mana Deck = 12). This is source-executed QA, **not** full mouse-driven gameplay. Page errors in recorded runs: **0**.
4. Seven card identities in six groups have observed source/runtime problems. Other 25 entries are **not** certified per-card gameplay PASS. CSV records evidence and remaining tests separately.

## Confirmed code/runtime defects — no fixes applied

| ID | Priority | Card(s) | Observed evidence | Required repair direction (proposal only) |
|---|---|---|---|---|
| **EVTITM-01** | **HIGH** | Defensive Formation `S0-EVT-012` | Official condition: opponent uses **Area Attack**. `responseKind` accepts `/Area\|All\|Dual/`, and Chromium offered `area_reduce` to `S0-ARC-017` **Dual Arrow (Dual Target)**. Single Target correctly rejected and genuine Area offered. | Match true Area subtype, not any Dual/multi-target card; preserve per-affected-Hero Response and the 20/40 reduction based on base Classes. |
| **EVTITM-02** | **CRITICAL** | Ring of Protection `S0-ITM-007`, Chain Mail `S0-ITM-016` | Both are **Protection/BLOCK** Items, have no runtime normalized response effect. `responseKind` returns `null`; `responseOptionsFor` offered neither against matching **Magical** and **Physical** attacks respectively. `responseBlockAmount` returns 0. This independently substantiates the earlier Chain Mail concern; Primal Strike itself was not rerun here. | Materialize legal damage-type-specific BLOCK Response handling from official text. Do **not** invent a numeric BLOCK amount that is not printed. Test Primal Strike and standard Attack, PIERCING, SURE HIT, PAY and response expiry. |
| **EVTITM-03** | **CRITICAL** | Spectral Grappling Hook `S0-ITM-012` | Printed **CONDITION: Discard 1 card from your hand**. `responsePaymentSpec` returns **0** and `responseOptionsFor` offers the Hook when it is the **only** card in Hand. The cost contracts omit the mandatory physical discard. | Enforce another physical Hand card chosen as CONDITION before commit; atomic payment, cancel rollback; preserve DODGE legality. |
| **EVTITM-04** | **HIGH** | Warp Scroll `S0-ITM-019` | `warpScrollLegalHeroLanes()` filters only alive/non-Legacy; no Stun/Freeze check. Chromium **committed** LEFT ↔ CENTER swap involving a **Stunned** Hero, moved the Stun with that Hero, and discarded Warp Scroll. This violates rulebook's no Swap for Stun/Freeze. | Preflight and commit check both Heroes' statuses using S0 move legality. Preserve no default Exhaust for a legitimate card-effect Swap. |
| **EVTITM-05** | **HIGH** | Poison Vial `S0-ITM-011` | Current official Item text says attach to **the Hero that used it**, Physical Attack inflicts Poison(2); **no printed Class restriction**. `poisonVialHostEligible` and commit validator disallow a Warrior host. Identical direct committed Item works for an Archer, fails for Warrior. | Remove unsupported Thief/Archer-only Item host restriction, with valid physical-attack/attachment criteria. Preserve limited duration and legal Poison effects. Separate source question below. |
| **EVTITM-06** | **LOW** | Stamina Potion `S0-ITM-003` | `legalPlayStateFor` says **can=true** when every Hero is Ready, although `legalTargetLanesFor` is empty (no Exhausted Hero to affect). Target selection can't complete. **No spend/lost card confirmed**. | Match preplay availability to eligible Exhausted Hero target; test AI and UI disabled/denial feedback. |

**Count:** 6 defect groups affecting **7 unique cards** (including 2 protection Items); no code changes.

## Targeted positive evidence (limited)

- **Intercept** `S0-EVT-007`: response offered against ordinary Physical and Magical Attack.
- **Tactical Adaptation** `S0-EVT-009`: counter options for opposing Tactical or Event, not Item; **Flashpowder Bomb** `S0-ITM-017`: counter options for Item, not Tactical/Event.
- **Defensive Formation**: valid genuine Area offered; invalid Dual Target also offered (EVTITM-01).
- **Spectral Grappling Hook**: DODGE option offered against Physical and Magical; **physical discard payment is broken** (EVTITM-03).
- **Last Resort**: denied with 3 active allied Heroes, allowed with only 1. **Forged Alliance**: denied at 2 Racial Tokens (cap).
- **Health Potion / Greater Health Potion**: preplay rejects full-HP targets. **Elixir**: Sleep and Poison recognized as negative statuses for target selection. **Phoenix Feather**: no defeated target correctly denied.
- **Mana Potion** and **Freeze Bomb**: code routes for physical Mana Draw and Freeze(1) exist, but test calls stopped at the opposing reactive Item window, so **neither was falsely marked as a successful final commit**.
- Buff Items, Card Search/Return, Scouting, REVIVE, and Mana routes were traced, but most require further full UI/PAY, choice completion and AI tests.

## Source clarifications / separate checks — do not silently change authority

1. **Poison Vial trigger:** runtime currently adds Poison only after **positive final HP damage**, whereas official Item text says its Physical Attack Card will inflict Poison for 2 turns without explicit **“when this Attack deals damage”** wording. Confirm the designer's intended trigger (card played vs connected Hit vs actual damage) before changing this independent branch. The unsupported Class gate above is separately confirmed.
2. **Health Potion / Greater Health Potion:** source DEV44 text omits HEAL numbers, while staged runtime uses +30/+50 from physical S0 card-art evidence. Existing OSA discrepancy review remains unresolved. **Do not change OSA** or invent new amounts.
3. **Primal Strike + Chain Mail:** failure to offer Chain Mail is confirmed for ordinary matching Attack at `responseOptionsFor`; perform the previously pending Primal Strike live paid Response scenario after the specific Item Response fix.
4. **Other stage-wide open items:** Casting owner-End vs Rulebook v2.9 owner-Draw counter conflict; Runeforged Burst zero-count interruption; Deck Builder v1.58 import incompatibility; full mouse-driven Human-vs-AI match to Win/Loss/Draw; all Legacy abilities.

## Explicit next steps

- **Wait for designer approval** before editing any code, even though this is audit 6/6.
- If approved: correct only evidenced EVT/ITM defects with isolated S0 implementation and no OSA writes. Test physical discard and response commitments, cancel rollbacks, Rank/Lineage, status restrictions, all relevant protection keywords and realistic human-vs-AI turns.
- After stage 6 repair: **full consolidated regression** for ARC/WAR/THF/CLE/MAG/EVT+ITM, S0 6,975 Class/Lineage, 13 Target, 30 Ultimate Tribute checks, plus seeded opponent scenarios and a genuine normal browser match through Game Over. Only then discuss one combined version bump/ZIP after authorization; **RC13 remains current staged label**.

**Machine-readable companion:** `Grandis_Legacy_VS_AI_Season0_Audit_EVT_ITM_2026-11-05.csv` — 32/32 record inventory with verification levels.

**Evidence/probes (external, no patch):** `audit_work/evt_itm_inventory.json`, `audit_work/evt_itm_stage6_results.json`, `audit_work/evt_itm_stage6_edges.json`, `audit_work/evt_itm_stage6_commit.json` and corresponding `*_probe.js`, `*_edges.js`, `*_commit.js`.
