# Grandis Legacy VS AI Season 0 — v1.0 RC29

**Release date:** 2026-11-06  
**Baseline:** Official v1.0 RC28, plus two user-approved groups of staging changes.  
**Status:** **RELEASE CANDIDATE — NOT FINAL**. Official OSA DEV45 unchanged.

## Changes in this release

### Stoneblood — decision in the center stage
- When a Dwarf Hero would be defeated and Stoneblood can activate, show **that Hero card** in the center-stage decision (visual representation only).
- Decisions: **SPEND 1 TOKEN & STAY AT 30 HP** and **DECLINE & CONTINUE DEFEAT**.
- Removed duplicate Hero-side **STONEBLOOD / SKIP** buttons for this decision.
- Token spend, 30 HP survival, and decline-to-Defeat mechanics follow existing authorized behavior.

### Mana Surge / Arcane Surge — Mana payment toggle
- On Spell Blade / Arcane Duelist card Mana payment, display one additional optional **Surge toggle** (default OFF).
- When eligible, the toggle spends **1 additional physical Mana Shard** on a Magical Attack for **+10 (Mana Surge)** or **+20 (Arcane Surge)** damage.
- Disabled and hover-explained when the attack is not Magical, the selected base payment is invalid, or no additional physical Shard remains after base payment. Other Heroes do not see the toggle.
- Preserve payment **PAY / CANCEL** semantics, including no spending on CANCEL. Existing AI logic is unchanged.

### Hero-side Class Ability, Racial Trait, Legacy, and eligible Response hover help
- Added contextual hover/focus tooltip showing ability cost and effect based on the official S0 consumer-printed card data.
- Includes **Second Chance** (1 Racial Token → dodge incoming Physical/Magical damage) and **Human Ambition** (1 Racial Token → draw 2 during Deploy Phase), plus Ancestral Focus, Primal Strike, Dragon Scale, Holy Resurgence, Radiant Oblivion, and relevant Legacy Ability text.
- Portal tooltip is pointer-transparent and stable across the recurring 120 ms renderer. Moves outside the Hero lane to prevent clipping; pointer leave/blur/action change cleans it up. No effect behavior changed.

## Files changed relative to RC28
- `engine/shared-app/app.bundle.js` — PLAYER Surge decision at Mana payment.
- `shared-app/app-runtime.js` — Stoneblood center stage, Surge payment toggle presentation and Hero-action tooltips.
- `shared-ui/battlefield-ui.css` — associated UI styling.
- Documentation/release metadata and `docs/qa/rc29/*`.

All other original RC28 application files are byte-identical, including official consumer card data, engine lineage authority, AI and artwork. No OSA source modification.

## QA evidence
- Targeted browser engine/DOM scenarios for Stoneblood + Surge: **16/16 PASS**; zero JS page errors.
- Targeted browser DOM/focus/hover scenarios for Hero-side tooltips: **23/23 PASS**; zero JS page errors.
- JavaScript syntax: `node --check` on game bundle, UI runtime and lineage authority: **PASS**.
- Archive integrity: ZIP test, unique single top-level application directory, all original RC28 files preserved, expected script/style references present: **PASS**.

**Testing limits:** The 39 browser checks above use synthetic/controlled Chromium match states (including one actual mouse-hover case) and do **not** establish full natural-match correctness. Native Firefox hover and full Human-vs-AI match through Game Over, exhaustive natural complex defense combinations remain **NOT VERIFIED**.

See `docs/TAKEOVER_NOTE.md` and `RC29_QA_SUMMARY.json`.
