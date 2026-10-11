# Grandis Legacy PvP v3.80.3 Release Notes

## Scope

v3.80.3 stays on the v3.80 line and keeps VS AI v6.91.4 as the gameplay/presentation donor. This rebuild replaces the earlier provisional v3.80.3 package. PvP remains responsible for room/seat transport, server authority, reconnect, lifecycle, and private-information projection; normal donor gameplay behavior is preserved instead of being re-designed for networking.

Custom Deck Main Deck validation intentionally remains **50-60 cards**.

## Gameplay / presentation fixes included

- Opponent Shard Pool remains visible during normal play, matching VS AI v6.91.4. Only temporary opponent-Shard selection is presented face-down.
- Opponent-Shard choice preserves the donor candidate mapping and can complete without synthetic-id deadlocks.
- Mana payment interaction is reconstructed around the donor UX:
  - Shard select/deselect is a **local draft** in the browser.
  - Clicking **PAY** sends one authoritative reconciliation batch containing the selection delta plus the commit.
  - The server validates the entire batch atomically; a failed commit cannot leave half-applied authoritative selections.
  - The same boundary is used for Response Mana payment.
- Opening Hand/Starting Shard presentation has one owner only; the opening board is imported silently before the explicit donor opening animation, preventing duplicate opening motion/SFX.
- Resolved Draw Phase automatically advances to Deploy after mandatory Draw, replacement/choice resolution, and Mana Regen.
- Coin Flip preserves the donor hidden-battlefield lifecycle and no longer leaks opening Card/Draw SFX underneath it.
- Both seats see the same Heads/Tails choice presentation. Only the authoritative chooser can click; the non-chooser does not receive a separate waiting-card screen.

## Loading / deck-selection polish

- Selected-deck artwork is preloaded/decoded before use, and card art is warmed in the background.
- Opening presentation waits for currently visible board art to decode before revealing/animating it.
- Dynamic card/shard/back images suppress text-only alt fallback while decoding and use a neutral pending visual.
- Deck preview cards use a card-back fallback while artwork is not ready.
- `YOUR DECK` summary is grouped by the two physical decks:
  - Heroes + Legacies -> Legacy Deck total
  - Skills + Items + Events -> Main Deck total
  Counts continue to come from the actual selected/imported deck data.

## Preserved v3.80 fixes

- Tab-scoped reconnect identity / stable READY flow.
- Seat-token reconnect validation and kick/reconnect hardening.
- Surrender -> lobby -> new-match lifecycle.
- Seat 2 Shard ownership/orientation correctness.
- Hidden-zone/privacy projection hardening without hiding public battlefield Shards.
- Guarded room reset, stale-action dedupe, and build-mismatch recovery.
- Legacy Local-AI identity boxes remain removed from the PvP battlefield.

## Verification

The final package is checked with syntax, native v6.91.4 authority regressions, two-seat Shard selection/payment regressions, payment single-network-commit regression, static handshake checks, asset checks, lobby parity checks, manifests, donor parity, deployment static readiness, and clean-ZIP verification.

A true live two-browser WebSocket/browser-animation run still requires production dependencies (`ws`) in the execution environment; that dependency is declared and locked, but is not installed in the packaging sandbox.
