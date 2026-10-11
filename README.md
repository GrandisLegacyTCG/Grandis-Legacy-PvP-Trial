# Grandis Legacy PvP v3.80.7

Grandis Legacy PvP v3.80.7 is a **gameplay-parity/payment-handshake patch** on the v6.91.4-native PvP line. The multiplayer layer preserves VS AI v6.91.4 gameplay/presentation behavior and only adds the remote-player, authority, privacy, reconnect, and synchronization seams required by PvP.

## Locked bases

- **Presentation/gameplay base:** VS AI v6.91.4
- **Lobby base:** PvP v3.76.6
- **Architecture reference:** handshake lessons from VS AI Tutorial v6.48 and PvP v3.51
- **Server gameplay authority:** the exact VS AI v6.91.4 shared gameplay engine, executed headlessly in Node
- **PvP Mana seam:** browser-local donor Shard selection; one final selected-Shard-UID commit on PAY

PvP v3.51 is **not** shipped as an authority/runtime dependency. It remains useful as an older networking reference, but v3.80.7 Mana interaction follows the current VS AI v6.91.4 donor behavior rather than the older Class-only/FIFO experiment.

## Current handshake

```text
v6.91.4 desktop / tablet / mobile UI
                |
                | normal committed gameplay intent
                v
        thin PvP client adapter
                |
                | one gameplay intent + base revision
                v
  exact v6.91.4 gameplay engine in headless Node
                |
                | one atomic intent-result
                | + viewer-safe localized snapshot
                v
        thin PvP client adapter
                |
                v
       v6.91.4 presentation runtime
```

The active remote human is always executed as v6.91.4's local `PLAYER` in actor-local seat orientation. This prevents the multiplayer server from invoking v6 Local AI for Player 2.

The donor's internal side names (`PLAYER` / `AI`) remain an engine implementation detail. In PvP mode the presentation translates the remote side to **Opponent**; it does not expose Local-AI identity copy as player-facing PvP UI.

See `ARCHITECTURE_V380.md` for the full contract.

## Mana payment boundary

v3.80.7 removes the PvP-only Class-Shard/FIFO payment fork and restores the active donor engine tree byte-for-byte to VS AI v6.91.4.

The browser interaction is now:

```text
authoritative payment pending arrives
        |
        v
v6.91.4 recommended exact Shard selection
        |
        | click any normal Mana or Class Shard
        | (browser-local donor state only)
        v
final selected_shard_uids draft
        |
        | PAY: one network intent
        v
server validates every UID against the actor's authoritative Shard Pool
        |
        | inject validated final selection
        v
untouched v6.91.4 donor commit once
        |
        v
Response / resolution authoritative snapshot
```

Normal Mana and Class Shards are both selectable exactly as in VS AI v6.91.4. The donor remains responsible for exact Mana value, matching Class value, and legal payment calculation. The PvP server does not invent a second payment formula; it only verifies final identity/ownership and submits the validated draft to the donor commit routine.

For Response payments that also require a Hand discard, the browser keeps both the Shard choice and required discard choice in the same local donor draft and sends the final Shard UIDs plus final discard-choice indices on PAY.

## Gameplay transport boundary

v3.80.x uses one atomic `intent-result` for each committed network action. Exactly one network gameplay action may be in flight. A second committed action while one is still in flight is rejected locally rather than silently queued. If the result times out, the client releases the gate and requests a fresh authoritative snapshot.

Mana **selection clicks are intentionally not network actions** in v3.80.7; they only change the mounted donor's local payment draft. PAY is the single committed network action for that payment.

The opening battlefield is non-interactive until the server reaches `started`. A client may finish its opening animation a few seconds before the other device, but it cannot send gameplay actions during that gap.

## Asset policy

This standalone trial package carries the local Season 1 WebP/media set. Visible card and Shard URLs resolve to packaged assets:

- `card-art/<CARD_ID>.webp`
- `assets/shards/*.webp`
- `assets/ui/*`
- `engine/assets/audio/*`

To avoid a card name/text flashing before its artwork is ready:

- the selected player's deck art is preloaded as an **unordered asset set** in the lobby;
- visible opening-board assets are decoded before opening presentation starts;
- dynamic card/Shard images use a decode guard and hide alt-text fallback while pending;
- the previous full-game `warmAllCardArt()` background preload is removed.

The browser is never given a “top 5 deck order” preload hint. That would leak future draw order through cache/network inspection. Preloading an unordered set of cards the player already knows are in their own deck avoids that privacy leak.

## Coin Flip and opening boundary

Coin Flip follows the VS AI v6.91.4 lifecycle: the battlefield keeps `gl-lobby-hidden` through Coin Flip choice/result, the donor Coin Flip overlay owns the visible screen, and the PvP integration does not override its backdrop. The Coin Flip gate also keeps the battlefield `inert` and blocks pointer/focus interaction.

The opening board is imported **without rendering** and then presented exactly once per client by the v6.91.4 opening presenter. A stable server-owned opening presentation ID makes presentation idempotent. Clients may start a few seconds apart, but the same opening cannot replay on one device.

## Seat orientation and mirroring

Seat mirroring remains part of the PvP authority boundary. It is required so either physical player can be presented to the donor runtime as local `PLAYER` while the server retains one canonical two-seat board. v3.80.7 does not redesign this mechanism while Mana Payment is the blocking gameplay issue.

## Deck summary

The lobby summary keeps the two physical deck groups separate:

```text
Heroes + Legacies -> Legacy Deck
Skills + Items + Events -> Main Deck
```

Imported Custom Decks intentionally retain the existing **50–60 Main Deck** acceptance for this PvP line.

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

`npm run release:seal` runs source/static tests plus final manifest generation. `npm run test:startup` is a separate real-process startup check and requires production dependencies to be installed.

## Mandatory deployment guardrails

Before a release is treated as deployable:

1. Make all source changes first.
2. Run `npm run release:seal` **after the last edit**.
3. Run `npm ci --omit=dev --ignore-scripts` in the environment that will execute the package.
4. Run `npm run test:startup` and require a real HTTP 200 `{ "ok": true }` from `/health`.
5. After the final ZIP is created, clean-extract it and repeat source/manifest checks.

See `DEPLOYMENT_GUARDRAILS.md`.

## Project workflow rules

`PROJECT_WORKFLOW_RULES.md` remains mandatory project policy:

- a single bug report does **not** automatically authorize another ZIP;
- investigate the actual source/logic first and consolidate related fixes where practical;
- package only after the user explicitly asks for the candidate build;
- every future Takeover Note should carry the same workflow rule.

v3.80.7 is being packaged because this update was explicitly requested after the payment-handshake audit.
