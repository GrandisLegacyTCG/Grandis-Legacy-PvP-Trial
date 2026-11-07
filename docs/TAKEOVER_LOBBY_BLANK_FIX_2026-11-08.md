# PvP S0 RC32 — Lobby blank page fix (staging)

**Baseline:** `Grandis_Legacy_PvP_S0_RC32_S1_Lobby_Network_Only_S0_HeroPreview_2026-11-08.zip` (verified same `public/pvp/pvp-host.js` as extracted staging).

**Authorization/scope:** Fix lobby blank on launch, without modifying the underlying gameplay, UI visual design, room/seat protocol, coin flip, or releasing a new package.

## Root cause: CONFIRMED

`public/pvp/pvp-host.js` exported `openingPresented` on `window.GL_PVP_HOST` after `openingPresented()` had been removed from the lifecycle. Since JavaScript evaluates object shorthand values during export, that reference throws `ReferenceError: openingPresented is not defined` before boot creates `#pvpSetupOverlay`.

**Fix:** Removed the obsolete shorthand property from the host API export only. Kept `coinPresented` and `confirmCoin`, which the RC32 coin presentation uses. Did not reintroduce an `opening-presented` protocol action or invented opening UI.

## QA actually performed

- **FAIL (baseline, Chromium injection smoke):** `openingPresented is not defined`; no `window.GL_PVP_HOST`; lobby overlay count 0.
- **PASS (fixed, Chromium injection smoke):** no page errors; `window.GL_PVP_HOST` present; `#pvpSetupOverlay` present with `.open`; starter deck and room UI rendered after injecting local styles. This test injects app script/style bytes into a Chromium page because normal HTTP/file navigation is administratively blocked in the testing environment. It does not verify hosted asset loading or real live WebSocket UI connection.
- **PASS (`npm run check`):** JS syntax, S1 CSS/UI source parity, **new VM top-level export regression**, S0 starter catalog, live server WebSocket two-seat pregame → RC32 coin transition.
- **NOT VERIFIED:** Northflank deployment, browser loading from a real HTTP server, complete two-browser gameplay and final combat victory.

## Changed files in staging

- `public/pvp/pvp-host.js`: one obsolete API property removed.
- `tests/lobby-init.mjs`: new regression verifying `GL_PVP_HOST` initializes and its public methods exist, without stale `openingPresented`.
- `package.json`: include regression in `npm run check`.

**Release:** None. Baseline unchanged. For existing GitHub deployment, the functional fix can be applied by replacing `public/pvp/pvp-host.js` with the staging copy; test and package changes are recommended to prevent recurrence.
