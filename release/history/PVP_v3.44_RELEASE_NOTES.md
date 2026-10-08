# Grandis Legacy PvP v3.44 Release Notes

Version: **v3.44**

## What changed

- Preserved the existing legacy `pvp-v260` Lobby presentation family while keeping all five current canonical Starter Decks.
- Added a Lobby-only **Rank I / Rank II / Rank III** Hero preview. All three formation Heroes move together; switching Starter resets to Rank I. The preview sends no gameplay/network intent and does not affect match-start Rank.
- Hardened static GitHub Pages → remote WebSocket endpoint handling:
  - Room 1 and Room 2 use explicit configured WSS bases plus `/ws`.
  - GitHub Pages fails closed when a remote endpoint is absent instead of attempting a socket against GitHub Pages itself.
  - connection timeout/error/disconnected states are visible in the Lobby instead of being rendered forever as “Connecting…”.
  - reconnect reuses the same resolved endpoint path.
- Server-authoritative gameplay, viewer-safe serialization, canonical runtime, and the v3.43 Battlefield remain preserved.

## Deployment note

The configured production room endpoints remain the same endpoints present in the historically working v3.42 deployment reference:

- Room 1: `wss://p01--grandis-legacy-pvp--2kwws8nzlcc2.code.run/ws`
- Room 2: `wss://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run/ws`

This sandbox cannot independently certify those external services because its outbound DNS is unavailable. Deploy/redeploy the v3.44 server to both room services and run live browser connection verification in the deployment environment.
