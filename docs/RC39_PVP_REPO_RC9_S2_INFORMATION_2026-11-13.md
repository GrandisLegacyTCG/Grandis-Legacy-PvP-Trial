# Grandis Legacy PvP — RC9 Stage 2: Match Information & History

**Date:** 13 November 2026  
**Build:** `gl-s0-pvp-rc39-beta2-repo-rc9-s2-2026-11-13`  
**Base:** RC9 Stage 1 FULL (Response Engine parity).  
**Donor:** VS AI RC39 CardPlayed/Banners update + Part 5 CardPlayed dedup fix.  
**Status:** Patched and focused-tested; live match and Northflank not yet verified.

## RC9 three-stage plan (A01–A09 all retained)

| Stage | Tasks | Status |
| --- | --- | --- |
| **1** — Gameplay/Response | A01 — dual-target/Area subtype, Intercept/Smoke Screen full-negation, defensive legality | **Completed in Stage 1** |
| **2** — Information/History | **A02** Discard/Mana notices; **A03** Card Played and linked response/discard; **A04** formula-aware damage banner; **A06** Part 5 detail dedup | **This build** |
| **3** — Polish/Performance | A05 Card Review reuse/performance; A07 viewport-adaptive 5:7 Active Card; A08 lobby-name Turn Banner; A09 centered Legacy choice; final live testing | **Pending** |

The future `grandislegacy.web.id` promotion and buttons to VS AI/Deck Builder remain deferred until after VS AI RC40.

## Scope Stage 2

### A02 — Committed Mana and discard notifications
- Owner-only source- and zone-specific discarded-card notices remain in PvP for Hand, Main Deck, Field, and Hero EXP. The source action's exact server event ID is attached where available; never pair two repeated copies by card ID alone.
- **Mana Steal** notice can show actual Mana gained only if the matching **committed** `mana_result` is visible. Otherwise it shows removed shards without guessing a gain. Physical Shard UIDs are not exposed in popups.
- Preserve PvP notification duration of **VS AI baseline +1 second** and existing dedup/reconnect-safe presentation queue. No per-click or per-notice new network request.

### A03 — Complete, linked Card Played
- Keep YOU/OPPONENT thumbnails and DISCARDED history; show per-Hero actual damage/HP, Burn contribution and Prevention, real status before/after duration, healing and Mana totals when projected by the server.
- Linked Response Chain remains navigable using same committed public action IDs. Add local two-way links between a DISCARD history entry and the causing action, avoiding fragile card-ID fallbacks.
- Only viewer-safe server-projected entries are used. No opponent Hand/Deck browsing and no additional history fetch over WebSocket.
- `renderHistory` skips unchanged signatures and maintains a bounded, prunable event ID set to keep re-renders inexpensive.

### A04 — Damage banner parity
- Keep a **single** pre-Response banner fixed in the top battlefield center; show Skill name and attack damage, not target position or `(before Response)`.
- Print **`60 Magical Damage`** without modifiers, **`60 Magical Damage → 80 Magical Damage`** if changed.
- When the server provides a variable-damage formula (e.g. Arrow Barrage), show its expression once (`10 × 6 Mana Shards = 60 Physical Damage`), followed by a changed final amount only if different. Do not invent `0 → damage` from missing printed values or alter the underlying Attack/Response windows.

### A06 — Card Played duplicate detail cleanup
- Structured authoritative per-Hero damage audit is the source of displayed damage; raw Result lines repeat neither damage nor Hero HP when already covered.
- Keep a *single* Burn contribution display, without adding it again to final HP damage. Preserve unique result information (e.g. Invincible/Reflect) and existing Battle Log.
- Send the immutable `burn_damage` audit property through the existing viewer-safe projection only. The engine gameplay algorithm remains unchanged in Stage 2.

## Network, fairness & performance guarantees

- **No changes** to single WebSocket RC6 Stage 2, `server/headless-rc32.mjs`, `server/ws-lite.mjs`, `pvp-network.js` or `pvp-mana-draft.js`; no new protocol/message/handshake or additional external requests.
- `public/battle/engine/shared-app/app.bundle.js` differs from Stage1 **only** by one public result-audit field `burn_damage`; all prior Stage1 gameplay/Response rulings remain intact.
- Server-authoritative outcome, exact local-draft Mana PAY, hidden Hand/Deck and spectator privacy remain in force. UI reads the already-delivered viewer-safe state.
- Existing sound/animation paths and RC7 overlay removals retained; no new floating damage or redundant popups.

## QA performed

- **Stage2 focused: 11/11 PASS.** Authoritative projection Burn/prevention/status, duplicate filtering, multi-hit and multi-target grouping, Attack subtype, committed Mana Steal gain, Scouting EXP discard privacy and linking, repeated identical action isolation, dynamic banner, immutable network/engine hash.
- **Stage1 Response: 13/13 PASS**, real Dual Arrow and Intercept/Smoke Screen flows.
- RC8 VS AI parity: **17 focused checks PASS**.
- Legacy targeted cases: RC39 latest Mana notice, RC39 RC2/RC3/RC4, RC5 local draft, transport regression and syntax checks exercised.
- Full `npm run check` was launched, but its single-run execution hit the environment timeout during the legacy regression chain (not a gameplay assertion). **Do not claim full-suite PASS.** Focused/remaining tests were run separately.
- **Not run/verified:** two-browser live UI and SFX, real slow network/refresh stress, Northflank WSS, Docker build, mobile/Firefox visuals. Test these before promotion.

## Manual acceptance walkthrough

1. Attack with Dual Arrow (2 targets), Intercept/Smoke Screen 1st Response, then with PASS continuation; test both seats. Ensure all Stage1 mechanics remain unchanged.
2. Attack with Arrow Barrage and buffed Aether Slash: one center banner; verify calculated damage and exact after-modifier wording.
3. Use Scouting on opponent EXP, Calculated Plan on opponent Hand and a deck-discard effect. Verify recipient popup + private DISCARDED Card Played tile. Tap tile to see *Caused By*, tap the originating action to see *Discarded Cards*.
4. Test Mana Burn/Steal including matching Color Mana; only the affected recipient sees actual removed identity and optional gained count, never physical UIDs.
5. Use one skill twice, or two copies of the same card. Ensure Card Played does not mix effects across different committed action IDs.
6. Trigger Burn, damage reduction, multi-hit, Status, DODGE/BLOCK/COUNTER: no duplicate damage/HP/result rows; animations and sound play exactly once on both clients, including after reconnect.

## Distribution

- FULL ZIP: complete source to deploy **instead of** RC9 Stage 1.
- Changed ZIP: delta applicable **only** against exactly RC9 Stage 1 FULL, not RC8/RC7. Does not perform an automated merge.
- **No GitHub push or Northflank deployment** performed. Manual promotion stays with project owner; promotion to website and navigation buttons wait for VS AI RC40.
