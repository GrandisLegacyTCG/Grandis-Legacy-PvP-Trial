# Grandis Legacy PvP — RC40 Patch 3.1 (14 November 2026)

**Production Card Played Details now use the exact VS AI RC40 source renderer** (`v94EventDetailHtml`, donor SHA256 `26065ab5cf13c7701f4886049a3c3d8509fd00812e7a164f2f60f6eab514b65f`) and its CSS, including damage-breakdown layouts. The existing PvP-only renderer is unused in production. A viewer-safe schema adapter transforms committed server events only; no extra WebSocket requests or hidden data. Canonical Casting and Attachment wording are also donor-synchronized. Ancestral Focus is printed as **Mana cards** (same gameplay effect).

`npm run check:rc40-p31` executes the full prior patch QA plus 11 donor-specific checks. Detailed notes: `docs/RC40_PVP_PATCH3_1_VSAI_CARD_PLAYED_PARITY_2026-11-14.md`. Two-browser live audio, visual and WSS verification still require manual staging. GitHub and Northflank have not been modified. Website static add-on is bundled separately and references same-origin root `/card-art/`.

---

# Grandis Legacy PvP — RC40 Integration Patch 3 (14 November 2026)

**Baseline:** RC40 Patch 2 FULL. **Scope:** S0 RC40 Card Review v1.66 data/renderer, first-party PvP Lobby links to VS AI and Deck Builder, responsive navigation, single WebSocket and local artwork preservation. Same-origin website static frontend bundle shipped separately. GitHub/Northflank not modified.

# Grandis Legacy PvP — RC40 Integration Patch 2 (14 November 2026)

**Latest base:** RC40 Patch 1, now with Stage 2 presentation/UI parity.
**Source:** VS AI RC40 (Player Rulebook v3.3, Main R3.8 / Legacy R3.7).
**Build ID:** `gl-s0-pvp-rc40-patch31-vsai-cardplayed-2026-11-14`.

All RC40 Patch 1 gameplay changes are retained. Stage 2 adds improved Card Played detail, Hero-identity Item arrow targeting, non-destructive Mana Pool rendering, and correct BLOCK/DODGE VFX/SFX (no extra Attack impact when HP damage is zero). Mana removal notice stays target-only after committed Mana reveal. No new WebSocket channel, extra gameplay HTTP request, or new authoritative calculation.

**Terminology clarification:** Designer confirms Ancestral Focus's correct printed wording is **“Mana cards”**. The functional gain effect is unchanged; this patch does not modify the printed card or ability rules.

**Stage 3 remains deferred:** RC40 Card Review/UI polish, Counter Chain, privacy-safe card reveal, promotion at `https://grandislegacytcg.web.id/pvp`, plus Lobby buttons **GO TO VS AI** and **GO TO DECK BUILDER**. Do not deploy to GitHub or Northflank automatically.

Run `npm run check:rc40-p2` and `npm run build:precompress`. Manual two-browser animation/audio and Firefox/mobile verification is still required.

See `docs/RC40_PVP_PATCH2_PRESENTATION_PARITY_2026-11-14.md`.

---

# Grandis Legacy PvP — S0 RC39 Repo RC9 Stage 3 Patch 1 (13 November 2026)

**Build:** `gl-s0-pvp-rc39-beta2-repo-rc9-s3-p1-2026-11-13`  
**Base:** PvP RC9 Stage 2 FULL, 13 November 2026.  
**VS AI donor:** RC39 **Part 5 Batch 2** (not RC40).

**RC9 Stages 1 & 2 preserved:** gameplay/Response parity, private Mana/Discard notifications, Card Played and linked Response chain, dynamic damage banner and duplicate-result suppression.

**Stage 3:** viewer-safe Card Played grouped per Hero; one-click local Legacy draft + single server-authoritative final commit; resolution-adaptive 5:7 Active Card; lobby-name Turn Banner (blue self / red opponent); cached Card Review; 1v1 swap lock from latest VS AI donor, with Auto Center / Revive rules preserved.

**Important rule note:** VS AI Part 5 Batch2 introduces a 1v1 swap prohibition absent from Player Rulebook v3.2; update/approve rulebook before public launch. This package does not modify the PDF.

**Network:** RC6 Stage 2 single WebSocket, local Mana PAY, immutable client-hidden information model and no extra request for animations/Card Played/choices. GitHub and Northflank remain untouched; manual deployment/testing by project owner.

Run `npm run check:syntax`, `npm run test:rc9-s3`, `npm run test:rc9-s2`, `npm run test:rc9-s1`, and `npm run build:precompress`. Use `npm run check` for full historical regression when available. Live two-browser/mobile/Firefox stress acceptance remains pending.

Technical notes: `docs/RC39_PVP_REPO_RC9_S1_RESPONSE_2026-11-13.md`, `docs/RC39_PVP_REPO_RC9_S2_INFORMATION_2026-11-13.md`, and `docs/RC39_PVP_REPO_RC9_S3_FINAL_2026-11-13.md`.

Future `grandislegacy.web.id` promotion and navigation buttons to VS AI/Deck Builder are intentionally deferred until after VS AI RC40.

## RC9 Stage 3 Patch 1 — Card Played / Mana notification hotfix

- Compact VS AI-style Card Played Detail: action/source, authoritative per-Hero damage and linked Response details, exact recipient-visible Mana loss, related cards.
- No fake DISCARDED entry for ordinary played Attack card cleanup. Discard caused by Scouting/Calculated Plan is shown only with source action and known origin.
- Mana Burn/Steal receipt only on losing seat, after server-confirmed selected Mana face(s) have animated; identity remains hidden from attacker and spectators.
- YOU / OPPONENT badge background retained without bright border.
- Architecture: one RC6 Stage2 socket; no new per-click or Card Played network request.

Focused QA: `npm run test:rc9-s3-p1`. Live two-browser visual tests remain pending.

See `docs/RC39_PVP_REPO_RC9_S3_P1_CARDPLAYED_MANA_2026-11-13.md`.

## RC40 Integration Patch 1 — 14 November 2026

**Latest patch:** Season 0 RC40 gameplay and canonical card data, derived from the official VS AI RC40 final archive; original PvP network remains RC6 Stage 2 single WebSocket. New Build ID: `gl-s0-pvp-rc40-patch1-gameplay-2026-11-14`.

Main R3.8 (187) + Legacy R3.7 (55), all 10 Legacy abilities, two reworked BUFF Events, pre-Defense Burn, corrected Hero HP and Items, and 25 artwork updates. Pre-existing RC9 response/history/UI patches are retained. The five historical starter package exports remain valid; their old export provenance is not game rule authority.

Run `npm run check:rc40-p1` (focused RC40 + network/authority regressions); run `npm run build:precompress` after modifying assets. Full interactive two-browser QA is still required. See `docs/RC40_PVP_PATCH1_GAMEPLAY_PARITY_2026-11-14.md`.

**Deferred:** Stage 2 Card Played RC40 + Item Arrow / Mana blinking / BLOCK-DODGE double SFX; Stage 3 RC40 UI/performance and final lobby **GO TO VS AI** / **GO TO DECK BUILDER** links. Planned public mount: `https://grandislegacytcg.web.id/pvp` (not deployed here). GitHub and hosting remain manual.
