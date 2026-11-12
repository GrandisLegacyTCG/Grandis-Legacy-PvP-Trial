# Grandis Legacy PvP S0 RC39 — Repo RC2 Combat & UI Hotfix

**Date:** 12 November 2026  
**Status:** PvP Trial / deployment candidate for manual GitHub upload; no hosted two-device certification.  
**Build:** `gl-s0-pvp-rc39-beta2-repo-rc2-2026-11-12`  
**Baseline:** PvP RC39 Repo RC1. Game rules / RC39 donor gameplay engine and card artwork unchanged.

## Reported issues and implemented resolution

1. **Rank Up Return EXP and Scouting popup did not match VS AI RC39.** Both choices now use the donor-style full-screen focused center-choice card stage rather than the old `TRIAL - Rank II Return EXP` modal. Local Draft from Beta 2 Batch 3 is preserved: choice clicks are local and CONFIRM sends one server-validated transaction. Rank Up EXP return + the new Hero appearance continue to use the existing `RANK_UP_COMMITTED` and `TRIAL_EXP_RETURNED_TO_HAND` transaction visual pipeline. The VS AI single-player local mutation is deliberately NOT imported into PvP.
2. **Skill source Hero was automatically chosen when there was only one legal candidate.** Removed the `beginPlayFromHand` -> `beginPlayFromHandFast` client translation and the lone-source fast-path in the headless authority. Both the normal path and legacy Fast alias retain mandatory `source_selection` followed by the player's `chooseHeroFromBoard` decision, even with one eligible Hero. Other legal target/Mana stages continue normally.
3. **Area Attack damage and Status icons could show too early for one target.** A new authoritative combat presentation journal records public pre-Response attack state and releases exactly one result containing ALL affected lanes only when the entire Response/mandatory-choice chain has ended. The UI temporarily holds displayed Area target HP and Status icons until that final event, then shows all affected Hero battle effects together. The real gameplay HP/Status remains immediately authoritative on server; this display freeze does not affect Response legality or attack resolution.
4. **Attack VFX sometimes skipped.** The server now supplies bounded, immutable, replay-safe `PVP_COMBAT_RESOLVED` presentation events on each accepted attack resolution. Clients no longer depend solely on observing intermediate Response snapshots or inference from one previous HP snapshot. Public event metadata is projected for both perspectives, including Player 2, with no private card choices or hidden Mana identity.
5. **Opening hand animation.** Corrected 6+6 hardcoded presentation expectation to official Rulebook v3.2 **5+5** (10 opening card events and five visual pairs). Opening Mana animation remains three starting Shards per player; the engine opening-card and mandatory Draw rules were already correct.
6. **Favicon.** The main `/` lobby now declares the existing `public/battle/engine/assets/favicon.png`, matching the battlefield's favicon.

## Network and authority invariants

- **Unchanged:** S1-derived **RC6 Stage 2 lobby-owned single WebSocket**, reconnect/ACK, embedded Battlefield, and lobby matchmaking.
- **Unchanged:** RC5 local Mana Selection and atomic PAY, Batch 3 Local Draft and authoritative final commit.
- **Unchanged:** RC39 gameplay engine/cost rules, Rank Up requirements, card data and R3.7 artwork, Opponent Mana Pool face-up, blind opponent Mana selection, Coin Flip winner order choice.
- Combat presentation events contain **only** public card ID, source/target side/position, post-commit damage totals and new public Status names, not Hand, deck order, response options or physical Mana Shard IDs. The events are mirrored per viewer and de-duplicated by ID on the client.
- The client-side HP/Status hold is display-only; no client is allowed to resolve combat or modify authoritative game state.

## QA performed

- `npm run check`: PASS (complete existing RC34/RC38/RC39 engine, transport, privacy, seat 2, local draft, Response, lobby, startup and hotfix regressions; includes added RC2 checks).
- `tests/rc39-rc2-combat-ui.mjs`: PASS synthetic three-target Area; nested Response; compulsory pending choice; both seat projections; Status/HP hold; no duplicate replay; public-only projection; modal parity markers; explicit Hero selection; 5+5 opening and favicon.
- `tests/rc34-seat2-payment-response.mjs`: PASS **real RC39 engine** Player 2 Skill attack + exact Mana -> Player 1 Response PASS -> authoritative combat event generated with correct public damage for both perspectives.
- `tests/rc34-rc4-quickplay-tuneup.mjs`: PASS real RC39 Bard and Maestro paths, now including mandatory source selection, plus seat 2 mirrored actions.
- `tests/rc38-combat-hotfix.mjs`: PASS pre-existing ST target clicks, parallel Area VFX, public opponent Mana and private Response masking.
- `tests/rc39-batch5-rank-privacy.mjs`: PASS real RC39 Rank Up Return EXP atomic commit and both-seat public projection.
- `npm run build:precompress`: PASS; newly changed app-runtime/HTML Brotli/Gzip sidecars regenerated for deployed static delivery.
- Full and changed-only ZIP integrity: verified after packaging.

## Live QA still required

This is a **source/regression-tested staging candidate**, not proof of production animations or frame timing. Hosted browser and **real two-device Northflank** testing remain outstanding. Test Rank Up/Scouting visual layout on desktop + mobile, a single valid Hero Skill source, Poison Mist/Area Attack with 0/1/multiple Responses including a nested Response, full Status animation timing and a long match/reconnect. Check favicon and opening card flights after an uncached deploy. The execution environment does not allow a trustworthy automated rendering run against the hosted site.

**Deployment:** User uploads source manually to the PvP Trial GitHub repository. This work does not push to GitHub or deploy to Northflank. Use the RC2 full-repository archive, not the RC1 changed-only patch.
