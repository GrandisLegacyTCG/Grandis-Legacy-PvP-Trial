# RC38 / Deck Builder v1.64 compatibility review and Rulebook package refresh

**Later patch, 12 Nov 2026:** RC38 now generates Mana from selected Hero progressions on EVERY import, and disregards the JSON Mana composition entirely. The original manual eligibility comparison below documents the state **before** this later patch; see `docs/qa/rc38/RC38_AUTO_MANA_OVERRIDE_2026-11-12.md`. The five official starters still match because their compositions are already Hero-derived.

Date: 2026-11-12. Scope: offline source review and automated tests; no production browser deployment.

## Compatibility review
- All five official starter compositions, their Mana Decks and default formations match between the Builder v1.64 bundled starter JSON and RC38 `engine/starter_deck_examples`.
- RC38 supports the Builder v1.64 draft export shape (`deck`, `legacy_packages`, `shard_deck`, `default_formation`).
- RC38 app-specific restrictions remain deliberate: imported Color Mana must match selected Hero Base Class (Hybrids permit both). Deck Builder's general manual deck legality is broader. This is an intentional subset, not a gameplay-rule contradiction.
- Deck Builder v1.64 additionally restricts Hero selection to at most two Heroes of the same Rank I Base Class. RC38's validator does not enforce the same construction limit; a deck created by the Builder already complies. Treat as app-scope difference, not grounds to silently change RC38.

## Package refresh
- Replaced the embedded v3.2 Player Rulebook PDF with the latest user-uploaded file. The prior embedded PDF still said Color Mana was selected from Ultimates; the replacement says any color, maximum one of each.
- Updated the RC38 addendum and CURRENT_RULEBOOK to identify Hero-based Color Mana as an app-specific restriction, not a conflicting supersession of the general Rulebook.
- No rules engine, starter composition, or AI behavior changed.

## Local checks
- Deck Builder `npm run check`: PASS.
- RC38 `RC38_CLASS_MANA_BEGINNER_MUSIC_QA.cjs`: 16/16 PASS.
- Static starter comparison: 5/5 exact composition, Mana, formation match.


## Second verification pass (2026-11-12)
- ZIP CRC/integrity check: passed. Embedded Rulebook PDF is SHA-256 identical to the latest uploaded v3.2 PDF (`614ed388f24ba64914710fde2410c9f74be353d0ef61f274a224b250958027d1`).
- Deck Builder v1.64 `npm run check`: passed. All five original exported Starter JSONs independently passed RC38 `validateDeck` (50 Main, 12 Legacy, 3 packages).
- RC38 active QA rerun: Class Mana/Beginner 16/16; AI Heal/Import 37/37; Intermediate Tribute 38/38; Chromium Mana/Beginner/Music 13/13; Beginner scripted 9/9; Intermediate scripted starter pairs 25/25; active engine/runtime JavaScript syntax valid.
- This is a **source and automated QA check**, not a full deployment or natural-player acceptance test. The browser QA uses an assembled/inlined HTML test harness; direct browser navigation to local or localhost files was blocked by this review environment, so it was not certified.
- The rechecked package also fixes outdated current-authority wording in the README and RC38 release notes. No rules engine, card content, starter composition or AI files were changed.
