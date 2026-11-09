# Grandis Legacy PvP - RC36 Patch 4 UI Hotfix 1

Date: 9 November 2026. **STAGING / QA**, not final or production-certified.

## Scope

Source archive: `Grandis_Legacy_PvP_S0_RC36_Patch4_Network_RC6_Stage2_Lightweight_2026-11-09.zip`.
Visual donor: `Grandis_Legacy_VS_AI_Season0_v1.0_RC36_Patch_4_2026-11-09.zip`.

The user reported regressions in lobby Hero Review, Coin Flip controls/art, blank board after opening, duplicate opponent Mana, and responsive lobby. This update fixes those source-level issues and reuses existing approved VS AI visuals. It does **not** add AI gameplay, BGM, new HUD controls, or change existing PvP action authority.

## Root causes and changes

| ID | Issue | Source evidence and fix |
|---|---|---|
| UI01 | Hero click opens bespoke progression, not approved review | `public/pvp/pvp-host.js` routes Hero click to the donor `GL_DB158_REVIEW.mount` with 3-rank lineage. `public/pvp/db158-card-review.js` is copied from VS AI RC36 with the base URL adjusted to existing `/battle/` asset paths. Source card data lives in `public/pvp/s0-lobby-review-catalog.js`, 45 Hero and 10 Legacy records. Original donor review CSS rules in `public/lobby/pvp-card-review-rc36.css`. |
| UI02 | Extra Return to Lobby on Coin Flip | Removed PvP-only `glPvpCancelCoin` DOM injection in `public/battle/shared-app/app-runtime.js`; no change to server pregame timeout logic. |
| UI03 | Coin artwork / UI outdated | `public/assets/ui/Racial-Token-{Head,Tail}.webp` synchronized with approved VS AI RC36 donor. PvP coin result uses donor's `gl-coin-single-result` markup. `public/battle/shared-ui/mobile-landscape-lobby.js` reused from donor for mobile coin viewport. |
| UI04 | Battlefield empty after Coin Flip | `initSoundSettings()` dereferenced absent `glMusicSwitch`, throwing before `GL_GAME_UI` registration. Guarded optional Music switch; SFX switch remains. No new BGM. |
| UI05 | Opponent Mana appears in extra panel at top-right | Reverted custom `OPPONENT MANA` badge and its repositioning. The face-down Mana pool remains in the same opponent field placement as VS AI RC36 (required for shared card mechanics). |
| UI06 | Mobile lobby collapsed into a different design | Added presentation-only `pvp-mobile-desktop.js` and CSS, reproducing the desktop two-column DOM on mobile touch devices in a fitted/rotated landscape canvas (desktop itself unaffected). |
| NET01 | Lite fallback socket can disconnect when payload length is exactly 127 bytes | `server/ws-lite.mjs`: conditional for 64-bit payload length is now `else if`, so a decoded 16-bit length of 127 is not misinterpreted as a new 64-bit framing discriminator. Native `ws` transport unaffected. |

## QA and release constraints

- `npm run check`: PASS, including S0 rules, RC5 Mana, both-seat Response, server-authoritative turn flow, viewer privacy, reconnect, postmatch, Stage 2 socket and batch tests.
- `npm run test:rc36-ui-hotfix`: PASS, including source-level review card lookup and 55-card inventory, latest coin asset parity, absence of custom HUD controls, mobile presentation preservation, and 127-byte RFC6455 framing fix.
- `npm run build:precompress`: PASS; `.br` / `.gz` sidecars regenerated from source.
- **Not verified:** Browser-level live rendering (the local Chromium browser blocks page navigation by administrator policy), real two-device multiplayer gameplay or screenshot comparison, and Northflank/native-ws production tests.
- **No GitHub actions performed.** Upload and deployment remain manual. Do not publish as a production final until end-to-end visual QA passes.
- Prior known network risks (spectator cleanup and half-open watchdog) are outside this UI hotfix; they should be tracked separately rather than silently classified resolved.

## Browser smoke-test steps (human QA)

Open the same hosted room in separate device/browser sessions (not two tabs sharing a session). Verify the three lobby Heroes each open the original VS AI review with ranks I/II/III and close control. Confirm the mobile lobby preserves the same two-column desktop controls/formation. READY on both players, run Coin Flip and verify current artwork and no Return to Lobby button. Confirm both players' 3 Heroes, hands, and starting Mana appear after opening; after the server passes the initial Draw Phase, the other player's view must stay synchronized. Verify opponent Mana is still visible face-down only in the original VS AI position and no new label/panel appears at top-right. Check SFX works and BGM is absent. Finally test a Response and a reconnect.
