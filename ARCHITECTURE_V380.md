# PvP v3.80.4 Architecture

## 1. Purpose

v3.80.4 restores gameplay parity around the v6.91.4-native PvP integration. The architecture uses the current VS AI runtime as the gameplay/presentation donor; PvP transport/privacy code must not redesign public battlefield behavior.

### Bases

| Responsibility | Source |
|---|---|
| Gameplay presentation, timing, animation, sound, desktop/tablet/mobile interaction | VS AI v6.91.4 |
| Pre-match Lobby presentation | PvP v3.76.6 |
| Multiplayer design reference | VS AI Tutorial v6.48 ↔ PvP v3.51 handshake concepts |
| Server gameplay implementation | VS AI v6.91.4 shared gameplay runtime, headless, with one intentional PvP payment seam |
| PvP Mana-payment policy | v3.51-style Class-only manual choice + FIFO automatic normal Mana |

No v3.51 runtime/authority directory is shipped. The older repository is used as a behavior reference for the payment decision model only; that policy is reimplemented in the current v6.91.4-based source.

## 2. What was learned from the old handshake

The v6.48 Tutorial and PvP v3.51 repositories used byte-identical contract/adapter components for the core runtime handshake. v3.80.4 preserves the architectural lessons, not the old implementation:

- clients send **intent**, not a client-authored final board;
- the server is the mutation authority;
- clients receive viewer-safe authoritative state;
- seat orientation is an adapter concern, not a gameplay-rule rewrite;
- presentation renders the authoritative result;
- private information is masked before it crosses the viewer boundary.

The exact evidence hashes are recorded in `release/V380_DONOR_PARITY.json`.

## 3. Current handshake

```text
          VS AI v6.91.4 presentation
       desktop | tablet | mobile
                   |
              E().intent(...)
              E().intentBatch(...)
                   |
                   v
        public/pvp/pvp-host.js
        - serial intent queue
        - baseRevision
        - clientActionId
        - local asset resolver
                   |
                WebSocket
                   |
                   v
              server.js
        - room / reconnect
        - revision / dedupe
        - coin/opening ACK gates
                   |
                   v
      server/v6914-authority.mjs
        - v6.91.4 gameplay scripts
        - intentional PvP Class-only/FIFO Mana-payment seam
        - headless Node VM
        - actor-local orientation
                   |
                   v
         viewer-safe snapshot
                   |
                WebSocket
                   |
                   v
        silent bridge state import
                   |
                   v
      v6.91.4 external presentation
```

## 4. Actor-local seat orientation

The v6 runtime historically names its human side `PLAYER` and its other side `AI`. Multiplayer must not interpret the second remote human as Local AI.

The server therefore keeps one canonical two-side state but, before applying a remote player's intent, imports that canonical state in the acting seat's orientation. In that orientation, the acting remote human is `PLAYER`. After the v6 runtime accepts the intent, the server exports canonical state from the same seat orientation.

Conceptually:

```text
canonical board
   |
   +-- seat 1 acts -> import as seat 1 -> actor is PLAYER -> apply v6 intent -> export canonical
   |
   +-- seat 2 acts -> import as seat 2 -> actor is PLAYER -> apply v6 intent -> export canonical
```

The first-turn call follows the same rule: `beginFirstTurn('PLAYER')` is executed after orienting the board to the actual first seat. Calling `beginFirstTurn('AI')` would hand control to v6 Local AI and is forbidden in the multiplayer authority.

## 5. Revision and intent contract

Every gameplay write carries the snapshot revision on which it was based.

```text
runtime-intent
  baseRevision
  clientActionId
  intent
  args

runtime-intent-batch
  baseRevision
  clientActionId
  steps[]
```

The server rejects stale revisions. Accepted actions create a new authoritative revision. `clientActionId` is kept in a bounded dedupe ledger. The server also sends an explicit `intent-ack` containing the accepted action ID and revision; the client releases its serialized queue only after the matching authoritative snapshot arrives. An unrelated opponent revision therefore cannot be mistaken for acknowledgement of a local action.

`intentBatch` exists because some v6 mobile/tablet interactions legitimately issue dependent operations in one UI action, for example select + confirm. Committed gameplay transitions are executed server-side against one authoritative actor-local runtime. **Mana payment is deliberately not implemented as a local draft or reconciliation batch.**

## 5A. PvP Mana payment contract

PvP uses a deterministic v3.51-style decision model on the v6.91.4 board:

```text
authoritative payment pending
        |
        +-- normal Mana Shards -> automatic FIFO fill
        |
        +-- Class Shards -> only manual choice for Skill payment
                               |
                               | toggle Class UID (authoritative intent)
                               v
                    server recomputes FIFO Mana fill
                               |
                               | PAY
                               v
                 one authoritative payment commit
```

Normal Mana Shards remain visible in the current v6.91.4 payment UI but are inert. For Skill payment, a matching Class Shard contributes 2 Mana and a nonmatching Class Shard contributes 1; every time a Class choice changes, the engine recomputes the remaining normal Mana from the Shard Pool in FIFO order. Canceling the Class choice restores that same FIFO fill. For Item/Event/non-Skill payment, normal Mana is automatic first and Class Shards are automatic fallback at value 1. Response payment follows the same policy.

Because the server already owns the Class-choice state before PAY, PAY does not reconstruct browser clicks. It commits the canonical pending payment once. This removes the second local payment state that previously caused payment animation to play and then snap back to the unresolved popup.

## 6. Viewer safety

Before a snapshot reaches a viewer:

- opponent hand identities are masked;
- draw-pile orders are masked;
- private pending/response data belonging to the other side is masked;
- spectators do not receive either player's hand identity;
- **Shard Pools remain visible public battlefield state**, matching VS AI v6.91.4; only the temporary opponent-Shard choice is presented face-down;
- opponent-Shard choice candidates retain the donor UID needed to map the face-down option back to the visible pool card;
- seat 2 receives the same board localized so its own side is `PLAYER` for the v6 presentation.

The server owns this boundary. Presentation code does not decide what secret data should be hidden.

## 7. Coin Flip and opening

Coin Flip follows the donor lifecycle rather than a PvP-specific screen treatment. The battlefield remains `gl-lobby-hidden` through Coin Flip choice/result and the donor Coin Flip overlay owns the visible screen. PvP CSS does not override the donor backdrop or force `.app` visible.

While the Coin Flip gate is active:

- the field is `inert`;
- pointer input is disabled;
- hover/card preview/focus/click cannot leak through;
- gameplay board snapshots are not rendered;
- opening Draw/Shard presentation and card-motion SFX do not begin.

Flow:

```text
both READY
-> server creates v6.91.4 match
-> Coin Flip choice/result
-> both clients ACK Coin Flip presentation
-> Start Game becomes authoritative
-> server commits opening hand + starting Shards
-> server assigns one stable openingPresentationId
-> clients import opening board silently (no render)
-> each client may start when its assets are ready
-> the same openingPresentationId can animate/sound at most once per client
-> both clients ACK opening presentation
-> server begins first turn in actor-local orientation
-> authoritative v6 mandatory Draw/replacement/Mana Regen
-> server automatically advances resolved Draw -> Deploy
-> v6.91.4 presentation renders the authoritative result
```

## 8. Presentation ownership

Authoritative snapshots are imported with `skipImportAnimations:true`. Opening adds an extra boundary: the committed opening board is imported with `render:false`, and only the explicit v6.91.4 opening presenter is allowed to render/animate it.

That is intentional. The external `shared-app/app-runtime.js` owns visible animation/SFX by comparing prior and next authoritative visual state and by consuming the v6 battle-feedback surface. This avoids two presentation engines firing for the same transition.

The v6.91.4 donor remains the gameplay/read surface except for the explicitly documented PvP Mana-payment policy seam; the PvP layer does not create a second battlefield renderer.

## 9. Asset boundary

Standalone v3.80.4 resolves visible media locally:

```text
cardView(id) -> card-art/<id>.webp
manaAsset(shard) -> assets/shards/<class-or-Generic>.webp
```

The external v6 presentation also uses packaged local UI backs, token faces, and audio.

Donor files may contain dormant website/CDN strings. Those do not define the active standalone presentation path because donor rendering is suppressed and bridge imports are silent.

Future Website integration should replace the resolver boundary, not scatter hard-coded Website URLs through gameplay code.

## 10. What v3.80.4 deliberately does not ship

- no PvP v3.51 authority/browser-runtime tree;
- no v3.78 `sync/runtime-sync-lock` compatibility architecture;
- no Local-AI authority adapter in the PvP page;
- no PvP-specific desktop/tablet/mobile gameplay renderer;
- no client-authored final board mutation.
