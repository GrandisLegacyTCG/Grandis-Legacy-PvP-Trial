# RC38 auto Mana Deck override - 12 November 2026

## Approved scope

- **Only VS AI RC38** constructs the active 12-Shard Mana Deck from its chosen Hero progression packages, for each side independently.
- One Color Mana Shard per distinct Base Class represented by the selected Heroes, including both Base Class families of any Hybrid progression; the balance is Regular Mana. No 3-Color cap.
- `mana_deck` and `shard_deck` from any imported JSON are **not authoritative**, irrespective of how those JSON Mana values are configured. Both `PLAYER` and `AI` receive the same normalization policy. The source JSON remains unchanged on disk.
- Main Deck, Legacy Deck, Hero package and formation validation remain unchanged. Import remains Intermediate-only.
- Mana values, spending, regen, return, and Ultimate Tribute requirements are unchanged.
- This auto construction is an app-specific choice within the general Player Rulebook v3.2 allowance, not a change to the Rulebook or Deck Builder.

## Engine change

- `normalizeDeck` replaces Mana fields in the *normalized in-app copy*. This prevents invalid imported Mana rows from blocking otherwise-legal decks.
- `buildManaDeckForDeck` regenerates physical Shards directly from selected Hero base Classes, even when called with an unnormalized custom deck.
- Starting Mana Pool still draws physical cards from this effective Mana Deck normally.

## Tested cases

- Five official starters retain the same effective Mana composition.
- 3 Hybrid progressions spanning 5 Base Classes: 5 Color + 7 Regular.
- Player and AI custom imports where the JSON Mana colors contradict the selected Heroes.
- JSON with 12 Regular, duplicated colors, out-of-Class color, oversized total, malformed Mana field, missing Mana field, and nested Deck Builder shape.
- Negative control: malformed Main Deck is still rejected.
- Beginner/Intermediate AI decision-policy smoke remains unchanged.

Automated test results are stored in `RC38_CLASS_MANA_BEGINNER_MUSIC_RESULTS.json` and any additional suite artifacts produced for this patch.

No GitHub upload was attempted.

## Local RC38 patch regression results (12 Nov 2026)

- Automatic Mana + Beginner policy Node: **20/20 PASS**.
- Heal/Import Node: **37/37 PASS**.
- Intermediate Tribute Node: **38/38 PASS**.
- Browser Mana/Beginner/Music (including contradictory imported Hybrid Mana for both sides): **15/15 PASS**.
- Browser Lobby real JSON import: **14/14 PASS**.
- Browser Intermediate Heal: **16/16 PASS**.
- Stage4 runtime deck guard updated for new Mana authority: **5/5 starter and negative-control sets PASS**.
- Five original 2026-11-11 Deck Builder v1.64 JSON exports: **5/5 imports**, physical Mana checked for both Player and AI.
- Stage7 simulated starter matches (Intermediate, five different starter pairings): **5/5 completed with 0 errors**.
- JavaScript syntax check: PASS.

Historical `check-stage4-assets-starters.cjs` still compares the current R3.6 starter compositions against a **superseded dev34 provisional starter source**, and fails on the original Main Deck data even though the five designer-supplied exports pass the current checks. It is **not** treated as an active RC38 regression gate. It was not modified to hide this mismatch.

These tests cover source/runtime and scripted browser/game flows, not exhaustive human playtesting.
