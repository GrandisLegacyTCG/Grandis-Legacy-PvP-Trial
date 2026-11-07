# Grandis Legacy VS AI Season 0 — Stage 4 Targeted QA

**Scope:** authoritative Season 0 Starter Decks, official card artwork, and source-level/deck-engine validation. **Not** gameplay certification.

## Actual PASS checks

- `node runtime/season0-generated/check-consumer-stage3.cjs`: 7 DEV44 SHA256 pinned exports; 248 unique S0 catalog IDs; 242 non-Mana card records; 426 printed branches; 36 complex bindings; 45 Hero.
- `node runtime/season0-generated/check-stage4-assets-starters.cjs`: all 5 current DEV34 starters match approved Deck Builder v1.58 source; each 50 Main + 12 Mana + 12 Legacy Deck, 3 Hero progressions. All 248 official card-front assets and 3 backs SHA256 match active OSA records. All 251 hashes are distinct within the **active** distribution. No S1 `card-art/S1-*` files retained.
- `node runtime/season0-generated/check-stage4-engine-deck-guard.cjs`: executed **extracted actual** `app.bundle.js` `validateDeck()` and `buildManaDeckForDeck()` functions in restricted Node VM: all five official S0 starters accepted; 49, 51 Main rejected; duplicate Ultimate rejected; duplicate Special Event rejected; 13 Mana rejected; exact S0 Mana face classes supplied by starter preserved. Does not assert browser/UI behavior.
- `node --check engine/js/static-data.js`; `node --check engine/shared-app/active-starters.js`; `node --check engine/shared-app/app.bundle.js`; `node --check shared-app/app-runtime.js`: syntax PASS.

## Not verified

Headless Chromium attempt timed out without providing a usable DOM/result; browser boot is **UNVERIFIED**. Actual UI rendering, effect routing, AI decisions, and a complete Human vs AI game remain **UNVERIFIED** and must not be reported as passed. Legacy self-tests originally written for S1 v6.91.9 still refer to S1 cards/60-card decks and are not valid S0 acceptance checks.

## Known unfinished features

The existing effect handlers still use Season 1 hardcoded ID routes for multiple cards. Stage 5 must wire S0 effects and card-specific conditions before attempting actual gameplay certification. Designer-confirmed future Casting behavior: progress `0` shown at play, +1 on own End Phase, release during appropriate own Battle Phase, and Runeforged Burst Hit-trigger forced release locked until the next own Battle Phase. Discard-zone CONDITION selection/commit remains to be added reusing existing CONDITION flows.
