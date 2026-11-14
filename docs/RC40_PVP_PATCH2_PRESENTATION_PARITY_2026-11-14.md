# Grandis Legacy PvP RC40 — Patch 2: Presentation Parity

**Date:** 14 November 2026  
**Base:** `RC40 Patch1 Gameplay FULL`  
**Donor:** VS AI RC40  
**Release status:** Patched / focused tests pass; two-browser live visual QA pending.

## Changes

1. **Card Played** — Retain compact VS AI-style hierarchy for Action, Used By, Response Detail, Damage Resolution by Hero, Mana Burn/Steal, Related Cards; expose public per-Hero damage modifiers from the committed engine audit with strict field whitelisting; show actual 0 HP damage when full BLOCK reduced otherwise positive incoming damage; avoid empty result groups and duplicated flat result lines. Only recipient-masked data is used; hidden Deck/Hand identity is not projected. Badge YOU/OPPONENT unchanged.
2. **F01 Item arrow** — Prefer committed target Hero identity over stale lane when choosing connector endpoint. Response/Protection Item connectors likewise bind the currently defended public Hero. Missing Hero identity suppresses an incorrect arrow instead of pointing to another Hero. Gameplay target and server intent remain unchanged.
3. **F02 Mana blinking** — Remove `innerHTML=''` redraw in `renderPool`. Reuse Shard DOM nodes by stable visible UID, insert or remove only physical Shards that actually changed. Update selection/face classes in place. Separate own/opponent render signatures. Blind opponent choice stays local and never leaks physical UID.
4. **F03 BLOCK/DODGE double Attack SFX/VFX** — On `PVP_COMBAT_RESOLVED`, only an actual HP reduction plays Attack impact sound/animation. A zero-damage status-only event may show a status icon, without a damage sound. Committed Defense VFX and Dodge/Block SFX stay. Partial BLOCK with remaining HP damage can intentionally produce both Defense and impact feedback.
5. **Mana notifications** — Preserve target-only committed Mana Burn/Steal reveal→notification sequence from RC9 P1; no new client packets.

## QA

- RC40 Patch1 regression (`npm run check:rc40-p1`) PASS.
- New focused Stage2 integration (`node tests/rc40-stage2-presentation.mjs`): target Hero identity, stable Mana DOM, full BLOCK sound, partial damage sound, viewer-safe modifiers and unchanged network code.
- Previous Card Played, Response, Legacy, selection, privacy and single-WS focused suites PASS.
- Manual two-browser full match, responsive visual review, timing/latency and Firefox behavior: NOT YET VERIFIED.

## Ancestral Focus wording

The designer confirms **“Mana cards”** is the correct wording. This differs from some RC40 canonical data/text that uses “Mana Shards”. Since actual gameplay is identical, do not change the resolved effect in this presentation patch. Preserve the wording clarification for the next canonical print/data review.

## Deferred Stage3

`https://grandislegacytcg.web.id/pvp` deploy routing, Lobby buttons to VS AI/Deck Builder, RC40 Card Review/Counter Chain/Reveal, broad performance and two-browser release checks. Do not push repository or redeploy hosting.
