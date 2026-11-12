# Grandis Legacy Season 0 - RC38 Mana Deck Rule Addendum

**Approved designer policy, 11 November 2026. Applies to VS AI RC38.**

This document describes an **RC38 app-specific deck-construction restriction**, not a replacement for the general Player Rulebook v3.2. The updated Rulebook permits any Color Mana color (maximum one per color); RC38 deliberately offers only the subset matching selected Hero Base Classes. Payment and gameplay rules stay unchanged.

## Active behavior from the RC38 auto-Mana override patch (12 November 2026)

RC38 now always computes the **effective** Mana Deck from the three Hero progression packages selected for that side. The calculation adds **one Color Mana per unique represented Base Class** (for Hybrid progressions, both Base Classes), then fills the remaining slots with Regular Mana to exactly 12. It applies to BOTH Player and AI, all starters, and every custom deck. Any `mana_deck` or `shard_deck` from imported JSON is ignored/replaced in the in-app copy, even when the JSON list has different colors, duplicate colors, an incorrect total, or malformed Mana rows. The original JSON file is unchanged.

This is an app-specific automatic deck construction policy; the Rulebook and Deck Builder may permit more general manually selected Color Mana combinations. The Hero, Main Deck, Legacy Deck, and formation are still validated normally. The previous optional/manual policy below is retained only as historical context and is **superseded** by the automatic composition for VS AI.

## Historical RC38 Mana eligibility policy (11 November 2026; superseded in-app)

- Build exactly **12 Mana Shards**.
- You may include Color Mana only for **Base Classes represented by the three selected Hero progression packages in the Legacy Deck**.
- For a **Hybrid Hero progression**, either or both of that Hero's two Base Classes are eligible.
- **Maximum 1 Color Mana Shard per Class/color** in the same Mana Deck. A Class may be represented only once even when multiple selected Heroes share it.
- **There is no overall maximum of 3 Color Mana Shards.** A team representing all five Classes may include one of each, for **5 Color Mana + 7 Regular Mana**.
- Color Mana of an eligible Class is **optional**. Fill all remaining slots with Regular Mana to reach 12.
- The cards selected as **Ultimate Cards do not determine which Color Mana may be included**.

Examples: a team representing Warrior, Cleric, Archer, Thief, and Mage may select 0 to 5 Color Mana (one per eligible Class). A team of only Warrior and Cleric progressions may not include Mage Color Mana. A Color Mana duplicated for the same Class is invalid.

**Unchanged:** A matching Class Color Mana Shard is still required to Tribute an Ultimate. Matching Class Mana still has its ordinary payment value for matching Skill costs; other Mana payment, Draw/Regen, and Return Cycle rules are unchanged. The Ultimate owner and matching-shard conditions are not waived.

## Implementation authority

- In this RC38 VS AI build, `engine/shared-app/app.bundle.js` computes allowed classes from the selected Hero progression packages (including both Hybrid Base Classes). Custom deck import validation and automatic Mana Deck fallback both use that same eligibility list.
- Five built-in starter compositions and default formations are unchanged by this addendum.
- **Deck Builder v1.64 is a separate product.** Its manually assembled Mana Deck permits any color under the general Rulebook. RC38 deliberately restricts imported Mana colors to selected Hero Base Classes. These are different product-specific acceptance scopes, not conflicting Mana payment rules. The current Rulebook v3.2 PDF is embedded in this package.
