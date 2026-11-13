# Grandis Legacy PvP — RC9 Stage 3 Patch 1: Card Played + Mana Burn/Steal Feedback

**Date:** 13 November 2026  
**Build ID:** `gl-s0-pvp-rc39-beta2-repo-rc9-s3-p1-2026-11-13`  
**Baseline:** RC9 Stage 3 UI Batch 2 FULL (13 November 2026).  
**Donor for presentation parity:** VS AI RC39 Part 5 Batch 2.  
**Scope:** six player-reported UI/effect-information issues only. Game rules, network contract and service deployment remain unchanged.

## Changes

1. **PVP-UI-001 — Card Played owner badges:** removed the bright border/stroke from YOU (blue) and OPPONENT (red) while retaining their distinct backgrounds and thumbnail positions.
2. **PVP-UI-002 — Recipient-only Mana loss:** a committed `MANA_LOSS_COMMITTED` notification is distributed only to the player who actually lost Mana to an opposing effect; not to its attacker or a spectator, and not for self-paid ability costs. Shard identities remain private to the receiving player.
3. **PVP-UI-003 — Reveal before notification:** the target first sees one or more face-up copies of the *server-confirmed* Mana Shards animate toward their Shard Deck, then the notice states their actual Regular / Color Mana identity. Uses the existing authoritative snapshot; no extra network round-trip. Up to four card flights are drawn in a batch for smooth playback; the notice lists the complete committed loss. A 550 ms fallback delay covers layouts without animation anchors.
4. **PVP-UI-004 — Accurate DISCARDED history:** no fake Discarded tile for Attack cards entering Discard during normal post-Response cleanup. Private opponent-caused discard tiles require known source and origin (Hand, Main Deck, EXP or Field) and link to the causative committed action when possible. Own played-card custody does not create a duplicate discard entry. Unknown/unproven origins are conservatively excluded instead of displaying `Unknown origin / Opponent Effect`. Legitimate effects remain attributed to source card where available.
5. **PVP-UI-005 — Compact detail:** Card Played Detail uses short stacked fields rather than tall two-column rows, preserving layout on narrow screens. Large technical `RESOLVED` and `Resolved by Runtime` prose stays removed.
6. **PVP-UI-006 — VS AI-style gameplay history:** Card Played Detail now lists Action, Used By, recipient-visible exact Mana Burn/Steal, Response Detail from committed linked DEF/REACTION/Counters, a unified per-Hero damage breakdown (Base Damage, Block/Reduction/Burn and actual HP change), plus clickable Related Cards. Removed redundant or invented zero-damage text. Exact hidden Mana identity remains undisclosed to attack source; they may see the public removed count.

### Details: authoritative information only

- Source of Mana identity: receiver-scoped `MANA_LOSS_COMMITTED.removed_shards` published by the server; the attacker receives neither that event nor any hidden shard identity through `effect_results`.
- Source of Response Detail: linked publicly committed Card Played action IDs / chain IDs, with safe unique-card fallback. No private Response options or Hand/Deck data used.
- Source of damage: server-projected `damage_by_hero` / `damage_summary`, never simulated client-side.
- Source of discarded card identity: receiver-scoped `PVP_OPPONENT_DISCARD` attributed to a known action/origin.
- The shared RC6 Stage 2 single WebSocket, server authority, single final Mana/Legacy commit and game engine remain unchanged.

## Files touched

- `server/viewer-safe.mjs`
- `server/discard-presentation.mjs`
- `public/battle/shared-app/app-runtime.js`
- `public/battle/shared-ui/battlefield-ui.css`
- `tests/rc9-p3-hotfix.mjs` (new targeted cases)
- `tests/rc9-stage2-match-history.mjs` and `tests/rc9-stage3-ui-legacy.mjs` (updated presentation assertions)
- Version, asset cache keys, `package*.json`, README and documentation.
- Rebuilt `.br` / `.gz` compressed static assets from exact patched sources.

## Focused QA

- Stage 3 Patch 1 new tests: **8/8 PASS** — recipient visibility, Mana reveal before toast, no false Discard, legitimate Scouting attribution, compact detail/Response, hidden Mana type, owner badge border, untouched transport source.
- Stage 3 regression: **18/18 PASS**.
- Stage 2 regression: **11/11 PASS**.
- Stage 1 Response engine: **13/13 PASS**.
- RC8 parity checks: **17 PASS**.
- Viewer privacy, single-socket, battle bridge and blind Mana/Cancel regressions: **PASS**.
- JS syntax and static precompression: **PASS**.
- ZIP integrity: checked during packaging.

**Not yet verified:** live human-vs-human two-browser gameplay, exact visual/composited Mana flight and sound timing, mobile/Firefox UX, production network latency. These must be checked in manual match testing. **Do not label FINAL/public-ready based only on focused QA.**

## Deployment

The FULL package is preferred. The incremental package applies only to the *exact* RC9 Stage 3 Batch 2 FULL baseline. GitHub, Northflank and `grandislegacy.web.id` were not modified. Promotion / VS AI / Deck Builder navigation remains deferred until after VS AI RC40.
