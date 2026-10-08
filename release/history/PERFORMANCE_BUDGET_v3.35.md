# PvP v3.35 Performance Budget

Target environment remains the existing low-resource Northflank room services.

Runtime constraints preserved:
- Browser runtime is compiled once at Node process boot and reused as an isolated VM script per match.
- WebSocket `perMessageDeflate` remains disabled to avoid compression CPU cost.
- `TCP_NODELAY` remains enabled for small real-time action frames.
- WebSocket payload ceiling remains 1 MiB.
- Public snapshot logs remain capped independently from the larger internal diagnostic log.
- Connection-signal RTT sampling is player-only and low frequency; it does not trigger gameplay snapshot broadcasts.
- v3.35 adds no new server polling loop, analytics, telemetry, or gameplay broadcast loop.
- Frontend SHA/build metadata is static and has zero gameplay hot-path cost.

The main v3.35 change is deployment/frontend synchronization, not additional server computation.
