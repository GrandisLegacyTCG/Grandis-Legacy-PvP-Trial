# RC39 - Main Deck R3.7 + Conservative Code Audit and Trim

**Date:** 12 November 2026. **Parent:** RC38 Rank Up Root Cause Fix. **Status:** Playtest candidate.

> **Superseded / RC39 revised:** The first RC39 cleanup was rejected as a PvP
> donor baseline because it removed `pvp-adapter.js`. The revised release
> **restores and upgrades** this module. Only **four** unreferenced files remain
> trimmed. All active VS AI gameplay/Rank Up code is unchanged.
> PvP adapter unit QA: **17/17 PASS**. Current PvP server/network are not included.
> See `docs/pvp/RC39_PVP_DONOR_ADOPTION_CONTRACT.md`.

## Main Deck artwork

- **187/187** R3.7 Main Deck `.webp` files verified by Card ID and SHA-256, matching Deck Builder v1.65 byte-for-byte.
- Only **17 Archer cards** differ from RC38 R3.6, and these 17 files were replaced. Other **170** Main Deck art files, all Hero/Legacy art, Rulebook, card data and starter decks remain untouched.
- Regenerated active 248-entry art manifest, keeping image paths unchanged. No card mechanics have been changed.

## Actual duplicate declarations and safe trim

Found **four same-scope duplicates** in `engine/shared-app/app.bundle.js`:
`aiTurnDirectorAvailable`, `cancelAITurnDirector`, `aiDirectorSchedule`, `aiDirectorStatus`.
All first definitions were shadowed by the last definitions in the RC38 IIFE. Removed exactly the earlier, already-ineffective definitions and one prior duplicated `GL_AI_TURN_DIRECTOR` initializer. **The final functioning definitions were not edited.**

Additionally archived **four inactive source files**, with their exact original bytes:

1. `engine/shared-app/app.css` - obsolete stylesheet; active UI uses inline CSS and `shared-ui/battlefield-ui.css`.
2. `engine/shared-app/battlefield-authority.css` - no active entrypoint reference.
3. `engine/shared-ui/battlefield-ui.css` - legacy copy; the root `shared-ui/battlefield-ui.css` remains active.
4. `engine/js/mobile-app-nav.js` - old, unreferenced navigation file; live mobile presentation remains loaded.

Everything removed is preserved in `docs/trim/RC39_TRIMMED_CODE_ARCHIVE.zip` **and also delivered as a separate ZIP**, including `RC39_ALL_TRIMMED_CODE.txt`, original files/snippets and manifest. Approximately **413,083 bytes of obsolete live-tree source** removed (the archive remains separately available).

**Code collision audit:** 4 duplicated AI Director functions -> 0; 2 state initializers -> 1. One repeated local `var r` declaration in QA-only test logic remains intentionally; it is not conflicting code. AI gameplay source is unchanged by the adapter revision. The updated PvP adapter is an additional donor integration module, not part of the active VS AI entrypoint.

**Not trimmed on purpose:** anything in Rank Up event/animation flow, AI scoring, dynamic intent dispatch, review iframe, active style cascade, card rules, or functions exported for runtime use. A syntactic or name-count audit is **not proof** that all unused code is found; removing more would require independent call-path tracing and expanded browser regressions.

## Tests run after trimming

| Check | Result |
| --- | --- |
| Node/JS syntax for active sources | PASS |
| Mana and Beginner AI policies | **20/20 PASS** |
| Intermediate Mana Draw + loss notification behavior | **11/11 PASS** |
| Intermediate Tribute policy | **38/38 PASS** |
| Healing and deck import | **37/37 PASS** |
| Seeded 25-pair starter match simulation | **25/25 finished, 0 captured errors** |
| Rank Up browser authoritative transaction / Return EXP (Player + AI, Rank II + III) | **4/4 PASS**, all flights in each batch simultaneous |
| Changed + unchanged art files decoded by Chromium | **24/24 PASS** |
| Browser assembled from RC39 index markup + active script order; real 3v3 match start | **PASS**, zero JS exceptions |
| ZIP verification, file manifest, SHA-256 | Generated/validated in final packaging |

## Boundaries

- Chromium headless testing and deterministic Node simulations are not a guarantee of never seeing a Firefox timing bug. Firefox manual acceptance, especially simultaneous Rank Up Return EXP, remains recommended.
- Prior Rank Up fix's `RANK_UP_COMMITTED` transaction and animation code are **unchanged** in RC39.
- **RC39 hotfix:** Counter-style English Mana-loss notification is now driven by committed `MANA_LOSS_RESOLVED` events; see `RC39_TARGET_AND_MANA_BANNER_HOTFIX_NOTES.md`. Browser visual acceptance remains unverified.
- No GitHub push/submission was attempted.


## Revision after initial RC39 release

The original tables above describe earlier RC39 verification. In the later revised hotfix:
- Replaced the obsolete inline Mana-loss toast with the existing centered COUNTERED!-style banner, English copy, event-driven and one-per-commit.
- Updated Intermediate AI target priority: low remaining/max HP, Cleric healer pressure, and Warrior avoidance only while >60% HP and another legal target exists.
- Updated one prior fixed-CENTER test to compare alternative Class-row sources targeting the **same dynamically selected target**.
- New VM QA: target 12/12, Mana event/banner 13/13, Heal/Import 37/37, Beginner/Mana 20/20, Tribute 38/38, PvP Adapter 17/17; 25 seeded matches finished without recorded errors.
- No browser Firefox/Chromium visual replay performed for this later hotfix.
