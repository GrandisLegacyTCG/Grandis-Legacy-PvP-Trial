# Grandis Legacy PvP v3.80.6

Grandis Legacy PvP v3.80.6 is a **gameplay-parity patch** on the v6.91.4-native PvP handshake. The multiplayer layer must preserve VS AI v6.91.4 gameplay/presentation behavior and only replace local-AI authority with remote-player/server authority where required.

## Locked bases

- **Presentation base:** VS AI v6.91.4
- **Lobby base:** PvP v3.76.6
- **Architecture reference:** the handshake pattern used by VS AI Tutorial v6.48 and PvP v3.51
- **Server gameplay authority:** the VS AI v6.91.4 shared gameplay engine, executed headlessly in Node, with one intentional PvP payment-policy seam
- **PvP Mana policy:** v3.51-style Class-only manual choice; normal Mana Shards auto-fill in FIFO order

PvP v3.51 is **not** shipped as an authority/runtime dependency. Its payment decision model is reimplemented as a narrow PvP-only seam on top of the v6.91.4 gameplay base.

## New handshake

```text
v6.91.4 desktop / tablet / mobile UI
                |
                | intent / intent batch
                v
        thin PvP client adapter
                |
                | one gameplay intent + base revision
                v
  v6.91.4 gameplay engine in headless Node
                |
                | one atomic intent-result
                | + viewer-safe localized snapshot
                v
        thin PvP client adapter
                |
                v
       v6.91.4 presentation runtime
```

The active remote human is always executed as v6.91.4's local `PLAYER` in an actor-local seat orientation. This prevents the multiplayer server from invoking v6 Local AI for Player 2.

The donor's internal side names (`PLAYER` / `AI`) remain an engine implementation detail. In PvP mode the presentation translates the remote side to **Opponent**; it does not expose Local-AI identity copy as player-facing PvP UI.

See `ARCHITECTURE_V380.md` for the full contract.

## Asset policy

This standalone trial package intentionally carries the local Season 1 WebP/media set. Visible card and Shard URLs are resolved through the PvP presentation boundary to packaged local assets:

- `card-art/<CARD_ID>.webp`
- `assets/shards/*.webp`
- `assets/ui/*`
- `engine/assets/audio/*`

The v6.91.4 gameplay donor still contains some website/CDN strings internally. Those are not the active standalone presentation path: donor rendering is suppressed, authoritative snapshot imports are silent, and visible card/Shard resolvers are overridden locally.

When PvP is integrated into the main website later, this resolver boundary can be changed to the shared Website asset repository without changing gameplay authority.

## Coin Flip and opening boundary

Coin Flip follows the VS AI v6.91.4 lifecycle: the battlefield keeps `gl-lobby-hidden` through Coin Flip choice/result, the donor Coin Flip overlay owns the visible screen, and the PvP integration does not override its backdrop. The Coin Flip gate also keeps the battlefield `inert` and blocks pointer/focus interaction.

The opening board is imported **without rendering** and then presented exactly once per client by the v6.91.4 opening presenter. A stable server-owned opening presentation ID makes the presentation idempotent: clients may start a few seconds apart, but a late ACK/snapshot from the other client cannot replay the same opening animation or sound. This prevents duplicate opening Draw/Shard motion and card-motion audio under the Coin Flip screen. The server begins the first authoritative turn only after both clients acknowledge opening; once mandatory Draw/replacement/Mana Regen is resolved, authority automatically transitions Draw -> Deploy like VS AI.


## Gameplay transport boundary

v3.80.6 removes the previous client-side intent queue and the two-message `intent-ack` + later-snapshot correlation. Exactly one gameplay action may be in flight. The server finishes that action with one `intent-result` containing the action ID, accepted/rejected status, resulting authoritative revision, and the sender's viewer-safe authoritative snapshot.

A second click while an action is still in flight is rejected locally instead of being silently queued. If the result does not arrive within the transport timeout, the client releases the action gate and requests a fresh authoritative snapshot. This prevents one lost/mis-correlated action from deadlocking every later card, Class-Shard, or PAY interaction.

The opening battlefield is also non-interactive until the server reaches `started`. A client may finish its opening animation a few seconds before the other device, but it cannot send gameplay actions during that gap.

## Mana payment interaction boundary

PvP intentionally uses a simpler payment policy than VS AI v6.91.4. **Normal Mana Shards remain visible but cannot be manually selected.** They auto-fill the remaining cost in Shard-Pool FIFO order. For Skill and Event payments, the player may toggle only Class Shards; selecting a Class Shard reduces the number of auto-selected normal Mana Shards, and canceling that Class Shard restores the same FIFO normal-Mana fill.

Class-Shard toggles are authoritative server intents. PAY is a single authoritative commit against the already-canonical payment state; there is no local draft, no symmetric-diff reconciliation, and no replay batch. Event uses the exact same payment interaction as Skill; its Class Shards contribute 1 Mana. Response Mana payment uses the same Class-only/FIFO policy. Items do not enter this Mana-payment UI in the current PvP ruleset.

This is an intentional PvP-only gameplay seam, chosen to keep the payment state deterministic across two devices while retaining the current v6.91.4 payment UI.

## Asset warm-up and deck summary

The selected deck artwork is preloaded in the lobby, the full local card-art set warms in the background, and visible opening-board art is decoded before opening presentation starts. Dynamic card/shard images suppress text fallback while decoding. The deck summary is grouped by the two physical decks: `Heroes + Legacies -> Legacy Deck`, then `Skills + Items + Events -> Main Deck`.

## Local run

```bash
npm ci --omit=dev --ignore-scripts
npm start
```

Default endpoint: `http://127.0.0.1:3000/` when `HOST=127.0.0.1`, or production bind `0.0.0.0` when no HOST is supplied.

Health endpoint: `/health`.

## Validation

```bash
npm test
npm run frontend-manifest
npm run manifest
npm run verify:manifest
npm run check:deployment
npm run test:startup
```

`npm run release:seal` runs the static/source validation plus final manifest generation. `npm run test:startup` is a separate **real process startup** check and requires production dependencies to be installed.

## ⚠ Mandatory Deployment Guardrails — read before every new version

A browser message such as **`no healthy upstream`** means the reverse proxy has no healthy application process behind it. It is not, by itself, a frontend diagnosis.

Before a release is treated as deployable:

1. Make all source changes first.
2. Run `npm run release:seal` **after the last edit**.
3. Run `npm ci --omit=dev --ignore-scripts` in the environment that will execute the package.
4. Run `npm run test:startup` and require a real HTTP 200 `{ "ok": true }` from `/health`.
5. After the final ZIP is created, clean-extract it and repeat the source/manifest checks. Do not claim live deployment PASS unless the real server process actually started.

The Docker runtime contract is deliberately small: `server.js`, `server/`, and `public/`. If a future server startup imports or reads another runtime root, the Dockerfile must copy that root too.

See `DEPLOYMENT_GUARDRAILS.md`.

## Project workflow rules

`PROJECT_WORKFLOW_RULES.md` is mandatory project policy:

- a bug report does **not** authorize creating another ZIP;
- consolidate fixes in the working tree where practical;
- when the candidate is ready, ask the user for explicit permission before packaging;
- every future Takeover Note must repeat those workflow rules.
