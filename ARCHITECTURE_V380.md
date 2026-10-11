# PvP v3.80.7 Architecture

## 1. Purpose

v3.80.7 restores gameplay parity around the v6.91.4-native PvP integration and removes the experimental PvP-only Mana-payment policy fork. The architecture uses the current VS AI runtime as the gameplay/presentation donor; PvP transport/privacy code must not redesign public battlefield behavior.

### Bases

| Responsibility | Source |
|---|---|
| Gameplay presentation, timing, animation, sound, desktop/tablet/mobile interaction | VS AI v6.91.4 |
| Pre-match Lobby presentation | PvP v3.76.6 |
| Multiplayer design reference | VS AI Tutorial v6.48 ↔ PvP v3.51 handshake concepts |
| Server gameplay implementation | Exact VS AI v6.91.4 shared gameplay runtime, headless; final payment UID reconciliation lives outside the donor engine |
| PvP Mana-payment policy | VS AI v6.91.4 exact Shard selection locally; one final selected-Shard-UID commit on PAY |

No v3.51 runtime/authority directory is shipped. The older repository remains an architectural/networking reference only. The active Mana behavior comes from the current VS AI v6.91.4 donor.

## 2. What was learned from the old handshake

The v6.48 Tutorial and PvP v3.51 repositories used byte-identical contract/adapter components for the core runtime handshake. v3.80.7 preserves the architectural lessons, not the old implementation:

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
        public/pvp/intent-channel.js
        - exactly one action in flight
        - timeout + resync recovery
                   |
                   v
        public/pvp/pvp-host.js
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
        - final selected-Shard-UID validation seam
        - exact donor engine stays unmodified
        - headless Node VM
        - actor-local orientation
                   |
                   v
      atomic intent-result +
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

During `opening`, the battlefield may already be visible for a client whose animation finished first, but PvP keeps the app inert until the server reaches `started`. This prevents apparently-live controls from sending actions while the other device is still acknowledging the same opening session.

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

The server rejects stale revisions. Accepted actions create a new authoritative revision. `clientActionId` is kept in a bounded dedupe ledger. The originating browser receives one `intent-result` that contains the action ID, accepted/rejected status, resulting revision, and that viewer's authoritative snapshot. The client releases its action gate from that one result; it does not correlate a separate ACK against a later broadcast snapshot. Opponent/spectator state still arrives through the normal room broadcast.

`intentBatch` exists because some v6 mobile/tablet interactions legitimately issue dependent operations in one UI action, for example select + confirm. Committed gameplay transitions are executed server-side against one authoritative actor-local runtime. There is no client-side gameplay queue: if another action is already in flight, a second click is rejected rather than stored for later replay. If an `intent-result` times out, the gate is released and the client requests a fresh snapshot. **Mana selection is the exception to the network-action rule: it is a browser-local draft inside the mounted donor runtime. Only PAY crosses the network with the final UID set.**

## 5A. PvP Mana payment contract

v3.80.7 uses the exact VS AI v6.91.4 Shard-selection model and keeps the active donor engine byte-identical to the donor repository:

```text
authoritative payment pending
        |
        v
donor recommended exact selection
        |
        +-- click any normal Mana Shard -> local donor toggle only
        |
        +-- click any Class Shard       -> local donor toggle only
        |
        v
local selected_shard_uids
        |
        | PAY sends final UID list once
        v
server final-payment seam
        |
        +-- pending type / acting seat validation
        +-- duplicate rejection
        +-- every UID must still exist in authoritative actor Shard Pool
        +-- Response discard indices validated when applicable
        |
        v
inject validated final draft into server donor runtime
        |
        v
untouched donor commitManaShardPaymentChoice / commitResponsePaymentChoice
```

The donor itself determines exact payment legality. A Mana Shard is worth 1. A matching Class Shard is worth 2 when paying a matching Skill; otherwise a Class Shard is worth 1 according to the donor/rules. The server does not replay a sequence of browser toggles and does not maintain a PvP-specific FIFO payment formula.

This boundary preserves canonical identity end-to-end: the visible Shard UID is the local selected UID, the UID transmitted by PAY, and the UID validated against the authoritative Shard Pool. A local click cannot spend anything by itself; the authoritative state changes only when PAY is accepted.

For Response payments, required additional Hand-card choices are kept in the same local donor draft while Mana is being selected, then submitted alongside the final Shard UID list on PAY.

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

The exact v6.91.4 donor remains the gameplay/read surface. PvP adds only an integration boundary around final payment commit; it does not fork the donor payment rules or create a second battlefield renderer.

## 9. Asset boundary

Standalone v3.80.7 resolves visible media locally:

```text
cardView(id) -> card-art/<id>.webp
manaAsset(shard) -> assets/shards/<class-or-Generic>.webp
```

The external v6 presentation also uses packaged local UI backs, token faces, and audio.

Donor files may contain dormant website/CDN strings. Those do not define the active standalone presentation path because donor rendering is suppressed and bridge imports are silent.

Asset loading is intentionally bounded: the selected own-deck artwork is preloaded as an unordered set, visible opening assets are decoded before opening presentation, and dynamic images are guarded while decoding. Full-game art warm-up is removed, and no future top-deck ordering is exposed to the browser.

Future Website integration should replace the resolver boundary, not scatter hard-coded Website URLs through gameplay code.

## 10. What v3.80.7 deliberately does not ship

- no PvP v3.51 authority/browser-runtime tree;
- no v3.78 `sync/runtime-sync-lock` compatibility architecture;
- no Local-AI authority adapter in the PvP page;
- no PvP-specific desktop/tablet/mobile gameplay renderer;
- no client-authored final board mutation.
