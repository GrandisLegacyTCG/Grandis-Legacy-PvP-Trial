# Grandis Legacy PvP — RC40 Integration Patch 2

**Tanggal:** 14 November 2026  
**Baseline:** PvP RC40 Integration Patch 1 Gameplay FULL  
**Donor visual/gameplay information:** Grandis Legacy VS AI RC40  
**Build ID:** `gl-s0-pvp-rc40-patch3-website-ui-2026-11-14`  
**Status:** Patched; automated focused checks passed; manual live dual-browser validation still required.

## Release scope

### 1. Card Played — VS AI RC40 presentation parity

Card Played PvP continues to use the same core information hierarchy as VS AI RC40: Action / Used By, Response Detail, Damage Resolution by Hero, result of Block/Prevention and other public modifiers, actual HP loss, Mana Burn/Steal details where the observer is authorized, and Related Cards. Display is condensed to avoid long rows and duplicated damage result lines.

Authoritative per-Hero modifier data is projected through an explicit whitelist on the server. This is not a raw copy of the VS AI local game state: the PvP observer projection deliberately filters private data about the other player's Hand/Deck and unrelated hidden choices. UI opens details from data already received; opening Card Played does not send a new network request.

### 2. F01 — Item target arrow pointing at the wrong Hero

The visual target endpoint now follows the **public identity of the Hero**, not just a stale LEFT/CENTER/RIGHT slot. This applies to Item/Protection and related Response connectors; the target lane is resolved at presentation time. If an explicit Hero identity no longer exists on the field, suppress a misleading connector instead of pointing to a different Hero. No targeting rules or submitted action payloads were changed.

### 3. F02 — Mana Pool blinking

Mana Shard elements are now reused by their stable visible UID. A Mana click or server snapshot no longer clears the entire pool DOM and reconstructs every card. Separate signatures handle local and opponent pools; only inserted, removed, reordered or selected shards receive DOM updates. Opponent blind choice remains a local draft; physical identities and opponent private information are not revealed.

### 4. F03 — BLOCK/DODGE double visual and audio

Attack impact visuals and P.Atk/M.Atk sounds now play only when the committed combat result removes HP. A fully blocked or dodged Attack does not also play the old Attack damage sound. The appropriate Block/Dodge visual and sound are preserved. Partial BLOCK with remaining HP damage can intentionally play Defense feedback followed by actual damage feedback. A zero-damage status-only event may still show the status icon without Attack impact sound.

### 5. Mana notification sequencing

Preserve the earlier server-confirmed, target-only Mana Burn/Steal notice. When the affected player's removed Shard is revealed by the animation, the Mana result notification follows it; neither the source player nor a spectator receives private Shard-type notification. No new network or game actions.

### 6. Ancestral Focus terminology

Designer clarification: the correct terminology is **“Mana cards.”** The previous RC40 source contains an alternative phrase, “Mana Shards”; this patch does **not** alter the effect or engine result. This terminology is queued for canonical print/data reconciliation separately.

## QA completed

- `npm run check:rc40-p2` — **PASS**.
- New RC40 Patch 2 focused UI/presentation tests — **7/7 PASS** (Hero target identity; non-blinking Mana DOM; Block/Dodge zero-damage audio; actual damage SFX; Card Played public modifiers; privacy; unchanged network runtime).
- RC40 Patch 1 canonical/effect, Event, Burn/Response and legacy regressions — **PASS**.
- Existing RC9 Card Played, private Mana notification, payment, Response and Legacy regressions — **PASS**.
- Single WebSocket architecture, existing local Mana draft, seat 2 payment, spectator/private projection and asset integrity — **PASS** in focused/regression checks.
- HTTP `/health` and JavaScript static asset test — **PASS**, build ID confirmed.
- ZIP integrity and FULL versus changed-only SHA verification — completed during packaging.

**Not yet verified:** manual full match with two actual browsers; audio perception/volume, browser animation timing, sustained mobile layout and live-host network latency. Do not label this a public-ready final build on the basis of automated tests alone.

## Unchanged/deferred

- **One WebSocket, RC6 Stage 2**, with server-authoritative combat, Response, local Mana selection and atomic server commit.
- No GitHub push, Northflank deployment or changes to the live site.
- **Patch 3**, not Patch 2: website path `https://grandislegacytcg.web.id/pvp`, Lobby buttons **GO TO VS AI** and **GO TO DECK BUILDER**, RC40 Card Review v1.66, optional Counter Chain / Card Reveal / Rank UI improvements and full release/performance QA.

## Installation

- Prefer **FULL ZIP** to replace the deployed repository source for manual testing.
- **Changed-only ZIP** applies only to the identical **RC40 Patch 1 Gameplay FULL** baseline. It is not a patch against RC9 or RC40 VS AI.
