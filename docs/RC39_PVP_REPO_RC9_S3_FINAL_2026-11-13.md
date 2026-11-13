# Grandis Legacy PvP RC9 Stage 3 — Polish, Server-Safe Legacy Choice and VS AI Batch 2

**Date:** 13 November 2026  
**Build:** `gl-s0-pvp-rc39-beta2-repo-rc9-s3-2026-11-13`  
**Base:** RC9 Stage 2 FULL (not RC8 or Stage 1).  
**Donor:** VS AI **RC39 Part 5 Batch 2**, the follow-up to Part 5 Dedup and Response Fix. **This is not RC40.**

## Complete RC9 plan (A01–A09)

| Stage | Scope | State |
| --- | --- | --- |
| **1** | A01: Attack/Defense Response engine, Dual Arrow, Intercept/Smoke Screen | Retained from S1 |
| **2** | A02, A03, A04, A06: Mana/Discard information, Card Played and linked history, dynamic damage banner, detail dedup | Retained from S2 |
| **3** | A05, A07, A08, A09: Card Review, Active Card, lobby player name turn banner, centered Legacy selection; Part 5 Batch2 additions | Patched and focused tested here |

## A05 — Card Review responsiveness and caching

- Reopening the same READY Card Review leaves its existing iframe mounted; no duplicate markup/navigation.
- Reuse existing `db158-card-review.js` iframe lifecycle and idle stylesheet prewarm. No new WebSocket or gameplay fetch.

## A07 — Adaptive 5:7 Active Card

- `.active-card-stage` is a size-container; card width is capped by available stage **width AND height** using container units (`cqh`).
- Maintain artwork **5:7** aspect and `object-fit: contain` (no crop). Full Card History header remains reachable and does not overlap Close on narrow sidebar.
- **Limit:** Live rendering at all viewport/resolution permutations in real Firefox/mobile is not established. Chromium layout probe in this container timed out, so do not claim 9/9 visual viewport PASS for PvP.

## A08 — Named turn banner and color consistency

- Replace `YOUR TURN / OPPONENT TURN` with the safe lobby names from `window.GL_PVP_IDENTITY`, e.g. **JENOZ'S TURN** and **PLAYERHH'S TURN**.
- All labels use `textContent`, not HTML injection. Player-view-relative blue when it is your turn, red when it is the opponent's, with suitable fallback if a name is unavailable.
- Name persists through existing server lobby/snapshot and local identity; **no extra request**.

## A09 — Defeat → Choose Legacy in battlefield center

- After defeat, show available Legacy card artwork in centered selector, selecting a candidate highlights it locally; **CONFIRM LEGACY** appears/activates only after choosing.
- Clicking Legacy candidates modifies only the local preview; it does not send a WebSocket and does not redraw the whole battlefield. One `commitExactLocalChoiceDraft` packet is sent at confirmation.
- The server verifies **decision owner, mandatory pending type, choice ID and candidate index** against the canonical engine, then selects and commits through the existing headless authority. No client-controlled arbitrary card IDs.
- Reject stale/wrong-owner/out-of-range selection without advancing authoritative revision. Preserve engine game state rollback, one revision for confirmed Legacy, and mirrored seat-2 handling.
- Existing center choice/backdrop animation retained; nothing added to game networking architecture.

## New VS AI Part 5 Batch 2 changes adopted

### Grouped Card Played details
- A single bordered section per affected Hero; group multi-hit damage/HP, actual healing and changed Status duration in that section.
- Zero damage, unchanged HP and unchanged Status do not create result noise. Preserve meaningful Burn/Reduction, unique effects and response detail.
- Uses **only the viewer-safe action ledger** with bounded public numbers; never reads an opponent's hidden hand/deck or private engine snapshot. Extended the server's scalar-only `damage_by_hero` and `status_by_hero` projection for other played-action types when available; card identity secrecy unchanged.
- Data stays navigable through previous Linked Response Chain and DISCARD history. Battle Log preserved.

### 1v1 positional lock
- Guarded engine swaps and targeting effects when **both players have exactly one active Hero**. Manual Reposition, source/target effect Swaps, Shadow Switch, Cover Up and AI-only reposition paths cannot bypass this check.
- **Auto Center remains permitted**, including with Freeze/Stun; when Revive makes 2v1, normal swap eligibility is restored; when back to 1v1 lock re-engages.
- **Rule-authority caveat:** New 1v1 swap prohibition comes from VS AI Part 5 Batch 2; the uploaded Player Rulebook v3.2 only documents Auto Center and normal swaps, not this additional ban. Canonical Rulebook needs a corresponding update/approval before public promotion. No edits made to Rulebook PDF.

## Networking and performance boundaries

- RC6 Stage2 **single WebSocket** unchanged (`server/ws-lite.mjs` identical). No new socket, per-click selection request, per-history lookup or per-card-detail fetch.
- Server-authoritative gameplay; RC5 local Mana draft and atomic PAY intact (`pvp-mana-draft.js` identical).
- Existing discard/Mana notifications (owner-only) and review/history dedup continue from Stage2.
- 1v1 rule inserted in narrowly scoped engine functions; no wholesale engine swap or AI logic migration.
- No new npm dependency, no backend service or database.

## QA performed

- **Stage3 focused: 18/18 PASS**, including real headless engine Legacy defeat through Poison and single authoritative confirmation for **both seats**, wrong-seat/stale/out-of-range/replay guards, Batch2 1v1 lock, Auto Center and revive unlocking, grouped per-Hero UI, no-op filtering, named banner safety, CSS/static integration checks.
- **Stage2 focused: 11/11 PASS** on updated Stage3 contract; **Stage1 Response: 13/13 PASS**; **RC8 VS AI adoption: 17 checks PASS**.
- Privacy, RC6 Stage2 single socket + Response, real local drafts, blind Mana, and current banner targeted regressions: PASS.
- JavaScript syntax checks: PASS.
- **Not verified:** full `npm run check` complete historic suite, real two-browser UX/animation/sound, Firefox/mobile/responsive layout, live slow network/reconnect and Northflank hosted WSS. A local Chromium layout smoke attempt timed out; it is not counted as passing.

## Manual acceptance for user

1. With separate browsers, use different Lobby names. Verify each client shows own name in **blue** on their own turn, opposite name in **red** on opponent turn. Check reconnect.
2. Test Active Card on 1440×900, 1280×600, 390×844 and landscape 844×390. Verify 5:7, visible artwork and no Battle Log/History overlap.
3. Make Heroes defeated from both seats and through an opponent's Attack/Poison: centered Legacy options, one highlight, one CONFIRM, no extra click network actions or repeated animations. Test mandatory choice under interrupted/slow network and reconnect.
4. Test 1v1 after Auto Center, attempted manual/forced swaps, Stoneblood/Revive unlocking to 2v1 and relocking to 1v1. Confirm designer approval for rulebook.
5. Test repeated Arrow Barrage, BLOCK, DODGE, Area and repeated-attack multi-Hero Card Played: one result section per Hero, no redundant zero/HP/Burn, linked history still works and private cards stay private.
6. Check clicking Full Card History, Card Review (same card repeatedly), with sound/animation on both browser seats and without flicker/large rendering spikes.

## Deployment and future navigation

**Use FULL ZIP** for clean replacement. Changed ZIP applies only to **exact RC9 Stage 2 FULL**. No GitHub push, Northflank deploy or `grandislegacy.web.id` promotion. Website navigation buttons to VS AI and Deck Builder remain **deferred until VS AI RC40**, per owner instruction.
