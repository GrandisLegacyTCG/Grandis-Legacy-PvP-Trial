# Grandis Legacy PvP v3.78.2 — Coin Flip Battlefield Gate Stabilization

## Scope

v3.78.2 preserves the v3.78.1 Lobby parity and authoritative opening fixes, and fixes the next user-reported presentation regression: the v6 battlefield could disappear/re-hide during the Coin Flip → Start Game transition after later authoritative snapshots.

## Bug — battlefield not rendered correctly around Coin Flip / Start Game

Observed symptom:
- after Coin Flip / Start Game, the page could show only the page background and a stray flying card while the normal v6 battlefield was absent;
- the symptom matched the gameplay root being hidden while body-level animation layers remained visible.

Verified root cause:
- `syncPvpPreGame()` re-applied `gl-lobby-hidden` on every relevant PvP snapshot;
- when `m.status === 'started'` and opening had already begun, the function returned after closing the Coin Flip overlay without guaranteeing the hidden class was removed;
- `.app.gl-lobby-hidden { visibility:hidden!important }` therefore hid the entire mounted v6 field, while animation layers appended directly to `document.body` could remain visible.

## Fix

PvP Coin Flip no longer uses battlefield hide/unhide as the presentation gate.

New contract:
1. The Lobby closes.
2. The approved v6.91.3 battlefield remains mounted/rendered.
3. The existing Coin Flip popup is presented inside a fully opaque black fullscreen overlay.
4. During `coin-flip` and `coin-result`, the battlefield is gated with `gl-pvp-coin-gated`, `inert`, `aria-hidden`, and `pointer-events:none`.
5. Battlefield hover-preview surfaces are explicitly suppressed while gated.
6. A later authoritative snapshot cannot re-hide the gameplay root.
7. The gate is released only when Start Game receives a valid authoritative opening setup and the approved v6 opening presentation begins, or on legitimate adoption/reconnect of an already-started match.

This is an integration-layer lifecycle fix. It does not add a second gameplay UI or modify PvP v3.51 authority rules.

## Anti-leak requirement

While Coin Flip is active:
- no card/hero hover can trigger;
- no click can reach the battlefield;
- no focus can move into the battlefield;
- no hover preview is allowed to remain visible;
- the surrounding fullscreen overlay is opaque black (`#000`).

The existing opening boundary remains unchanged:

```text
Coin Flip result
→ Start Game
→ Opening Hand
→ Starting Shards
→ presentation-complete acknowledgement
→ authoritative mandatory Draw
→ authoritative Regen
→ Deploy
```

## Architecture preserved

- Lobby presentation: PvP v3.76.6 donor.
- Gameplay presentation/timing/interactions: approved VS AI v6.91.3 donor.
- Multiplayer authority/network/privacy/payment/state: PvP v3.51 donor.

