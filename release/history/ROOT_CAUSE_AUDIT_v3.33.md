# Root Cause Audit — PvP v3.33

Date: 2026-09-04

## Why multiple previous source patches could appear to do nothing

### 1. The live frontend deployment was not guaranteed

The browser application is under `public/`, but earlier release packages did not include a GitHub Pages workflow that explicitly published `public/`. Updating repository source therefore did not prove that the live Pages site was serving the new frontend. This matches the reported symptom that even purely client-side changes such as the mobile hamburger did not visibly change.

### 2. Frontend and two authoritative servers could silently diverge

PvP has one GitHub Pages frontend and two Northflank WebSocket services. Earlier builds had no shared build-ID handshake. Mixed versions could connect normally. Sound/VFX depends on the server producing the authoritative event and the browser rendering it, so this mismatch could break the complete path while local source tests still passed.

### 3. Workarounds accumulated around symptoms

Several later patches added alternate VFX sources/retries, an extra Legacy wrapper, duplicate Hero-star routing, and multiple hamburger hide guards. Those increased branches without proving that the deployed frontend/server pair was current.

## v3.33 architecture

- GitHub Pages deploys exactly `public/`.
- All three deployments share build ID `gl-pvp-3.33-2026-09-04`.
- Mixed frontend/server versions are rejected.
- Battle presentation has one authoritative source after board render.
- Mobile Hero action uses the shared VS AI UI path.
- Legacy uses the shared VS AI stage markup.
- Cross-app mobile nav is structurally lobby-only.
- Player names are explicit server seat data and localized per recipient.

This makes deployment identity observable and reduces each reported behavior to one runtime path.
