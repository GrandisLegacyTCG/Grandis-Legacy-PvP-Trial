# PvP v3.80.1 QA Report

## Reconstruction checks

- PvP root shell is based on VS AI v6.91.4 neutral runtime shell.
- No authored `TURN 16`, sample Hands, sample Hero art, sample Active Card, or sample battle-log content remains in `public/index.html`.
- `public/assets/cards/` and `public/engine/index-original.html` are absent, matching v6.91.4 cleanup.
- Exact v6.91.4 donor tree fingerprints are checked for engine, card-art, shared-ui, runtime, and the non-lobby assets subset.

## Reconnect checks

- Client id and seat token are tab-scoped through `sessionStorage`, not shared origin-wide localStorage.
- Stale WebSocket `open/close/error/message` callbacks are ignored when they no longer own `state.ws`.
- Reconnect scheduling uses one timer.
- Server replacement of the same valid seat session uses code 4006; the replaced tab forks to a fresh session instead of reconnect-fighting.
- Seat-token mismatch uses code 4004; the tab forks to a fresh identity and does not retry the protected seat token.
- PvP active presentation does not expose donor `VS AI`, `AI Turn`, or `AI Mana` labels.
- READY remains gated only by a stable connection, player role, and a selected/retained deck.

## Existing v3.80 regressions retained

- Seat 1/Seat 2 actor-local authority orientation.
- Seat 2 Shard ownership.
- Viewer-safe pending/draw/opening/Shard/Legacy privacy.
- Surrender -> finished -> return-to-lobby lifecycle.
- NEXT PHASE after authoritative Draw.
- Custom Deck 50-card acceptance regression.
- Setup-only room reset.
- Build mismatch recovery and no-store runtime code.

## Live startup boundary

A real server startup still requires production dependency `ws`. If that dependency is unavailable in the audit sandbox, only source/static/headless-authority checks can be claimed there.
