# GitHub Trial / Northflank - Network RC6 Stage 2

**Staging only.** Recommended target: `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` on a distinct staging branch, such as `s0-net-rc6-stage2`.

1. Extract the Stage 2 ZIP, including `.github/workflows`; commit **its extracted contents** at the repository root. Do **not** upload this ZIP as a single repository file. Do not overwrite the Season 1 PvP repository.
2. Run the included GitHub Actions workflow. It installs Node 22, Python WebSocket QA, native `ws@8.21.0`, runs `npm run build:precompress` / `npm run check`, builds Docker, and checks that `/health` reports `transport: ws`.
3. Deploy using the root Dockerfile in a **single** Northflank instance, port `3000`, WebSocket upgrade enabled, endpoint `/health`. In-memory room state does not support horizontal replicas or automatic failover persistence.
4. Open the root lobby `/` in two browser/device sessions, not `/battle/`. Test normal flow through Coin Flip and Battle, real Response and Mana Payment, reconnect, and 60-second cleanup. The root route preserves a single WebSocket; a direct standalone `/battle/` URL uses a separate fallback connection.
5. For performance diagnostics open `/?pvpPerf=1` and inspect the browser logs on both devices. Do not share card-private snapshots, session seat tokens, or sensitive browser logs publicly.

**Known limits:** RC36.3 engine/UI and AI/BGM removal are not in Stage 2. Full hosted browser QA and performance baselines are not certified. If the embedded battle UI fails, roll back to RC6 Stage 1 or RC5 rather than disabling server-side rules or viewer masking.

No GitHub push/deployment was performed by the assistant; upload/deploy remains manual as requested.
