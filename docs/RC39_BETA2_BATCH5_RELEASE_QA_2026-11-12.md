# Grandis Legacy PvP S0 RC39 — Beta 2 Batch 5

**Build date:** 12 November 2026  
**Build ID:** `gl-s0-pvp-rc39-beta2-batch5-2026-11-12`  
**Status:** PvP Trial **staging candidate**; not yet verified by a live two-device browser match.  
**PvP baseline:** `Grandis_Legacy_PvP_S0_RC38_Beta2_Batch4_RC38_Latest_Source_2026-11-12.zip` (contains Batches 1–4).  
**RC39 donor:** `Grandis_Legacy_VS_AI_Season0_RC39_2026-11-12.zip`.

## Integration boundary

The new release integrates RC39's gameplay source using a three-way merge against the RC38 donor, **retaining PvP's server-authoritative bridge and its PvP-only fixes**. It is *not* a wholesale copy of the single-player application.

1. **RC39 engine and Rank Up:** Engine records immutable `RANK_UP_COMMITTED` with Hero source/destination, the complete committed EXP stack (including the last Tribute), return quota and rank-up transaction ID. The authoritative Rank Up return moves exact EXP cards after one local draft commit. PvP's browser presents all returning/discarding EXP together, then animates the new Rank Hero. Viewer-safe events include only the public EXP-card metadata needed for those animations.
2. **Seat 2 event perspective:** Fixed a redundant second side swap on `presentationEvents`, which could make committed Rank Up / effects appear associated with the wrong player. The actual engine and both recipient-safe projections were tested.
3. **RC39 Mana loss notification:** Normal Mana Payment is not affected. After an opponent Mana Burn/Steal selection is committed, or a Crusader/Paladin ability spends Shards outside the ordinary PAY picker, the server records an after-resolution `MANA_LOSS_COMMITTED` presentation event. Only the **affected** player's viewer-safe board receives that notice. It contains counts and Regular/Color summaries, **never physical Shard UIDs or unresolved blind-selection choices**. The browser renders the donor-style nonblocking notification once (deduplicated on repeat snapshots).
4. **Artwork:** 17 Archer Main Deck `S0-ARC-*.webp` replaced with RC39 R3.7 images; all **187/187** Main Deck artwork hashes match donor. `s0-asset-manifest-stage4.json` updated.
5. **Donor PvP adapter:** Included RC39 `runtime/adapters/pvp-adapter.js` **byte-identical** as a reference/factory. **Not activated**, so it cannot accidentally replace the tested Batch 3 local-draft system.
6. **Versioning:** Updated PvP RC39 server, health identifier, lobby title, relevant query-string cache IDs, regression metadata, package metadata. Brotli and gzip sidecars regenerated from final sources.

## Deliberately unchanged

- **One RC6 Stage 2 lobby-owned WebSocket**, Join/Ready/Start/coin/reconnect and response transport.
- **RC5 atomic Mana Payment**, Response payment, blind Mana selection via server-only opaque handles, and **face-up opponent Mana Pool** (private Hand/Main Deck/Mana Deck protected).
- **Batch 1** retained Card Review iframe and reduced redundant lobby rendering.
- **Batch 2** startup server precompile and optional idle battlefield warm-frame; preserve per-match isolated state.
- **Batch 3** local multi-card draft and single atomic server commit (EXP, Scouting, Bard/Hand discard, Crystal Ball, Legacy).
- PvP approved layout, Coin Flip **GO FIRST / GO SECOND**, mobile landscape, waiting notification, AOE post-Response FX, legal ST target hitboxes, SFX enabled, BGM absent. No AI opponent is enabled in multiplayer.

## QA evidence

| Check | Result |
|---|---|
| Source syntax (`npm run check:syntax`) | PASS |
| RC39 donor art parity | **187/187 PASS** |
| RC39 original engine Rank Up event, return-EXP via final atomic commit, Player 1 / Player 2 event perspective, viewer-safe projection, deduped animation plan | PASS |
| RC39 Mana loss resolved-event projection (only owner; no UIDs; no duplicate toast), class-ability hook | PASS |
| RC5 + Batch 3 local draft and actual engine choice roundtrips | PASS |
| RC6 Stage 2 one-socket parent/child transport | PASS |
| PvP viewer privacy and original Response / ST / AOE regression | PASS |
| Coin Flip winner picks first or second | PASS |
| Auto-Mana for 5 starter decks + v1.64 imported deck + 5-color hybrid combinations | PASS |
| HTTP static delivery / compression / health | PASS |
| S1 pregame gate → RC39 authoritative coin/opening / private Hand | PASS |
| Precompression | 82 assets; 18.39 MiB source → 1.10 MiB Brotli; PASS |
| Combined `npm run check` | Produced PASS logs for every component, including the final RC39 checks, but the **command runner reached its execution time limit before a confirmed exit code**; critical groups were repeated independently and PASS |
| Live Northflank 2-browser/2-device match, full visual Rank Up and Mana toast, cold/warm START latency | **Not yet verified** |

The headless Chromium screenshot attempt did not complete in this environment and must not be reported as visual QA success. No GitHub/ Northflank changes were made.

## Deployment notes

1. Use the **full build** for a fresh staging deployment. Its root includes `package.json`, `Dockerfile`, `server.js`, `server/`, and `public/`.
2. The **changed-only** package must be applied **on top of the exact RC38 Beta 2 Batch 4 baseline** above. It is *not* compatible with PvP RC36 or the old PvP Trial main branch without the intervening Batches 1–4.
3. Deploy to **PvP Trial only**; do not alter PvP main yet. Once deployed, compare `GET /health`'s `buildId` with the ID above.
4. Prioritize live QA: start after READY, coin winner chooses turn, opening/Response chain, Player 1 and Player 2 EXP Rank Up Return, Mana Burn/Steal blind choice and affected player's notification, face-up opponent Mana Pool, mobile portrait overlays.
