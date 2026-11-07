# Grandis Legacy — PvP Season 0 | RC32 | GitHub-Ready Staging

**Baseline gameplay and battlefield:** supplied **VS AI Season 0 v1.0 RC32 (2026-11-07)**. **Multiplayer baseline:** previous PvP S0 RC31 Playtest Staging. **Architecture reference:** Season 1 PvP v3.51, whose server runs the shared game runtime and sends recipient-scoped views. This package is an independent staging checkout; it does not modify or replace VS AI RC32 or PvP Season 1.

**State:** complete source repository prepared for GitHub upload and an isolated Northflank staging deployment. Automated local WebSocket matches and limited two-Chromium renderer integration have passed. **NOT CERTIFIED AS FINAL:** direct hosted browser HTTP/WebSocket navigation, mobile/Firefox, comprehensive card-by-card parity, complete ordinary 3-Hero victory through two human UIs, Docker build and Northflank staging deployment remain unverified. Do not treat this as a production release.

## Upload this repository to GitHub (not a production release)

1. **Extract** the `Grandis_Legacy_PvP_S0_RC32_GitHub_Ready_2026-11-07.zip` archive. Do **not** upload the ZIP itself as a single file to the GitHub repository: GitHub does not automatically unpack it.
2. Create a **new isolated repository** for Season 0 PvP (prefer **Private** while testing). With GitHub Desktop or Git, copy the **contents** of the extracted folder into the repository root (not an extra nested folder). The root must contain `package.json`, `Dockerfile`, `server.js`, `client/`, `server/`, `tests/`, `docs/`, and `.github/`.
3. Commit and push. Open **Actions → PvP Season 0 staging QA**. Both `rc32-and-network` (including Docker/HTTP/native WSS) and `browser-native` (two native Chromium instances) must turn green. **Their GitHub results are NOT VERIFIED prior to this upload.**
4. Create a **separate Northflank Combined Service** from this new repository, set **Dockerfile** build at repository root, **one replica**, public HTTP port `3000`, environment `PORT=3000` (and `HOST=0.0.0.0`). Use the generated HTTPS URL; the client connects to the same host's WSS `/ws` automatically. Do not replace the existing Season 1 service.
5. Once deployed, visit `/health`, play from two separate browsers or devices, and check the scenarios in [`docs/NORTHFLANK_STAGING_GATE.md`](docs/NORTHFLANK_STAGING_GATE.md). A remote Node acceptance script is included (`PVP_PUBLIC_URL=https://<staging-host> npm run test:hosted`). Real Northflank acceptance remains **NOT VERIFIED** until performed.

For test scope, file inventory and outstanding gates see [`docs/GITHUB_READY_HANDOFF_2026-11-07.md`](docs/GITHUB_READY_HANDOFF_2026-11-07.md). All art and gameplay still originate from VS AI RC32; **Grand Finale and Poison Vial use RC32, not stale OSA DEV45 values**. The repo has no Node dependencies (`npm install` is optional). Node 22 is required.

## Play locally

Requires **Node.js 22 or newer**. Extract the ZIP and open a terminal inside the directory containing `server.js`.

```sh
npm run check
npm start
```

Open `http://localhost:3000` in **two separate browser profiles** (or one normal and one private browser). Both players enter the same Room Code, select a deck or upload a valid Season 0 Deck Builder JSON, click SELECT DECK and READY. Seat 1 starts; seat 2 calls the opening coin. The match loads the actual **RC32 battlefield**, with the server executing all gameplay intents. Use **PvP Room** to view room status again and **RECONNECT** after a temporary disconnect.

For an additional **controlled renderer QA**, with Python Playwright and websocket-client installed, run `python tests/browser-bridge-smoke.py` while the server is active. It uses a **test-only WebSocket relay**, not browser-native WebSocket; its success is not proof of live hosting. The server is independently exercised through real Node WebSocket connections by `npm run check`.

## Northflank staging deployment — one service, one origin

This ZIP includes a `Dockerfile` based on Node 22 Alpine. Create a **separate Season 0 service/repository**, not the existing Season 1 production service. Use the repository root as Docker build context; deploy a single service and one running instance (rooms live in process memory). Expose **public HTTP port 3000**, configure service environment `PORT=3000`, and use the generated HTTPS service URL to open the app. The page constructs `wss://<same-host>/ws` automatically; no separate static frontend is necessary. Verify `/health`, then perform the first 2-browser cross-device match before enabling public access. Do **not** claim resilience across restarts: active rooms are lost on process restart.

For a separately hosted GitHub Pages frontend, supply a `?ws=wss://<northflank-host>/ws` query on the frontend URL and set `PVP_ALLOWED_ORIGINS=https://<exact-frontend-origin>` in Northflank. Do not use the default same-origin policy for a distinct-origin website and do not expose the reconnect seat token publicly. This split deployment has **not** been tested end-to-end in this build.

Optional server settings: `HOST` (default `0.0.0.0`), `PORT` (default `3000`), `PVP_MAX_ROOMS` (default `32`), `PVP_RECONNECT_MS` (default 300000), `PVP_LOBBY_IDLE_MS` (default 300000), `PVP_ALLOWED_ORIGINS` (explicit comma-separated HTTP(S) origins). Do not run multiple replicas without first adding shared durable room/session authority.

## Why RC32 parity is maintained

- The authoritative per-room Node VM loads **the same RC32 card rules and JS game engine** that the browser uses, with two human seats and no local-AI action scheduler.
- Room management, WebSocket transport, reconnect, tokenized seats and recipient-private projections are separate from card effects.
- RC32 assets (including the six Mana Deck R2 fronts, revised Poison Vial, EXP artwork and new presentation assets) were merged from the RC32 archive. **All 689 latest RC32 upstream files are present** in `client/`; **686 are byte-identical** and only the 3 PvP-owned runtime/UI files intentionally differ (see the latest source parity manifest). `client/runtime/pvp-network.js` is additional.
- Four narrowly scoped engine adaptations are retained from PvP RC31: round advancement after a forced Hand Limit discard; no result modal invocation in suppressed headless mode; physical Mana zone seat mirroring; prevention of double-swapping private presentation event sides and the result reason. The RC32 logic for Poison Vial, Deflect, Greater Health Potion, rendering and notification updates is otherwise retained.
- Card authority exceptions: **Grand Finale `S0-CLE-031`: Bard 60, Maestro 90**, from VS AI RC32's inherited approved local override. **Poison Vial `S0-ITM-011`** uses RC32's designer-approved updated text/art/Skill-Physical-damage behavior and current-turn Attachment expiry, even though upstream OSA DEV45 is behind. No import of Season 1 card effects.

## Source layout / QA

- `client/` — latest RC32 UI, card assets, scripts, overlay and PvP client adapter.
- `server/headless-rc32.mjs` — isolated authoritative RC32 engine VM.
- `server/viewer-safe.mjs` — per-player hidden-card/mana masking and opaque blind choice handles.
- `server/ws-lite.mjs`, `server.js` — WebSocket, lobby, rooms, reconnect, HTTP and origin checks.
- `tests/` — executable source/authority/privacy/response/complete-match/WebSocket regressions, optional Chromium UI bridge test.
- `docs/TAKEOVER_RC32.md` — complete RC32 migration and QA checkpoint, evidence and outstanding acceptance gates.

`npm run check` checks syntax, actual RC32 engine boot, local card overrides, 2-seat Attack/Response, client-private projection, fully authoritative deck-out matches, and true WebSocket lobby/hand-discard/terminal flow. **Passing those tests is not the same as verifying every card interaction through two native browsers.**

## Northflank preflight continuation (2026-11-07; NOT DEPLOYED)

This **separate** `pvp_s0_rc32_northflank_preflight` worktree extends RC32 staging. It adds correctly labeled **custom Deck Builder imports**, stricter Season 0-only envelope checks, an export-**shaped** Deck Builder v1.62 regression, and a disposable-room live-host smoke test. These are **not** new gameplay effects. RC32 Grand Finale and Poison Vial remain unchanged. The original RC32 playtest ZIP and VS AI archive were not replaced.

Run `npm run check` for predeployment automated regressions. After creating an isolated Northflank staging service, an operator can run `PVP_PUBLIC_URL=https://<host> npm run test:hosted`. For click-by-click staging setup, see [`docs/NORTHFLANK_STAGING_GATE.md`](docs/NORTHFLANK_STAGING_GATE.md). For verified vs pending work and code-diff scope, see [`docs/TAKEOVER_PREFLIGHT_2026-11-07.md`](docs/TAKEOVER_PREFLIGHT_2026-11-07.md). The GitHub Actions `.github/workflows/staging-qa.yml` has **not** run yet; Docker image build and direct hosted playability are **NOT VERIFIED**.

## Latest RC32 source update — 2026-11-07 (same RC number)

This working tree integrates the newest uploaded RC32 maintenance snapshot: **Primal Strike/Burn, Stun gating of activated Hero/Class/Racial actions, and the new 2-Mana matching Color Shard selection priority**. No restart from RC31 or rebuild of the Season 1 multiplayer architecture was needed. All previous PvP WebSocket/network/UI integrations and RC32 Grand Finale/Poison Vial authority are retained.

See [`docs/TAKEOVER_RC32_LATEST_MAINTENANCE_2026-11-07.md`](docs/TAKEOVER_RC32_LATEST_MAINTENANCE_2026-11-07.md) and [`docs/RC32_LATEST_SOURCE_PARITY.json`](docs/RC32_LATEST_SOURCE_PARITY.json) for exact source parity, tests and outstanding Northflank acceptance. **Latest RC32 staging is NOT deployed and NOT final**.
