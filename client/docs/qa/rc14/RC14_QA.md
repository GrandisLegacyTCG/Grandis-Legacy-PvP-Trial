# Grandis Legacy — VS AI Season 0 v1.0 RC14 | Consolidation QA

**Date:** 2026-11-05  
**Status:** RELEASE CANDIDATE — **NOT FINAL**.  
**Build basis:** VS AI Season 0 RC13 application with the six authorized source-audit fix stages ARC, WAR, THF, CLE, MAG, EVT/ITM.  
**Data authority:** OSA Season 0 DEV45 / DEV44 exports remain read-only; no S1 card-data fallback.

## Completed QA (in-memory Chromium exercising original bundled engine)

| Scope | Verified result | Proof |
|---|---:|---|
| EVT/ITM targeted new fixes | **12/12 PASS** | `../evt_itm/EVT_ITM_FIX_QA.json` |
| Warrior targeted regression | **36/36 PASS** | `../evt_itm/SIX_STAGE_CONSOLIDATED_QA.json` |
| Thief targeted regression | **35/35 PASS** | same |
| Cleric targeted regression | **23/23 PASS** | same |
| Mage targeted regression | **20/20 PASS** | same |
| Mage immunity/expiry | **2/2 PASS** | same |
| S0 Skill/Hero Class+Lineage combinations | **6,975 PASS** | `../evt_itm/EVT_ITM_REGRESSION_QA.json` |
| Target selection | **13/13 PASS** | same |
| Ultimate Tribute (both sides, 15 Ultimates) | **30/30 PASS** | same |
| JS parse & Chromium page errors | **PASS, 0 errors** | source syntax check + JSON files |

**Coverage boundaries:** These are targeted engine-integrated fixture tests (including PAY/CANCEL and normal response resolution), not 242/242 live card PASS. ARC has its previously recorded Stage 1 checks; no fresh full set of 42 Archer card mouse-click tests was run for RC14. A normal Human-vs-AI match through terminal Game Over remains **unverified**.

## Decisions / open issues

- EVT/ITM repairs: exact Area Attack detection; Chain Mail Physical full BLOCK and Ring of Protection Magical full BLOCK against matching incoming damage (no printed numeric cap, PIERCING disallowed); Spectral Grappling Hook physical Discard-1-at-PAY CONDITION and CANCEL safety; Warp Scroll Stun/Freeze prohibition; Poison Vial no unsupported Class restriction; Stamina Potion needs Exhausted target.
- **Do not silently alter** Poison Vial's separate trigger rule; original app currently requires positive final HP damage, source text does not explicitly state this condition. Designer review remains pending.
- Deck Builder v1.58 import format, official Casting owner-Draw vs prior approved owner-End implementation, OSA potion art/text discrepancy, Runeforged 0-count, remaining Legacy/Response/UI checks and a complete normal match remain separate work items.
- Current package is **RC14, not FINAL**, even though the evidenced defects across six audit categories were repaired and targeted regression tests passed.
