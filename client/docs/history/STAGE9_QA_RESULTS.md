# GRANDIS LEGACY — VS AI SEASON 0 — CONTINUATION QA (2026-11-04)

**STATUS: RELEASE CANDIDATE. Full ordinary Chromium Human-vs-AI UI match to natural terminal is STILL UNVERIFIED.** Do not promote this to production-verified.

## Changes made in this checkpoint

- Corrected the LOCAL_AI `GL_VERSION` string exposed by the v6.91.9-derived application from an old VS AI v6.48 / OSA S1 v1.9.5 label to **VS AI Season 0 v1.0 RC · Base v6.91.9 · OSA DEV45 · Runtime Data S0 DEV44**. Only descriptive runtime metadata changed. PvP/Tutorial branches were retained as historical code, not modified. No gameplay effect implementation or database changed.
- Read and exercised the existing external Chromium UI. Multiple UI-automated attempts followed lobby, coin flip, original battlefield, PLAYER phase progression, AI activity, Response PASS, and player Hand-limit Discard through multiple rounds. Full natural UI terminal was not reached before bounded test execution was stopped. No browser normal-win/loss result was observed, and this does **not prove** a gameplay defect or full playability.
- Direct loopback HTTP navigation in the test browser was blocked by administrator; browser smoke used the original HTML/JS and local assets intercepted at a virtual origin. This is not actual hosted/GitHub Pages deployment verification.

## Checks rerun after the metadata correction

| Check | Observed result |
|---|---|
| JS syntax `node --check engine/shared-app/app.bundle.js` | PASS |
| S0 DEV45 / DEV44 pinned export and count verification | PASS |
| 5 S0 starter decks (50 Main, 12 Mana, 12 Legacy); official 251 artwork | PASS |
| Invalid deck rejection through actual deck validator | PASS |
| Stage5 existing 18 + completion 24 targeted checks | PASS |
| Stage6 existing 20 Bard/AI targeted checks | PASS |
| 5 **new** full terminal Node-VM matches using existing local game engine | PASS: AI wins at rounds **19, 12, 15, 12, 19**; 0 recorded errors; passive human |
| New Chromium bootstrap check: code loads, zero console JS errors and zero requested missing assets, `getSnapshot().version` identifies S0 correctly | PASS |
| At least one browser Human-vs-AI match to natural Game Over through full external UI | **NOT VERIFIED** |
| Hosted production URL and physical mobile battlefield match | **NOT VERIFIED** |

The 62 targeted checks do **not** establish all card interactions or tactical AI quality. The five Node matches do **not** substitute for a normal full game via interactive browser UI. The older Surrender result-modal smoke is not a normal match.

## Remaining required acceptance

1. Complete one **ordinary**, non-Surrender match to terminal through the unmodified interactive browser UI and record the on-screen result and underlying terminal state.
2. If a real defect appears, fix only that defect, rerun targeted regressions and the same UI scenario; otherwise do not redesign the game/UI/AI.
3. Verify regular hosted/served assets and test mobile battlefield usability before production certification.

**Data authority remains unchanged:** OSA DEV45 official S0 cards/effects/art, DEV44 pinned consumer exports; original S1 app code is a handler/UX baseline only.
