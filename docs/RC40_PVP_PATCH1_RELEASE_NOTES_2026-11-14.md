# Grandis Legacy PvP — RC40 Integration Patch 1 (14 Nov 2026)

**Baseline:** PvP RC9 Stage 3 Patch 1. **Donor:** VS AI RC40 (Main R3.8 / Legacy R3.7, Rulebook v3.3). **Scope:** Stage 1 — gameplay rules, canonical data and artwork. **Status:** Patched; manual gameplay verification pending.

## Included

- 10 refreshed Legacy abilities and their 1–2-card cost selection / corresponding Deck or Discard card selection.
- Coordination Attack two-turn BUFF (+10/+20 based on starting three-Hero Base Classes, including defeated Legacy).
- Defensive Formation two-turn BUFF (3 Mana, reduction 40/80, no Reaction).
- Burn +10 pre-Defense on connected hits; DODGE or NEGATE prevents Burn; no double count.
- Elara Heavens III 130 HP; Bromir Oathforge I 90 HP; Poison Vial, Magic Compass and Ancestral Focus corrections.
- Canonical Area Attack metadata, all 242 RC40 card definitions/effect recipes/runtime view model and 25 updated artwork files.
- PvP-specific Response, Mana payment, networking and visibility mechanisms are preserved. Browser cache revision and build ID updated.

## Verified locally

- Canonical QA 44/44, Event lifecycle 5/5, Burn/HP/Items/Racial 8/8, prior Response 13/13, Stage2 history 11/11, Stage3 UI + two-seat Legacy 18/18, P1 UI 8/8: **PASS**.
- Single WebSocket, two-seat Mana/Response, viewer privacy, reconnect/HTTP and ZIP integrity: **PASS**.
- `npm run check:rc40-p1`: **PASS**. Original historical `npm run check` not claimed as passing because it includes RC39 hash/older-effect fixtures.
- Manual live two-browser full match / Firefox / Northflank live latency: **NOT YET VERIFIED**.

## Deferred (not implemented in this build)

Stage 2: Card Played RC40 duplication/format parity, F01 Item Arrow direction, F02 Mana Pool blinking, F03 duplicate Attack/Block/Dodge effects, mana notifications.

Stage 3: Final UI/performance, Card Review, card reveal, Counter Chain and lobby navigation buttons **GO TO VS AI** and **GO TO DECK BUILDER**. Target final PvP deployment is `https://grandislegacytcg.web.id/pvp`. No hosting or GitHub changes made.

For detailed patch/QA notes see `docs/RC40_PVP_PATCH1_GAMEPLAY_PARITY_2026-11-14.md` within the FULL ZIP.
