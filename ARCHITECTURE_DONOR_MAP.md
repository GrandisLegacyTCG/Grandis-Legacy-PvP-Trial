# Grandis Legacy PvP v3.76.1 — Active Donor Map

This build intentionally uses **two active sources only**.

## 1. PvP v3.51 — authoritative multiplayer/gameplay foundation

PvP v3.51 owns multiplayer state and rules execution: lobby/session lifecycle, Ready/Kick, Start Match, the battlefield-backed Coin Flip/Result flow, single-in-flight intent handling, WebSocket snapshots, Mana payment, pending choices, Response, hidden-opponent-Shard choices, privacy, reconnect, spectator, surrender, and server-side validation.

The browser gameplay contract and server gameplay contract stay on the v3.51 model. The VS AI local/exact-payment engine is not PvP authority.

### Pre-game boundary

The visible pre-game ownership is deliberately split at the end of Coin Flip:

`Lobby (v3.51) -> Coin Flip/Result (v3.51, dark battlefield background) -> mount/hydrate v6.90.7 under a blackout veil -> Opening Hand/Starting Shards/first Draw+Regen (v6.90.7 presentation)`

Hero Rank I is setup state and is already on the battlefield; it is not presented as a draw from the Legacy Deck.

## 2. VS AI v6.90.7 — gameplay presentation/UX donor

VS AI v6.90.7 supplies the visible gameplay surface immediately after Coin Flip: Opening Hand/Shard animations, battlefield layout, Hand/Shard presentation, phase tracker, Card Played, Active Card, Battle Log, choice/payment surfaces, targeting visuals, card movement, VFX/SFX, and interaction styling.

It renders authoritative PvP state; it does not publish a second game state or replace v3.51 rules/network authority.

## Product adjustments locked for v3.76.1

- One visible PvP lobby; room switching UI is removed.
- Lobby fits one viewport without scrolling; header dimensions are unchanged.
- Deck Builder / VS AI navigation buttons are hidden for now.
- Player names are capped at 20 characters without explanatory UI text.
- During setup, Seat 1 may remove Seat 2 at any time. Seat 2 may remove Seat 1 only while Seat 1 is offline.
- Kick visuals remain the canonical compact PvP v3.51 control.
- Coin Flip stays v3.51 and uses the battlefield background with a darker overlay.
- At Coin Flip completion, a full dark veil hides the surface swap while v6.90.7 mounts/hydrates; Opening starts only on the v6 surface.
- Opponent identity stays top-left: player name, deck name, connection bars on the right.
- Local player identity uses the existing bottom-right slot: connection bars on the left, then player name and deck name.
- Opening presentation is Hand P1 -> P2 alternating x6, then Starting Shards P1 -> P2 alternating x3, then first-player normal Draw + Regen.
- Private Opening/Draw information never enters Card Played history.
- Phone and tablet have **no portrait UI**. Portrait is blocked by a rotate-to-landscape gate; landscape uses the same composition with responsive scaling.

No third integration repository is an active runtime donor for this build.
