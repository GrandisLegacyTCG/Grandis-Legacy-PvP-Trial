# Grandis Legacy PvP v3.75.5

Two-human, server-authoritative Grandis Legacy PvP with the current VS AI v6.90.7 battlefield/UI experience.

## Locked source roles

This build uses a hard boundary between the three source lines:

- **PvP v3.51 = gameplay + multiplayer authority after match start.** The headless server loads an exact copy of the proven v3.51 canonical gameplay runtime and the v3.51 gameplay intent router.
- **VS AI v6.90.7 = UI/UX/presentation.** The browser keeps the newer battlefield layout, center choices/payment presentation, hover/review behavior, effects, animation, and audio concepts.
- **pvp-fresh v3.73.20 = lobby/start-game/opening donor only.** Its gameplay synchronization and exact-Shard transaction model are not used as the authoritative match engine.

The practical target is simple: players should experience the latest UI/UX while the backend uses the multiplayer flow that already proved stable in v3.51.

## Why the server runtime is separate

`public/js/app.bundle.js` remains the newer browser/presentation runtime required by the v6.90.7-derived UI. The server does **not** execute that file for gameplay authority.

The canonical match engine is isolated in:

- `server/runtime/static-data.js`
- `server/runtime/runtime-authority.js`
- `server/runtime/app.bundle.js`

Those files are exact v3.51 runtime artifacts. Static QA locks their SHA-256 hashes so the v3.73.x gameplay/payment model cannot silently leak back into server authority.

## Payment behavior

The authoritative payment flow is restored to v3.51 semantics:

- Event / Item / other non-Skill payments do not use the newer universal exact-Shard popup; Mana Shards pay first and Class Shards are consumed only if needed.
- Skill payments may offer Class Shard choice; chosen Class Shards contribute first and Mana Shards automatically fill the remaining cost.
- The browser may present the newer v6.90.7 payment UI, but the server decides legality, cost, Shard spending, card resolution, and the next pending state.

The first player's first-turn restriction remains **Attack-only**. Deploy/Reform Events are not blocked merely because it is Round 1.

## Repository naming

The production tree follows the recognizable PvP v3.51-style layout: browser code under `public/js/`, CSS under `public/css/`, and shared battlefield UI under `public/shared-ui/`. Internal `PLAYER` / `AI` runtime side names are retained for snapshot compatibility; in human-vs-human PvP, internal `AI` means Player 2.

See `docs/SOURCE_MAP_v3.75.5.md` and `docs/SYNC_ARCHITECTURE_v3.75.5.md`.

## Versioning

The active line is **v3.75.5**. Future maintenance builds increment only the final component: `v3.75.6`, `v3.75.7`, and so on unless explicitly changed.

## Local run

Requires Node.js 18+.

```bash
npm install
npm start
```

Open the same URL in two browser sessions for Player 1 and Player 2. Additional visitors can join as read-only hidden-info spectators up to the configured cap.

## QA

```bash
npm test
```

The automated suite locks the exact v3.51 server gameplay artifacts, checks v3.51 payment semantics and Round-1 Event legality, verifies Meditation resolution in the authoritative engine, two-human P1↔P2 handoff, Player 2 Tribute, spectator security/capacity, opening transport, and authoritative battle feedback.

Real two-browser testing is still required before calling the build live-ready, especially Meditation, Steal, and a paid Skill from both seats.

## Deployment

- Dockerfile: repository root `Dockerfile`
- Default port: `3000` (`PORT` is honored)
- Health check: `/health`
- Fixed room: `GRANDIS_PVP`
- Intended memory budget: 256 MB
