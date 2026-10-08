# Grandis Legacy PvP v3.75.8

Server-authoritative two-player Grandis Legacy PvP.

**Active architecture**
- PvP v3.51: multiplayer/gameplay/network authority.
- VS AI v6.90.7: UI/UX presentation.

The build uses one visible PvP lobby. The gameplay UI is the newer VS AI presentation adapted to authoritative two-player snapshots rather than a second local game engine.

## Run

```bash
npm ci
npm start
```

Health endpoint: `/health`  
WebSocket endpoint: `/ws`

## QA

```bash
npm test
```

See `ARCHITECTURE_DONOR_MAP.md`, `BUILD_NOTES_v3.75.8.md`, and `QA_v3.75.8.md`.
