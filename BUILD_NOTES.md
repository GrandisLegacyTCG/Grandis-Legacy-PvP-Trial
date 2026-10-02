# Grandis Legacy PvP v3.70 — Build Notes

Build date: 2026-10-02

## Locked architecture

- Fresh PvP branch built from the updated **Grandis Legacy VS AI v6.80** package.
- PvP v3.51 is **not** the gameplay/battlefield base; it is used only as the lobby/server/network reference.
- One fixed room: `GRANDIS_PVP`.
- Two human player seats only.
- Spectator / Teaching View parked (`maxSpectators: 0`).
- No room switching, `Go To`, or `Switch To` controls.
- Battlefield identity is two-line: local **Player Name / Deck Name**, opponent **Deck Name / Player Name**. Desktop limit is 25 characters per line; phone/tablet is 20.
- Connection signal sits outside the identity box: local-left / opponent-right, aligned to Deck Name.
- Match timer occupies the first slot of the existing bottom action row, matching the PvP timer position.
- Human-vs-human opening coin flip: Player 2 calls Heads/Tails.

## VS AI v6.80 parity guard

The current PvP branch keeps the v6.80 battlefield/runtime as the base and changes only the PvP integration points needed for local assets, two-human state mirroring, and presentation/network wiring. Against the supplied 294-file v6.80 package, all 294 files remain present; 288 are byte-identical and 6 are intentionally changed (`index.html`, `option-b-runtime.js`, `FILE_MANIFEST_SHA256.csv`, `engine/shared-app/app.bundle.js`, `engine/js/app.bundle.js`, `engine/js/static-data.js`).

The `engine/shared-app/app.bundle.js` changes are limited to PvP seat mirroring for physical Shard state plus authoritative battle-feedback instrumentation/bridge hooks; they do not enable AI control or replace v6.80 battle presentation. Card art/audio and the normal battlefield presentation remain bundled locally.

## Verification

`npm test` passes all included checks:

- JavaScript syntax checks.
- Static architecture guard.
- Headless v6.80 human-vs-human shared runtime bridge check.
- Two-human authoritative server simulation: Player 1 + Player 2 seats, opening coin flow, viewer-safe snapshots, human turn handoff, second-human action, and rejection of a third client.

The server simulation intentionally uses a temporary local WebSocket test stub and removes it after testing. The shipped repository contains no `node_modules`. Real deployment/local browser play uses `npm install` to install the `ws` dependency.

## Promotion gate

This is the **v3.70 testing branch**. Promote to v3.80 only after live two-browser end-to-end play confirms networking/reconnect and visual parity in the deployed environment.


## v3.70 Northflank + mobile landscape patch
- Removed stale Docker `COPY runtime` / `COPY sync` steps; the current v6.80-based server uses `public/engine` plus `data`.
- Increased isolated runtime execution ceiling from 2s to 15s for smaller/throttled deployment instances; gameplay logic is unchanged.
- Phone/tablet use one landscape layout. Physical portrait is rendered as a rotated virtual-landscape canvas; the user does not need to enable auto-rotate.
- Mobile Card Review popup is disabled. A tap on a battlefield card shows the same sidebar hover preview used on desktop; tapping outside dismisses it. Desktop double-click Card Review remains unchanged.
- Lobby visual baseline follows PvP v3.51, with no-scroll compact height tiers, transparent swap-button hit areas, fixed logo/favicon paths, Player 1 pre-match Kick for Player 2, and Starter Deck 1 initialized immediately.
- WebSocket is same-origin `/ws` only; mobile reconnect uses stale-socket guards plus online/pageshow/visibility recovery.

## v3.70 browser first-hydration fix
- The first authoritative PvP board snapshot is imported state-only (`skipImportAnimations: true`) so the v6.80 animation diff never runs against a missing previous browser state.
- After the first successful hydration, subsequent snapshots keep the normal v6.80 import-animation path.
- If an animated import ever fails on an already hydrated board, the client retries that snapshot state-only rather than leaving the battlefield blank.
- Returning to setup/lobby resets the per-match hydration marker so the next match also receives a safe first import.
- Verified in headless Chromium: first import uses state-only hydration, second import re-enables animations, all six Hero slots hydrate, and deck/shard state is populated.

## v3.70 combined PvP bug-fix batch

- Fixed Player 2 Shard Draw/Mana Regen cross-wiring by mirroring `playerManaDeck/aiManaDeck`, `playerManaPoolCards/aiManaPoolCards`, `playerManaClasses/aiManaClasses`, and Shard Deck counts with the seat.
- Added server simulation assertions that Shard Pools advance on the correct seat across P1 → P2 → P1 turn handoffs.
- Fixed remote pending ownership leak: a Player 2 Tribute/selection may block Player 2 correctly, but Player 1 no longer receives Player 2's `CANCEL` button (and vice versa).
- Added setup Lobby **Leave Seat** / remove-seat flow: P1 and P2 can leave themselves; P1 can remove P2; P2 can remove P1 only while P1 is offline. Seat exit invalidates the token and suppresses automatic immediate seat reclaim.
- Retains the earlier anti-stuck Draw→Deploy human progression normalization, first-hydration guard, local asset bundle, Northflank Docker fix, identity layout, opponent resource-label mirroring, compact Shard stacking, fixed Mana Pool container, and mobile/tablet zoom/scroll lock.


## v3.70 authoritative battle presentation fix

- Restored the proven PvP v3.51 transport pattern without using v3.51 gameplay or assets: the headless server records the exact resolved v6.80 battle feedback while render suppression is active, publishes it as a one-shot `battle_feedback` event, and strips the internal ledger from viewer snapshots.
- Browser clients localize the event for seat 1/seat 2, play the approved v6.80 battle SFX immediately on the authoritative revision, import/render the canonical board, then replay the approved v6.80 VFX after two animation frames so Hero anchors are paint-ready.
- Event IDs are deduplicated client-side so reconnect/resend cannot replay settled battle feedback.
- Physical/Magical Attack, Physical/Magical Defense, Dodge, and Heal continue to use the original bundled VS AI v6.80 assets; no website dependency or replacement effect was added.
- Added an authoritative battle-feedback regression test covering attacks from both canonical sides and verifying the server emits exactly one public feedback event originating from the canonical PvP ledger.

## 2026-10-02 — Authoritative presentation parity pass
- PvP presentation timing now follows the proven v3.51 authoritative orchestration model: capture old geometry, import the authoritative snapshot without heuristic diff animation, then replay explicit server animation events.
- Actual card motion, Draw, Shard gain, Tribute, Rank Up, Legacy, battle VFX, and SFX continue to use the VS AI v6.80 presentation engine/assets.
- Battle VFX now retries until the target Hero anchor is paint-ready; battle audio is deduplicated separately.
- Opening coin flow fully gates the battlefield until first authoritative hydration/paint is ready, preventing Round/Phase information leaks and empty-field flashes on slower tablets.
- Mobile/tablet Active Card preview is height-constrained with contain scaling so the full card remains visible.


## 2026-10-02 — PvP v3.51 timing parity + battle VFX readiness
- Normal authoritative presentation no longer waits for an extra double-`requestAnimationFrame` after each imported revision. Draw, Shard Draw, Rank Up, Tribute, Legacy, and card motions are queued immediately after the server snapshot import, matching the proven PvP v3.51 orchestration timing.
- Battle SFX still fires before board import; only battle VFX waits for paint-ready Hero anchors.
- Added user-gesture audio unlock/warmup and early battle-asset priming so Card/Battle audio starts warm instead of cold on mobile/tablet browsers.
- Battle VFX PNG animations are paused at frame 0 until image decode completes; the removal timer also starts only after decode. This prevents large Attack/Defense/Heal PNGs from finishing invisibly while `gl-decode-pending` is active.
- Battle VFX PNGs were losslessly re-optimized (same dimensions/transparency/pixels) to reduce decode/transfer cost where possible.
