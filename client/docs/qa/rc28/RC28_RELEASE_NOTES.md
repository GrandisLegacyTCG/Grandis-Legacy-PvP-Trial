# RC28 — Full Lineage Fallback and shared modal hover lifecycle (2026-11-06)

## Authorized scope

Designer requested **"benerin semuanya"** following RC27 read-only audit: correct 11 wrongly chosen hybrid Class/Rank effect rows and remove Replenish/Legacy choice popup hover flicker. Start from **RC27** and preserve its prior UI/gameplay/artwork/AI behavior. Official OSA Season 0 DEV45 remains **READ-ONLY**.

## Confirmed gameplay defect and correction

`engine/js/runtime-authority.js` → `GL_RULES_RUNTIME.selectClassRow()` previously reversed `active_class_lineage`. Because hybrid Class bridge appended secondary Rank-I Base Class last, reverse-iteration preferred that Rank I over an available primary Rank II printed effect row on Rank III Heroes. Runtime legality was correct; **value/branch selection was not**.

Selector now prioritizes exact current Class, then the **highest applicable official printed Class/Rank effect row** in the Hero's legal Lineage. For equal Ranks, it prefers the Hero's `evolution_path`; if no printed rows exist for a dynamic map, it checks primary evolution first before other legal Lineage classes. No extra Class eligibility is granted. All 11 confirmed mismatches now select the proper row:

| Card | Rank III Hero | Correct row | Selected effect |
|---|---|---|---|
| Zol | Maestro | Bard | 20 damage |
| Sleeping Dart | Maestro | Bard | 30 damage, Sleep 1 |
| Hammer of Justice | Crusader | Paladin | 60 damage, Stun 1 |
| Holy Light | Crusader | Paladin | Heal 60 |
| Aether Ball | Arcane Duelist | Spell Blade | 70 damage and printed on-Hit MANA BURN 1 |
| Mana Absorption | Arcane Duelist | Spell Blade | 40 damage and printed on-Hit MANA STEAL 2 |
| Blink Strike | Grand Arbalest | Arbalest | 30 damage |
| Skull Crush | Arcane Vanguard | Arcane Warrior | 50 damage |
| Colossal Bash | Arcane Vanguard | Arcane Warrior | 60 damage |
| Weapon Throw | Arcane Vanguard | Arcane Warrior | 60 damage |
| Runic Guard | Arcane Vanguard | Arcane Warrior | BLOCK 50 and printed REFLECT 30 |

`GL_RULES_RUNTIME.cardLegalForLineage()` is unchanged. No 11 individual card-specific overrides were added.

## Confirmed UI defect and correction

`shared-app/app-runtime.js` → `renderCenterChoiceStage()` closed its stage on **every 120 ms render** even when there was **no center-choice session**. `closeCenterChoiceStage()` hid the **shared preview owned by the generic popup**, causing Replenish and Legacy card preview flicker under a stationary pointer.

Now the center stage is closed only when a real center-choice session is active/being exited. When idle, its renderer does not erase a generic modal's preview. The existing centered Bard/Maestro preview, preview cleanup on genuine session transitions, and left/right placement are retained. No CSS redesign or artificial delay.

## Verification and boundaries

- `node --check` passed for both modified runtime JS files.
- **155 Skill × 45 Hero = 6,975 static legality/row checks**: 1,059 legal combinations; **0** legality differences and **0** wrong effect rows (RC27 had 11 wrong rows).
- Actual application JavaScript in controlled Chromium DOM: **11/11** expected fallback rows and printed numeric/secondary text values matched; `Aether Ball` printed MANA BURN 1, `Mana Absorption` printed MANA STEAL 2 and `Runic Guard` printed REFLECT 30.
- Browser DOM: Replenish (Discard search), Legacy Defeat Choice, Legacy Card Choice and Hand search preserved hover through **25 repeated render cycles**, then closed on mouseleave; Bard hover preserved through 24 cycles and correctly cleared on session change. **0 browser page errors**.
- These are targeted source/runtime/UI tests. They do not prove complete damage/secondary effect resolution for every possible game state, a native Firefox match, or a normal Human vs AI game to terminal. The previous waivers remain **NOT VERIFIED**, not PASS.

## Changed files

- `engine/js/runtime-authority.js` — effect-row fallback precedence.
- `shared-app/app-runtime.js` — no idle-stage hover destruction.
- `README.md`, `docs/TAKEOVER_NOTE.md`, and `docs/qa/rc28/*` — documentation/QA.

**Not changed:** card database/official OSA, engine attack/response code, AI, artwork, animations, other apps. Release status **RELEASE CANDIDATE, NOT FINAL**.
