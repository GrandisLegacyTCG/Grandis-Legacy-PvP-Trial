# Grandis Legacy PvP S0 — RC38 Beta 2 Batch 4 Source Sync

**Prepared:** 12 November 2026. **Status:** PvP Trial staging candidate. **Baseline:** RC38 Beta 2 Batch 3 (includes Batches 1 and 2). **Donor:** `Grandis_Legacy_VS_AI_Season0_RC38_2026-11-12.zip`, verified against `RC38_BUILD_INFO.json` (`date=2026-11-12`, in-place automatic Mana override patch). **Build ID:** `gl-s0-pvp-rc38-beta2-batch4-2026-11-12`.

## Specific updates brought into PvP

1. **Latest RC38 automatic Mana Deck policy:** for BOTH human seats, derive the effective 12 physical Mana Shards exclusively from their 3 selected Hero progression packages. Include exactly one Color Mana per distinct Base Class, including both base Classes of Hybrid progressions; all remaining Shards are Regular. No old three-Color limit, no Ultimate-card-based class selection. This is the current VS AI **app policy**, not a rewrite of the general Rulebook v3.2 Mana permission.
2. **Imported v1.64 Deck Builder JSON:** `mana_deck` / `shard_deck` fields are treated as non-authoritative, including contradictory, missing, off-Class, malformed or oversized entries. The original import payload is not mutated. The existing Main/Legacy/Hero/formation checks are preserved. The PvP server's nested-vs-root envelope check still rejects contradictory Main/Legacy fields, but no longer treats contradictory raw Shards as a validation error.
3. **Donor reference data parity:** updated generated card/effect/hero/asset/Mana metadata and RC38 stage guard script from the same authoritative donor. Core `static-data.js`, official active starters, and all supplied card-art assets were already byte-identical and were retained unchanged.
4. **Card review alignment:** current R3.6 Fenrir Ironfang naming/owner condition and the Rank Up text (return 2/3 EXP to Hand, rather than draw new cards) are synchronized for lobby/battle review. Imported Card Review still uses the original VS AI design.
5. **Minor shared CSS parity:** synchronized the donor's `GO FIRST` / `GO SECOND` layout rules without replacing PvP's existing Coin Flip winner/loser presentation or its `Opening Coin Flip` title suppression.
6. **Deploy-safe versioning:** new Build ID, package version, HTML asset cache busting, and regenerated Brotli/Gzip. PvP README, source history and RC6 docs retained.

## What was deliberately NOT imported

- VS AI **Beginner/Intermediate AI** decision system, AI-only deck import gates, AI-only heal/tribute selectors, or any local AI turn logic. PvP has two human players and remains fully server-authoritative.
- VS AI **BGM** and pregame audio changes: PvP continues to have no background music; existing SFX remain.
- VS AI lobby architecture or independent local game/AI WebSocket flows: keep the **RC6 Stage 2 single lobby-owned WebSocket**, reconnect, player roles/ready, Coin Flip turn choice, spectator masking, and embedded battlefield bridge.
- No changes to **RC5 atomic Mana Payment**, local draft/atomic choice work from Batch 3, or authoritative damage/Status rules. PvP-specific Single Target, Area Attack/Response visuals, mobile landscape rotation, waiting notification and Opponent Mana Pool face-up presentation stay in place.

## Local verification

- `npm run build:precompress`: **PASS** (81 compressed files; regenerated sidecars from the new source).
- `npm run check`: **PASS**, including all inherited PvP/network/lobby/Response/Mana tests and the new Batch 4 policy tests.
- Actual headless RC38 engine: **five out of five official starter compositions** generate exactly 12 physical Shards on BOTH human seats. **Nested v1.64 import** with conflicting, impossible Mana data starts and opens correctly on both sides without modifying input. **Three hybrid progressions** spanning all five base Classes generate 5 Color + 7 Regular (both seats).
- Negative controls from donor's current `check-stage4-engine-deck-guard.cjs`: still rejects 49/51 Main Cards and duplicate Ultimate, accepts/replaces contradictory Mana JSON for all five official starters.
- Existing Batch 3 real-engine Rank Up, Scouting, Crystal Ball, Bard Draw and Hand Limit commit tests: **PASS**.
- Existing opponent Mana privacy/blind-selection and RC6 single-socket tests: **PASS**.
- ZIP integrity / compressed-sidecar match: verified in separate release packaging audit.

## Remaining acceptance limits

- This is a **local source + automated regression build**, not a verified two-device hosted match. Need test on desktop and mobile with both players (Lobby, imported deck, Mana Pool visibility, Coin Flip, Response, Status animations), reconnect, and Northflank latency/resource pressure.
- No claim that Northflank START loading FPS/latency is improved by Batch 4; Batch 4 synchronizes source, while the startup optimizations remain from Batch 1/2.
- **GitHub and Northflank were not modified.** PvP main repository stays untouched.

## Deployment note

Upload the **full package** to a clean PvP Trial build, or apply the **changed-only** package over the exact Beta 2 Batch 3 baseline; do not layer it on RC36.8 or another branch. When comparing staging versions, confirm `/health` returns the new `buildId`, then hard-refresh both clients so cache keys match. Live results still require user acceptance testing.
