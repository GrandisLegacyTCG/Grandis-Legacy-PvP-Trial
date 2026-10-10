# PvP v3.80.0 Architecture

## 1. Purpose

v3.80.0 hardens the v6.91.3-native PvP integration introduced in v3.79. The architecture continues to use the current VS AI runtime rather than forcing the old PvP browser engine into a newer presentation family.

### Bases

| Responsibility | Source |
|---|---|
| Gameplay presentation, timing, animation, sound, desktop/tablet/mobile interaction | VS AI v6.91.3 |
| Pre-match Lobby presentation | PvP v3.76.6 |
| Multiplayer design reference | VS AI Tutorial v6.48 ↔ PvP v3.51 handshake concepts |
| Server gameplay implementation | exact VS AI v6.91.3 shared gameplay runtime, headless |

PvP v3.51 contributes **ideas only** in this release. No v3.51 runtime/authority directory is shipped.

## 2. What was learned from the old handshake

The v6.48 Tutorial and PvP v3.51 repositories used byte-identical contract/adapter components for the core runtime handshake. v3.80.0 preserves the architectural lessons, not the old implementation:

- clients send **intent**, not a client-authored final board;
- the server is the mutation authority;
- clients receive viewer-safe authoritative state;
- seat orientation is an adapter concern, not a gameplay-rule rewrite;
- presentation renders the authoritative result;
- private information is masked before it crosses the viewer boundary.

The exact evidence hashes are recorded in `release/V380_DONOR_PARITY.json`.

## 3. Current handshake

```text
          VS AI v6.91.3 presentation
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
      server/v6913-authority.mjs
        - exact v6.91.3 scripts
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
      v6.91.3 external presentation
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

`intentBatch` exists because some v6 mobile/tablet interactions legitimately issue dependent operations in one UI action, for example select + confirm. The batch is executed server-side against one authoritative actor-local runtime rather than mutating the client locally.

## 6. Viewer safety

Before a snapshot reaches a viewer:

- opponent hand identities are masked;
- draw-pile orders are masked;
- private pending/response data belonging to the other side is masked;
- spectators do not receive either player's hand identity;
- seat 2 receives the same board localized so its own side is `PLAYER` for the v6 presentation.

The server owns this boundary. Presentation code does not decide what secret data should be hidden.

## 7. Coin Flip and opening

The battlefield is mounted from the start of the match but a fully opaque black Coin Flip layer owns the screen.

While the Coin Flip gate is active:

- the field is `inert`;
- pointer input is disabled;
- hover/card preview/focus/click cannot leak through;
- opening Draw/Shard presentation does not begin.

Flow:

```text
both READY
-> server creates v6.91.3 match
-> Coin Flip choice/result
-> both clients ACK Coin Flip presentation
-> Start Game becomes authoritative
-> server commits opening hand + starting Shards
-> v6.91.3 opening presentation on both clients
-> both clients ACK opening presentation
-> server begins first turn in actor-local orientation
-> authoritative v6 mandatory Draw/Regen
-> v6.91.3 presentation renders the result
```

## 8. Presentation ownership

Authoritative snapshots are imported with `skipImportAnimations:true`.

That is intentional. The external `shared-app/app-runtime.js` owns visible animation/SFX by comparing prior and next authoritative visual state and by consuming the v6 battle-feedback surface. This avoids two presentation engines firing for the same transition.

The exact donor engine remains the gameplay/read surface; the PvP layer does not create a second battlefield renderer.

## 9. Asset boundary

Standalone v3.80.0 resolves visible media locally:

```text
cardView(id) -> card-art/<id>.webp
manaAsset(shard) -> assets/shards/<class-or-Generic>.webp
```

The external v6 presentation also uses packaged local UI backs, token faces, and audio.

Exact donor files may contain dormant website/CDN strings. Those do not define the active standalone presentation path because donor rendering is suppressed and bridge imports are silent.

Future Website integration should replace the resolver boundary, not scatter hard-coded Website URLs through gameplay code.

## 10. What v3.80.0 deliberately does not ship

- no PvP v3.51 authority/browser-runtime tree;
- no v3.78 `sync/runtime-sync-lock` compatibility architecture;
- no Local-AI authority adapter in the PvP page;
- no PvP-specific desktop/tablet/mobile gameplay renderer;
- no client-authored final board mutation.
