# Grandis Legacy PvP S0 RC39 — Repo RC9 Stage 2 (13 November 2026)

**Build:** `gl-s0-pvp-rc39-beta2-repo-rc9-s2-2026-11-13`  
**Base:** PvP RC9 Stage 1 Response Parity FULL (13 November 2026).  
**Donor:** VS AI RC39 CardPlayed & Banners Update + Part 5 Dedup Fix (13 November 2026).

**Stage 1 retained:** Response rulings including Dual Arrow, whole-Attack Intercept/Smoke Screen, single target/Area subtype, status and authoritative timing.

**Stage 2 now patched:** recipient-safe discard and Mana result notices, local linked Card Played and discarded history, dynamic damage formula banner, real damage/Burn/HP and Status detail, no duplicate result math, reduced re-render overhead.

**Stage 3 pending:** Card Review performance, resolution-adaptive 5:7 Active Card, lobby-name TURN banner, centered Choose Legacy, final visual/live QA. Website navigation and promotion remain deferred until VS AI RC40.

**Architecture:** RC6 Stage 2 single WebSocket; no extra requests, engine remains server-authoritative, local Mana draft and one atomic final commit unchanged. No GitHub/Northflank action taken. Live two-browser playtest not yet verified.

Run `npm run check` for full historical suite (may take longer than focused QA limits), `npm run test:rc9-s2` for new recipient-safe Stage2 focused QA, `npm run test:rc9-s1` for Stage1 Response QA, and `npm run build:precompress` when deploying changed text assets.

See `docs/RC39_PVP_REPO_RC9_S1_RESPONSE_2026-11-13.md` and `docs/RC39_PVP_REPO_RC9_S2_INFORMATION_2026-11-13.md`.
