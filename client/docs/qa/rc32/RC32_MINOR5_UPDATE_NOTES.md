# RC32 — Five Approved Minor Updates (7 November 2026)

**Release identity:** v1.0 RC32. These changes update the existing RC32 package without claiming a new RC or changing gameplay. The previous RC32 file is preserved separately for comparison. This is a RELEASE CANDIDATE, NOT FINAL.

## Changes

1. **Lobby:** Remove the horizontal divider between the two Hero deck panels and the Start Match row. Preserve the button layout, header, and spacing.
2. **Mana Deck artwork:** Replace ALL six `S0-MAN-001` through `S0-MAN-006` front faces from the designer-supplied `GL_S0_ManaDeck_R2.rar` archive. Preserve Card IDs, class mappings, backs, rules, quantities, costs, and other card art.
3. **Hero EXP edge:** Correct the READY Hero EXP 100/200 strip overhang along the bottom, using the production battlefield EXP CSS/geometry. Keep approved horizontal offset, Hero-over-EXP stacking order, four-card capacity, and Exhausted orientation.
4. **Mana Regen in actual Battlefield:** The real `.zone[data-zone-type="Shard Deck"]` renderer now shows the `REGEN`/`+N` text badge instead of the old numbered coin, for player and AI. Desktop sizes 9px/12px and deck counters 13px; mobile/adaptive sizes remain compact 7px/10px and deck counters 12px.
5. **Notification duration:** `RACIAL TRAIT!` is 2000 ms, equal to the existing `COUNTERED!` 2000 ms. Preserve queue behavior.

## OSA boundary and manifests

Only local VS AI art assets are replaced. Historical OSA consumer exports and their original R1 hash manifests are retained unchanged so they are not misrepresented as fresh OSA authority. The local R2 artwork overrides, new checksums, and old checksums are listed in `RC32_MANA_DECK_R2_OVERRIDES.json`. **An OSA-R1 SHA parity check over the now-overridden six images is expected to fail**; it is not evidence that the image files are corrupt. Update upstream OSA only via an independently approved OSA change.

## Validation status

Targeted syntax, resource-integrity, metadata, and isolated Chromium DOM/CSS tests are recorded in `RC32_MINOR5_QA.json`. An isolated browser render is not a full natural Human-vs-AI match. Native Firefox and full natural match remain **NOT VERIFIED**.
