# Verification — Grandis Legacy PvP v3.33

Date: 2026-09-04

## Passed locally

- `npm run check` — PASS after runtime-sync regeneration.
- `npm run test:package` — PASS.
- `npm run test:bridge` — PASS.
- `npm run test:ui` — PASS.
- Additional gameplay/source regression scripts outside `check` — PASS.
- Runtime sync lock — PASS for 25 files.

### Reported parity bugs

- Deployment-integrity / structural cleanup regression — PASS.
- Player-name render regression — PASS with a stale canonical `OPPONENT` and live room name override.
- Mobile hamburger — PASS: absent from static gameplay HTML and physically removed by active-match lifecycle.
- Mobile Hero star — PASS in the functional VM runtime path using the shared VS AI action menu.
- Hero/Legacy parity — PASS through exact VS AI Legacy markup/parity contract and attachment-slot parity regression.
- P.Atk/M.Atk/P.Def/M.Def — PASS in functional runtime harness: all four VFX assets are painted and all four audio assets are played using VS AI semantics.
- Card Played parity — PASS.
- Quick Reload / Aura Infusion Bolt counter — PASS.
- PvP deck legality 60 / 3 / 1 — PASS.

## Cleanup assertions

Tests also fail if any of these obsolete layers return:
- `legacy-card-anchor` workaround.
- `__gl_vfx_retry`.
- `battleFeedbackFromAnimationPlans`.
- static gameplay hamburger.
- old generic in-match hamburger display rule.

## Server/live limitation in this sandbox

`test:server` and `test:room` cannot run here because the package dependency `ws` is not installed in the sandbox (`ERR_MODULE_NOT_FOUND: ws`). The package correctly declares `ws ^8.18.0`; normal deployment installs dependencies. A real production GitHub Pages + two-Northflank two-browser session was not run from this environment.

Therefore this verification claims **local source/runtime behavior**, not that production has already been redeployed. Production must deploy this exact release to all three targets; the new build handshake prevents a mixed deployment from masquerading as success.

## Performance finishing verification

- Deployment-integrity regression now asserts one precompiled `vm.Script`, no per-match runtime source compilation, compression disabled, 1 MiB payload ceiling, and player-only 10-second signal sampling.
- Static/runtime check confirms signal ping handling returns before room broadcast.
- Starter-vs-Starter canonical board JSON measured ~6.3 KiB in the bundled VM harness.
- `npm run check`, package, bridge, UI, and offline gameplay regressions pass after the performance cleanup.

## Final finishing pass

- Performance budget assertions — PASS.
- Runtime-sync lock regenerated after cleanup — PASS (25 files).
- `npm run check` — PASS.
- `npm run test:package` — PASS.
- `npm run test:bridge` — PASS.
- `npm run test:ui` — PASS.
- Offline gameplay regressions for attachment parity, defeat/Casting cleanup, Source Stack adoption, Stoneblood progression, review font, End handoff, and gameplay foundation — PASS.
- Final manifest verification — PASS after release files are finalized.
- Local Chromium navigation is blocked by the sandbox administrator for both `file://` and loopback HTTP URLs, so a real browser page-load test is not claimed. The VM/runtime functional tests remain the browser-behavior evidence available in this environment.
