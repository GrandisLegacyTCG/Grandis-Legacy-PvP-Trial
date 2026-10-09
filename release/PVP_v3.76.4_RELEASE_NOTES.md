# Grandis Legacy PvP v3.76.4 — Release Notes

Date: 2026-10-09
Scope: targeted UI restoration / pre-game presentation stabilization.

## Authority / architecture

- PvP v3.51 remains the authoritative game/network/runtime implementation.
- VS AI v6.90.7 remains the visible gameplay presentation reference.
- No second gameplay engine was introduced.
- No local client state was promoted to gameplay authority.
- v3.76.3 low-memory static streaming, de-bloat, canonical asset resolution, and Lobby-first boot behavior are preserved.

## Root-cause audit

### Lobby UI rollback
v3.76.3 fixed boot reliability and repository/resource bloat but retained the older v3.51 `installLobbyModal()` presentation, including multi-room navigation and spectator metadata. The room abstraction was not required for user-facing UI. v3.76.4 removes that presentation complexity while retaining the existing backend room/service abstraction.

### Gameplay duplication / overlap
Source audit did **not** prove that the native `#app` renderer and the external v6 shell were steadily visible at the same time: v3.76.3 CSS already hid `#app` while the old `pvp-external-gameplay` class was present. The larger problem was ownership/reveal timing. Visibility was keyed to `GL_PVP_SHARED_BOARD_ACTIVE && state`, which is a data/runtime flag rather than an explicit presentation-state contract. The external shell itself also authored visible pre-game defaults (`OPPONENT`, `PLAYER`, active `DRAW PHASE`, enabled-looking phase actions, `00:00`) and rendered zero-count pools before the authoritative/pre-game visual state was ready. This made Coin Flip/opening look like stacked or half-mounted UI even when the native renderer was not proven visible simultaneously.

v3.76.4 replaces that implicit switch with explicit `pvp-presentation-owned`, `pvp-pregame`, `pvp-presentation-ready`, and `pvp-gameplay-revealed` states. Native `#app` remains mounted for runtime/controller compatibility but is nonvisual while the external presentation owns gameplay.

### CSS order
The stylesheet order was audited: v3.51 base CSS loads first, then the v6 shell and presentation CSS. No primary global stylesheet-order inversion was found. The fix therefore does not add an offset/z-index patch pile. Only scoped PvP identity/pre-game/empty-pool rules were added, and the bottom rail's three-column geometry was moved into the donor shell rule itself.

## UI changes

### Lobby
- Removed/hid user-facing multi-room presentation: Current Room, room number, switch-room controls.
- Removed GO TO DECK BUILDER / GO TO VS AI from the PvP Lobby.
- Removed Players/Spectators/Card Backs metadata counters from the Lobby.
- Kept SPECTATE.
- Player Name is capped at 20 characters without helper text.
- Kept compact seat/kick behavior and existing server permissions.
- Reflowed desktop Lobby spacing so a 1440×900 browser fixture fits naturally with no vertical document scroll; no overflow-clipping workaround is used.
- Connection/error copy no longer exposes room-selector complexity.

### Coin Flip / pre-game
- Coin Flip controller/logic remains PvP v3.51.
- External v6 shell mounts behind the Coin Flip under explicit dark/noninteractive gating.
- Phase actions are hidden/disabled during pre-game.
- Phase highlight is suppressed during pre-game and turn copy reads `OPENING MATCH / PRE-GAME` instead of a false active turn.
- Timer is blank/inactive until authoritative `startedAt` exists; no fake `00:00` pre-game state.
- Empty Shard Pool counters no longer show raw `0`; empty pools use a subdued shell state.
- Opening presentation owns pre-game interaction until its final animation callback completes.
- Authoritative click interception now includes the external v6 shell, not only native `#app` controls.

### Gameplay presentation ownership / geometry
- Exactly one intended visible gameplay owner: external v6 shell.
- Native `#app` stays hidden/noninteractive while external ownership is active.
- Reveal is gated on required v6 structural regions and hidden native renderer state, not merely script completion.
- Hero/Hand/deck/Shard/Discard/phase/sidebar/bottom geometry continues to use v6 shell structure/CSS; no random per-element geometry redesign was added.
- Opponent and local identity slots now show Player Name + Deck Name using existing v6 locations, with connection signal bars on the requested sides.
- Bottom rail is `Timer | Sound | Surrender` in one integrated v6 rail.

## Preserved behavior

No gameplay-rule redesign was made. Payment, Attack legality, Round 1 rule, Response, Steal, Tribute, Rank Up, Status, Attachment, Casting, defeat/revive, reconnect authority, privacy, and the server reducer remain on the existing authoritative path. Sound remains independent from render suppression. EXP continues to use canonical `assets/exp/...` paths.

## Automated / static QA actually run

PASS:
- JavaScript syntax: `server.js`, `app.bundle.js`, `pvp-network.js`, `pvp-gameplay-presentation.js`, `pvp-presentation-adapter.js`.
- v3.76.4 UI stabilization static suite: 26 checks.
- Candidate 3A intent router / server ownership protections.
- Candidate 3A headless runtime and opening flow.
- Candidate 3A canonical gameplay smoke (representative Attack/Tactical/Item/Event, targeting, Mana/Shard payment, Response backbone, Tribute, Rank Up, Ultimate Tribute, Reposition, invalid-action no-mutation).
- Candidate 3C defeat/lifecycle cleanup.
- Candidate 3B advanced runtime (statuses, advanced Response, Attachment, Casting, search privacy/reveal behavior, multi-target flows).
- Runtime sync lock regenerated and verifier passed for 94 files before server smoke; regenerated again for final packaging.

## Server / memory QA actually run

The real `ws` package is not installed in this sandbox and outbound package installation is unavailable. For HTTP/static-only smoke, a temporary QA-only `ws` API stub was created outside the final package behavior, then deleted before packaging. It was used only to allow the real production `server.js` HTTP listener/static handler to start; no WebSocket gameplay PASS is inferred from it.

PASS static-delivery smoke:
- 15 representative static requests across 3 rounds.
- `/health` remained responsive.
- `static-data.js`: 8,949,723 bytes requested successfully.
- Node runtime returned no `Content-Encoding` (no reintroduced request-time compression).
- RSS: 178,216,960 -> 178,946,048 bytes (+729,088 bytes).
- heapUsed: 87,380,000 -> 87,320,920 bytes (-59,080 bytes).
- No `brotliCompressSync(` or `gzipSync(` in production server source.

## Browser / screenshot QA actually run

The environment blocks direct Chromium navigation to local HTTP/file URLs with `ERR_BLOCKED_BY_ADMINISTRATOR`, so this build does **not** claim a live-server browser acceptance PASS or a real two-client browser match PASS.

A real Chromium browser was nevertheless used with production v3.76.4 CSS and production Lobby/gameplay DOM shell loaded through Playwright `set_content`. Eight browser-rendered visual fixtures were captured and manually inspected:

A. Lobby — Player 1 joined
B. Lobby — both players Ready
C. Coin Flip — before choice
D. Coin Flip — waiting for other player
E. immediately after Coin Flip / opening pre-game
F. during Opening Hand
G. after Opening Hand + Starting Shards
H. normal gameplay Deploy phase

Observed in those browser-rendered fixtures:
- no document/body vertical scroll at 1440×900;
- Lobby does not show Go To buttons, room selector/number, or spectator counters;
- Coin Flip background is dark and structurally prepared;
- phase controls are not exposed as active during pre-game;
- no raw zero Shard counter in an empty pool;
- one phase rail and one bottom rail;
- six Hero lanes total (three each side) with one intended visible card representation per occupied fixture slot;
- opponent/local identity blocks use the requested v6 locations;
- gameplay Deploy fixture shows integrated Timer / Sound / Surrender.

These fixture screenshots validate CSS/DOM composition, not live WebSocket synchronization or real card-state hydration.

## Known remaining QA limitation

- A real two-browser/two-client WebSocket session was not executed in this environment.
- Direct live-server Chromium navigation could not be executed because of administrator browser policy.
- Therefore synchronization and live visual transitions should receive final deployment acceptance testing; they are not falsely marked PASS here.
