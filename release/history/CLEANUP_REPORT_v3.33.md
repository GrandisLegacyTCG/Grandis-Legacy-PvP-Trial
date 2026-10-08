# Cleanup Report — Grandis Legacy PvP v3.33

Date: 2026-09-04

## Goal

Remove the v3.29–v3.32 workaround stack around the reported PvP parity bugs and keep one deterministic implementation for each behavior.

## Removed obsolete / non-working layers

### Battle sound + VFX

Removed:
- `runQueuedBattleFeedback(...)` retry wrapper.
- `__gl_vfx_retry` event mutation.
- `battleFeedbackFromAnimationPlans(...)` battle-VFX fallback.
- heuristic/state-delta battle VFX when an authoritative board is imported.

Kept architecture:
1. Server/runtime records the real resolved battle result into `pvpBattleFeedbackEvents`.
2. Client imports the authoritative board.
3. Client renders that board.
4. Only fresh ledger entries are sent to the shared VS AI battle renderer.

The actual P.Atk/M.Atk/P.Def/M.Def renderer and assets remain the VS AI v6.25 implementation. PvP adds only browser audio-unlock handling required for WebSocket gameplay.

### Mobile Hero star / Racial action

Removed the PvP-specific capture-phase Hero-star opener. The star/button is now opened only by the shared VS AI UI handler. PvP intercepts the selected Racial/Class/Legacy action afterward and sends the authoritative multiplayer intent.

### Hero / Legacy card size

Removed the PvP-only `legacy-card-anchor` wrapper and its CSS workaround. Legacy now uses the same stage/card markup as VS AI v6.25 and the shared Hero/Legacy parity CSS.

### Mobile cross-app hamburger

Removed the stacked in-match hide patches. There is no static hamburger in gameplay HTML. The lobby creates the navigation node; active gameplay removes the node from the DOM. The only mobile CSS display rule is scoped to `body.pvp-lobby-mode`.

### Player names

Removed stale-header reconstruction/fallback patching. Server snapshots explicitly publish seat 1/2 names; the receiving board is localized to `PLAYER` / `AI`, and battlefield presentation reads the live room names first. `OPPONENT` is not accepted as a real room name.

### Dead turn-start compatibility

Removed unused `acknowledgePvpTurnStart`, `acknowledgeLocalTurn`, old acknowledgement state fields, and the no-op lobby-theme installer. Draw → Deploy remains automatic.

### Naming cleanup

The old `installPvp256UiPatch` / `gl-pvp-v260-ui-patch` runtime marker was renamed to the neutral `installPvpInterfaceStyles` / `gl-pvp-interface-styles`. The styles are still required UI styles; only the obsolete patch identity was removed.

## Deployment integrity

The frontend lives under `public/`, while two Northflank services run the authoritative server. v3.33 adds an explicit GitHub Pages workflow for `public/` and a hard build-ID handshake (`gl-pvp-3.33-2026-09-04`) so an old frontend cannot silently run against a new server or vice versa.

## Performance cleanup

The finishing pass did not add another gameplay fallback. It instead reduces overhead around the clean paths: runtime source is precompiled once, signal RTT traffic is player-only and low-frequency, repeated signal DOM writes are avoided when values are unchanged, and the WebSocket server uses low-CPU/no-compression settings with NoDelay for intents.
