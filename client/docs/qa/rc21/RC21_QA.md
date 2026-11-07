# RC21 — QA and release status · 2026-11-05

## Scope & source control

- Immutable source baseline: `Grandis_Legacy_VS_AI_Season0_v1.0_RC20_2026-11-05.zip`.
- Scoped runtime edits: `shared-app/app-runtime.js`, `shared-app/db158-card-review.js`, `shared-ui/battlefield-ui.css`.
- OSA S0 DEV45, OSA S1, Deck Builder v1.58, PvP and all card artworks: **UNCHANGED**.

## Approved RC21 changes

1. **Lobby Hero Review parity (#6)**: clicking a Hero package in Lobby now launches one Deck Builder v1.58 review with 3 clickable `HERO LINEAGES` rank thumbnails; rank selection swaps detail/art in same review. Retains RC20 transparent outer frame. Footer is intentionally Lobby-only. Responsive overflow now scrolls in iframe when rank III content is taller than viewport.
2. **Long Hero Skill button (#7)**: names longer than 14 characters get reduced font inside a 100×30 CSS-pixel long-name-only button (86px width at ≤820px). Art, other short actions, and card detail typography stay unchanged. This targets the upper-right Hero ability label in the screenshot.
3. **Targeted Hero HP (#8)**: Response target Hero's lane gets z-index 955, above other lit source Hero lanes (950); target's own HP overlay sits at 1300 inside that lane and stays unrotated. No HP value/state mutation. A live native Firefox overlapping action has **NOT** been reproduced/verified; see limits.
4. **Arbalest / Grand Arbalest center choice (#9)**: only the single engine `drawn_card_id` appears in the shared dimmed center-stage, no Hand multi-selection and no select/deselect on the card; actions KEEP CARD and SHUFFLE & REDRAW invoke existing `commitDrawReplacementChoice()` engine transaction. Inline Hero choice duplicate is suppressed; Rank III passive and Draw This Turn unaltered.

## Browser QA observations (Chromium policy-safe inline harness)

- Local sandbox browser blocks normal `file:`/localhost navigations; instead an **inline-source Chromium fixture** loaded production JS/CSS with source paths rewritten only in the test harness, without modifying packaged sources. Artwork network requests blocked in this harness, so the test validates DOM/logic/layout and cannot prove actual art rendering fidelity.
- Lobby first Hero Rank I (`S0-WAR-H004`) → HERO LINEAGES visible, **3 rank controls**, 1 active; switch to Rank III `S0-WAR-H006` updated detail and active control; **no page JS errors**. Tested at 1566×738 and 1381×602. On short viewport, embedded document scrollY advanced to 106px with footer accessible; tested at 1381×602.
- With a simulated legitimate pending `draw_replacement_choice` built from a production snapshot via temporary `getSnapshot` override, center stage showed **exactly 1 card, 0 clickable cards, 0 selected cards**, and **KEEP CARD / SHUFFLE & REDRAW**. No engine state mutation in that DOM probe.
- CSS stacking path **computed in Chromium** with focus classes activated: other lit lane `z-index:950`, targeted lit lane `z-index:955`, targeted HP overlay `z-index:1300`, HP `opacity:1` (6 lanes mounted). Full overlapping Response screenshot replay is **NOT proven**.

## Engine regression results (same Chromium inline harness)

| Check | RC21 observed |
|---|---|
| Draw reservation and Quick Reload decision/mana continuation | PASS |
| Target Selection | PASS 13/13 |
| Ultimate Tribute | PASS 30 successful cases |
| Mandatory/optional Swap | PASS 40 checks |
| Class/Lineage | PASS 6,975 |
| Browser JS errors in harness | 0 |

**Do not overclaim:** no normal end-to-end Firefox match; no full Quick Reload/Grand Arbalest user-click sequence with actual cards and animation; no real visual recheck of HP occlusion during response animation, though z-order change was applied. Legacy Brilliant Radiance/Double Casting historical failure remains outside RC21 scope.

## Changed files & compatibility

- `shared-app/app-runtime.js`: lobby review dispatch, rank switching messages, draw-replacement center stage, action-label adapt, target focus HP stacking class.
- `shared-app/db158-card-review.js`: optional rank thumbnail/footer and iframe scrolling; maintain RC20 transparent shell.
- `shared-ui/battlefield-ui.css`: one-card centered presentation, long label hitbox, target HP stacking.
- Documentation: README, `docs/DEV_NOTES_01-20.md`, `docs/TAKEOVER_NOTE.md`, this QA file.
- **Engine gameplay bundle not changed**; data and art unchanged.

**Status:** RC21, not FINAL. Run an actual Firefox match, especially on mobile/short viewport and two+ simultaneous Casting, before Final certification.
