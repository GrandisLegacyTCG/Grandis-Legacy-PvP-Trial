# Verification — PvP v3.28

Date: 2026-09-04

- `npm run check`: PASS.
- New live VFX renderer regression: PASS. The test intentionally withholds the Hero DOM anchor on the first checks, then verifies retry-safe rendering creates `M.Attack.png` and `P.Defense.png` image nodes.
- `npm run test:package`: PASS.
- `npm run test:bridge`: PASS.
- `npm run test:ui`: PASS.
- Runtime sync lock self-test: PASS as part of `npm run check`.
- Exact battle assets match the VS AI package by SHA-256.
- Full live WebSocket room test was not run in this sandbox because installed runtime dependencies are unavailable here; no live-room PASS is claimed.
