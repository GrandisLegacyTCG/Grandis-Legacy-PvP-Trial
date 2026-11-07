# RC20 — UI Card Review / Casting Palette / Event & Utility Arrow QA

**Date:** 2026-11-05  |  **Baseline:** packaged RC19  |  **Build:** RC20 (release candidate, not FINAL)

## Scope and authorized changes

1. **Card Review**: remove unwanted gray *outside* the actual Deck Builder review card, including round-corner backgrounds and bottom trim. Retain its intended dark information panel, card artwork, and layout.
2. **Simultaneous Casting**: give each live Casting a distinct, persistent highlight and match its locked target position to its source Casting Attachment (violet, teal, amber). If two target the same position, show a combined two-hue highlight. No Casting mechanics changed.
3. **Arrows**: keep all other existing connectors, and change only designer-specified Events/Utility Items: Begin Anew none; Market Bargain own Main Deck; Forged Alliance own Racial Token row; Déjà Vu own Discard; Magic Scope opponent Hand; Crystal Ball own Main Deck; Magic Compass own Main Deck. No Flashpowder Bomb arrow. Attack/Defense/Consumable/Buff visual rules remain unchanged.

## Card Review root cause, fix and validation

**Root causes verified:** an explicit `1px #414653` border on the embedded `.review-card`; iframe fit reporting `card height + 2px`; and the native dark-color-scheme iframe canvas (rendered as gray in the rounded card's transparent corners despite CSS background `transparent`). Deck Builder `body::before` retained its own page-wide decorative overlay in the embedded frame.

**Changes:** remove the extra border; report exact rendered card bottom from the embedded frame, observing font/art loading and late changes; force a light transparent iframe canvas (while keeping the dark Deck Builder content card); remove the embedded Deck Builder page's unrelated `body::before` decoration. The outer app modal/iframe/panel backgrounds and borders are transparent. No reparenting, no global transform/scaling changes.

**Browser measurements:** Chromium screenshots and DOM `getBoundingClientRect` tests of Event (`S0-EVT-008`), Skill (`S0-THF-015`), Hero (`S0-WAR-H001`), Item (`S0-ITM-018`), Legacy (`S0-WAR-L001`) at **1381×602, 1600×900, 1024×650, 820×580** — **20/20 renders**: internal review border 0px, viewport-fit, no JS errors, max measured card/frame mismatch 0.53px. Rounded-corner screenshots confirm removal of gray area external to review. In the comparable 1381×602 screenshot, the old near-top-left border pixel `(132,69)` was RGB `(97,97,101)` and RC20 was `(1,2,4)` (underlying darkened battlefield). Lower-left `(131,533)` was `(53,54,57)` and is now `(1,2,4)`.

## Casting and arrow tests

- Chromium read-only UI render fixture with two active Castings: first source Attachment and opposing locked lane violet, second source Attachment and lane teal. Checked actual `::before` lane colors; screenshot documented. Third active Casting amber in pure presentation test. Colors unchanged on repeated reads and after an unrelated Casting ends. A shared locked lane keeps two distinct colors represented.
- **14/14 arrow mappings** (7 card identities × player/opponent sides) match exact target zone/none and resolve to a live DOM anchor. Validated the existing no-arrow policy for Flashpowder Bomb and pre-existing Hero arrow for Freeze Bomb. Tests target the presentation-only mapping; these are not full end-to-end item card effect simulations.

## Separate pre-existing engine regression observation

`testGameplayFoundationFixes()` returned `{ok:false,reason:"Brilliant Radiance missing against Double Casting activation 1"}` on **both unmodified RC19 and RC20** in the same Chromium fixture. `testPlaytestManaRules()` and `testDefeatCastingCleanupRevive()` returned `{ok:true}` in both versions. `testUnbrokenStandClassRows()` returned all `false` on both versions. These are **not caused by the RC20 changes**; do not claim all gameplay regression tests passed. No unauthorized gameplay repair was made for these observations.

## Limitations / next tests

Native Firefox is not installed in the validation environment. Full hosted Firefox game play-through, actual live Event/Utility selection/AI histories and all stacked-response combinations have **not** been verified. For delivery QA, verify real Firefox Card Review for Hero/Skill/Item/Event/Legacy, two simultaneous Castings, and Event/Item arrows in an actual match. If any issue appears, investigate first per designer change-control policy.

## Source files changed

- `shared-app/db158-card-review.js` — iframe canvas/background/border/fit.
- `shared-ui/battlefield-ui.css` — palette styles and transparent Card Review wrapper.
- `shared-app/app-runtime.js` — Casting visual identity mapping + approved arrow target mapping.
- `README.md`, `docs/RELEASE_STATUS.md`, `docs/TAKEOVER_NOTE.md`, this report.

No engine data, OSA source, game rules, mana algorithms or gameplay card effects were altered.
