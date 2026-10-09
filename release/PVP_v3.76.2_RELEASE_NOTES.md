# Grandis Legacy PvP v3.76.2 — Stabilization / Presentation Bridge Fix

## Authority boundary
- Gameplay, network, WebSocket lifecycle, lobby, coin flip, payment, pending choices, Response, privacy, reconnect, spectator and surrender remain on the PvP v3.51 authority path.
- VS AI v6.90.7 is used only for the external gameplay presentation shell and its UI behavior.
- `pvp-fresh-v3.73.20` was not used as an implementation donor.

## Root causes and fixes
### Sound
Root cause: the proven PvP audio helper returned early when `SUPPRESS_RENDER` was true. External presentation intentionally suppresses the native renderer, so the same guard also silenced SFX.
Fix: audio playback is no longer gated by renderer suppression. Existing sound state/toggle remains the source of audio enablement. The native renderer remains suppressed.

### Timer
Root cause: the external v6 shell did not expose a `[data-pvp-match-timer]` node, while the native PvP renderer that previously owned the node is suppressed.
Fix: the bottom rail now contains `Timer | Sound | Surrender`; the timer node is bound to `GL_PVP_MATCH_TIMER_TEXT`, which is maintained by the existing PvP network timer controller. No second timer engine was added.

### Tribute / EXP stack
Root cause: the v6 external integration stylesheet referenced `engine/assets/exp/Stack 100-200EXP.png`, which is not the canonical public presentation path in this PvP package.
Fix: the stylesheet now resolves `assets/exp/Stack 100-200EXP.png`, and the asset is packaged at that path. Tribute rules and authoritative `exp_cards` state are unchanged.

### Initial boot/loading
Root cause: raw/hydrating DOM could paint before both runtime and CSS were ready; all static files were also forced through `no-store`.
Fix: an initial parse-time boot veil hides raw UI until the bridge runtime is ready. Static versioned files receive immutable cache headers; text assets support Brotli/gzip when accepted. Dynamic `/config.js` and `/health` stay `no-store`.

## Intentionally unchanged
- PvP v3.51 server/runtime authority and payment contract.
- Coin Flip controller and pre-game authority.
- Round 1 rule (first player is Attack-restricted only).
- Privacy/source masking model.
- Tribute/Rank Up/Defeat rules.
- No second gameplay engine, no local optimistic authority, no v3.73.20 intent/sync model.

## Tests actually run
### Passed
- `node --check server.js`
- `node --check public/js/app.bundle.js`
- `node --check public/js/pvp-network.js`
- `node --check public/js/pvp-gameplay-presentation.js`
- `node --check public/js/pvp-presentation-adapter.js`
- `node tests/run-v3762-stabilization-static.cjs`
- `npm run test:candidate3a:gameplay`
- `npm run test:candidate3c:lifecycle`

### Not counted as pass
- Historical `npm test` / v3.51 promotion tests: fail their hard-coded old package-version assertion after the release version changes.
- `npm run test:architecture`: fails an existing exact-source-string assertion for the current v3.51 masking function signature (`revision` parameter), not a runtime failure.
- Real two-browser acceptance was not executed in this environment. It must still be performed before production sign-off.


## Same-version deployment correction — 2026-10-09
- Version remains **v3.76.2**. No version bump.
- Root cause of `no healthy upstream`: `sync/runtime-sync-lock.v2.63.json` still contained pre-final hashes after the v3.76.2 source files were patched. The fail-closed startup gate therefore rejected `package.json`, `public/index.html`, `public/js/app.bundle.js`, and `server.js` before the HTTP server could listen.
- Fix: regenerated the runtime sync lock from the final v3.76.2 source tree, then regenerated the repository SHA-256 manifest. No gameplay/network/UI behavior was changed by this correction.
- Validation after correction: runtime sync verifier PASS (94 locked runtime files); repository/frontend manifest verifier PASS; `node --check` PASS for `server.js` and `public/js/app.bundle.js`.
- A full HTTP/WebSocket boot with the real `ws` package was not counted as executed in this sandbox because the package registry dependency download was unavailable here. Northflank/Docker will still install the locked dependency through the existing `npm ci` step.

## Browser acceptance still required
Run the 50-point acceptance list from the v3.76.2 task, with special attention to two-client Sound, authoritative Timer/reconnect, EXP stack/Reposition/Rank Up/Defeat, privacy, and cold-start/network 404 inspection.
