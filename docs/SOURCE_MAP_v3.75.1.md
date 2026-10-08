# Grandis Legacy PvP v3.75.1 — Source Map

## Authority order

1. **Network / multiplayer behavior: PvP v3.51**
   - server-authoritative room model
   - two player seats
   - reconnect and seat recovery
   - intent -> ACK -> authoritative snapshot lifecycle
   - viewer-safe hidden information
   - read-only spectators

2. **Battlefield / UI behavior: VS AI v6.90.7**
   - visible battlefield geometry and current card sizing
   - center decision/payment presentation
   - hover/review interactions
   - phase, Hand, Shard, Active Card, and Response focus presentation
   - client-side animation/audio concepts where safe for PvP

3. **Integration donor: pvp-fresh v3.73.20**
   - server-side adaptations needed to run the v6.90.7-derived shared runtime in human-vs-human mode
   - exact Mana selection routing
   - current opening/battle presentation event transport
   - fixes already covered by automated PvP regression tests

`v3.73.20` is **not** the naming/layout authority and is not copied wholesale.

## Canonical v3.75.1 production files

| Responsibility | Canonical file | Source role |
|---|---|---|
| Node/WebSocket authority | `server.js` | v3.51 network model + tested PvP integration fixes |
| Gameplay intent allowlist/routing | `server/gameplay-intent-router.mjs` | v3.51-derived with current payment/pending intents |
| Client network + lobby | `public/js/pvp-network.js` | v3.51 network/lobby model adapted to current UI |
| Shared gameplay runtime | `public/js/app.bundle.js` | v6.90.7-derived runtime with PvP authority patches |
| Runtime authority bridge | `public/js/runtime-authority.js` | shared runtime |
| Static card/runtime data loader | `public/js/static-data.js` | shared runtime |
| Starter-deck bridge | `public/js/active-starters.js` | current v6.90.7 donor runtime |
| Visible PvP UI runtime | `public/js/pvp-ui-runtime.js` | v6.90.7 UI donor adapted for PvP |
| Presentation boundary | `public/js/pvp-presentation-adapter.js` | PvP-only boundary |
| Animation event player | `public/js/pvp-animator.js` | PvP-only presentation |
| Main PvP UI CSS | `public/css/pvp-ui.css` | v6.90.7 UI donor adapted for PvP |
| Lobby CSS | `public/css/pvp-lobby.css` | PvP |
| Shared battlefield UI | `public/shared-ui/` | shared runtime |

## Removed confusing production paths

The following v3.73.x paths are intentionally removed from the active tree:

- `public/engine/`
- `public/pvp/`
- `public/option-b-runtime.js`
- `public/option-b-integration.css`

Their active contents were moved into the canonical v3.51-style `public/js`, `public/css`, `public/shared-ui`, and `public/assets` locations.

## Compatibility names intentionally retained

The browser LocalStorage identifiers containing `pvp370` / `pvp371` are intentionally retained for upgrade continuity. Renaming them would silently reset persisted client/seat/deck preferences. Source comments identify them as compatibility keys.

## Internal `AI` side-name exception

The shared v6.90.7 runtime serializes the second canonical side as `AI` (`aiHand`, `aiHeroes`, `turn === "AI"`, etc.). PvP v3.75.1 deliberately keeps that **internal schema** so browser and headless-server snapshots stay compatible. In human-vs-human PvP, that side is Player 2 and no AI controller owns its decisions.

This is the one major naming exception: **file/module names and player-facing labels are PvP-normalized; canonical runtime state keys are compatibility-stable.**
