# Grandis Legacy PvP v3.75.2

Server-authoritative, two-human Grandis Legacy PvP build. This release is the first cleaned rebuild after the v3.73.x integration experiments.

## Build direction

- **PvP v3.51 is the network role model.** The match remains server-authoritative and keeps the proven two-player lobby/seat lifecycle, intent -> ACK -> authoritative snapshot recovery pattern, reconnect handling, viewer-safe snapshots, and read-only spectator behavior.
- **VS AI v6.90.7 is the UI/UX role model.** The visible battlefield, center decision/payment UX, card review/hover behavior, and current presentation concepts are adapted for human-vs-human PvP.
- **pvp-fresh v3.73.20 is an integration donor, not the authority.** Only PvP adaptations that survive the v3.75.2 QA suite are retained.

The server is still the gameplay authority. UI animation/presentation never commits gameplay state locally.

## Repository naming

The production tree now follows the familiar PvP v3.51 layout: canonical browser code is under `public/js/`, CSS under `public/css/`, and shared battlefield UI under `public/shared-ui/`. The old nested `public/engine/`, `public/pvp/`, `option-b-runtime.js`, and `option-b-integration.css` production paths are removed.

Key files:

- `server.js` — room, WebSocket, authoritative snapshots, reconnect/spectator lifecycle.
- `server/gameplay-intent-router.mjs` — allowed gameplay intent contract.
- `public/js/pvp-network.js` — client PvP network/lobby orchestration.
- `public/js/app.bundle.js` — shared gameplay runtime used by browser and headless server.
- `public/js/pvp-ui-runtime.js` — v6.90.7-derived visible battlefield/decision presentation adapted for PvP.
- `public/js/pvp-presentation-adapter.js` — explicit state/presentation boundary.
- `public/js/pvp-animator.js` — authoritative animation-event playback only.
- `public/css/pvp-ui.css` and `public/css/pvp-lobby.css` — PvP visual layers.

See `docs/SOURCE_MAP_v3.75.2.md` for the exact source-role map.

## Versioning from here

The active line is **v3.75.2**. Future maintenance releases increment the final component only: `v3.75.3`, `v3.75.4`, and so on, unless a new versioning decision is made explicitly.

## Local run

Requires Node.js 18+.

```bash
npm install
npm start
```

Open the same URL in two browser sessions for Player 1 and Player 2. Additional visitors join as read-only spectators up to the configured cap.

## QA

```bash
npm test
```

The automated suite checks source wiring, exact Mana payment, two-human turn handoff, Player 2 Tribute -> next phase regression, reconnect/snapshot behavior, hidden-info spectators, spectator capacity, and authoritative battle-feedback transport.

## Deployment

- Dockerfile: repository root `Dockerfile`
- Default port: `3000` (`PORT` is honored)
- Health check: `/health`
- Fixed room: `GRANDIS_PVP`
- Intended memory budget: 256 MB

Historical `gl_pvp370_*` / `gl_pvp371_*` browser storage keys are intentionally retained so existing PvP users do not lose seat/deck preferences during the upgrade. They are compatibility identifiers, not current release names.

The shared v6.90.7 runtime also still uses **`PLAYER` / `AI` as internal canonical side identifiers**. In PvP v3.75.2, internal `AI` means **Player 2**, not an AI-controlled opponent. Player-facing PvP UI is normalized to Player/Opponent wording, and the server clears AI control ownership in human-vs-human mode. Renaming the canonical side schema itself is intentionally deferred because it would touch serialized runtime state and create unnecessary desync risk.
