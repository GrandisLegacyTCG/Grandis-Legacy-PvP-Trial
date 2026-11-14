# Grandis Legacy PvP — RC40 Integration Patch 3
**Date:** 14 November 2026  
**Based on:** PvP RC40 Patch 2 FULL  
**New build ID:** `gl-s0-pvp-rc40-patch3-website-ui-2026-11-14`  
**Status:** Patched / focused-QA PASS; live public launch NOT verified.

## Verified website sources
The connected `GrandisLegacyTCG/Grandis-Legacy-Website` GitHub `main` README and CNAME were read on 14 November 2026. Official paths:
- `https://grandislegacytcg.web.id/` — VS AI RC40.
- `https://grandislegacytcg.web.id/deck-builder/` — Deck Builder v1.66 Style 1.
- `https://grandislegacytcg.web.id/deck-builder/style-2/` — Deck Builder Style 2.
- `https://grandislegacytcg.web.id/pvp/` — GO TO PVP button target **exists as a link only**. There is no PvP page or Node server in the Website repository at the time of inspection.
- The Website repository has 248 files in root `/card-art/`, shared by VS AI and Deck Builder.

## Implemented in Patch 3
1. **PvP Lobby navigation.** Added `GO TO VS AI` and `GO TO DECK BUILDER` to the existing Season 1-style PvP lobby header. Buttons use the exact production paths above. Logo also points to the official VS AI home. Responsive styles support desktop, landscape, and narrow screens, with keyboard focus indicators.
2. **Card Review v1.66.** Read-only printed view-model for all 242 Season 0 cards copied from official VS AI RC40 (`db166-view-model.js`). Updated isolated renderer and clarity assets. Existing PvP iframe reuse retained to avoid reloading on repeated opening. Both lobby and battlefield use the same current RC40 registry; gameplay still comes exclusively from the PvP server.
3. **RC40-style Counter Chain.** The existing committed `CARD_NEGATED` notice queue now renders one horizontal `card → COUNTER → card` information row with self/opponent colors, rather than adding another overlay. PvP duration uses RC40 3.5-second reference plus the established +1 second PvP allowance. Duplicate event IDs are still suppressed.
4. **Static `/pvp/` website integration.** An optional separate ZIP contains a static `/pvp/` folder ready to be added to the existing Website GitHub repository. It does not overwrite root VS AI or Deck Builder files. The optional bundle includes a fixed `build-meta.js`, external backend WebSocket configuration, and subpath-safe asset references. The backend is still the separately deployed Node/Northflank server.
5. **Origin security and route tolerance.** The Node backend continues to allow original same-host WebSockets and also the exact official site Origin `https://grandislegacytcg.web.id`. An optional `PVP_ALLOWED_ORIGINS` environment variable can add explicit trusted origins. The Node HTTP server also accepts static `/pvp/` prefixed paths, but GitHub Pages itself cannot proxy WebSockets.
6. **Performance/artwork.** The self-contained Node FULL build keeps its own local artwork, with no external image server. The optional GitHub Website `/pvp/` static bundle instead reuses `/card-art/` already on `grandislegacytcg.web.id`, the same domain and browser cache as VS AI and Deck Builder. All **248 local artworks** were compared byte-for-byte with official VS AI RC40 and matched; no copies are placed in website addon. This avoids 18.3 MB of duplicated site files and does not open a new image domain connection.

## Preserved from Patch 1 & Patch 2
- RC40 engine, Main Deck R3.8, Legacy Deck R3.7, 10 Legacy abilities, Event Buffs, Burn order, updated Hero HP and item restrictions.
- PvP server authority, single WebSocket RC6 Stage 2, atomic Mana selection, valid Response, existing hidden-information filters and reconnect handling.
- Card Played details, correct Item arrows, stable Mana Pool DOM, no double impact SFX for full Block/Dodge, target-only Mana loss notifications.
- Correct designer term **“Mana cards”** for Ancestral Focus remains noted; no gameplay effect changed.

## Deployment (manual)
Use **FULL Node ZIP** for the standalone PvP backend. It serves `/`, `/battle/`, `/health`, and `/ws` (and static `/pvp/` aliases). The optional static website addon should be uploaded only under the existing Website repository's `/pvp/` path, preserving the site's root files including `.nojekyll`, `CNAME`, `/card-art/`, VS AI and Deck Builder.

The static site's `pvp/config.js` uses a **previously recorded Northflank host** as `wsBase`. That hostname was not reachable for current verification in this environment. **Confirm and update `wsBase` to the actual production WSS URL before publishing, and deploy this exact Patch 3 Node build first**; older server builds will reject the new `buildId` handshake. Test `PVP_ALLOWED_ORIGINS`, WSS upgrade, both seats and spectator. The GitHub Pages site itself cannot run the PvP server or proxy `/ws`.

**Nothing was pushed to GitHub, Northflank, or the production website.**

## QA completed
- `npm run check:rc40-p3` — PASS, including Patch 1 and Patch 2 regressions, Mana/Response, server-authoritative gameplay, hidden-information checks, one-socket tests, and 7 new Patch 3 tests.
- `npm run test:http` — PASS (Brotli, ETag, no exposing `.br/.gz` sidecars).
- Standalone Node `/health`, `/pvp/`, `/pvp/battle/assets/review-db158/js/db166-view-model.js`, compressed JS — HTTP 200; correct build ID.
- Static Website addon QA — **8/8 PASS** (asset resolution, same-origin artwork paths, 248 card hashes matching donor, external WSS config, matching build ID, official navigation and preserved namespace).
- JavaScript syntax checks — PASS.
- Package SHA/ZIP verification performed for the FULL, changed-only, and Website ZIPs.

## Not verified / launch gate
1. Complete interactive PvP match on **two live browsers** with actual Northflank WSS, reconnect, private Hand/Deck/Mana, Block/Dodge audio, and legacy choice.
2. Live availability of the previously used Northflank hostname and `https://grandislegacytcg.web.id/pvp/` after manual GitHub deployment.
3. Desktop/mobile visual QA in real Chrome + Firefox. A headless Chromium attempt in the tool environment could not finish; no screenshot-based acceptance is claimed.
4. Production latency/CPU/RAM, CDN caching, simultaneous users and deployment/release smoke.
5. RC40 selected-card public reveal has **not** been enabled for hidden PvP cards without authoritative visibility permission; existing private Card Played/choice displays remain.

**Release classification:** Candidate for manual staging QA; not a verified public release.
