# Grandis Legacy PvP v3.75.5 — Source Map

## Hard authority boundary

### 1. PvP v3.51 — gameplay and network authority

Used for the match backend after match start:

- server-authoritative gameplay runtime;
- gameplay intent allowlist/routing;
- one authoritative step at a time;
- payment semantics;
- pending/response ownership;
- two-player turn ownership;
- hidden-information opponent Shard choices;
- reconnect/viewer-safe snapshot model.

The v3.51 gameplay runtime is preserved as exact artifacts under `server/runtime/` and hash-locked by QA.

### 2. VS AI v6.90.7 — UI/UX authority

Used for what players see and interact with:

- battlefield geometry and current card sizing;
- Hand / Shard / Hero presentation;
- center choice/payment visuals;
- hover/review interactions;
- phase/focus presentation;
- animation/audio presentation where safe for PvP.

The browser UI sends gameplay intent; it does not become the gameplay authority.

### 3. pvp-fresh v3.73.20 — lobby/start-game/opening only

Retained only for the pre-game integration work that was already useful:

- lobby/room experience;
- deck/ready/start flow;
- opening presentation transport/integration.

The following v3.73.20 gameplay concepts are explicitly excluded from authority:

- queued/local-first gameplay progression;
- universal exact-Shard payment transaction model;
- gameplay pending lifecycle that can advance only one browser.

## Canonical production files

| Responsibility | Canonical file | Authority/source role |
|---|---|---|
| Room/WebSocket/snapshot authority | `server.js` | PvP network shell; launches v3.51 gameplay engine |
| Gameplay intent router | `server/gameplay-intent-router.mjs` | exact v3.51 router |
| Server gameplay static data | `server/runtime/static-data.js` | exact v3.51 runtime artifact |
| Server gameplay bridge | `server/runtime/runtime-authority.js` | exact v3.51 runtime artifact |
| Server gameplay engine | `server/runtime/app.bundle.js` | exact v3.51 runtime artifact |
| Client network + lobby | `public/js/pvp-network.js` | v3.51-style authoritative handshake + current lobby/start integration |
| Browser shared runtime | `public/js/app.bundle.js` | v6.90.7-derived browser/presentation runtime; **not server authority** |
| Browser runtime bridge/data | `public/js/runtime-authority.js`, `public/js/static-data.js` | v6.90.7-derived browser support |
| Visible PvP UI | `public/js/pvp-ui-runtime.js` | v6.90.7 UI with v3.51 decision/payment adapter |
| Presentation boundary | `public/js/pvp-presentation-adapter.js` | PvP presentation adapter |
| Authoritative event animator | `public/js/pvp-animator.js` | presentation only |
| PvP UI CSS | `public/css/pvp-ui.css`, `public/css/pvp-lobby.css` | current visible UI |

## Payment boundary

The server runtime uses v3.51 `computeManaPayment`, `autoManaPaymentWithoutPrompt`, and `shouldPromptManaPayment` semantics. The browser center-payment UI mirrors that state:

- only Class Shards are optional/selectable for normal Skill payment;
- generic Mana Shards automatically fill the remaining cost;
- normal payment commits through the v3.51 `handleChoiceConfirm` path;
- Event/Item payments can resolve without the newer universal exact-Shard popup.

## Internal side names

The shared runtime serializes Player 2 as `AI` (`aiHand`, `aiHeroes`, `turn === "AI"`, etc.). This is intentionally retained to avoid snapshot/schema churn. In PvP, this is a compatibility key only; there is no AI controller for Player 2.
