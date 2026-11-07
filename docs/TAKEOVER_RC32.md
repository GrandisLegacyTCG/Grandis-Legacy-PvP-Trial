# Grandis Legacy PvP S0 — RC32 Migration / Takeover — 2026-11-07

## Authority and permission

- New source: `/Grandis_Legacy_VS_AI_Season0_v1.0_RC32_2026-11-07.zip`, supplied by the designer.
- Previous working baseline: PvP S0 RC31 Playtest Staging ZIP. S1 architectural reference: PvP v3.51 (the available repository, **not** the unsupplied v3.80.17).
- Gameplay authority: RC32 app + Rulebook v2.9, with documented approved local Grand Finale 60/90 and updated Poison Vial. OSA DEV45 is **not** substituted for RC32 on either of these cards. Keep S1 game effects separate.
- User request: integrate RC32 into the established PvP S0 path and work toward a playable PvP game. This authorizes staging implementation and QA, **not** publishing to the user's live GitHub/Northflank.

## Integration procedure (completed)

1. Extracted both archives into separate scratch/staging directories; compared client-relative SHA256 hashes. RC32 had 683 files; old PvP client had 662: 28 differences, 22 RC32 additions, plus one PvP-only `runtime/pvp-network.js`.
2. Took all RC32 assets, card/frontend/UI changes, engine and UI source; only kept PvP bootstrap entrypoint, own network adapter and scoped PvP engine/UI corrections. After migration, **0 RC32 paths missing**; 5 expected path differences (`engine/shared-app/app.bundle.js`, `shared-app/app-runtime.js`, `index.html`, old `docs/RELEASE_STATUS.md` and `docs/TAKEOVER_NOTE.md`); one additional PvP network adapter. The release status/takeover documents differ because original historical RC31 notes were intentionally preserved, rather than pretending to be RC32 release notes.
3. The four proven PvP-only behavior corrections were re-applied without replacing RC32 game rules: (a) forced Hand Limit round advancement, (b) headless-safe surrender result modal guard, (c) correct seat 2 physical Mana zone mirroring, (d) correct `presentationEvents`/`gameEndReason` mirroring. RC32 new last-opponent-action handling was retained for source parity.
4. Preserved multiplayer room/session server; switched production entrypoint to `headless-rc32.mjs`, updated build ID and added RC32-only card/art/feature guards. Retired old unused headless module. Adapted newest UI renderer in place: PvP screen bootstrap, opponent-facing hidden Mana, proper opponent labels, start-turn Draw button, result names, and network script insertion.
5. Preserved RC32 source assets and the designer-approved *Poison Vial*; kept the existing in-app `grand-finale-designer-nerf.js` override.

## Measured QA, not extrapolation

| Check | Actual result | Scope and limitations |
|---|---|---|
| `npm run check` JS syntax | PASS | Server, adapter, client runtime, RC32 engine |
| `tests/rc32-integration-smoke.mjs` | PASS | Poison Vial latest text/semantics marker, Grand Finale 60/90, Deflect text, Greater Potion 50, RC32 feature code presence, seven card artwork files, PvP bridge/source flags. Not natural combat fixture. |
| Two authoritative RC32 VM rooms, opening and cards | PASS | Both local human seats, opening decks/Hands/Mana; no Season 1 cards |
| Hidden information / user-seat protection | PASS | Shard backs/UIDs, hand/deck/progression, blind shard handles, seat2 private events, rejected spoofed turns/abilities |
| Actual Attack / Defense Response | PASS | Selected legal battle cards, paid Defense and response, server engine state |
| Real headless full deck-out | PASS | Starting seat 1 and 2, 519–520 actions each, Round 45, consistent seat-relative result |
| Real WebSocket game until deck-out | PASS | Lobby through final winner, 520 actions including 168 hand-limit choices, both seats using Node WebSocket |
| Chromium two-renderer UI | PASS — controlled relay | Both profiles: lobby, select/ready/coin, initial hands, actions queued and **actual NEXT PHASE UI button click** synchronized; game-loaded JS errors 0. Browser images and native WS not verified. |
| Hosted Chromium direct HTTP | BLOCKED | Environment returns `net::ERR_BLOCKED_BY_ADMINISTRATOR` for `http://127.0.0.1:3000/`; not app failure |
| Container image / Northflank deployment | NOT VERIFIED | Docker is not installed in test environment; no account access/deployment |
| Complete native two-browser ordinary 3-Hero victory, multi-card edge cases, mobile / Firefox | NOT VERIFIED | Requires real devices/hosting and natural gameplay scenarios |
| Custom Deck Builder v1.62 export compatibility | NOT VERIFIED | Legacy Deck Builder v1.58 sample accepted by RC32 server; latest v1.62 exports not end-to-end imported |

## Problems surfaced and scope decisions

- Replacing the entire PvP engine with unmodified RC32 **would regress** 4 prior multiplayer fixes, including seat 2 Mana perspective, result reason, private draw presentation, and hand-limit Round; restored exactly these corrections.
- Copying old PvP RC31 bundle forward would silently miss RC32 gameplay fixes (Poison Vial, Greater Health Potion Ready-only, Deflect/PIERCING, etc.); **replaced with RC32 source first** and reintroduced only reviewed PvP adaptations.
- The browser test relay can demonstrate shared browser renderer and server adapter interaction but is **not** a substitute for native HTTPS/WSS Northflank acceptance.
- Full 3-Hero win, Casting, Rank Up, Revive, all statuses, mobile layouts, production persistence and many card-dependent choices remain open as an **acceptance list**, not silent PASS.

## Next gate before any official release

Deploy a single-instance **staging** Northflank service from this package, visit public `https://...` in two isolated browser sessions, and complete normal matches with real UI choices. Verify Attack/Response, Poison Vial Physical Skill triggers/expiry, Deflect vs Piercing, Greater Health Potion Ready restriction, Hero Rank Up/Tribute/Legacy/Revive/Casting/Status, terminal victory, reconnect, audio/images and private-card visibility. Record OS/browser/environment. Test latest Deck Builder v1.62 export. Fix only observed regressions; keep VS AI RC32 and OSA unchanged.

**Checkpoint:** RC32-converted, local playtest-capable staging package and executable tests. No public deployment; no FINAL claim.
