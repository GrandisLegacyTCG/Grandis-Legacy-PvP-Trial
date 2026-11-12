# RC39 Revised - PvP Gameplay Donor Adapter Contract

**Scope:** `runtime/adapters/pvp-adapter.js` in the VS AI RC39 donor package.
This is a reusable **adapter module** for future integration. It does **not**
replace PvP's own host/network/server, modify current deployed PvP, or run in
VS AI. The host must explicitly load, register and activate it.

## Authority boundary

1. **Local only:** hover/preview, select/deselect candidates, organize a draft,
   choose Mana Shards, respond to on-screen prompts, and display resulting UI.
   These actions must not trigger a server round trip or mutate game state.
2. **Final commit:** one semantic server intent (or one atomic batch if the
   current PvP transport supports it) when the player confirms. The adapter
   attaches `clientActionId` and `baseRevision` for the host to forward.
   Batch size is restricted to two steps to match the inspected PvP Trial
   transport; do not assume arbitrary client-side multi-step transactions.
3. **Server resolves:** costs, card legality, damage, statuses, EXP, Rank Up,
   Mana transfers, choices, and turn effects. It validates seat, actor,
   decision owner, revision and handles. Server publishes the authoritative
   snapshot to each player. Client must never treat its visual preview as a
   committed match result.
4. **ACK / reconciliation:** PvP host calls `acceptServerReply({clientActionId,
   ok, revision})` on verified server response and `syncAuthoritativeRevision()`
   for confirmed snapshots. No silent retry on disconnect; resync first.

## Use from a PvP host (illustrative, not plugged into VS AI)

Load `runtime/adapters/authority-adapter.js` then `pvp-adapter.js` from the PvP
web app. Do **not** load `local-ai-adapter.js` or enable AI decisions in PvP.
Existing host code can retain its own `pvp-network.js`, WebSocket, lobby and
server authority.

```js
const adapter = GL_CREATE_PVP_AUTHORITY_ADAPTER({
  engine: pvpPresentationEngine,        // server-projected facade, not a local opponent AI
  bridge: pvpViewerSafeBridge,
  getRevision: () => pvpHost.revision,
  getViewerSnapshot: () => pvpHost.viewerSafeSnapshot,
  sendFinalIntent: packet => pvpHost.sendFinalPacket(packet)
});
GL_AUTHORITY_ADAPTER.register('pvp', adapter);
GL_AUTHORITY_ADAPTER.use('pvp');

// Example: use opaque choice handles only; no physical UID or Shard identity.
adapter.syncAuthoritativeRevision(pvpHost.revision);
adapter.beginDraft({
  id: `opponent-mana-${pvpHost.revision}`,
  baseRevision: pvpHost.revision,
  kind: 'opponent_mana_blind',
  choices: serverSuppliedOpaqueHandles,
  minSelections: 2, maxSelections: 2,
  buildCommit: ({selections}) =>
    encodeOpponentManaSelectionUsingCurrentPvPServerContract(selections)
});
// Each click: adapter.toggleChoice(opaqueHandle) -> local UI only.
// Confirm: await adapter.commitDraft() -> ONE server intent.
```

The `buildCommit` encoder MUST follow the specific PvP server's current method
name and argument contract; RC39 does not invent/change server intent names.
`sendFinalIntent` must forward `clientActionId`, `baseRevision`, and the
validated `intent/args` or atomic `steps` unchanged. Alternatively a host can
provide its existing `sendIntent(name,args)` function (then host owns its own
idempotency envelope).

## Mana visibility and privacy

- **Normal board:** opponent Mana Pool is **face-up** (Regular and Color/CLASS
  visible), matching VS AI. The face-up projection MUST originate server-side.
- **Mana Burn / Mana Steal selection:** selection overlay shows anonymous,
  shuffled, face-down candidates supplied by the server as opaque handles.
  Their handles must not encode Shard UID, Class, color or displayed pool index.
  The server maps handle -> physical Shard on final commit.
- **After resolution:** reveal the selected Shards, apply the removal/steal,
  then render authoritative state. Never guess hidden choices in the adapter.
- **Still private:** opponent Hand, unopened Main Deck / Mana Deck order,
  private decisions and secret future draws. Face-up **Mana Pool** does not
  imply all zones become public.
- `publicOpponentMana()` returns only `{kind:'GENERIC'}` /
  `{kind:'CLASS',class_name:'Mage'}` from server-projected pool, excluding UIDs;
  it fails with `FACE_UP_POOL_REQUIRED` if the PvP server still projects it
  face-down. Fix the server's viewer projection rather than fabricating it.

## Integration checklist for each future VS AI donor

1. Pin the VS AI donor build and the PvP host baseline with hashes.
2. Diff rules/effects/Rank Up/event schema, not AI strategy or browser UI.
3. Update PvP server rules/authority first; update viewer-safe projection and
   intent encoder to the new contract.
4. Preserve current PvP networking, lobby, server version gate, recovery and
   privacy. Adapt one client **final commit** per user decision wherever legal.
5. Regression: local draft sends zero packets; final commit exactly one;
   server rejection and stale revision; duplicate id; private hand and deck;
   face-up opponent pool + opaque blind Mana choice; both seats; Rank Up VFX.
6. Verify in a live two-client PvP match before marking PvP release-ready.

## Verification boundary

The donor module was tested in isolation using Node VM. The inspected public
PvP Trial repository (2026-11-09) showed an opaque blind selection protocol
and local-draft actions, **but its viewer projection still masked the normal
opponent Mana Pool**. This note is about that inspected source, not a claim
about the user's newer PvP Beta build. The latter has not been provided here.
Current deployed/active PvP is **not modified** by this RC39 ZIP.
