# Grandis Legacy PvP v3.78.3 — Release Notes

Date: 2026-10-10

## Scope

v3.78.3 stabilizes the boundary between the approved VS AI v6.91.3 presentation client and PvP v3.51 server authority. It preserves the v3.76.6 Lobby and the v3.78.2 opaque Coin Flip / anti-hover gate.

## Fixes

### 1. Mana payment no longer deadlocks at PAY

The visible v6 client already emits `commitManaShardPaymentChoice`, but the PvP intent router did not classify that intent. The authoritative commit could therefore be rejected after the payment animation had put the center-choice UI into a busy state.

v3.78.3 registers the missing PAYMENT intent and adds presentation-only failure recovery so a rejected/disconnected action cannot leave the center modal permanently busy.

### 2. v6 same-tick UI actions are serialized instead of dropped

The v6 client is allowed to make locally synchronous UI decisions such as `select...` followed immediately by `confirm...`. Remote PvP authority is asynchronous. v3.78.2 rejected a second call while the first intent was in flight, which could expose desynchronization in mobile-native interaction paths.

v3.78.3 keeps server-only mutation authority but adds a bounded queue (24). Follow-up intents wait until the authoritative board revision advances, then are sent against the newest revision.

### 3. Authoritative card/battle presentation is bridged back into the visible v6 owner

The v3.51 server still emitted authoritative presentation events, but the clean integration consumed essentially only the opening sequence while snapshot import animations were suppressed. v3.78.3 restores the mature boundary concept without reviving visible v3.51 UI:

`capture before import → import authoritative snapshot → render v6 → replay presentation after render`

Relevant card movement and battle feedback are replayed through the visible v6 integration layer. Draw/Shard/Rank/Legacy state-diff presentation already owned by the approved v6 client remains on that existing path to avoid duplicate animation.

## Asset correctness

Asset validation starts from `public/index.html` and checks the production-loaded graph and runtime URL conventions. Active refs have zero broken HTML/CSS/script/media/dynamic paths in the release audit. Locked v6 asset trees retain their donor fingerprints. Dormant strings belonging to the suppressed standalone v6 renderer are documented separately instead of being satisfied by duplicate asset copies.

## Architecture unchanged

- Lobby: PvP v3.76.6
- Visible gameplay: VS AI v6.91.3
- Multiplayer authority: PvP v3.51
- Local AI authority: disabled/replaced by remote authoritative player state
- No visible v3.51 gameplay UI

## QA status

Automated source/runtime regressions cover architecture, assets, Lobby donor parity, Coin Flip input gating, opening boundary, gameplay authority, Mana intent registration, same-tick intent serialization contract, and authoritative presentation ordering.

Real two-client desktop/tablet/mobile WebSocket acceptance remains **UNVERIFIED** in this sandbox and must not be reported as PASS until executed in a live environment.
