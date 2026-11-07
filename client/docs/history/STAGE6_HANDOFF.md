# Grandis Legacy VS AI Season 0 — Stage 5 completion patch + Stage 6 AI update
**Date:** 2026-11-04

## Source authority and rollback
- BASE: `Grandis_Legacy_VS_AI_Season0_STAGE5_Gameplay_Updated_2026-11-04.zip` (separate rollback archive).
- All S0 card IDs, costs, damage, text, effects and artwork are supplied by the pinned OSA S0 DEV45/DEV44 exports in `runtime/season0-authority` and the existing S0 generated data.
- VS AI v6.91.9's application engine, response/transaction infrastructure and battlefield UI remain the mechanism baseline. No OSA, PvP or Deck Builder files were changed.

## Small Stage 5 gameplay correction: Bard Class Ability
Stage 5's Hero component registry had the canonical **Prolonged Symphony** and **Orchestral Crescendo** texts but the interactive Class Ability handler supported only an `activated_heal` ability. Source now adds their *optional Draw Phase hand exchange* without introducing a new card-data authority. This ability is intentionally offered AFTER normal Draw Phase Main Deck draw + Mana Regen, while still in Draw Phase, BEFORE Deploy.

- Bard: may discard exactly 0 or 1 from Hand; draw the discarded number.
- Maestro: may discard 0, 1 or 2 from Hand; draw the discarded number.
- Each eligible Hero has its own once-per-own-Draw opportunity, with Maestro offered first if present; declined exchanges do not cost resources. A Hero is matched by current S0 Hero Class (Bard or Maestro), not S1 names/IDs.
- Human: optional multi-select hand choice, **Skip Ability**, max card count, confirmation; renderer and app bridge both use the existing choice overlay. AI: automatic optional discard selection.
- If Main Deck has fewer available cards than discarded, the ordinary nonmandatory Draw effect draws only what is available (existing engine behavior).
- Does not touch existing Holy Resurgence heal Class Ability or other S1 gameplay.

## Stage 6 — AI changes implemented
1. **Temporary BUFF follow-up** — existing `aiPlan` follow-up pipeline now recognizes additional S0 Wings of Valor (all allied Attackers) and Blessing of Accuracy (selected ally), and rejects using them with no presently legal Attack follow-up. Existing Poison Vial, Scroll, Enrage, Ring of Grace, Heaven's Fury, Double Casting and Wildfire plans remain. It simulates Mana payment and rechecks legal actions at execution.
2. **Ultimate timing** — S0 Attack Ultimates scored for lethal finishing, multiple targets and source-Hero emergency INVINCIBLE. Nonlethal single-target Ultimates are deprioritized rather than automatically spent when affordable. Defensive Ultimate options (including S0 Bromir Absolute Defense) are withheld on minor hits and allowed at lethal/critical danger or when REFLECT could defeat the attacker. Scoring is heuristic (not a guaranteed optimal strategy).
3. **Bard resource management** — during the optional Draw Phase ability, AI favors duplicate Zol/Lun/Vae, prioritizes note setup if return-combo cards are in Hand, and can decline an exchange. Maestro can discard up to 2, Bard up to 1; each Hero is individually limited per Draw. Tune Up's AI automatic search favors relatively missing note types, while still permitting any combination.
4. **Preserved boundaries** — existing response legality and animation/UI engine remain; AI cannot use the opponent's hidden Hand or face-down Mana identities in these new decisions. No new engine or external simulator.

## Verification and limitations
- Five changed/added JS files checked for syntax: **PASS** (`engine/shared-app/app.bundle.js`, `shared-app/app-runtime.js`, `engine/js/runtime-authority.js`, both authority/local AI adapters).
- Stage 3 consumer integrity, Stage 4 official artwork/starter validation, Stage 4 executable deck rejection tests: **PASS**.
- Stage 5 18 targeted + 24 completion-focused source tests: **PASS**.
- Stage 6 20 new actual source-function tests for Bard exchanges, new Buff follow-up mapping, Ultimate attack/defense choice and external UI intents: **PASS**.
- **Browser/UI interactions NOT verified.** No actual human-vs-AI match was run, no final playability claim. Remaining Stage 6 acceptance: test AI decision loop across end-to-end gameplay, especially complex card choices and actual nested Response; Stage 7 must complete full game QA.
- Stage 5 integration and targeted test results are not proof of exhaustive card/effect correctness.

## Next action
Review/iterate AI heuristic decisions with the designer, then stage 7 browser gameplay and complete match. Do not change official S0 data to force legacy handler behavior. This ZIP is a **working source checkpoint**, not a release certification.
