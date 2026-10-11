# Grandis Legacy PvP v3.80.4 Release Notes

## Scope

v3.80.4 stays on the v3.80 line and keeps VS AI v6.91.4 as the gameplay/presentation donor. This release promotes the accepted FIFO-payment rebuild that was previously packaged as v3.80.3; gameplay behavior is unchanged from that rebuild. PvP remains responsible for room/seat transport, server authority, reconnect, lifecycle, and private-information projection; normal donor gameplay behavior is preserved instead of being re-designed for networking.

Custom Deck Main Deck validation intentionally remains **50-60 cards**.

## Gameplay / presentation fixes included

- Opponent Shard Pool remains visible during normal play, matching VS AI v6.91.4. Only temporary opponent-Shard selection is presented face-down.
- Opponent-Shard choice preserves the donor candidate mapping and can complete without synthetic-id deadlocks.
- PvP Mana payment is intentionally simplified to the proven Class-choice model:
  - normal Mana Shards remain visible but are **not manually selectable**;
  - normal Mana auto-fills the remaining cost in Shard-Pool **FIFO** order;
  - for Skill payment, only Class Shards can be toggled manually; selecting/canceling a Class Shard automatically reduces/restores the FIFO normal-Mana fill;
  - Item/Event/non-Skill payment keeps Mana-first automatic payment with Class Shards only as automatic 1-Mana fallback;
  - Response Mana payment uses the same policy;
  - PAY is one authoritative commit of the already-canonical payment state: no browser-local draft, no selection-diff replay, and no fake spend animation before server acceptance.
- Opening Hand/Starting Shard presentation has one owner only; the server assigns a stable opening presentation ID, so each client may start a few seconds apart but the same opening animation/SFX can run at most once per device.
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

The final package is checked with syntax, v6.91.4-based authority regressions, two-seat Class-only/FIFO Mana-payment regressions, forged normal-Mana-toggle rejection, opponent-Shard gameplay checks, opening-ID dedupe checks, static handshake checks, asset checks, lobby parity checks, manifests, donor/seam fingerprints, deployment static readiness, and clean-ZIP verification.

A true live two-browser WebSocket/browser-animation run still requires production dependencies (`ws`) in the execution environment; that dependency is declared and locked, but is not installed in the packaging sandbox.
