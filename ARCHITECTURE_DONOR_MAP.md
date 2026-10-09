# Grandis Legacy PvP v3.75.9 — Active Donor Map

This build intentionally uses **two active sources only**.

## 1. PvP v3.51 — authoritative application foundation

PvP v3.51 owns multiplayer state and rules execution: lobby/session lifecycle, Ready/Kick, Start Match, the battlefield-backed Coin Flip/Result UI, authoritative opening, single-in-flight intent handling, WebSocket snapshots, Mana payment, pending choices, Response, hidden-opponent-Shard choices, privacy, reconnect, spectator, surrender, and server-side validation.

The browser gameplay contract and server gameplay contract stay on the same v3.51 model. The VS AI exact-payment/local engine is not PvP authority.

### Pre-game boundary

The entire path below remains v3.51-owned:

`Lobby -> Ready/Kick -> Start Match -> Coin Flip -> Coin Result -> Opening Hand -> Starting Shards -> first normal Draw + Regen`

Hero Rank I is setup state and is already on the battlefield; it is not presented as a draw from the Legacy Deck.

## 2. VS AI v6.90.7 — post-opening presentation/UX donor

VS AI v6.90.7 supplies the visual language after opening: battlefield layout, Hand/Shard presentation, phase tracker, Card Played, Active Card, Battle Log, choice/payment surfaces, targeting visuals, card movement, VFX/SFX, and interaction styling.

The v6 surface does not control Lobby, Coin Flip or Opening and does not publish its own game state. It activates only after the authoritative v3.51 opening presentation completes.

## Product adjustments locked for v3.75.9

- One visible PvP lobby; room switching UI is removed.
- Desktop lobby fits one viewport without scrolling; header dimensions are unchanged.
- Deck Builder / VS AI navigation buttons are hidden for now.
- Player names are capped at 20 characters without explanatory UI text.
- During setup, Seat 1 may remove Seat 2 at any time. Seat 2 may remove Seat 1 only while Seat 1 is offline.
- Kick visuals remain the canonical compact PvP v3.51 control.
- Opponent identity stays top-left: player name, deck name, connection bars on the right.
- Local player identity uses the existing bottom-right slot: connection bars on the left, then player name and deck name.
- Opening presentation is Hand P1 -> P2 alternating x6, then Starting Shards P1 -> P2 alternating x3, then first-player normal Draw + Regen.
- Private Opening/Draw information never enters Card Played history.

No other integration repository is an active runtime donor for this build.
