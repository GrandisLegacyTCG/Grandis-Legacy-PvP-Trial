# RC23 — Confirmed fixes and AI tactical follow-ups (2026-11-05)

**Application baseline:** unmodified RC22 ZIP, staged separately. **Authority:** OSA Season 0 DEV45 consumer cards, S0 Player Rulebook v2.9 and explicit designer instructions; v6.91.9 used only as existing VS AI engine behavior reference. **No OSA/Deck Builder/PvP/RULEBOOK mutations.**

## Authorization and work scope

The designer approved fixing the previously discussed RC22 bug list, then added the following explicit AI requests before packaging: `S0-ITM-011` Poison Vial followed by a Physical Attack, `S0-ITM-020` Freeze Bomb followed by an attack during which Freeze prevents Dodge, and `S0-ITM-019` Warp Scroll used strategically to escape bad formation. Previously discussed Double Casting Elementalist/Elemental Lord was confirmed correct in the focused comparison, so its timing and payments were not rewritten. RC22 one-line right-side Hero buttons, center Quick Reload spacing, and Lobby Hero Review scroll remain as-is.

## Application modifications

**`engine/shared-app/app.bundle.js`:**

1. **MANA COST +:** `cardPlayCostForSource()` now extracts a *printed additive surcharge for the eligible Class/Rank effect row*, rather than relying on a list of special Skill IDs; preserve exceptions for dynamic Mana Void and Execute and preserve inherited rows. Source matrix: `S0-MAG-030` Arcane Warrior 5 / Arcane Vanguard 4; `S0-MAG-018` Elementalist 3 / Elemental Lord 1; `S0-WAR-018` Gladiator 7 / Conqueror 5; `S0-CLE-025` Paladin **6** / Crusader **4**. Response uses the corrected source cost.
2. **Draw counter / Colossal Dreadbolt:** the physical-Draw count in `commitActualMainDeckDrawState()` is no longer capped at 6; the current official per-card cap remains **140 printed base damage**, not 140 final damage after independent class bonuses. Grand Arbalest 7 and 8 Draws both compute 150 with its established +10 Rapid Chamber bonus; Arbalest 14 and 15 Draws both compute 140. One stale historical internal self-test assertion for the former 120-base cap was updated to the current 140-source cap.
3. **Divine Edge Rank III:** `applyResolvedAttackDamage()` performs a true random selection of two opponent Hand cards after positive **primary HP damage** by Grand Ranger, moves the physical identities into the opponent's Main Deck, then shuffles. Does not inspect identities before choosing; no effect for Rank II or zero damage. No Draw-counter increment for Hand→Deck moves.
4. **Flame Dragon's Wrath** (`S0-MAG-019`): canonical ALL OPPONENTS recognized in attack-shape dispatch; opens legal separate defender Responses for all opposing active Heroes. Elementalist/Elemental Lord printed damage and Burn, including the established class passive, remain source-driven.
5. **Venom Detonation** (`S0-THF-018`): same ALL OPPONENTS routing invokes existing Venom-specific per-poisoned-target resolver, preserving independent Poison duration snapshots, appropriate Rogue/Renegade multipliers and per-Hero Responses; unpoisoned Heroes skipped. Poison is not removed while the Response is pending. No invented SURE HIT: a legal defender DODGE remains offered.
6. **Poison Vial AI:** retain the existing subtype-bound planner, which refuses a Vial without a same-Hero **Physical Attack Skill** follow-up. Verified committed AI Item activation, established Poison Vial attachment, automatic Battle Attack, subsequent Poison infliction. Do not broaden "Physical Attack" into all Physical damage or Area cards.
7. **Freeze Bomb AI:** `aiBestAttackAfterFreezeBomb()`, `aiPlanForSetupAction()`, and deploy scoring look ahead to a reachable target with a feasible same-turn Attack. After Bomb grants Freeze, a legal attack is auto-chosen; the standard Freeze status disables defender DODGE. The AI saves the Item if a follow-up is unavailable. No extra Freeze rules.
8. **Warp Scroll AI:** `aiWarpFormationValue()` / `aiWarpScrollStrategicPair()` evaluate all eligible pairs, consider current HP exposure and expected Battle opportunities, reject neutral/negative or currently Casting swaps; execute the selected swap without an artificial Exhaust. Prevent the AI from undoing its own Warp during its generic same-turn Reform Reposition routine. Player-side selection remains unchanged.

**`shared-app/app-runtime.js`:** `heroHasDrawReplacementCounter()` now recognizes actual canonical Season 0 Arbalest and Grand Arbalest Hero progression identifiers, enabling the existing `! Hero Information / Draw This Turn` UI. Does not show on Rank I or unrelated Heroes.

**`README.md`, `docs/TAKEOVER_NOTE.md`, `docs/qa/rc23/`:** this release record and evidence. No other runtime, art, OSA, or official rule data changes.

## Verification method and results

- **15/15 focused engine/AI checks PASS** (`RC23_QA.json`). Includes all 8 printed cost Class/Rank combinations; Rank II/III Blessing Response cost; 7+ real Draws with 140-base cap retained; Grand Ranger 2 physical opponent Hand→Deck random moves and Rank II exclusion; Flame 3 independent defender Responses for both ranks and Burn; Venom only 2 Poisoned defenders, independent Magical Responses, damage/duration/remove, plus availability of legal Dodge; Poison Vial AI follow-up + no-waste; Freeze Bomb AI freeze/Attack/no-dodge + no-waste; Warp Scroll safety and no-waste; baseline S0 target 13/13, lineage 6,975 checks and Ultimate Tribute 30/30. **0 Chromium page errors and 0 missing assets** in this test harness.
- **Hero Information UI** (`RC23_UI_COUNTER_QA.json`): `S0-ARC-H008` and `S0-ARC-H009` show `Draw This Turn: 7`; `S0-ARC-H007` and unrelated Warrior Hero do not show the indicator. 0 errors and missing assets.
- **15 Ultimate source smoke records / Rank II–III focused runs** (`RC23_ULTIMATE_EFFECT_SMOKE.json`): confirmed Flame 3 targets, Venom 2 poisoned targets, Double Casting printed cost, existing multi-target Ultimates. NOTE: **not 15 fully completed real UI ability uses**. Some Ultimates are Response-only, some open subsequent Choice screens (Bard Grand Finale, Mana Void), and their full execution was not claimed PASS. Stage fixtures are constructed engine states, not human-played games.
- `node --check` for both modified JS modules PASS. Existing engine source and representative gameplay loaded in Chromium via in-memory intercepted routes to avoid environment blocking localhost/file navigation.

## Limits / next QA

Normal full Human-vs-AI browser match through Win/Loss/Draw (not Surrender), Firefox hosted UI interactions, complete Response PAY for both ranks of Blessing, every 15 Ultimate through real hand clicks, per-target live DODGE for Venom, and long multi-turn tactical quality remain unverified. Existing prior open issues remain open unless covered explicitly above. Release **RC23, NOT FINAL**. Do not silently edit OSA or treat tests as evidence of exhaustive playability.
