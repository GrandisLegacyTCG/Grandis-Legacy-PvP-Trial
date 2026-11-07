# Grandis Legacy VS AI Season 0 — v1.0 RC31

**Release date:** 2026-11-07  
**Baseline:** Official v1.0 RC30 (2026-11-06), incorporating the approved UI-001 staging modification.  
**Status:** **RELEASE CANDIDATE — NOT FINAL**. Official OSA Season 0 DEV45 unchanged.

## Approved scope and changes

1. **Reopen Match Result:** At Game Over, reuse the Surrender button's exact location with the `Match Result` action. The Game Result popup still opens automatically, can be dismissed using CLOSE, and can be reopened any number of times without altering match state. While a match is active the same button remains Surrender, with its existing confirmation. No new sidebar button or layout rearrangement. Remove the previous automatic 60-second return to Lobby to preserve the ability to view the final battlefield and reopen the popup; **BACK TO LOBBY** still works as the explicit navigation control.
2. **Restore favicon:** Add an explicit `<link rel="icon">` to the existing, bundled `engine/assets/favicon.png`. This favicon is byte-identical to the Grandis Legacy Website v1.40 and Deck Builder v1.60 favicon. No asset duplication or new artwork.
3. **No gameplay change:** The separate designer ruling about Item/Greater Health Potion requiring Ready when its effect Exhausts the Hero is recorded as pending; it was not implemented in RC31. Prior RC30 gameplay, card assets, AI logic, and OSA DEV45 source are retained.

## Files changed relative to RC30

- `index.html` — Match Result button ID (staging) and favicon link.
- `shared-app/app-runtime.js` — Surrender/Match Result state handling, reopen, remove 60-second automatic return.
- `shared-ui/battlefield-ui.css` — finished-button color, no repositioning.
- `README.md`, `docs/TAKEOVER_NOTE.md`, `docs/qa/rc31/*`, `docs/manifests/RC31_FILE_SHA256.csv` — release documentation and checksums.

No card definitions, official OSA, gameplay engine or other app components modified.

## QA / acceptance limitations

- **16/16 PASS** in focused controlled Chromium browser tests using the actual bundled engine and inline-loaded DOM: lobby, active match Surrender confirmation/cancel, game end via Surrender, initial popup, CLOSE, two reopening cycles, result preservation, non-mutating state, 820px/1024px/1600px layouts, Back-to-Lobby control presence, no page JS errors.
- **PASS** JavaScript syntax checks: `shared-app/app-runtime.js` and `engine/shared-app/app.bundle.js`.
- **PASS** static favicon reference, valid 120x120 PNG, byte-exact match to the canonical Website/Deck Builder asset; ZIP entry and CRC checked after packaging.
- **BLOCKED** hosted HTTP/browser asset-loading regression because localhost network navigation is unavailable in the execution environment; only direct file/asset references are statically validated.
- **NOT VERIFIED** natural complete Human-vs-AI game to a Win/Loss/Draw terminal state, native Firefox, live BACK TO LOBBY browser navigation, complex natural Defense interactions, and any untested card/AI interactions. Previous RC30 QA totals represent previous targeted suites, not a re-run in RC31.

**Do not claim final.** Details: `RC31_QA_SUMMARY.json`, `RC31_UI001_CHROMIUM_QA.json`, `docs/TAKEOVER_NOTE.md`.
