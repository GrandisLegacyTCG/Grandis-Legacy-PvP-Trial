# PvP v3.34 Performance Budget

The lobby connection fix must remain transport-light.

- No extra reconnect polling was added.
- No build-version room broadcast was added.
- No snapshot frequency increase.
- Build ID is carried only on traffic that already exists (connection query, snapshot/pong/health diagnostics).
- WebSocket `perMessageDeflate` remains disabled.
- `maxPayload` remains 1 MiB.
- Server runtime remains precompiled once at process boot.
- Public room logs remain capped to 40 entries per snapshot.
- RTT signal sampling remains player-only on a 10-second timer with a 22-second in-flight guard.
