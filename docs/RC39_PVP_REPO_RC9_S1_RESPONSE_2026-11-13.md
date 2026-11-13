# Grandis Legacy PvP — RC9 Stage 1: Response Engine Parity

**Date:** 13 Nov 2026  
**Base:** PvP S0 RC39 Repo RC8 FULL  
**Source authority:** VS AI RC39 Response Engine Full Negate Fix, 13 Nov 2026; S0 Player Rulebook v3.2  
**Status:** PATCHED / ENGINE QA PASS; LIVE PvP unverified.

## Three-stage development plan (all prior items retained)

| Stage | Scope | Status |
|---|---|---|
| **1 — Rules & Response** | **A01**: all 8 previously approved Response/Attack-subtype fixes, engine regression, no network change | **This build** |
| **2 — Match information** | A02 Important Effect Notifications, A03 Card Played/Linked Chain, A04 Damage Formula Banner, A06 Card Played dedup. Preserve RC8 behavior while adopting newer VS AI Part 5 details. | Not started |
| **3 — UX, performance & promotion preparation** | A05 Card Review reuse, A07 5:7 Resolution-Adaptive Active Card, A08 lobby-name `NAME'S TURN` banner, A09 centered Legacy selection; final tests/optimization. Actual promotion/navigation waits until VS AI RC40. | Not started |

No item from A01–A09 is removed or considered verified simply because an older subset was implemented in RC8.

## Stage 1 gameplay changes (A01)

1. **Dual Arrow** (`S0-ARC-017`): two manually selected opponent Heroes but printed subtype remains **Physical Attack**; not Area Attack or Single Target Attack.
2. **Intercept** (`S0-EVT-007`): only a printed Physical/Magical Attack, including Dual Arrow; excludes Area, Casting and Ultimate. Negates **the entire Attack** and returns Attack Card to source Hand.
3. **Smoke Screen** (`S0-THF-004`): available if *any* selected recipient is a legal Thief-line source, including **Spell Blade** or **Arbalest**, independent of the target shown in first Response Window. Negates whole Attack and returns card to source Hand. Excludes Casting and Ultimate Attack.
4. **Whole-Attack negation timing:** Intercept and Smoke Screen allowed **only** in Response Window 1, before any target's damage; after first PASS, cannot be played at target 2. No second Response after successful whole-Attack negate.
5. **Brilliant Radiance** (`S0-CLE-002`): only a true **Single Target Attack**; not Dual Arrow, Area, Casting or Ultimate, even when only one live target remains.
6. **Defensive Formation** (`S0-EVT-012`): only true Area Attack, not Dual Arrow. Classification is based on attack subtype/profile, not count of recipients or damage type.
7. **Venom Detonation** (`S0-THF-018`) and **Flame Dragon's Wrath** (`S0-MAG-019`): runtime attack profile **Area Attack** with **Magical Damage**; original canonical card definition JSON and physical artwork remain untouched pending authorized print update.
8. **Target-by-target continuation** stays in place if first Response passes. All paid costs, defeat checks, source-card custody, and per-target Response resolution remain within engine commit transaction.

## Scope boundary / network simplicity

- Only `public/battle/engine/shared-app/app.bundle.js` changes game logic. The same
  headless engine source is loaded into isolated per-match server VM; clients
  do not independently determine authoritative damage or Response legality.
- **No edits** to `server/headless-rc32.mjs`, `server/ws-lite.mjs`,
  `public/battle/runtime/pvp-network.js`, `pvp-mana-draft.js`,
  viewer-safe projection or other transport/payment modules.
- No extra WebSocket, request, heartbeat, message category or local click RPC.
  Engine sends its next already-existing viewer-safe Response Window in the
  normal server revision/snapshot path.
- UI and SFX assets and behavior from RC8 are retained; no new overlays.

## QA / acceptance

- **13/13 donor-focused PvP cases PASS**: legal classifications, Intercept vs Area,
  Smoke Screen Spell Blade/Arbalest, first vs second Response, Brilliant Radiance,
  Defensive Formation, real full-card return and no damage on both targets,
  PASS continuation, and mirrored responder seat.
- `npm run check` including existing server/headless, WebSocket,
  RC5 Mana, RC6 single socket, RC8 privacy/history, and full static/HTTP checks: PASS.
- Syntax check (`node --check`): PASS.
- Live two-browser UI/animation/Response PAY, Northflank/WSS and mobile: **NOT VERIFIED**.
- Manual quick test: Dual Arrow at 2 targets, Smoke Screen (Spell Blade/Arbalest)
  or Intercept on first Response; same scenario PASS first Response then second;
  Dual Arrow cannot use Brilliant Radiance/Defensive Formation; actual Area can
  use Defensive Formation, not Intercept; check both player seats and reconnect.

## Deployment

Full archive is a complete RC8 replacement. Incremental patch applies only to
**exact RC8 FULL**. Do **not** mix with RC7 or older. Manual upload to GitHub and
Northflank remains the user's task. Production promotion and buttons linking VS AI
and Deck Builder **deferred until after VS AI RC40**.
