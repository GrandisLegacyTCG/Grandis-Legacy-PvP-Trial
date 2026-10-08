# Grandis Legacy PvP v3.75.8 — Active Donor Map

This build intentionally uses **two active sources only**.

## 1. PvP v3.51 — authoritative application foundation

PvP v3.51 owns multiplayer state and rules execution: lobby/session lifecycle, single-in-flight intent handling, WebSocket snapshots, coin flip/start, opening authority, Mana payment, pending choices, Response, hidden-opponent-Shard choices, privacy, reconnect, spectator, surrender, and server-side validation.

The browser gameplay contract and the server gameplay contract remain on the same v3.51 model. The VS AI exact-payment engine is not used as PvP authority.

## 2. VS AI v6.90.7 — presentation/UX donor

VS AI v6.90.7 supplies the visual language: battlefield layout, Hand/Shard presentation, phase tracker, side panels, Active Card/Card Played/Battle Log presentation, choice/payment surfaces, card movement, VFX/SFX, and interaction styling.

The v6.90.7 layer is a renderer/controller adapter over authoritative PvP snapshots. It does not publish its own game state.

## Product adjustments locked for v3.75.8

- One visible PvP lobby; room switching UI is removed.
- Desktop lobby targets one viewport without scrolling; the existing header is not compressed.
- Deck Builder / VS AI navigation buttons are hidden for now.
- Player names are capped at 20 characters without explanatory UI text.
- During setup, Seat 1 may remove Seat 2 at any time. Seat 2 may remove Seat 1 only while Seat 1 is offline.
- Opponent identity stays top-left: player name, deck name, connection bars on the right.
- Local player identity uses the existing bottom-right slot: connection bars on the left, then player name and deck name.
- Start sequence uses PvP v3.51 authority: lobby -> coin flip -> opening -> gameplay.
- Opening presentation is Hand P1/P2 alternating x6, then Starting Shards P1/P2 alternating x3, then first-player normal Draw + Regen.
- Private opening/draw information never enters Card Played history.

No other integration repository is an active runtime donor for this build.
