# Grandis Legacy PvP v3.80.0 Release Notes

## Scope

v3.80.0 is a hardening release on top of the v6.91.3-native PvP handshake introduced in v3.79. The version is bumped because this pass contains more than three independent fixes.

Locked bases remain unchanged:

- Gameplay/presentation donor: VS AI v6.91.3
- Lobby presentation donor: PvP v3.76.6
- Server authority: exact VS AI v6.91.3 gameplay engine executed headlessly
- PvP v3.51: architecture reference only; no v3.51 runtime is shipped

The exact locked v6.91.3 donor gameplay sources are not patched by this release. Fixes live in the server handshake, viewer-safe projection, PvP host, and external presentation layer.

## v3.80.0 fixes

1. **Draw / Next Phase lifecycle**
   - The interactive Draw Phase no longer leaves `NEXT PHASE` permanently disabled after the authoritative mandatory Draw and Mana Regen are complete.
   - Seat 1 and Seat 2 both localize the active remote human as v6 `PLAYER`, with Draw completion state preserved.

2. **Surrender -> lobby -> new match lifecycle**
   - Surrender finishes the authoritative match once.
   - `BACK TO LOBBY` now resets the server match state instead of reloading the same finished match.
   - Player deck selections are retained while READY state and match runtime state are reset for the next match.

3. **Prototype identity UI cleanup**
   - Removed the old battlefield `LOCAL AI / AI Deck` and `PLAYER / Player Deck` identity boxes and runtime fallbacks from the active PvP presentation.

4. **Seat 2 ownership mirror**
   - Seat mirroring now includes Shard Deck, Shard Pool, Shard class inventory, Shard counts, and manual Reposition per-side state.
   - Seat 2 can no longer draw/pay from Seat 1's Shard state.

5. **Viewer-safe hidden-information boundary**
   - Opponent pending choices use an allow-list projection rather than a field blacklist.
   - Opponent Hands, Main Decks, Legacy Deck identities, Legacy package metadata, Shard Decks, Shard Pools, and Shard class inventories are masked at the network boundary.
   - Spectator views mask both players' private zones.

6. **Draw / choice privacy**
   - Opponent `presentationEvents`, `lastActualDrawEvent`, and `lastDrawnCardBySide` no longer disclose Draw identities.
   - Draw Review / Quick Reload / Rapid Chamber pending payloads and durable Battle Log entries no longer reveal the reviewed card.
   - Hidden deck searches, Crystal Ball inspection/order, failed Hand-to-EXP choices, and resolver rollbacks are neutralized in opponent-visible logs.
   - The full Battle Log is preserved in donor newest-first order; sanitization does not truncate public history.

7. **Blind opponent choice privacy**
   - Opponent Shard selection uses synthetic, non-correlatable choice tokens.
   - Blind opponent Hand choice no longer exposes the canonical Hand index mapping.
   - Opening Shard events mask opponent UID, class identity, and art before presentation.

8. **Setup / reconnect hardening**
   - Existing player seats require the correct seat token on reconnect.
   - Player 2 kick no longer immediately reclaims the same seat through the normal client reconnect path.
   - Live-match `reset-room` is rejected; room reset is setup-only.
   - Idempotent action dedupe is checked before stale-revision rejection.

9. **Custom Deck refresh/reconnect**
   - Imported Custom Deck JSON/name is persisted locally and can also be restored from the player's setup snapshot.
   - A retained server Custom Deck is no longer silently overwritten by a stale/default starter after refresh.

10. **Build/cache recovery**
    - HTML/JS/MJS runtime code is served with `no-store`.
    - Client/server build mismatch uses a dedicated rejection path and one cache-busting reload instead of an endless reconnect loop.

## Explicitly unchanged

**Custom Deck Main Deck validation remains 50-60 cards.** This is an explicit PvP product requirement for this release and was intentionally not tightened to 60 cards.

## Verification boundary

Automated authority, privacy, static handshake, asset, lobby, manifest, and deployment-readiness checks are included in the repository. A real two-client browser/WebSocket deployment acceptance still needs to be run in an environment where production dependencies can be installed successfully.
