# Grandis Legacy PvP v3.80.2 Release Notes

## Scope

v3.80.2 is a gameplay-parity patch on the v3.80 line. The VS AI v6.91.4 gameplay/presentation contract remains the donor; PvP is restricted to room, remote-player transport, server authority, reconnect, lifecycle, and genuinely private network projection. Custom Deck Main Deck validation remains 50-60 cards by explicit product requirement.

Locked bases:

- Gameplay/presentation donor: VS AI v6.91.4
- Lobby presentation donor: PvP v3.76.6
- Server authority: exact VS AI v6.91.4 shared gameplay engine executed headlessly
- PvP v3.51: architecture reference only; no v3.51 runtime is shipped

## Root causes fixed

1. The viewer-safe projection treated the opponent Shard Pool as private and replaced public battlefield Shard identities with synthetic ids. VS AI v6.91.4 keeps the normal Shard Pool visible; only the temporary opponent-Shard choice is face-down. Synthetic ids also broke the donor choice renderer because candidate ids no longer matched the visible pool cards.
2. Opening state was imported and rendered before the explicit v6 opening sequence. That let the normal diff presenter react once and then `playOpening()` react again, producing duplicate opening motion and card-motion audio under the Coin Flip screen.
3. Shared-board PvP intentionally disables the browser-local Draw auto-advance helper. Without an equivalent server-authority transition, a resolved Draw remained in Draw until NEXT PHASE was clicked.
4. PvP integration CSS/runtime forced the battlefield visible and changed Coin Flip presentation instead of preserving the donor hidden-battlefield lifecycle.

## v3.80.2 fixes

- Opponent Shard Pool is public/visible during normal play, matching VS AI v6.91.4.
- Opponent-Shard effects keep the donor shuffled candidate ids so the face-down choice maps back to the real visible pool card and can commit successfully.
- Added real two-seat Steal regressions: select face-down opponent Shard -> commit -> opponent pool decreases -> acting player gains from own Shard Deck.
- Added real two-seat Mana payment regressions: paid card -> source -> payment -> toggle Shard -> PAY -> remote Response pass -> resolution.
- Opening board import is silent; the explicit donor opening presentation is the single owner of opening Hand/Shard animation and SFX.
- Coin Flip keeps the battlefield hidden and no longer receives PvP backdrop/visibility overrides.
- Resolved mandatory Draw automatically advances to Deploy at server authority, including Seat 2 orientation; pending Draw replacement/choice still blocks until resolved.
- Existing v3.80 reconnect, privacy, surrender/rematch, build-mismatch, and room-reset hardening remains intact.

## Explicitly unchanged

- Custom Deck Main Deck validation: **50-60 cards**.
- Exact v6.91.4 gameplay authority source files.
- PvP v3.76.6 lobby presentation base.
- Tab-scoped reconnect identity introduced in v3.80.1.

## Verification boundary

Headless authority, two-seat gameplay regressions, syntax, static handshake, assets, manifests, donor hashes, and clean ZIP checks are run before packaging. A true two-browser WebSocket/browser-animation test still requires the production `ws` dependency and browser runtime in the execution environment.
