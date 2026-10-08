# Grandis Legacy PvP v3.34 — Release Note

## Scope
PvP only. Source Stack v1.7.3, VS AI, Tutorial, Deck Builder, and Website are unchanged.

## Fixed
### Lobby connection regression introduced by v3.33
Root cause: v3.33 required exact frontend/server build-ID equality before allowing the WebSocket session. GitHub Pages and the two Northflank services deploy independently, and browser caching can also briefly retain the older frontend. This made a normal staggered rollout look like an offline Room 1/Room 2 lobby.

v3.34 changes build IDs to diagnostics only:
- server no longer sends fatal + closes code 4409 solely for build mismatch;
- client no longer rejects snapshots/pongs solely for build mismatch;
- the full-screen deployment-mismatch blocker was removed;
- build IDs remain in config, snapshots, pong, and `/health` for QA;
- client exposes diagnostic `GL_PVP_SERVER_BUILD_ID` and `GL_PVP_BUILD_SKEW` without interrupting play.

## Preserved clean architecture
- one authoritative battle-feedback → post-render VS AI presentation path;
- lobby-only structural mobile hamburger;
- shared VS AI mobile Hero/Racial action UI;
- explicit server seat-name authority;
- Hero/Legacy stage parity without workaround wrapper;
- lightweight connection signal indicator;
- exact 60 / max 3 normal / max 1 Ultimate PvP deck validation.

## Performance
No new polling/broadcast loop was added. Existing low-vCPU WebSocket/runtime constraints remain unchanged.
