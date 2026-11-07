# Grandis Legacy VS AI Season 0 — RC22 targeted UI corrections

Date: 2026-11-05. Baseline: immutable `Grandis_Legacy_VS_AI_Season0_v1.0_RC21_2026-11-05.zip` (user-provided copy with `(1)` suffix). Scope is exactly the three designer-approved UI corrections. OSA Season 0 DEV45, VS AI gameplay bundle, card data/art, Deck Builder and other apps are not edited.

## Changes

1. **Hero right-side Class/other ability buttons** — RC21 mistakenly imposed `100 x 30px` on long names and still permitted two-line wrapping. In RC22, all button heights follow the same **20 CSS-pixel** single-line box (`white-space:nowrap`), while short-name button widths remain natural; a long label does **not** enlarge shorter buttons. Removed the hard-coded long-name width/height override via more-specific appended CSS. The actual side-column width is retained; runtime measures the label text against that space and reduces **only** the font size when needed. This also covers `Human Ambition`, `Prolonged Symphony`, and `Orchestral Crescendo` (and other Hero action labels). The class/racial/legacy action click handlers and timings are unchanged. At small/scaled layouts the available side column can force very small text; all names still have their full title tooltip. No button is enlarged vertically.
2. **Quick Reload/Rapid Chamber center screen** — added only a `20px` CSS top margin to the two action buttons (`KEEP CARD`, `SHUFFLE & REDRAW`) below the single drawn card, scoped to `body.gl-center-draw-replacement`. The card remains unselectable and the authoritative Draw replacement method is unchanged.
3. **Lobby Hero Review wheel scrolling** — in the isolated Deck Builder review iframe, remove inherited scroll-chain blockers on `.review-card`/`.review-rows` (`overflow:visible`, `overscroll-behavior:auto`) and allow wheel propagation through the review layout/detail column. Keep the iframe and its current actual Deck Builder v1.58 view, all 3 Hero Lineage thumbnails, original modal geometry and close/rank logic. When the review is taller than the iframe, the iframe document scrolls instead of clipping the bottom content.

## QA

- JS syntax: `node --check` on `shared-app/app-runtime.js` and `shared-app/db158-card-review.js`: PASS.
- Read-only UI harness: Chromium loaded the actual production `index.html`/CSS/JS through intercepted local in-memory static routes (rather than native localhost/file navigation). 3 desktop/compact screen sizes: **1600×747, 1024×650, 820×580**. No page JS errors or missing source assets in these routes.
- Right-side ability buttons: five representative names, including `SKIP`, `HUMAN AMBITION`, `PROLONGED SYMPHONY`, `ORCHESTRAL CRESCENDO` and an especially long stress-test name. At all 3 viewport sizes: identical heights within each viewport, `white-space:nowrap`, text fits the measured content box, short buttons remain narrower, no multiline growth. The application scales its battlefield on smaller viewports, so visual heights were 20/17/15px respectively while CSS-defined height remains 20px for all buttons in each case.
- Quick Reload UI fixture: one centered card, exactly two original action labels; card-to-button visual gap **38.9, 24.0, 25.4px** at the three viewport sizes respectively (after RC22 margin). No mechanics are executed by this geometry fixture.
- Actual Lobby Review: for each view, opened real Hero Review, clicked Rank II and III lineage thumbnails and verified three thumbnails persist. Mouse wheel scrolled the iframe document to the bottom when overflow existed: **80px** on 1024×650 and **150/171px** on 820×580. At 1600×747, all content fits, so scroll range is zero. Inner `×` closed the review.
- Machine-readable per-viewport evidence: `RC22_UI_QA.json`.

## Boundaries / risks

- Full normal browser Human vs AI playthrough until Win/Loss/Draw remains **UNVERIFIED**; RC22 is still **RELEASE CANDIDATE, NOT FINAL**.
- True Firefox rendering, narrowest mobile layouts, real in-game Hero action affordances under all response/hover states, and real Draw-replacement transaction were not reproduced in this QA. A synthetic five-button fixture exercises the production CSS/font-fitting function but is not a normal match. The existing engine is byte-identical to RC21.
- Extreme names at very narrow side columns can become hard to read because the designer requests a single line without enlarging buttons; the tooltip retains the full label. Do not address this by silently changing UI geometry in a future version.
