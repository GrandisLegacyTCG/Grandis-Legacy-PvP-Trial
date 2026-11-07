# Stage 6 — targeted QA results (2026-11-04)

Commands executed from repository root:

```sh
node --check engine/shared-app/app.bundle.js
node --check shared-app/app-runtime.js
node --check engine/js/runtime-authority.js
node --check runtime/adapters/authority-adapter.js
node --check runtime/adapters/local-ai-adapter.js
node runtime/season0-generated/check-consumer-stage3.cjs
node runtime/season0-generated/check-stage4-assets-starters.cjs
node runtime/season0-generated/check-stage4-engine-deck-guard.cjs
node runtime/season0-generated/check-stage5-gameplay-targeted.cjs
node runtime/season0-generated/check-stage5-completion-targeted.cjs
node runtime/season0-generated/check-stage6-ai-bard-targeted.cjs
```

PASS: JavaScript syntax; consumer pins/catalog; 5 approved starters/251 active artwork; deck guard; Stage5 18 + 24 targeted function checks; Stage6 **20 targeted source-function assertions**.

New tests include multiple Bard/Maestro per Draw Phase, optional 0 discard, proper Hand/Discard/Draw movement, invalid duplicate index rejection, note-discard prioritization, S0 Wings and Accuracy follow-up identification, Ultimate held on nonlethal target, finishing priority and Bromir defensive urgency, external choice UI and runtime intent mappings.

NOT VERIFIED: Chromium boot, full UI/animation integration, complete game, AI real-game behavior or all 426 source effect branches. This is not a gameplay PASS declaration.
