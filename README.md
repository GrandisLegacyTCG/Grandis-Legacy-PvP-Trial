# Grandis Legacy PvP v3.80.12

Grandis Legacy PvP v3.80.12 is a **gameplay-input and authoritative-presentation stabilization patch** on the v6.91.6-native PvP line. The multiplayer layer preserves VS AI v6.91.6 gameplay/presentation behavior and only adds the remote-player, authority, privacy, reconnect, and synchronization seams required by PvP.

## Locked bases

- **Presentation/gameplay base:** VS AI v6.91.6
- **Lobby base:** PvP v3.76.6
- **Architecture reference:** handshake lessons from VS AI Tutorial v6.48 and PvP v3.51
- **Server gameplay authority:** VS AI v6.91.6 shared gameplay engine executed headlessly in Node, with narrow PvP-only input guards and battle-presentation bridge hooks
- **PvP Mana seam:** center-only ephemeral UI Shard selection; one final selected-Shard-UID commit on PAY

PvP v3.51 is **not** shipped as an authority/runtime dependency. It remains useful as an older networking reference, but v3.80.12 Mana interaction follows the current VS AI v6.91.6 donor behavior rather than the older Class-only/FIFO experiment.

## v3.80.12 stabilization scope

- Battlefield player/opponent names are restored with live connection bars (local bar left of name, opponent bar right of name).
- CANCEL is rendered only for the local owner of the pending decision.
- Battle Attack / Block / Dodge / Heal feedback is transported as stable server-owned presentation events, then replayed once per browser through the donor VFX/SFX layer.
- Automatic Draw -> Deploy remains server-authoritative, while the client visually holds the phase tracker on Draw until committed Draw + Mana Regen presentation finishes.
- Legal Racial/Class action buttons receive an explicit available visual state.
- Browser gameplay state is never restored from a local rollback snapshot; committed state changes remain server-owned.
- Intent batches are restricted to approved two-step atomic UI pairs and ownership is revalidated after the first step.
- Donor delegated and direct choice handlers are gated while PvP external UI owns gameplay input.

Mana Payment remains the already-proven v3.80.8/v3.80.9 final-UID handshake and is regression-tested, not redesigned.

## Current handshake

```text
v6.91.6 desktop / tablet / mobile UI
                |
                | normal committed gameplay intent
                v
        thin PvP client adapter
                |
                | one gameplay intent + base revision
                v
  exact v6.91.6 gameplay engine in headless Node
                |
                | one atomic intent-result
                | + viewer-safe localized snapshot
                v
        thin PvP client adapter
                |
                v
       v6.91.6 presentation runtime
```

The active remote human is always executed as v6.91.6's local `PLAYER` in actor-local seat orientation. This prevents the multiplayer server from invoking v6 Local AI for Player 2.

The donor's internal side names (`PLAYER` / `AI`) remain an engine implementation detail. In PvP mode the presentation translates the remote side to **Opponent**; it does not expose Local-AI identity copy as player-facing PvP UI.

See `ARCHITECTURE_V380.md` for the full contract.

## Mana payment boundary

v3.80.12 uses VS AI v6.91.6 as the active donor. The gameplay bundle carries one explicit PvP-only DOM guard so delegated donor clicks cannot mutate gameplay locally while the external PvP UI owns input; gameplay rules remain donor-driven.

The browser interaction is now:

```text
authoritative payment pending arrives
        |
        v
center payment clones use canonical Shard UIDs
        |
        | click any normal Mana or Class Shard
        | (ephemeral UI draft only; donor state does not move)
        v
final selected_shard_uids draft
        |
        | PAY: one network intent
        v
server validates every UID against the actor's authoritative Shard Pool
        |
        | inject validated final selection
        v
v6.91.6 donor commit once
        |
        v
Response / resolution authoritative snapshot
```

Normal Mana and Class Shards are both selectable exactly as in VS AI v6.91.6. The donor remains responsible for exact Mana value, matching Class value, and legal payment calculation. The PvP server does not invent a second payment formula; it only verifies final identity/ownership and submits the validated draft to the donor commit routine.

The real battlefield Shard Pool is **hover/presentation only** during payment. Only the centered cloned Shards can be selected. The old battlefield payment click path and separate battlefield PAY button are removed.

For Response payments that also require a Hand discard, the browser keeps both the Shard choice and required discard choice only in the same ephemeral UI draft and sends the final Shard UIDs plus final discard-choice indices on PAY.

## Gameplay transport boundary

v3.80.x uses one atomic `intent-result` for each committed network action. Exactly one network gameplay action may be in flight. A second committed action while one is still in flight is rejected locally rather than silently queued. If the result times out, the client releases the gate and requests a fresh authoritative snapshot.

Mana **selection clicks are intentionally not network actions** in v3.80.12; they only change the centered UI draft. They do not call the donor bridge. PAY is the single committed network action for that payment.

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

Coin Flip follows the VS AI v6.91.6 lifecycle: the battlefield keeps `gl-lobby-hidden` through Coin Flip choice/result, the donor Coin Flip overlay owns the visible screen, and the PvP integration does not override its backdrop. The Coin Flip gate also keeps the battlefield `inert` and blocks pointer/focus interaction.

The opening board is imported **without rendering** and then presented exactly once per client by the v6.91.6 opening presenter. A stable server-owned opening presentation ID makes presentation idempotent. Clients may start a few seconds apart, but the same opening cannot replay on one device.

## Seat orientation and mirroring

Seat mirroring remains part of the PvP authority boundary. It is required so either physical player can be presented to the donor runtime as local `PLAYER` while the server retains one canonical two-seat board. v3.80.12 does not redesign this mechanism while Mana Payment is the blocking gameplay issue.

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

v3.80.12 is being packaged because this update was explicitly requested after the real-browser payment and Meditation rollback report.
