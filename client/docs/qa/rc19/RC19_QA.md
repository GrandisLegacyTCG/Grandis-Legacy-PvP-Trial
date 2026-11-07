# RC19 — Targeted fixes, QA, limitations

**Baseline:** VS AI Season 0 v1.0 RC18. **Authority:** OSA S0 DEV45 (read-only) and Player Rulebook v2.9. **No modifications** to other Grandis Legacy apps or canonical data.

## Changes implemented

1. **Magic Compass**: Preserve existing 7-card columns/width; increase vertical space to accommodate 2–3 rows and scroll when necessary. Short-screen CSS bounds remain.
2. **Deck Builder Card Review**: Reduce panel max width from 1280 to 1120 px, remove excess gray outer surface, and fit frame height to real rendered review content by iframe-to-parent resize message. Retain isolated Deck Builder v1.58 renderer and Season 0 card data.
3. **AI Mana Pool**: Keep existing right-to-left addition positions. Correct z-index so the leftmost physical card displays in front; payment and Mana ownership unaffected.
4. **Korvak HP overlay**: Prevent Rank Up CSS opacity from hiding any living Hero HP; clear stale Rank Up transition flag if animation props are gone. **Specific screenshot issue was not reproduced in an end-to-end Firefox match.** No HP/damage engine mechanics changed.
5. **Poison Vial**: Designer clarification controls: `Physical Attack` is card **subtype**, not damage type. Only Skill subtype Physical Attack qualifies (including Dual Arrow if its printed subtype is Physical Attack); an Area Attack dealing Physical is NOT eligible. Leave independent hit/HP-damage semantics unchanged pending separate ruling.
6. **Chain Mail / defensive arrows**: During Response choice/commit, a Defense Skill or Protection Item uses exactly one Active Card → protected Hero arrow. Prevent resolved Protection Item events with attacker metadata from emitting a bad arrow. No game target/response change.

## Evidence

- Chromium browser: Card Review opens/closes, panel fits card content at desktop/compact/touch/portrait viewport sizes; no JS page errors in tested fixtures.
- Magic Compass: synthetic 21-candidate DOM grid confirms **7 columns and 3 rows**, vertical scrolling if viewport is short. Full real-game select/Search/Shuffle not re-run in this CSS-only layout fixture.
- AI Mana: leftmost card is top z-index at four viewports; positions remain right-to-left and within Pool boundary.
- Poison Vial: 8 subtype classification checks using the actual S0 engine helper; Physical Attack true, Physical Area Attack false.
- Defense: targeted mocked response-frame test on actual RC19 UI routing validates Chain Mail & Brilliant Radiance protect PLAYER LEFT; history attacker-facing Protection arrow suppressed. Does not substitute for a complete nested Firefox Response test.
- Existing regression hooks: RC17 Swap **40/40 PASS**, target **13/13 PASS**, Ultimate Tribute **30/30 PASS**, Class/Lineage **6,975 cases PASS**.
- No OSA mutations or version changes to unrelated apps.

## Open after RC19

- Reproduce Korvak's exact missing HP bar sequence in normal Firefox gameplay and inspect lane classes/DOM/visibility at failure frame. RC19 prevents the *known CSS suppression* but this does not prove it was the screenshot's only cause.
- Real match through Win/Loss/Draw (not Surrender), including multi-target/nested Response UI, Defense item arrows, Magic Compass, Poison Vial, and draw animations.
- Retest compact/mobile and Firefox specifically; Chromium geometry passes do not prove all browsers.

**Release status: RELEASE CANDIDATE, not FINAL.**
