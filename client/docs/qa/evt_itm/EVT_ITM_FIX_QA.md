# Grandis Legacy — VS AI Season 0 | EVT/ITM Stage 6/6 Repair QA

**Date:** 2026-11-05  
**Authorization:** Designer explicitly said “ok perbaiki semuanya” after the read-only EVT/ITM report.  
**Baseline:** RC13 staging source incorporating earlier approved ARC, WAR, THF, CLE, MAG fixes.  
**Scope:** Six evidenced EVT/ITM defect groups affecting seven S0 cards; no change to OSA authority, other apps, or pending designer rulings.

## Repairs made

| ID | S0 Card | Source-level correction |
|---|---|---|
| EVTITM-01 | Defensive Formation (`S0-EVT-012`) | `responseKind` uses *actual Area Attack* gate, not `/Area|All|Dual/` heuristic. Dual Target is not Area. The area flag is retained in a multi-target Response window so its legality survives revalidation. |
| EVTITM-02 | Chain Mail (`S0-ITM-016`), Ring of Protection (`S0-ITM-007`) | Added matching Physical-only and Magical-only BLOCK response routes. Respect PIERCING/`cannot_block`. The current S0 printed text says simply **“BLOCK incoming … damage”** without a numeric cap. Accordingly, the protection blocks the incoming matching damage amount, rather than inventing a S1-derived amount. Normal Attack and Primal Strike Response checked. |
| EVTITM-03 | Spectral Grappling Hook (`S0-ITM-012`) | Printed **CONDITION: Discard 1 card from your hand** now maps to one mandatory additional physical Hand card. A lone Hook is unavailable. Uses the preexisting `response_payment_choice`, PAID-commit, CANCEL rollback, and AI automatic mandatory payment; no changes to generic Response payment. |
| EVTITM-04 | Warp Scroll (`S0-ITM-019`) | Filters Stunned/Frozen Heroes from eligible lanes. Validates both selected lanes before payment/Reactive priority and again at card resolution. Legal card-effect Swap still does not Exhaust or consume manual Reposition. |
| EVTITM-05 | Poison Vial (`S0-ITM-011`) | Removed unsupported Thief/Archer-only Hero host restriction. Any alive active Hero is a valid user/host if standard Item/Attachment requirements are met. **No alteration to whether Poison requires actual HP damage**; designer/source trigger question remains OPEN. |
| EVTITM-06 | Stamina Potion (`S0-ITM-003`) | Preplay disallows card if there is no Exhausted allied Hero. Existing target filter is retained. No premature discard or payment. |

## Chromium isolated engine QA — actual results

`EVT_ITM_FIX_QA.json`: **12/12 PASS**, 0 page JavaScript errors, including:

- Formation Area yes / Dual and Single no.
- Chain Mail/Ring correct matching damage type, full incoming absorption, wrong type rejection and PIERCING exclusion.
- Normal successful Attack-response commit and Primal Strike+Chain Mail successful resolution; AI scores full Chain Mail BLOCK above a smaller paid BLOCK.
- Hook solo denial, choice/pay/discard, pre-commit CANCEL rollback, and AI mandatory discard.
- Warp Scroll Stun/Freeze preflight, no spend, legal free-Swap case.
- Poison Vial Warrior host successful Attachment placement.
- Stamina Potion no-target denial and eligible-target positive check.

`EVT_ITM_REGRESSION_QA.json` (real VS AI engine hooks): Class/Lineage **6,975** combinations PASS, Target Selection **13/13** PASS, Ultimate Tribute **30/30** PASS.

`SIX_STAGE_CONSOLIDATED_QA.json`: WAR **36/36**, THF **35/35**, CLE **23/23**, MAG corrected focused runner **20/20**, MAG expiry **2/2** PASS; browser JavaScript errors **0**. Earlier ARC source/Status fixes remain staged, and baseline Class/Lineage check passed, but no claim of 42/42 ARC end-to-end.

All Chrome tests executed real bundled application code in **injected DOM/isolated match fixtures**, not an ordinary mouse-driven Human-vs-AI match through Game Over. Thus RELEASE CANDIDATE, NOT FINAL.

## Preserved decision / do not repeat

- The 32 EVT/ITM identities were examined; the 12 QA cases are targeted checks, **not a blanket 32/32 gameplay PASS**.
- Do **not** classify a Dual Target Attack as Area merely because it hits multiple Heroes.
- Do **not** invent a `BLOCK 30` or other numeric value from S1 for the current S0 Protection Items: the current printed S0 texts have no numeric cap.
- Do **not** consume the Hook or its CONDITION on selection/CANCEL, and do not charge only the zero printed Mana cost while forgetting its physical discard.
- Do **not** remove Poison Vial's independent positive-damage trigger without explicit designer ruling; do not change the OSA cards.
- Do **not** relax Stun/Freeze movement restrictions during item-caused Swap.

## Still open / next

1. Full Human vs AI **real browser** match to terminal Win/Loss/Draw (not Surrender), all six families and AI decision quality.
2. Recheck interactions across actual graphical Response, nested Counter, physical exact Mana and Hand choices, UI animation/hover on desktop and mobile.
3. Independently review Poison Vial: printed text does not say `when this Attack deals damage`; current engine still requires positive final HP damage for Poison. No assumption or unauthorized change.
4. Deck Builder v1.58 JSON import incompatibility remains a separate reported issue. Do not claim this repaired.
5. Casting counter owner-End vs Rulebook v2.9 owner-Draw discrepancy, Runeforged Burst interruption at zero, OSA Health Potion art/text discrepancy, and remaining Legacy abilities remain tracked for source/field confirmation.
