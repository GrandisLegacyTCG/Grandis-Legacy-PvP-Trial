# Grandis Legacy PvP v3.72

Grandis Legacy two-human, server-authoritative PvP build. v3.72 keeps the PvP v3.70 gameplay/server baseline, uses the proven PvP v3.51 multiplayer/network patterns as the reliability reference, and selectively ports the current VS AI v6.90.7 battlefield + decision UX without importing AI control logic.

## Source / behavior stack

- **PvP v3.70** — authoritative gameplay baseline, human Response ownership, viewer-safe snapshots, reconnect state, Shard ownership, match timer, and PvP-specific fixes.
- **PvP v3.51** — multiplayer reliability reference: intent lifecycle, ACK/snapshot recovery, lobby role flow, spectator role, and human-vs-human orchestration.
- **VS AI v6.90.7** — battlefield/decision donor: center resource choices, exact Mana selection UX, current battlefield presentation, hover/review behavior, and updated card motion concepts.
- **Known-broken v6.90.7 donor behavior is not copied blindly.** In particular, the reported broken selected-Shard-to-Deck animation, unresolved Chain Mail connector behavior, and rejected Legacy/Discard hover placement are not treated as authoritative implementations.

## v3.72 highlights

### Opening Draw animation + sound reliability

The opening sequence remains server-authoritative, but battlefield presentation now has one visible owner: the Option-B battlefield layer.

- The server still emits one authoritative `opening_sequence` containing opening Draws, starting Shards, post-opening Draw, and post-opening Shards.
- PvP no longer routes the opening Draw through the hidden shared-engine animation container.
- `GL_OPTION_B_PRESENTATION.queueAuthoritativeOpeningSequence()` renders the sequence against the **visible Main Deck / Hand / Shard Deck / Shard Pool anchors**.
- Start-game presentation waits only for those required anchors to exist; it no longer waits up to ~1.1 seconds for all Hero art to finish loading.
- Authoritative animation IDs are **claimed first and marked seen only after the presentation path accepts them**, preventing a failed first paint from permanently consuming the event.
- Card Sound is prepared with a client-side Web Audio path and the audio context is resumed/unlocked on a real player gesture. HTMLAudio remains a fallback.
- One simultaneous Draw group triggers one card-motion sound rather than multiple stacked copies.

Gameplay state never waits for animation completion; presentation remains non-blocking.

### Exact Mana payment + center decision UI

PvP now uses the v6.90.7 exact-payment model in the shared runtime used by both browser and server:

- All visible Mana and Class Shards can be manually selected.
- Payment must equal the printed Mana cost exactly; overpay is illegal.
- Initial selection is a recommendation only.
- Clicking a new Shard while already at/over the cost uses FIFO replacement of the oldest selected Shards.
- Manually unselecting a Shard does not auto-fill it again.
- Paid Responses use the same exact selected-Shard model.
- Pending state carries `selected_shard_uids`; PAY is enabled only when the authoritative exact plan is legal (and any required Response discard cost is also ready).
- The visible center payment controls send normal PvP network intents (`toggleManaShardPaymentChoice`, `commitManaShardPaymentChoice`, and Response equivalents). They do not mutate authoritative gameplay locally.
- Legacy hidden payment overlays are not allowed to compete with the visible center payment UI.

The server loads the same shared runtime headlessly, so payment legality is validated server-side before a new snapshot is broadcast.

### Network / P2 Tribute stuck regression

- Gameplay intents follow send → server ACK → authoritative snapshot → client unlock.
- A 12-second intent watchdog prevents permanent client lock.
- ACK-without-snapshot recovery requests a lightweight `sync-request` after 2.5 seconds.
- Revision-based snapshots remain the source of gameplay truth; ACK alone never mutates game state locally.
- Regression coverage includes **Player 2: Reform → Tribute → choose Hero → Next Phase**.

### Spectator restored, hidden-info only

- Fixed room supports **2 players + up to 4 spectators**.
- When both seats are occupied, another visitor to the same match link joins as a Spectator.
- Spectators are read-only and cannot issue gameplay intents.
- Both Hands/private card identities remain hidden as Card Backs; public Teaching/Both-Hands mode is disabled.
- Spectators receive public authoritative battlefield updates, sound, and presentation events.
- Spectators reuse a sanitized spectator snapshot cache rather than getting a separate game engine.

### Lobby

The visible lobby follows the simpler PvP v3.51-style controls:

- `SPECTATE` / `JOIN AS PLAYER`
- `READY` / `UNREADY`
- `START MATCH`
- `RECONNECT`

Removed from the lobby UI: Current Room, room switch, player/spectator counters, and Spectator View selector. The backend remains one fixed room (`GRANDIS_PVP`).

### VS AI v6.90.7 battlefield / decision UX

- Center decision layer for Mana payment and supported hidden-card/resource choices.
- Canonical Shard Pool order is preserved visually; new Shards append naturally.
- Hero visual sizing remains independent from lane geometry; Hand/hover/counter/phase presentation from the prior battlefield port is retained.
- Card Review is restored on relevant battlefield surfaces without sending gameplay intents.
- Tribute/Rank-style presentation remains client-side and non-blocking.
- PvP canonical match timer continues to use server `startedAt` / `finishedAt` timestamps.

## 256 MB server budget

v3.72 remains designed for the **256 MB RAM** deployment constraint:

- One authoritative room/runtime engine; no engine per spectator.
- Static definitions are shared process-wide.
- Spectator snapshot data is cached/sanitized by revision rather than maintained as mutable per-viewer game state.
- WebSocket `perMessageDeflate` remains disabled.
- Animation, image, VFX, and audio playback stay client-side; the server transports compact state/events only.
- `/health` exposes `process.memoryUsage()` telemetry.
- Current active-match simulation with 2 players + 4 spectators measured about **170 MB RSS** in the test container. Deployment values can differ, so `/health` remains the live reference.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start
```

Open the local URL in two browser sessions for Player 1 and Player 2. Additional visitors can spectate up to the configured cap.

## Tests

```bash
npm test
```

The v3.72 suite covers:

- syntax/source wiring;
- v3.51-style ACK/watchdog/resync network safeguards;
- authoritative opening-sequence transport;
- visible Option-B opening presentation ownership + audio preparation wiring;
- exact Mana payment/FIFO runtime logic;
- authoritative Class Shard toggle + PAY path through the server intent router;
- P1 ↔ P2 turn handoff and physical Shard ownership;
- **P2 Tribute → Next Phase**;
- hidden-info/read-only spectators and spectator cap;
- authoritative battle-feedback transport.

The server simulation creates a temporary local `ws` test stub and removes it afterward. The repository ships without `node_modules`.

## Deployment / compatibility

- Builder: root `Dockerfile`.
- Default port: `3000`; injected `PORT` is honored.
- Health check: `/health`.
- One service = one fixed authoritative PvP room.
- Intended memory budget: **256 MB**.
- Runtime files: `public/pvp/pvp-v372.js` and `public/pvp/pvp-v372.css`.

Some DOM/CSS namespaces and Local Storage keys intentionally retain the historical `pvp370` / `gl_pvp370_*` names so browser identity, seat token, and deck preferences survive the upgrade.
