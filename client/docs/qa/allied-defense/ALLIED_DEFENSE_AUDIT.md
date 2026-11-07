# Grandis Legacy — Allied Defense and Source→Target Response UX (staging, 2026-11-06)

**Baseline:** original Season 0 v1.0 RC25 plus previously approved cumulative staging changes. **OSA Season 0 DEV45 remains read-only.** No distributable ZIP/version increment.

## Designer decisions

- `Holy Barrier` played during a Response still has an independent **legal Skill user** and **protected recipient**. Example: Priest uses the card to protect allied Crusader.
- On clicking **PLAY** for allied-source defensive Responses, pick the Hero **using the Skill** and then (for a single-protected-target card) pick the attacked Hero being protected, analogous to ordinary source→target Attack flow. Source selection and target selection happen before any PAY. Current attacked Hero remains the only legal protected recipient; this flow cannot redirect a Defense onto an unrelated Hero.
- Teamwide Responses (`Sacred Bulwark`, `Blessing of Divinity`) require choosing their **source Hero** only; the effect automatically targets all your Heroes as printed. `Cover Up` chooses the intervening Warrior source and then the originally attacked Hero. No additional source selection for no-source Protection Items.

## Confirmed gameplay defect and scope

`responseBlockAmount()` received the attacked Hero for all Response Blocks, including Class-scaled allied-source `S0-CLE-010 Holy Barrier` and `S0-CLE-022 Sacred Bulwark`. For example, Priest protecting Crusader produced BLOCK 0 instead of printed BLOCK 60. Paladin protecting Priest using Sacred Bulwark produced BLOCK 0 instead of 30. Source-side legality options were present in these constructed scenarios, but the downstream BLOCK calculation discarded source identity. AI defense ranking likewise evaluated the recipient rather than card user.

**Staged correction:** only when a Response is an allied-source Defense, select actual `responseOption.source_lane` source Hero for BLOCK calculation and AI scoring. Preserve attacked Hero as recipient and keep existing correct defender-dependent checks (e.g., Lun), payment, and Response authority. No OSA card edits.

## Other allied-effect families reviewed

- Single-ally healing: `Flash Heal`, `Lay on Hands`, `Holy Light`, `Vae`; source Class/Rank selects official printed Heal amount and recipient gets healing (including legitimate healing modifiers). Focused 36-source/target fixture matrix includes these and `Sanctuary`/`Blooming Harmony`. This matrix uses some deliberately illegal Hero/card combinations to inspect helper outputs, **not** full gameplay PASS for all 36.
- Team healing: `Sanctuary`, `Blooming Harmony`, `Holy Blast`—source amounts and legal target behavior sampled; no confirmed new source-vs-recipient BLOCK-type defect in this pass.
- Targeted allied buffs and utility: `Blessing of Might`, `Blessing of Wisdom`, `Blessing of Accuracy`, `Purify`, `Wings of Valor`; checked source/target paths at code level, but not every full turn and future Attack.
- Allied protective Responses: **two confirmed erroneous BLOCK branches** above; `Blessing of Divinity` is a teamwide INVINCIBLE Response requiring proper source Class/Rank; `Cover Up` changes attacked Hero to legal adjacent source; `Spectral Grappling Hook` is a Protection Item (not a Hero Skill), so user selection semantics differ.
- No conclusion that every other allied-effect combination is defect-free. Additional manual/firefox/full natural match remains Not Verified under existing designer waiver.

## Files changed in cumulative staging (application only)

- `engine/shared-app/app.bundle.js` — source-based BLOCK amount for allied defensive Responses + correct AI valuation.
- `shared-app/app-runtime.js` — explicit pre-PAY `PLAY → choose legal source Hero → choose attacked protected Hero → PAY` for `Holy Barrier` and `Cover Up`; teamwide `Sacred Bulwark`/`Blessing of Divinity` choose source, then proceed to PAY. Focus and guide text; Hero→Hero connector while selecting recipient. Existing non-allied Defense/REACTION behavior untouched.
- `shared-ui/battlefield-ui.css` — small response routing guide and selectable/selected Hero foreground focus layers.
- `docs/qa/allied-defense/` and this takeover record.

## QA evidence and boundaries

- Chromium **6/6** engine Response resolution tests PASS after fix: Priest→Crusader, Priest self, Saint→Warrior (`Holy Barrier`), Paladin→Priest, Crusader→Archer, Paladin self (`Sacred Bulwark`). Actual 4/3 Mana Response payment and HP calculation exercised in sourced synthetic gameplay states; zero page JS errors. Priest-protected Crusader at 100 HP with 90 incoming now ends at 70, not 10; 80 HP fixture with 90 incoming should end at 50.
- Chromium **3/3** response UI route state tests PASS (`Holy Barrier`, `Sacred Bulwark`, `Blessing of Divinity`); **1/1** DOM event-dispatch interaction sequence PASS for `PLAY → source → protected recipient → response_payment_choice`. No Mana is committed merely by selecting source/target. Page JS errors 0.
- Direct headless pointer-click QA in this synthetic fixture did **not** establish a natural hosted/UI mouse match: the fixture never completed the usual lobby/coinflip positioning, so the Hero card elements were not pointer-visible. The DOM event-dispatch test verifies handler wiring, not complete visual interactive acceptance. This limitation is not silently marked PASS.
- Earlier full-match Firefox and natural all-combinations waivers remain **NOT VERIFIED**.

## Additional caveat

The original user screenshot of Fiery Thrust + Holy Barrier shows only Crusader and Conqueror as visibly active on the opposing side. A separate actual Priest/Saint response user would be needed for a *legal* Holy Barrier. A user-described Priest→Crusader situation was reproduced and fixed, but original screenshot's exact source legality/history is **unresolved** without the match state/log. Do not infer the source Hero from a Card Played detail entry alone.

**Packaging:** Original RC25 ZIP and official OSA untouched. Stage only; no RC26 created.
