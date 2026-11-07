# Grandis Legacy — VS AI Season 0 | RC25 Staging Follow-up

**Baseline:** v1.0 RC25 (2026-11-06), unchanged original ZIP. **Status:** source changes staged only; no RC26 ZIP. OSA DEV45 source unchanged.

## Designer report and desired UX

1. Re-audit ALL five dual/hybrid Class paths after Melody Bard/Maestro could not use `S0-ARC-003 Escape Arrow` in Response.
2. On any card selection with a maximum, clicking a new candidate while the maximum is already selected **replaces the most recently selected card**. No preliminary deselect required. Clicking a selected card still deselects it. For an exactly-one choice, click another card simply replaces the old one. No game-state commit until the existing CONFIRM/PAY control (unless a specific flow already auto-commits by design).
3. During a Response, the selectable Hand cards and their PLAY buttons must be in front of the 65% focus dimmer; other dimmed UI stays dimmed.
4. Preserve the already approved Legacy-style left/right hover preview fix from the preceding RC25 staging follow-up.

## Root causes found

**Dual Class:** Current `window.GL_CARD_DEFINITIONS` / `static-data.js` DEV44 app consumer omits the secondary Base Class from `active_class_lineage` of 10 hybrid Rank II/III Hero records. However, the 10 corresponding **individual OSA DEV45 Hero JSON** records explicitly provide both Base Classes under `identity.activeLineages`:

| Hybrid | Official two Base Classes | Affected Rank II/III IDs |
| --- | --- | --- |
| Paladin / Crusader | Warrior + Cleric | S0-WAR-H008 / H009 |
| Arcane Warrior / Arcane Vanguard | Mage + Warrior | S0-MAG-H008 / H009 |
| Bard / Maestro | Cleric + Archer | S0-CLE-H008 / H009 |
| Spell Blade / Arcane Duelist | Thief + Mage | S0-THF-H008 / H009 |
| Arbalest / Grand Arbalest | Archer + Thief | S0-ARC-H008 / H009 |

In RC25, `s0MaterializeSkillLegality()` used the incomplete consumer Hero lineage to build `legal_active_classes`; the shared runtime `cardLegalForLineage()` also read the incomplete Hero lineage. That made eligibility incorrect for Skills tied to the second Base Class (e.g. Bard/Archer Rank I `Escape Arrow`). **Hybrid status does not grant the second Base Class's Rank II/III promotions** (e.g. Bard cannot use Marksman-only Skill).

**Choice UI:** For `legacy_card_choice` and `legacy_cost_selection`, the engine only appended a new selected index when count was **below** max; when max was full, clicking a different candidate did nothing. Some other card choice paths had similar handling. `legacy_defeat_choice`, one-card search, and blind opponent-hand selection already replaced the single selected index correctly; no change needed there.

**Response PLAY:** The Hand action button was rendered at a layer that could be visually suppressed by the focus dimmer. Increasing only the individual button's z-index within a lower Hand/HUD stacking context was insufficient; the focused Hand/HUD stacking levels also require elevation. The Hand must remain absolutely positioned to avoid layout shifts.

## Application-only changes staged

- `engine/shared-app/app.bundle.js`: 10-ID OSA-backed secondary Base Class bridge, strictly applies to current expected Base/Rank and to the *application's copies* of runtime Hero records. Read-only OSA/DEV44 exports and artwork unchanged. Update Skill legal classes and both normal and Response gate using the shared runtime. Update lineage QA expected source mapping.
- `engine/shared-app/app.bundle.js`: shared `s0ChooseCardIndex()` to replace previous tentative picks when all slots are full, used for `legacy_card_choice`, `legacy_cost_selection`, `card_search_choice`, `opponent_mana_selection`, `response_payment_choice`, `hand_limit_discard`, and Bard/Maestro optional Draw selection. Existing exact-shard Mana payment and action commit logic remain unchanged.
- `shared-ui/battlefield-ui.css`: scoped `.gl-focus-response` rules for the Hand, legal card actions, and PLAY button stacking. Keep Hand `position:absolute`; preserve dimming elsewhere.
- `shared-app/app-runtime.js` and `shared-ui/battlefield-ui.css`: preserve earlier approved class-ability hover preview staging changes (persistent pointer hover + left/right docking outside real card bounds).

## QA evidence (real Chromium browser loading current staged files)

- **10/10** source-identified hybrid Hero Rank II/III records have both official Base Class identities.
- **1,550/1,550** hybrid-vs-Skill Class/Rank lineage decisions match the current printed Class/Rank requirements. **10/10** negative checks do **not** grant advanced Skills of the other Base Class.
- `S0-CLE-H008` Bard and `S0-CLE-H009` Maestro are eligible to Response with Archer Rank I `S0-ARC-003 Escape Arrow` (assuming normal target/CONDITION/response legality); neither receives Marksman-only Skill eligibility.
- Engine's built-in full Skill/Hero lineage QA **6,975/6,975 PASS**, Target **13/13 PASS**, and Ultimate Tribute **30/30 PASS**; no browser JS errors and no missing assets in the run.
- Direct choice logic QA **8/8 PASS** for single replacement, deselect, multi-pick replacement, legacy cost replacement, card search, and Bard/Escape authorization.
- Focused synthetic DOM: Response Hand stays positioned absolutely; PLAY button is hit-testable above visible focus dimmer, `elementFromPoint` returns PLAY, dimmer z-index 900 / HUD 980 / card action button 1051.
- Earlier approved class-choice hover component QA rerun: **12/12** side placement cases across 1600/1024/820 px, hover >1 s persists and leaving closes; no JS errors.

**Not yet verified:** genuine Firefox behavior of new focus/choice changes, a natural mouse-driven Legacy Choice as a player in a complete match, and full Human-vs-AI end-to-end match. Per designer's prior waiver these remain **NOT VERIFIED**, not PASS. This staging verification does not constitute a new release.

## Next

Preserve this cumulative patch over the **original** RC25 when preparing a future combined release. Verify final UI behavior in a natural match before claiming Firefox compatibility. Do not ship a new RC until designer requests consolidation.
