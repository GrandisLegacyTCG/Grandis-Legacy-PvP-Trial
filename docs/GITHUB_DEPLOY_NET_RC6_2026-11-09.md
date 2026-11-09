# NET RC6 Stage 1 - Manual GitHub Trial / Northflank Staging

**Repo:** `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` ONLY. **Never upload to the Season 1 repo.**

1. Extract the NET RC6 ZIP into the root of a NEW trial branch (`s0-net-rc6-stage1`) and push it manually. Do not upload the ZIP itself as one archive file; commit its extracted contents, including `package-lock.json` and `.github/workflows/qa.yml`.
2. Let GitHub Actions finish. Workflow installs native `ws@8.21.0` with `npm ci`, enforces native WS in tests, validates the source/regressions, builds Docker, then starts the Docker image and checks `/health`.
3. For Northflank use a **Dockerfile** service based on this branch, exposed HTTP application port **3000**, HTTPS/WSS allowed, `/health` readiness, and **one instance**. The single in-memory room cannot be scaled horizontally without a shared session store.
4. Open `/health` and confirm `ok=true`, buildId `gl-s0-net-rc6-stage1-2026-11-09` and **transport `ws`**. If transport is `lite`, do not promote this deployment: the Docker environment did not install/use the planned native WS.
5. Test lobby/Ready/Start/Coin and an Attack with PASS on each side; then Defense, Reaction, nested Response, reconnect during a pending decision, network jitter and at least one full match on real Android/desktop.
6. In both browsers, use `/?pvpPerf=1` -> `/battle/?pvpPerf=1` to compare RTT, network ACK vs server engine time, Response paint, and start-to-first-battle-packet. Note any multi-second delay with exact device/network, action and measured stage.
7. Keep old RC5 Trial build for rollback. Only integrate the RC36.3 gameplay/UI donor after this transport stage passes hosting tests.

**Important:** this staging build still has RC34 game rules, old gameplay UI, and original BGM asset. It is intentionally **not** the final RC36 Lightweight build. New gameplay behavior must come from verified RC36.3 integration, not from silently relabelling RC34.
