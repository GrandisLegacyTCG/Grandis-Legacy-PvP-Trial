# Release Note — Grandis Legacy PvP v3.33

Date: 2026-09-04

## Scope

PvP only. VS AI v6.25 is the presentation/UI reference. Website, Deck Builder, VS AI, Tutorial, and Source Stack v1.7.3 are unchanged.

## Root fix: deployment integrity

- GitHub Pages workflow now deploys `public/` directly.
- Shared build ID: `gl-pvp-3.33-2026-09-04`.
- Frontend/server WebSocket compatibility is fail-closed.
- `/health`, config, snapshots, and pong expose the build ID.
- An incompatible deployment displays a visible mismatch screen instead of silently running mixed versions.

## Clean parity implementation

### P.Atk / M.Atk / P.Def / M.Def

- Uses the VS AI v6.25 VFX renderer and identical battle assets.
- PvP has one battle-presentation input: fresh authoritative `pvpBattleFeedbackEvents` after canonical board import/render.
- Removed VFX retry mutation, animation-plan battle fallback, and heuristic state-delta battle VFX.
- Browser audio unlock remains because PvP playback begins from WebSocket-driven events after a user gesture.

### Mobile Hero/Racial action

- Shared VS AI Hero-star UI opens the action menu.
- PvP only routes selected Racial/Class/Legacy actions to authoritative server intents.
- Removed the duplicate PvP Hero-star opener.

### Hero / Legacy size

- Removed the PvP-only Legacy anchor wrapper.
- Legacy uses the exact VS AI stage/card markup and shared parity CSS.

### Mobile hamburger

- No hamburger is statically mounted in gameplay HTML.
- Lobby creates the cross-app menu.
- Active match physically removes it from the DOM.
- Removed stacked CSS/JS hide workarounds.

### Player identity + internet signal

- Server snapshots explicitly publish Player 1 / Player 2 names from the room.
- Local/remote battlefield headers resolve those names by seat.
- `OPPONENT` is only presentation fallback when no real remote name exists.
- Four-bar connection indicator remains beside each player name + deck, driven by measured WebSocket RTT/connection state.

## Other cleanup

- Removed dead turn-start acknowledgement functions/state.
- Removed no-op lobby-theme installer.
- Renamed obsolete `...UiPatch` runtime styling marker to `installPvpInterfaceStyles`.

## Preserved

- Card Played parity.
- Quick Reload → Aura Infusion Bolt Draw This Turn counter.
- Automatic Draw → Deploy parity.
- Redirect/Cover Up fresh Defense Window.
- Pending attack indicator semantics.
- Main Deck legality: exactly 60; normal max 3; Ultimate max 1.

## Performance finishing pass

- Precompile the shared Node VM runtime once at server boot instead of parsing the large browser runtime again when a match starts.
- Keep server-side rendering suppressed.
- Disable WebSocket per-message compression and cap payloads at 1 MiB for predictable low-vCPU behavior.
- Enable TCP NoDelay for intent/ack traffic.
- Internet signal sampling is player-only, once every 10 seconds, and ping handling returns immediately without a room broadcast.
- No server metrics/tracker loop was added.
- Local harness sample canonical board size: ~6.3 KiB before recipient metadata/masking.
