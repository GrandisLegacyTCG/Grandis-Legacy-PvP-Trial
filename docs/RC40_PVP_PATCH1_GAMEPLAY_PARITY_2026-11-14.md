# Grandis Legacy PvP — Season 0 RC40 Integration, Patch 1 / Stage 1

**Date:** 14 November 2026  
**Official VS AI donor:** `Grandis_Legacy_VS_AI_Season0_RC40_2026-11-14.zip` (RC40 Main Deck R3.8, Legacy R3.7, 242 canonical card IDs).  
**PvP base:** `Grandis_Legacy_PvP_S0_RC39_Repo_RC9_Stage3_P1_CardPlayed_Mana_Hotfix_FULL_2026-11-13.zip`.  
**Build ID:** `gl-s0-pvp-rc40-patch1-gameplay-2026-11-14`.  
**Network:** unchanged RC6 Stage 2 one WebSocket. Authority: unchanged server headless engine and existing exact-action commits.

## Scope delivered — gameplay/data only

- Transplanted 23 narrow RC40 gameplay functions and four dedicated helpers into the PvP shared engine, **without replacing the PvP adapter, networking or server action gateway**.
- Canonical Main R3.8 + Legacy R3.7: 242 cards/IDs, generated definitions, effect recipes, hero components, runtime stack, asset manifest and JS runtime authority now from RC40.
- Synced **25 updated** official WebP artwork assets (13 Main + 12 Legacy, exactly verified by all-card SHA256 test); original artworks outside this delta unchanged.
- All **10 revised Legacy abilities**: five L001 discard 1–2 legal Base Class Skills from Hand and draw the same number; five L002 one legal Hand cost and matching Deck/Discard search/return as printed (with Ultimate restrictions). Local ability selection now allows CONFIRM at one or two qualifying Skills; legacy result still validated/committed by the PvP authority.
- `Coordination Attack` two-turn BUFF: +10 or +20 damage, with three different Base Classes evaluated from original three-Hero roster including defeated Hero/Legacy slots, snapshot at activation.
- `Defensive Formation` now costs 3 Mana and is two-turn BUFF, **not** a Response: reduce incoming Physical/Magical damage by 40 or 80 using the same roster predicate.
- Burn +10 applies to **connected hits before BLOCK/damage reduction**; DODGE and NEGATE do not connect, newly inflicted Burn does not amplify its own hit.
- Official Hero HP corrected: Elara Heavens Rank III 130, Bromir Oathforge Rank I 90. `Poison Vial` requirement updated for Archer/Thief/Warrior and trigger on Physical HP damage. `Magic Compass` searches exclude Ultimate. `Ancestral Focus` receives its RC40 Gain 2 Mana Shards printed effect.
- `Flame Dragon's Wrath`/`Venom Detonation` print-authoritative Area Attack with Magical damage; Stage1 RC9 Response fixes (Dual Arrow/Intercept/Smoke Screen) are retained.
- Browser build identity and script query versions bumped to prevent old RC39 engine from being reused after a manual deployment. Re-generated HTTP .br/.gz static assets.
- The legacy five-starter catalog's **unchanged November 11 deck export metadata** is intentionally kept to preserve existing starter/deck compatibility; the actual card behavior and image authority are now RC40. Its older descriptive tags are **not** authoritative for rules.

## Test evidence (executed on Patch 1 source)

- Official RC40 canonical effect QA adapted to current PvP engine: **44/44 PASS**, including all ten Legacy abilities, card data/recipe parity and artwork SHA256 for 242/242 cards.
- Official RC40 Event lifecycle QA adapted to PvP engine: **5/5 PASS**, including actual 3-Mana commit, BUFF duration, damage reduction, no Response and no Exhaust.
- New PvP-specific Burn/HP/Item/Racial QA: **8/8 PASS**.
- Pre-existing RC9 Stage1 Response regression updated for RC40 Defensive Formation: **13/13 PASS**, including real Dual Arrow multi-target and mirrored seat Response.
- Preserved Stage2 History: **11/11 PASS**; Stage3 Legacy / two-seat authority: **18/18 PASS**; RC9 Stage3 P1: **8/8 PASS**.
- `npm run check:rc40-p1`: **PASS** (JS syntax, all above, two-seat atomic Mana/Response, privacy, single WebSocket, lobby, catalog, asset integrity).
- Additional live-local automated WebSocket gating, reconnect/ID, local HTTP compressed asset checks: **PASS**.
- Full historical `npm run check` is **not certified**: some old RC39 tests pin old art hashes/Defensive Formation rules; do not interpret those as current RC40 failures without updating obsolete fixtures.
- Two humans manually playing a complete game (Firefox/mobile, latency/CPU and host deployment) remain **NOT TESTED**. Stage 1 is **patched, not public-ready**.

## Explicitly deferred (do not treat as fixed)

**Stage 2:** full Card Played RC40 donor parity; Item Arrow identity mapping (F01), Mana Pool blinking (F02), duplicated BLOCK/DODGE/damage sound (F03); mana notification timing/visibility and safe projections.

**Stage 3:** RC40 Card Review v1.66, reveal/Counter Chain, responsive UI polish, performance and full playtest. Promotion target: **`https://grandislegacytcg.web.id/pvp`** (not older project hostname). Final PvP lobby must have **GO TO VS AI** and **GO TO DECK BUILDER** buttons. Determine canonical routes / reverse proxy subpath at Stage 3; do not guess links or change routing now. No GitHub push, Northflank changes, or DNS/deployment changes made.

## Manual deployment caution

Use the FULL ZIP when replacing a different base, or changed-only **only on the exact RC9 Stage3 Patch1 FULL baseline**. Deploy complete JS + JSON + WebP + precompressed asset changes together. Verify `/health` returns the Patch1 Build ID and both players load that ID; clients using older builds should reload. Do not hot-swap running match code mid-game.
