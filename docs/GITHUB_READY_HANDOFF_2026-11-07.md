# Grandis Legacy PvP Season 0 — GitHub Ready Handoff

**Date:** 2026-11-07  
**Authorization:** User requested continuation until the repository is ready to upload to GitHub. No authority to deploy into the user's actual GitHub, Northflank project, or to replace Season 1 production.  
**Baseline:** `/mnt/data/pvp_s0_rc32_latest_work` (preserved); upstream `/mnt/data/Grandis_Legacy_VS_AI_Season0_v1.0_RC32_2026-11-07.zip` (SHA-256 `1376ef63d4531d46210f82d78b4f3ce908b2fd13c159915d078ac370a0c43e89`). Architecture reference: PvP Season 1 v3.51.  
**Target:** isolated Season 0 PvP staging GitHub repository and one-instance Northflank Docker deployment.

## What is included

- Complete static RC32 client and assets, with the existing PvP-only UI/network adapter changes. No new gameplay engine has been substituted and **RC32 Grand Finale 60/90 and Poison Vial** authority remain unchanged.
- Single-process, server-authoritative `server.js`, isolated RC32 headless runtime, private seat projections, WebSocket, room, reconnection and Custom Deck Builder JSON.
- `Dockerfile` at the repository root, `.dockerignore`, `.gitignore`, GitHub Actions `.github/workflows/staging-qa.yml` and host smoke scripts. A Dockerfile-only Northflank **Combined Service** suffices; do not publish these files as GitHub Pages alone.
- Full existing headless, network, 520-action deck-out, RC32 maintenance regressions, optional two-Chromium test relay, and an **additional native Chromium + real WebSocket test for GitHub Actions**.
- Deployment and acceptance directions: `README.md`, `docs/NORTHFLANK_STAGING_GATE.md`.

## Scope of this handoff

| File / scope | Action | Reason |
|---|---|---|
| `server.js` | Tiny safety correction | Reject unknown reconnect tokens **before** allocating a new room; idle offline lobbies now have a configurable cleanup horizon (`PVP_LOBBY_IDLE_MS`, default 300000 ms; at least reconnect grace). This prevents phantom-room allocation caused by invalid reconnect requests. |
| `tests/room-reconnect-abuse.mjs`, `tests/run-network-tests.mjs` | Added negative test to regular network regressions | Proves invalid reconnect attempts do not consume room capacity. Existing legitimate reconnect still covered by network and hosted smoke. |
| `tests/browser-native-smoke.py`, `.github/workflows/staging-qa.yml` | New CI acceptance gate | An actual browser navigation + native WS 2-seat lobby/coin/hand/phase test on GitHub runners. **Not executed locally due to environment-level Chromium HTTP block.** |
| `tests/repository-integrity.mjs`, `package.json` | New pre-upload gate | Ensures required runtime files, referenced browser HTML assets, and RC32 artwork are included; `npm run check` now includes this. |
| `README.md`, this handoff, `.gitignore` | Repository packaging | Document GitHub/Northflank setup, known limitations and exclude local secrets/test artifacts. |
| Game engine, card text, rules, artwork, AI app, Season 1 repo | **No modifications** | Respect the verified RC32 source authority and preserve the independent VS AI project. |

## QA: observed, not assumed

| Test | Result | Evidence / limit |
|---|---|---|
| `npm run check:repo` | **PASS** | Required root files; 14 HTML frontend resource references and 248 WebP card images exist; excludes .env/.git/node_modules |
| `npm run check` | **PASS** | RC32 source, gameplay conditions, Stun/Primal Strike, two-seat privacy, Attack/Response, deck-out, WebSocket, reconnect regression |
| Reproduced phantom room via unknown token | **CONFIRMED → FIXED** | Before patch, a rejected token increased `/health` rooms from 1 to 2; after patch, repeated invalid tokens leave room count unchanged |
| `PVP_PUBLIC_URL=http://127.0.0.1:<port> npm run test:hosted` | **PASS (pre-handoff baseline)** | Actual local HTTP and Node WS through a disposable room; no remote TLS or Northflank proof |
| `tests/browser-bridge-smoke.py` | **PASS** | Two Chromium renderers and active RC32 UI against real Node authority, **test-only WebSocket relay** (no native browser WS) |
| Native Chromium HTTP + WS local smoke | **BLOCKED / NOT VERIFIED** | Chromium navigation to `127.0.0.1` returns `ERR_BLOCKED_BY_ADMINISTRATOR` in this environment; newly added CI test must be run on GitHub |
| Dockerfile COPY-layout smoke | **PASS (partial)** | Recreated Dockerfile package/server/client directory layout outside Docker; actual Node HTTP + WebSocket hosted smoke passed. This is not a real Docker build. |
| Docker image build / `docker run` | **NOT VERIFIED** | Docker CLI not installed in this environment; GitHub Actions job prepared but not run yet |
| GitHub Actions CI | **NOT VERIFIED** | Requires user upload / commit; do not assume jobs will be green |
| Northflank HTTPS/WSS / cross-device game | **NOT VERIFIED** | No remote service URL, repository binding or cloud deployment performed |
| Normal win by eliminating 3 Heroes via 2 real human browsers; card-by-card parity | **NOT VERIFIED** | Automated full matches end by mandatory Deck-out, not ordinary combat victory |

## Upload and deployment procedure

1. Extract the GitHub-ready ZIP into a new working folder. **Copy its contents into a new repository root**; never commit only the ZIP. There are hundreds of asset files, so GitHub Desktop/git is preferable to browser manual uploads. A *private* staging repository is recommended.
2. After push, inspect **Actions → PvP Season 0 staging QA**. Both jobs should pass: `rc32-and-network` runs Node tests and Docker-built transport; `browser-native` uses Playwright/Chromium to navigate the real HTTP site and connect via WebSockets. If a job fails, **do not** treat a red build as deploy-ready.
3. On Northflank, connect that repo using a **Combined Service** (Dockerfile build, repository root). Configure exactly **one replica**: rooms and seat tokens are in RAM. Public HTTP port `3000` with `PORT=3000`, `HOST=0.0.0.0`.
4. Northflank assigns TLS to the public endpoint. Use the generated `https://...` URL for play; browser uses `wss://.../ws` automatically. Do **not** run `client/` as a standalone GitHub Pages site unless separately setting the WSS URL and `PVP_ALLOWED_ORIGINS`.
5. Health gate: `https://<host>/health` should return JSON with `ok: true` and `build` containing `s0-rc32-pvp`. Use the separate random-room Node smoke from an environment with Node 22 (`PVP_PUBLIC_URL=https://<host> npm run test:hosted`), then carry out two-human browser acceptance on Northflank.
6. Record both browser/OS versions and outcomes of **normal three-Hero defeat**, Response, Rank Up, Legacy, Casting, Status, Poison Vial and Grand Finale. Staging must **not** be promoted as final until critical tests are verified.

## Operating constraints / open risks

- **Not production-certified**: true Northflank deployment and native browser UI are not verified in this environment. CI only becomes evidence after a real GitHub Actions run.
- No persistence: server restart, rolling deploy, or replica switch loses active rooms; do not scale beyond one instance. There is no public matchmaking, account, chat, moderation, rate limiting or DoS defense. Private repository / restricted staging testers preferred.
- Cross-origin GitHub Pages and shared multi-instance topology remain unverified. Avoid public release until hardened.
- No Docker CLI available for direct image build here; only a CI build can validate that.
- Direct user-side local testing has been waived; **this does not count as PASS** for unexecuted tests.

## Next step

Upload this GitHub-ready code into a **new isolated GitHub repository**, watch CI, then connect a **separate Northflank staging service** and complete remote acceptance. No change to existing Season 1 or VS AI deployments.
