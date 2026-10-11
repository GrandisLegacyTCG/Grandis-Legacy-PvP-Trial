# Grandis Legacy PvP v3.80.5 Release Notes

## Scope

v3.80.5 fixes the PvP Mana-payment regression and restores the Hand hover position without restoring the removed identity badges.

## Payment model

- Skill and Event use one PvP payment interaction.
- Normal Mana Shards are visible but never manually selectable.
- Normal Mana Shards fill the remaining cost automatically in FIFO Shard-Pool order.
- Only Class Shards are manual choices. Clicking a Class Shard selects it; clicking it again cancels it and automatically restores the required FIFO normal Mana Shards.
- Matching Class Shard value remains 2 for a matching Skill; otherwise a Class Shard contributes 1.
- The server-owned pending payment exports `selected_shard_uids`, `payment_value`, and `payment_ready`.
- Client PAY enablement now follows authoritative `payment_ready`; the browser no longer recomputes a second payment legality state.
- PAY remains one authoritative commit and does not play a fake spend animation before server acceptance.
- Response Mana payment follows the same Class-only/FIFO model.

## Presentation regression

The visible PLAYER / Player Deck identity badge remains removed. A hidden geometry-only anchor now occupies the former donor position so Hand hover preview placement matches the v6.91.4 presentation instead of drifting with the Hand container.

## Preserved behavior

Opening presentation dedupe, reconnect/READY fixes, public opponent Shard Pool, blind opponent-Shard choice, automatic Draw-to-Deploy, surrender/rematch lifecycle, asset preload/decode guard, and 50–60 Custom Deck acceptance remain intact.
