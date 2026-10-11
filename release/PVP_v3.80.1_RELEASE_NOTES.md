# Grandis Legacy PvP v3.80.1 Release Notes

## Scope

v3.80.1 keeps the v3.80 line and reconstructs the PvP presentation boundary from the cleaned VS AI v6.91.4 donor. Gameplay rules are unchanged. Custom Deck Main Deck validation remains 50-60 cards by explicit product requirement.

Locked bases:

- Gameplay/presentation donor: VS AI v6.91.4
- Lobby presentation donor: PvP v3.76.6
- Server authority: exact VS AI v6.91.4 shared gameplay engine executed headlessly
- PvP v3.51: architecture reference only; no v3.51 runtime is shipped

## Root cause reconstructed

The previous v3.80.0 package did not fail because the VS AI gameplay engine could not be used for PvP. Two integration seams were wrong:

1. **The PvP root HTML had drifted backward to the retired authored/demo battlefield shell.** It still contained hard-coded Hands, Heroes, attachments, counts, Turn 16 text, card history, Active Card, and sample logs. VS AI v6.91.4 intentionally removed that shell and now starts from neutral runtime-owned markup.
2. **Connection identity was stored in origin-wide localStorage.** Two PvP tabs on the same origin therefore reused one client id and one seat token. Each connection replaced the other, and each closed client automatically reconnected, creating a replacement/reconnect loop that prevented a stable lobby READY state.

## v3.80.1 fixes

1. **Rebased PvP shell on VS AI v6.91.4 cleanup**
   - `public/index.html` is reconstructed from the v6.91.4 neutral shell.
   - Retired hard-coded Hero/Hand/attachment/history/Turn-16/demo state is gone.
   - Retired demo-only `public/assets/cards/` duplicates and `public/engine/index-original.html` are removed, matching v6.91.4 donor cleanup.
   - PvP-specific identity badges remain removed.
   - Donor-facing `VS AI` / `AI Turn` / `AI Mana` presentation copy is translated to neutral PvP/opponent copy in PvP mode.

2. **Lobby/battlefield ownership boundary**
   - The donor battlefield starts hidden during PvP setup.
   - The PvP host reveals it only for Coin Flip/opening/started/finished match states.
   - Lobby setup no longer exposes a stale authored battlefield behind it.

3. **Tab-safe connection identity**
   - Client id and seat token move from shared `localStorage` to tab-scoped `sessionStorage`.
   - Name/deck/custom-deck preferences remain local preferences and are not used as seat authority.
   - Reloading one tab keeps its reconnect identity; another tab can hold a different PvP session.

4. **Reconnect-loop hardening**
   - Stale WebSocket callbacks cannot mark a newer socket disconnected or schedule a second reconnect chain.
   - Reconnect timers are serialized instead of stacking.
   - When the same valid seat session is replaced by another tab, the replaced tab receives close code 4006, forks to a new client identity, and reconnects instead of fighting for the same seat forever.
   - Seat-token mismatch receives dedicated close code 4004; the affected tab immediately forks to a fresh tab identity instead of retrying the protected seat token.

5. **Donor authority label/update**
   - Server authority module is renamed to `server/v6914-authority.mjs` and release metadata now records VS AI v6.91.4 as the locked donor.
   - The actual four gameplay authority sources remain byte-identical to v6.91.4.

## Explicitly unchanged

- Custom Deck Main Deck validation: **50-60 cards**.
- Server-authoritative intent/revision/dedupe model.
- Seat-2 actor-local orientation and viewer-safe privacy projection introduced in v3.80.0.
- PvP v3.76.6 lobby presentation base.

## Verification boundary

Static/source/authority/privacy/assets/manifest checks are included. Real process startup still requires the production `ws` dependency to be installed in the execution environment.
