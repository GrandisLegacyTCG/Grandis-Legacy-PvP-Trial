# Grandis Legacy PvP v3.75.2 — Release Notes

Date: 2026-10-08

## Purpose

Tighten the Start Game opening presentation without changing authoritative gameplay state or the proven PvP v3.51 network model.

## Changes from v3.75.1

- Opening Hand is now presented strictly interleaved: local Player card 1 -> Opponent card 1 -> local Player card 2 -> Opponent card 2, continuing through all 6 cards.
- Starting Shards now use the same interleaved choreography for all 3 Shards. The presentation orders Shards by authoritative `group_index`; `pool_index` is used only as the visual destination.
- Opening Hand + Starting Shards are treated as one setup stage and must visually complete for both players before first-turn Draw presentation begins.
- Added a short visual separation between the completed 6+3 opening setup and the first player's normal Draw Phase.
- The first player's +1 Main Deck card then +1 Shard remain a separate normal-speed Draw Phase presentation.
- Opening setup card motions are accelerated to a short 110 ms flight with a 10 ms inter-card gap. Normal first-turn Draw motions remain 360 ms.
- Release identity advanced only at the final version component: v3.75.1 -> **v3.75.2**.

## Gameplay authority

No draw counts, deck contents, Shard contents, turn ownership, or server-authoritative state transitions were changed. This patch is presentation choreography only.

## Versioning rule

Future maintenance releases on this line increment only the final component: v3.75.3, v3.75.4, and so on.

## Validation target

`npm test` must pass before this package is treated as a candidate for live deployment.
