# RC36.8 PvP Trial — Mobile Orientation + Waiting for Opponent Response (Hotfix 2)

## Baseline
- Source: `Grandis_Legacy_PvP_S0_RC36_Patch4_Gameplay_Sync_RC36p8_2026-11-09.zip`.
- Target: `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` **only**. Upload/extract/commit by user; assistant never pushes to GitHub.
- Existing RC36.8 rules/game engine, card definitions, RC5 Mana, RC6 Stage 2 network transport and desktop art/layout are **not modified**.

## Fix 1 — Portrait mobile popups/VFX align to the battlefield
Previously the responsive stage rotated **only `.app`**, while `document.body` remained untransformed. All runtime popups, overlays and animation layers portaled to `body`, so on portrait phones they were sideways relative to the board and used the physical portrait screen geometry. The source fix:
- Rotates the mobile **live-game body** instead of the game `.app` alone, at the same 1600 × 747 logical stage and scaling. The body becomes the containing block for screen-space `position:fixed` portals; UI appears in the same orientation and scale. Desktop stays unchanged.
- Coin Flip and initial lobby remain handled by existing separate VS AI scripts; the body stage activates only after live gameplay becomes visible.
- Converts UI rectangles back to logical stage space via the inverse body `DOMMatrixReadOnly` for card flight, attack line placement, hover previews, and popups. Closes coordinate drift without rewriting the gameplay engine.
- Fixes popup/payment/max-height geometry to use logical 1600 × 747 dimensions, not 390 × 844 portrait viewport units.
- Device physical rotation is not forced: the CSS canvas works while orientation lock is unavailable (iOS/Android browser restrictions).

## Fix 2 — Opponent Response status
- Player with pending opponent-owned Response sees `WAITING FOR OPPONENT RESPONSE...`, without obscuring taps or providing an extra action.
- Uses **viewer-safe** `appState.responseWindow.response_owner === 'AI'`, or masked `pending.decision_side === 'AI'` with a `response_payment_choice`. Never inspects opposing cards/options or uses speculative client state.
- Immediately clears on authoritative state transition/Response resolution, coin, setup, game result, spectator role or disconnect. Older-revision snapshots do not override the visible notice.
- Does not alter attack/response timing, prompts, commit logic, server validation, protocol, or card rules.

## Build/cache
- New `BUILD_ID`: `gl-s0-pvp-rc36p8-mobile-response-hotfix2-2026-11-09` — ensures clients reload new CSS/JS on Northflank deployment and reconnect to matching server versions.
- New CSS `public/battle/runtime/pvp-mobile-landscape-fix.css` is loaded after the canonical donor `battlefield-ui.css`; no donor UI files are changed.
- `.br`/`.gz` sidecars regenerated with `npm run build:precompress`.

## QA and boundaries
- `npm run check`: PASS, including `test:rc36-mobile-waiting`, all existing network/Response/mana/privacy and RC36 Defense source tests.
- Headless Chromium CSS+DOM fixture: 390×844 portrait, 844×390 landscape, 1440×900 desktop; validates popup and game stage bounds; logical UI rectangle inverse verified numerically.
- Not tested: live simultaneous device gameplay with Northflank; iOS Safari visual viewport, hardware orientation changes mid-Response, and performance of every gameplay animation. These require actual user device testing.
- PvP Trial only; do not promote to main until confirmed.
