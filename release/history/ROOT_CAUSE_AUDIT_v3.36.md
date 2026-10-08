# Root Cause Audit — PvP v3.36

## Symptom

Live PvP showed correct names/mobile navigation after Website synchronization, but P.Atk / M.Atk / P.Def / M.Def VFX and sound still did not appear.

## End-to-end audit

1. **Renderer/assets:** the shared VS AI battle renderer and all four requested image/audio assets exist and execute correctly in the browser harness.
2. **Gameplay authority:** server canonical runtime records exact resolved battle feedback.
3. **Server transport:** `buildPublicAnimationEvents()` already converts newly resolved feedback into revision-scoped `kind: battle_feedback` events in `match.lastAnimationEvents`.
4. **Client defect:** `prepareAuthoritativeAnimations()` marked every `lastAnimationEvents` ID as seen, but `playAuthoritativeAnimations()` intentionally skipped `battle_feedback`. The client then attempted to recover battle feedback by diffing the imported canonical state's `pvpBattleFeedbackEvents` ledger. That second transport was indirect, payload-heavy, and could contain no new visible ledger entry after recipient masking/import timing.
5. **Result:** the exact server event was discarded before presentation while the fallback path could produce nothing.

## Fix

Use the server revision-scoped `battle_feedback` event as the only PvP battle-presentation transport. Capture it before board import, render the authoritative board, then invoke the shared VS AI renderer after two animation frames. Remove the canonical-ledger diff path from `pvp-network.js`. Recipient snapshots explicitly strip `pvpBattleFeedbackEvents`; the server-internal ledger remains available to build the exact public event.

## Signal indicator audit

The previous markup placed signal bars inside the same bordered `player-name` box. v3.36 introduces a borderless `pvp-identity-strip`: the bordered name/deck element and its signal are siblings. Local and opponent nodes retain distinct `data-pvp-signal-side` bindings and are updated from separate latency variables.
