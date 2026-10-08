# PvP v3.34 Root Cause Audit

## Symptom
Lobby remains on `Connecting to PvP Room 1…`, connection indicator is offline, and Start Match remains unavailable after v3.33 deployment.

## Root cause
v3.33 implemented a strict build handshake in both directions:
1. the v3.33 server closed a WebSocket when the `buildId` query did not exactly equal its own build ID;
2. the v3.33 frontend rejected a snapshot/pong whose build ID did not exactly equal the frontend build ID.

Because GitHub Pages, Room 1, and Room 2 are separate deployments — and browser assets can be cached — this created a temporary incompatibility window on every staggered deployment. The version-integrity protection itself caused the connection outage.

## Clean correction
The strict gate and blocking UI were removed. Build metadata remains diagnostic only. No retry layer, polling loop, or secondary transport was added.
