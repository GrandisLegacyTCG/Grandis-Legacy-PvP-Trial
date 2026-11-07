# Grandis Legacy PvP S0 RC32 — Northflank Preflight Worktree

**Date:** 2026-11-07. **Status:** FIXED IN STAGING / NOT DEPLOYED. **Baseline:** `pvp_s0_rc32_work` Playtest Staging, sourced from `Grandis_Legacy_PvP_S0_RC32_PLAYTEST_STAGING_2026-11-07.zip`; VS AI RC32 authoritative engine and UI; PvP Season 1 v3.51 only as architecture reference. **Scope:** proceed toward hosted playability without user-side local testing; staging development/QA only. **Original baseline remains unchanged.**

## Confirmed findings and changes

| Topic | Evidence | Change | Status |
|---|---|---|---|
| Custom deck display misleading | Original `update()` populated first starter when server accepted any deck; after a custom import dropdown still looked like first starter | Server exposes `myDeckKey` ONLY to the holder of that seat; lobby now explicitly shows `Custom Season 0 deck (validated)` and prevents accidentally clicking starter selection on `CUSTOM` | FIXED IN STAGING |
| S0-only deck envelope | RC32 engine accepted deck wrapper `season: S1` if nested actual data contained legal S0 cards | Reject explicit non-S0 `season` at headless server boundary; same gameplay rules retained | FIXED IN STAGING |
| Exported custom deck ambiguous | Deck Builder v1.62 shape contains both `deck.main_deck` and top-level `main_deck`. RC32 engine silently preferred top-level if both disagreed | Reject contradictory double representation for `main_deck`, `legacy_packages`, `shard_deck` | FIXED IN STAGING |
| Latest Deck Builder compatibility | Inspected actual v1.62 `js/app-s0.js` `s0Export()` (field `builder_version` is printed as 1.61) and reassembled an export-shaped **synthetic** fixture using an approved RC32 50/12/12 starter | Added `tests/deckbuilder-162-compat.mjs`: valid accepted, S1 and conflicting/invalid forms rejected. Not an actual 1.62 UI exported file | PASS, limited scope |
| Northflank readiness procedure | Node 22 Dockerfile and HTTP/WS from source; official Northflank port/build docs | Added `.github/workflows/staging-qa.yml` (unexecuted in GitHub), `tests/hosted-northflank-smoke.mjs` and deployment gate doc | STAGED / HOSTED NOT VERIFIED |

## QA evidence

| Test | Result | Notes |
|---|---|---|
| `npm run check` | PASS | Baseline syntax, RC32 source/override, privacy, actual Attack/Response, long deck-out, WebSocket rooms, custom deck and full WebSocket deck-out; see project scripts |
| `node tests/deckbuilder-162-compat.mjs` | PASS | Synthetic export schema, 50/12/12 and adversarial envelope cases. Not a generated v1.62 UI export. |
| `PVP_PUBLIC_URL=http://127.0.0.1:39617 npm run test:hosted` | PASS | Local Node HTTP+WS service, disposable room, 2 seats, masking, ready, coin, rejection, turn, reconnect, surrender. Remote Northflank not involved. |
| `PVP_TEST_PORT=39618 python tests/browser-bridge-smoke.py` | PASS | Two Chromium renderers, genuine JS UI, test-only WebSocket relay, real Node authority; 0 page errors. Does not validate native browser WebSocket/HTTP. |
| Docker build / GitHub Actions | NOT VERIFIED | No Docker binary in execution environment, GitHub Actions workflow not run. |
| Direct public Northflank HTTPS/WSS | NOT VERIFIED | No Northflank service/repo or credentials accessed, no deployment. |
| Complete natural 3-Hero victory, special card and mobile coverage | NOT VERIFIED | Still outstanding; earlier deck-out tests cover only mandatory draw exhaustion, not normal victory. |

## Changed files vs staging baseline

- `server.js`: recipient-only own deck selection status.
- `server/headless-rc32.mjs`: early Season 0 / import envelope consistency validation (NOT game-rule changes).
- `client/runtime/pvp-network.js`: lobby selection shown accurately and custom import not replaced by a misleading starter label.
- `tests/pvp-network-extended.mjs`: owner-only deck selection test.
- `tests/deckbuilder-162-compat.mjs`, `tests/hosted-northflank-smoke.mjs`, `package.json`: preflight QA.
- `.github/workflows/staging-qa.yml`, `docs/NORTHFLANK_STAGING_GATE.md`, this takeover document, README appendix.

## Next checkpoint

1. Obtain an isolated staging GitHub repo and Northflank service/URL when the operator elects to stage the project. Do not touch production Season 1/VS AI.
2. Verify GitHub Actions results and actual Northflank Docker build then run `PVP_PUBLIC_URL=https://... npm run test:hosted` from an environment with Node 22. Record the supplied URL and observations. Testing the service with WebSocket alone does not prove the two human browser UIs.
3. Use two actual HTTPS browser sessions and real user choices. Mandatory 3-Hero combat victory and card-specific playability gate must be signed off before claiming playable/public release.
4. If new bugs arise, reproduce and patch in staging, run regression tests, and ask before official release/packaging.
