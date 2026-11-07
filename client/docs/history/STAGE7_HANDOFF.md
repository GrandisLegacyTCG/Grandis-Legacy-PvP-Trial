# VS AI Season 0 — Stage 7 checkpoint (2026-11-04)

## Status
**TARGETED QA + FIVE NODE-VM TERMINAL MATCHES PASS; BROWSER FULL-MATCH TERMINAL STILL UNVERIFIED.** This is Stage 7 working candidate, **NOT a final verified playable release**. Stage 8 remains outstanding.

## Source basis
Continue from Stage 6, OSA Season 0 DEV45/DEV44 only for card IDs/names/costs/text/effects/art. Reuse original v6.91.9 engine, UI, transactions, AI action planner, and approved Casting (0 on play / +1 own End Phase / forced Runeforged release) and Discard CONDITION behavior. OSA, Deck Builder and PvP untouched.

## Actual Stage 7 corrective change
File `engine/shared-app/app.bundle.js`, `commitHandLimitDiscard()`: when the PLAYER completes required End Phase hand-limit discards, call `finishPlayerEndToAI(appState)` instead of calling `runAITurn(appState)` directly. The original shortcut skipped `advanceRoundAfterCompletedTurnPair()` when AI had the first turn; live Chromium clicks reproduced repeated Round 3 display despite advancing multiple turn pairs. After correction, browser log shows Round 3 -> 4 -> 5 -> 6 -> 7 normally. This fixes turn metadata without changing card data or hand-limit selection UI.

## Evidence
- `STAGE7_VERIFICATION_LOG.txt`: 5 JS syntax checks + pinned source consumers + artwork/starters + engine deck guard + Stage5/Stage6 existing focused tests, all pass.
- `STAGE7_ENGINE_MATCH_RESULTS.json`: 5 terminal matches executed using **actual v6.91.9-derived app engine in Node VM** with a passive player policy and local AI, rounds 11 / 14 / 17 / 13 / 20, no recorded errors, physical Mana invariant checked. AI winning against a passive player **does not demonstrate tactical AI quality**.
- `qa/stage7/CHROMIUM_LOBBY_DESKTOP.png`, `CHROMIUM_LOBBY_MOBILE.png`, `CHROMIUM_BATTLEFIELD.png`, and browser partial logs: actual Chromium executes original UI scripts, renders correct local S0 artwork, accepts lobby deck selection/coin flip, transitions to game board, lets player advance phases, exercises AI plays, Response PASS, End Phase hand-limit card discard, and advancing round after fix. Desktop and portrait mobile lobby inspected. Browser was loaded through an inline-script/intercepted-asset harness due URL navigation restrictions; code and assets came from the working source. 
- `STAGE7_BROWSER_UI_RESULT.json`, `STAGE7_ACCELERATED_BROWSER_UI_RESULT.json`: exploratory browser runs with a time budget, **not terminal matches**. Experimental direct engine-only Chromium script, if present, is not a UI-playability gate (bypassed original timed app director).

## Known open work
1. A **complete Human-vs-AI match reaching terminal win/loss/draw in the target browser with real UI flow** was NOT demonstrated in this checkpoint. Continue this before declaring Stage7 fully PASS / Stage8 production-ready.
2. Browser test uses Playwright-inlined scripts and intercepted local assets because direct `data:` navigation was blocked by administrator. Verify regular hosted/GitHub-Pages path behavior and mobile battle through actual user environment.
3. Targeted tests and five passive-player matches cannot prove tactical AI choice quality, correct interactive handling of all Season 0 special effects, or exhaustive combinations. Test Bard ability and high-risk S0 combos in live UI if needed. Old S1 version-specific self-test hooks may fail because they assert 200 S1 IDs or obsolete effect semantics; do not treat those as current S0 certification.
4. No new gameplay/card source data changes and no modifications to OSA, Deck Builder or PvP.

## Next checkpoint
Finish browser terminal-match check, resolve only reproducible defects, then Stage 8 coherent final source ZIP + complete TAKEOVER + verified QA. Preserve this Stage 7 source ZIP as rollback checkpoint.
