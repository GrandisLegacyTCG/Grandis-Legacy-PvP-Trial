# Grandis Legacy PvP v3.71

Grandis Legacy two-human, server-authoritative PvP build. v3.71 keeps the proven PvP v3.70 gameplay/server baseline, restores the stable PvP v3.51 multiplayer/lobby patterns that are useful for real human-vs-human play, and ports the final VS AI v6.88 battlefield presentation without importing AI control logic.

## Source / behavior stack

- **PvP v3.70** — gameplay behavior, authoritative match ownership, viewer-safe state, human Response ownership, Shard/payment rules, reconnect state, battle-feedback transport, and PvP-specific fixes remain the baseline.
- **PvP v3.51** — network/lobby/spectator reference: resilient intent lifecycle, spectator role flow, human-vs-human presentation orchestration, and lobby button behavior.
- **VS AI v6.88** — battlefield presentation donor only: final card sizing/layout, Hand treatment, hover previews, phase indicator, interaction focus, connector semantics, Tribute motion, choice popup layout, and related battlefield UX.
- **No AI-control behavior is imported into PvP.** The canonical second side is still named `AI` internally for shared-runtime compatibility, but both seats are human-authoritative.

## v3.71 highlights

### Network / P2 Tribute stuck regression

- Gameplay intents use an explicit client lifecycle: send → server ACK → authoritative snapshot → unlock/pump next queued action.
- A 12-second intent watchdog prevents a missed/delayed snapshot from leaving the client permanently locked.
- If an ACK arrives but no authoritative snapshot follows, the client requests a lightweight `sync-request` after 2.5 seconds.
- The server returns a fresh viewer-safe authoritative snapshot for resync without replacing the gameplay engine or mutating local client state.
- Regression coverage includes **Player 2: Reform → Tribute → choose Hero → Next Phase**, verifying the game can leave Reform and continue normally.

### Spectator restored, hidden-info only

- The fixed room supports **2 players + up to 4 spectators**.
- If both player seats are occupied, a third visitor to the same match link joins as a Spectator rather than being rejected.
- Spectators are **read-only** and cannot send gameplay intents.
- Both Hands and other private card identities remain hidden as Card Backs. Public Teaching/Both-Hands mode is disabled.
- Spectators receive the live authoritative battlefield plus public animation/sound events.
- Late join / resync uses the current authoritative match state.
- The server caches one sanitized Player-1-oriented spectator board per revision/name pair instead of building a separate deep-cloned battlefield for every spectator.

### Lobby restored toward PvP v3.51

The lobby keeps the deck/formation setup but restores the simpler PvP role controls:

- `SPECTATE` / `JOIN AS PLAYER`
- `READY` / `UNREADY`
- `START MATCH` for Player 1 when both players are ready and have valid decks
- `RECONNECT`

The following v3.70 room-information block is intentionally removed from the UI:

- Current Room / room name
- Switch Room
- Players count
- Spectators count
- Spectators View / Card Backs row

The server remains a **single fixed room** (`GRANDIS_PVP`). The removed block was display/navigation chrome, not a change to room authority.

### VS AI v6.88 battlefield parity

- Hero visual size is 120% of the baseline while lane geometry remains independent/stable.
- Standard cards remain 65% baseline; Hand cards use the v6.88 75% baseline and edge-only overlap.
- Hero/Hand/Shard and sidebar Card Played previews use body-level/fixed hover layers.
- Main/Discard/Shard/Legacy labels are hidden; counters use the compact v6.88 rectangular treatment.
- Mana Regen stays live from PvP state and only receives the v6.88 presentation treatment.
- Phase indicator uses moving underline + centered diamond + tint/highlight.
- PLAY/PAY receive the v6.88 green/gold treatment.
- Payment and Response states use the 65% interaction-focus dimmer while keeping only legal interaction surfaces bright.
- Attack connector remains Hero → Hero. Targeted Item/Event connectors originate from Active Card and point to the authoritative Hero/zone target.
- Targeted Item/Event connector hold is generalized so short-lived actions remain visible long enough to paint.
- Choice/search popup uses the fixed seven-column layout with hover preview to the right.
- Blind opponent-Shard selection stays shuffled/face-down; a single legal option can auto-commit through the normal authoritative intent path.
- Tribute has a non-blocking Hand → Hero presentation motion.
- Battlefield double-click Card Review is disabled; Hand/sidebar review remains available where intended.
- The PvP match timer continues to use canonical server `startedAt` / `finishedAt` timestamps.

## 256 MB server budget

v3.71 is designed around the deployment limit of **256 MB RAM**:

- One authoritative room state; no per-spectator game engine.
- Static card/runtime definitions are shared process-wide.
- Spectators reuse one sanitized board cache for a revision instead of separate deep-cloned game states.
- WebSocket compression remains disabled (`perMessageDeflate: false`) to avoid extra compression memory/CPU overhead on the small service.
- Public room logs are bounded; internal room logs are also capped.
- Animation/VFX/audio assets and playback remain client-side; the server transports only compact authoritative event metadata.
- `/health` exposes lightweight `process.memoryUsage()` values in MB (`rss`, `heapUsed`, `heapTotal`, `external`) for deployment monitoring.
- The included active-match simulation (2 players + 4 spectators) measured about **170 MB RSS** in the test container; real deployment usage can vary, so `/health` remains the deployment source of truth.
- Finished-match cleanup clears the engine/gameplay ledger/cache before returning the connected users to a fresh setup state.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start
```

Open the local URL in two browser sessions for Player 1 and Player 2. Additional visitors can spectate up to the configured cap.

## Tests

```bash
npm test
```

The v3.71 suite covers:

- JavaScript syntax and source wiring.
- v6.88 battlefield presentation markers while preserving PvP-specific runtime bridges.
- Headless two-human shared runtime behavior.
- Fixed-room server simulation with Player 1 / Player 2 seat lifecycle and coin flow.
- Viewer-safe private-state masking.
- Human P1 ↔ P2 turn handoff and physical Shard ownership.
- **P2 Tribute → Next Phase regression.**
- Spectator Card-Back masking, resync, and read-only enforcement.
- Authoritative battle-feedback event transport.

The server simulation creates a temporary local `ws` test stub and removes it afterward, so the repository is shipped without `node_modules`.

## Mobile / presentation behavior

- Phone/tablet use the existing landscape gameplay strategy, including the virtual-landscape rotation path for a physically portrait device.
- Mobile battlefield card tap-preview remains supported.
- Battlefield double-tap/double-click review remains inert in the battlefield layer.
- Sound/VFX stay driven by authoritative events and are deduplicated client-side, including spectator playback.
- The first authoritative battlefield hydration stays state-first to avoid empty-field/animation races on slower devices.

## Deployment

- Builder: root `Dockerfile`.
- Default port: `3000`; injected `PORT` is honored.
- Health check: `/health`.
- One service = one fixed authoritative PvP room.
- Intended memory budget: **256 MB**.

### Compatibility note

The v3.71 files are `public/pvp/pvp-v371.js` and `public/pvp/pvp-v371.css`. Some DOM/CSS namespaces and Local Storage keys intentionally retain the historical `pvp370`/`gl_pvp370_*` names so existing browser identity, seat token, and deck preferences survive the upgrade instead of being silently discarded.
