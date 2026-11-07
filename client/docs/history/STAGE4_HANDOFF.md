# GRANDIS LEGACY — VS AI SEASON 0 — STAGE 4 HANDOFF

**STAGE 4 DONE FOR DATA/ARTWORK/STARTER PACKAGING; NOT PLAYABLE; NO GAMEPLAY QA PASS.**

Source base: Original VS AI v6.91.9 with Stage 3 S0 DEV45 runtime data. Source OSA DEV45 read-only.

- Five official active starter presets from `Generated/Season0-Current/season0-current-starters.dev34.json` / Deck Builder v1.58 (Red-White; Blue-Red; Yellow-Blue; Green-Yellow; White-Green); all use 50 Main, 12 Mana, 12 Hero+Legacy, 3 progression packages. Historical provisional 3-deck JSON is NOT used.
- `engine/shared-app/active-starters.js` and `engine/starter_deck_examples` are now Season 0-only. Main Deck legality is **exactly 50 cards**. Ultimate eligibility reads the real S0 `is_ultimate` flag (Stage 3 `requirement.ultimate` was absent). Official starter Mana Deck list is honored rather than silently inferred.
- 248 SHA-verified S0 image fronts in **one** location `card-art/S0-*.webp`; 3 current verified backs in `assets/ui`. S0 class Mana artwork is mapped directly to the appropriate S0-MAN image, without copying Mana art twice. No S1 front art in this distribution. Engine and shared app UI now resolve these local paths.
- Stage3 source card names, ID, cost, printed effect branches, and effect data remain official S0 DEV45. No OSA/Deck Builder/PvP source changes. Original VS AI battle UI/effects/AI retained, apart from minimal resource-asset routing and deck/start setup.

**Outstanding for Stage 5:** new Discard-based CONDITION choice/commit UI using existing Permafrost/Escape Arrow pattern; agreed Casting progress UI 0 at play, +1 on own End Phase; Runeforged Burst Hit-trigger counter lock then mandatory next own Battle Phase release. These decisions have NOT been implemented yet.

**Caveats:** Original v6.91.9 S1 QA hooks inside `app.bundle.js` still contain S1 card fixtures, old deck sizes and old starter IDs; treat them as historical/inapplicable until targeted S0 QA is implemented. Stage 4 validates data, assets, and source syntax only; gameplay/runtime boot/AI not asserted.
