# Grandis Legacy PvP v3.70 — Build Notes

Build date: 2026-10-02

## Locked architecture

- Fresh PvP branch built from the updated **Grandis Legacy VS AI v6.80** package.
- PvP v3.51 is **not** the gameplay/battlefield base; it is used only as the lobby/server/network reference.
- One fixed room: `GRANDIS_PVP`.
- Two human player seats only.
- Spectator / Teaching View parked (`maxSpectators: 0`).
- No room switching, `Go To`, or `Switch To` controls.
- Battlefield identity is `[Player Name] - [Deck Name]` with one shared 40-character display budget including ` - `.
- Connection signal renders to the left of the battlefield identity.
- Match timer occupies the first slot of the existing bottom action row, matching the PvP timer position.
- Human-vs-human opening coin flip: Player 2 calls Heads/Tails.

## VS AI v6.80 parity guard

The original v6.80 public source contains 294 files. In this PvP build:

- 292 / 294 original v6.80 files are byte-identical.
- Only `index.html` and `option-b-runtime.js` are changed among original v6.80 files, for PvP wiring/presentation.
- No original v6.80 file is missing.
- `engine/shared-app/app.bundle.js` is byte-identical to v6.80.
- `engine/shared-app/app.css` is byte-identical to v6.80.
- `engine/shared-ui/*` is byte-identical to v6.80.
- Card art: 200 / 200 byte-identical to v6.80.
- Audio: 8 / 8 byte-identical to v6.80.

Source ZIP SHA-256:

- VS AI v6.80: `2fdc1de2436f19cfc30198b85665e5e9f2d988243fda43427e95be7db034397f`
- PvP v3.51 donor/reference: `138f1f56f2b786deea90ae843c6bc22734b28ea2f5789dee4b56523b19e95dee`

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
