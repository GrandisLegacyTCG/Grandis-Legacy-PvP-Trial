# Grandis Legacy PvP Season 0 - RC40 Patch 3.2 Technical Audit

Date: 14 November 2026. **Status: staging candidate, NOT production-ready.** GitHub used read-only. No push, commit, PR, deployment or Website repository modification.

## Sources actually inspected

- Latest VS AI RC40 source: `Grandis_Legacy_VS_AI_Season0_RC40_2026-11-14.zip`, retained source `docs/qa/rc40/RC40_ITEM_DISCARD_UI_AUDIT_2026-11-14.md` and embedded 347-engine/6-UI Item/Discard test. Main Deck R3.8, Legacy R3.7, Mana R2, Rulebook v3.3.
- PvP working baseline: `Grandis_Legacy_PvP_RC40_Patch3_1_STANDALONE_FULL_With_Merge_Guide_2026-11-14.zip` (Card Played donor parity already shipped).
- GitHub read-only repository: `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` branch `main`, head `8d14f0d28c35095c6fcd18c96d1d69c931f1f1fc`. CI file `.github/workflows/qa.yml` and `tests/ws-gate.py` checked; obsolete RC39 build-architecture expectation confirmed in repository.

## Actual fixes ported from newest RC40

1. **Printed Item class access** enforced at the authoritative play/Response user, including Rank II/III class lineage. Only six Items restricted: Poison Vial Archer/Thief/Warrior; Spectral Grappling Hook Archer/Thief; Ring of Grace Warrior/Cleric; Holy Medallion Warrior/Cleric; Invisibility Cloak Mage/Cleric; Chain Mail Warrior/Archer/Thief. The other 14 Items remain All Classes. Item user may legally protect a different-class ally; this is NOT target-class restriction.
2. **Atomic physical choices:** Response extra Hand Discard, Legacy L001 1-2 correct-class Skills, Legacy L002 search/Discard pile candidates, End Hand Limit: validate exact selected pile/Hand index, card ID, distinct physical copies and candidate validity *before any cost/state mutation*. Stale/duplicate/invalid selection is rejected without substitute, cost or partial commit.
3. **UI recovery/clarity:** Legacy Deck read-only uses CLOSE, Magic Compass committed search removes invalid CANCEL, legal precommit conditions retain CANCEL, coin flip sentence case, player's Draw flips card back to visible face on arrival, opponent Draw remains concealed. Stale candidate refocuses the active center-selection stage rather than deadlocking.
4. **PvP boundaries preserved:** server headless runtime owns all gameplay and intent validation; the 1-WebSocket parent lobby transport, seat tokens, reconnect, atomic Response, viewer-safe projection, hidden information and Cards Played formatter remain. PvP source/presentation conflicts were resolved explicitly rather than replacing the entire PvP client/engine with VS AI source.
5. **CI** `tests/ws-gate.py` now checks the actual RC40 `architecture` and current `buildId` and verifies `/health.authoritySources` is the real SHA256 of active engine source, not merely a renamed assertion. Version bumped from Patch 3.1 to Patch 3.2 and references updated. Active regressions still validate privacy, both seats, coin, server state and reconnect.
6. **Artwork:** Verified SHA256 identity for **all 248/248** latest VS AI RC40 files against local PvP artwork. Created current immutable reference at `docs/RC40_APPROVED_ART_HASHES.json`. Historical RC39 art test now compares to RC40 donor, not obsolete RC39 hashes.

### Changes retained from Patch 3.1

- Direct use of canonical `v94EventDetailHtml` / `getPublicCardPlayedDetail` VS AI formatter and related cards; PvP custom Card Played renderer remains retired.
- Server-filtered Card Played detail and recipient-only Mana information; no extra WS on detail/review/animation.
- Stage 2 item arrow by Hero ID; incremental Mana Pool DOM; no double impact sound for full BLOCK/DODGE.
- Latest event effects, Burn before damage reduction, 1v1 Center lock, original roster Base Class BUFF evaluation, R3.8/R3.7/Rulebook v3.3.

## Verification carried out in this environment

| Check | Evidence / result |
|---|---|
| New Item/Discard engine and UI | **353/353 PASS** (347 engine + 6 UI checks), `node tests/rc40-item-discard-hotfix.cjs` |
| `npm run check:rc40-p32` | **PASS**, includes Patch 1/2/3/3.1 suites, Card Played renderer parity (11 checks), HTTP, assets, Mana, viewer privacy and WS gate |
| Real RFC6455 two-seat gate | **PASS** via local `websocket-client` against included lite fallback: lobby, READY, Coin Flip, start, advance phase, duplicate/stale batch rejection, masked spectator/Hand, seat-token reconnect |
| Single-WebSocket architecture | **PASS** parent-only transport + iframe bridge tests |
| Client privacy projections | **PASS** both seats and spectator; owner-only Mana/discard results |
| Artwork hashes | **248/248 SHA256 MATCH** VS AI RC40 latest |
| Precompress static assets | **PASS**, `npm run build:precompress` (84 assets including updated HTML/JS/CSS .br/.gz) |
| HTTP static, conditional ETag, Brotli | **PASS** (included focused test) |
| JavaScript syntax | **PASS** via `npm run check:syntax`, included in focused check |
| Historical suite (`npm run check`) | Ran through all tests up to **RC9 Stage 3** PASS but local command exceeded 300s timeout before final RC9 Patch 1; final RC9 Patch 1 test was executed separately and **8/8 PASS**. CI may complete on GitHub's 20-minute runner; full single-process completion **NOT verified** here. |
| Extra historical regression tests | Updated obsolete RC38/RC39 assertions to verify *current* RC40 behavior and pinned unchanged RC40 Patch 3.1 network/headless hashes; individually executed each changed test with successful results. Old 187-image RC39 hash expectation replaced by all 248 latest donor hashes. |
| `npm ci` | **BLOCKED in container:** npm registry DNS `getaddrinfo EAI_AGAIN`; offline cache `ENOTCACHED` for `ws@8.21.0`. Cannot certify native production `ws` in this container. |
| Docker build / native ws in container | **NOT RUN:** Docker unavailable; mandatory production `PVP_REQUIRE_WS=1` requires installed `ws`. GitHub CI includes Docker + native `ws` health verification. |
| Browser component QA | **BLOCKED:** local Chromium navigation to localhost returned `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Static HTML and script/CSS links were checked at file level, but real desktop/mobile visual QA is pending. |
| Live Northflank WSS + real 2-browser gameplay | **NOT RUN** (no verified live Northflank hostname or production deployment access). Must pass before public promotion. |

**Do not interpret a VM test or fallback RFC6455 test as a native `ws`/Northflank/two-browser production test.**

## Website handoff notes

- Separate ZIP contains **frontend only** under `pvp/` root; Node runtime, `server.js`, tests and Docker are excluded.
- Shared artwork `/card-art/` root reused; **0** duplicate `S0-*.webp` included in handoff.
- `/pvp/battle/index.html` changed the previously broken `/build-meta.js` absolute reference to `../build-meta.js` (the correct Pages location).
- New build metadata is synchronized between client and server.
- `pvp/config.js` now intentionally has **blank** `wsBase`; Website maintainer must enter **verified** production `wss://` host. `requireExternalWss` guard prevents silent fallback to GitHub Pages `/ws`.
- Website source repository itself has **not been touched**. Target static site remains `https://grandislegacytcg.web.id/pvp/` and backend separately hosted by Northflank.

## Unresolved blockers before releasing

1. Run CI with native `ws@8.21.0` installed (`npm ci` success), complete uninterrupted `npm run check`, and ensure Docker image starts with `transport:'ws'`.
2. Northflank one-replica deployment + verified public `https://.../health` and secure WebSocket `wss://.../ws` from `Origin: https://grandislegacytcg.web.id`.
3. Two real browsers: end-to-end two players, privacy frame inspection, reconnect/disconnect, gameplay/Response/Item effects, UI/mobile/audio and return to PvP lobby.
4. Website maintainer to edit handoff `pvp/config.js` to actual verified hostname then deploy separately; verify all `/card-art/` URLs/cache.

**Decision:** RC40 source hotfix ported and focused regressions passed, but **NOT production-certified** until all live deployment gates above pass.
