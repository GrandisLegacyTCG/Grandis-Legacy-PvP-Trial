# Grandis Legacy PvP S0 — RC32 Same-Version Maintenance Takeover

**Date:** 2026-11-07. **Mode:** Implement authorized update within PvP staging, no deployment/release. **Parent checkpoint:** `/mnt/data/pvp_s0_rc32_northflank_preflight` (unchanged). **Target worktree:** `/mnt/data/pvp_s0_rc32_latest_work`. **Gameplay source:** updated user-provided `Grandis_Legacy_VS_AI_Season0_v1.0_RC32_2026-11-07.zip` (same RC32 filename, newer contents); PvP Season 1 v3.51 remains an architecture reference, not a gameplay source. No writes to source VS AI/OSA or production services.

## Confirmed source delta

The previous extracted VS AI RC32 reference contains 683 files. The newest source archive has 689. Compared with the old source, exactly **4 files differ and 6 files are new**: `README.md`, `docs/TAKEOVER_NOTE.md`, `docs/qa/rc32/RC31_TO_RC32_COMPLETE_INVENTORY_2026-11-07.md`, `engine/shared-app/app.bundle.js` were updated; 6 new QA/reference files cover Primal Strike/Burn, Stun/Color Mana, and a bundled v2.9 rulebook PDF.

Updated gameplay details **from this specific source archive**:
- Primal Strike (Racial Trait) deals 20 Physical damage and, on a target with Burn, adds 10 only when actual positive base damage remains after Defense; Burn stacking does not multiply the bonus. Skill-only effects such as Poison Vial do not trigger from this Racial Trait.
- A Hero with Stun may not activate Class/Racial actions. This includes Primal Strike, Human Ambition, Quick Reload/Rapid Chamber Draw Review, Dragon Scale, Second Chance and Stoneblood; mandatory Draw is unaffected.
- Manually selecting a matching 2-Mana Color Shard for an exact payment preferentially replaces already selected Color Shards, when a same-value swap is possible. Other toggles retain prior priority. Applied through the shared engine's Skill and Response payment helpers.

## Integration scope

- Replaced `client/engine/shared-app/app.bundle.js` with the **latest VS AI RC32** source plus the original **four tested narrow PvP bridge corrections**: mandatory hand-limit round advancement; suppress game result modal in headless surrender; mirror physical Mana zones for seat 2; avoid double-mirroring presentation events and mirror result reason. No other engine-specific gameplay patches.
- Synced upstream `client/README.md`, changed RC32 source inventory, and all six new upstream documents/QA files plus current official VS AI release/takeover metadata from the archive (byte-preserved).
- Preserved PvP's `client/index.html`, `client/shared-app/app-runtime.js`, `client/runtime/pvp-network.js`, `server.js`, VM engine, room management, reconnect, hidden-card masking and existing preflight tests as-is.
- Preserved **Grand Finale 60/90** and the RC32 **Poison Vial** local approved authority instead of replacing them with stale OSA values.
- Added `tests/rc32-same-version-maintenance.mjs` (in-memory test-only hooks; not shipped in production engine); included it in `npm run test:headless`.
- Source parity: **all 689 upstream files present** inside `client/`; **686 byte-identical** and **3 intentional PvP-specific differences** listed in `RC32_LATEST_SOURCE_PARITY.json`. No missing upstream files.

## QA evidence and limitations

| Check | Result | Evidence / scope |
|---|---|---|
| Node/JS syntax | PASS | `npm run check:syntax` |
| New RC32 behavioral test | PASS | Actual engine VM: Stun Primal Strike token safety, Stoneblood, Dragon Scale and Second Chance on BOTH seat coordinate sides; Primal Strike 20/30/Burn duration; exact Color Mana swap on BOTH sides |
| Existing headless regression suite | PASS | `npm run test:headless`; same real RC32 engine inside authoritative VM |
| Existing multiplayer network suite | PASS | `npm run test:network`; real Node WebSocket 2-seat lobby, privacy, turn/round, Attack/Response, deck-out terminal |
| HTTP+WebSocket hosted smoke on localhost | PASS | `npm run test:hosted` with local server, disposable room and two WebSocket seats; **not Northflank** |
| Two Chromium renderer UI/bridge | PASS | `tests/browser-bridge-smoke.py`; 2 UI sessions with test-only WebSocket relay, real Node authority; **not native WebSocket** |
| Native Chromium HTTP navigation | BLOCKED | Local `http://127.0.0.1:39762/` returned `ERR_BLOCKED_BY_ADMINISTRATOR`; environmental block, not evidence of an app bug |
| Docker build, GitHub Actions and real Northflank HTTPS/WSS | NOT VERIFIED | No deployment performed; do not imply production readiness |
| Full 3-Hero combat victory using two native human browser sessions, every card interaction, Firefox/mobile/device sound | NOT VERIFIED | Existing automated deck-out is not full natural card-by-card coverage |

**Status:** latest RC32 code integrated and local automated regressions passed in staging. Northflank playability and full native browser testing still NOT VERIFIED. Existing RC32 preflight README and Northflank staging gate remain applicable; user waived user-side local testing, not the need for hosted acceptance.

## Next operational gate

When an isolated GitHub repository/Northflank staging service is available, deploy this staging checkout as **one Docker service, one replica** with `PORT=3000`; verify `/health` and two real HTTPS browser sessions over native WSS. Confirm ordinary 3-Hero victory and representative new RC32 mechanics through the actual UI. Do not overwrite the Season 1 Northflank service or publish as final without acceptance.
