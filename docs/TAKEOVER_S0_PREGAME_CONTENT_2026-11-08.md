**SUPERSEDED by `docs/TAKEOVER_DIRECT_RC32_START_2026-11-08.md`.** The prior S0 opening overlay / ACK stage is now removed.

# PvP S0 RC32 — S1 v3.80.17 UI / S0 data — Takeover 2026-11-08

## Baseline and authorization
- Input package: `Grandis_Legacy_PvP_S0_RC32_S1v3.80.17_FullPregame_STAGING_2026-11-07.zip`.
- UI donor: `Grandis_Legacy_PvP_v3.80.17_2026-10-13.zip`.
- Gameplay and decks: `Grandis_Legacy_VS_AI_Season0_v1.0_RC32_2026-11-07.zip` and its staging battle engine.
- User correction: S1 **UI only**. All deck names, starter composition, Hero cards, previews, and match contents must be **S0**; no S1 starter can appear as a selected deck and no starter-index remap.
- Authorization: scoped implementation in separate staging, package for GitHub/Northflank; no deploy/GitHub modifications performed.

## Changes in staging
- `public/index.html`: two S0 catalog bootstrap tags; donor markup otherwise preserved.
- `public/pvp/s0-lobby-catalog.js`: exact S0 approved starter deck catalog exposed only as `GL_S0_LOBBY_STARTERS` (separate from S1's legacy runtime globals).
- `public/pvp/s0-lobby-card-definitions.js`: condensed 242-card S0 catalog for accurate lobby metadata and Hero rank display.
- `public/pvp/pvp-host.js`: deck UI, images, Hero progression, deck counts, custom-deck normalization, S0 card artwork preview, per-season localStorage keys; S0 opening overlay. Keeps S1 lobby layout/coin shell and automatic-room behavior.
- `server/s0-pregame-catalog.mjs`: loads S0 starter catalog with schema, 5-starter, 50/12/12 checks.
- `server.js`: now validates S0 deck and formation and prepares S0 engine **before** coin flip; uses that **same** authority for S0 opening and gameplay. Removed S1 `V6916Authority` gameplay calls. S1 imported decks are rejected. No starter-number remapping.
- `tests/s0-catalog-and-custom.mjs`, updated `tests/s1-source-parity.mjs` and `tests/s1-to-s0-transition.mjs`: independent additional checks for S0 content and imported decks.
- Original RC32 battle engine and donor S1 lobby CSS were not changed.

## Automated QA (actually executed)
| Test | Result | Scope |
|---|---|---|
| Syntax | PASS | Node server and both lobby/battle clients |
| UI donor parity | PASS | Original v3.80.17 HTML after removing exactly two S0 scripts; original CSS byte-identical |
| Source content | PASS | Five S0 starters, 50 Main cards, 12 Legacy, 12 Mana, all referenced S0 art present |
| WebSocket full pregame | PASS | S1 room/Ready/coin -> S0 opening -> RC32 gameplay action |
| S0 opening Hero display | PASS | Hero IDs for selected S0 deck; same Hero IDs appear in RC32 battlefield |
| Per-seat secrecy, spectator | PASS | Opponent hands masked; spectator hands masked |
| Reconnect, wrong seat, surrender | PASS | Specified test cases only |
| S0 builder import | PASS | Direct v1.58 source export (nested deck format) via WebSocket to real RC32 engine |
| S1 import rejection | PASS | S1 card IDs and 60 Main Deck import rejected |
| Browser visual E2E | NOT VERIFIED | Chromium `ERR_BLOCKED_BY_ADMINISTRATOR` navigating localhost |
| Northflank | NOT VERIFIED | Deployment not attempted |
| Full 3-Hero combat win | NOT VERIFIED | Only staged multiplayer smoke and surrender tested in this change |
| Other S0 Deck Builder exports | NOT VERIFIED | v1.62 outputs not exhaustively tested |

## Known limits and checkpoints
1. Opening uses S1's coin visual shell, but a simplified S0 Hero / face-down 6 Hand + 3 Mana sequence, **not** donor's exact flying animations (which depended on S1 gameplay data). Never claim opening animation pixel parity.
2. Pre-game S1 engine/bootstrap source files remain in the package to retain stable donor UI behavior, but lobby now obtains selected starter/card content exclusively from S0. They do not determine the S0 match.
3. Custom S0 Deck Builder format works for one tested v1.58 nested payload. Other v1.62 export shapes and malformed edge cases need QA.
4. Real remote browser workflow and Northflank need live verification; this is not a FINAL public gameplay release.
5. Deploy only to separate S0 repo/service; test two real browsers/players and report any runtime error with browser logs or screenshot.
