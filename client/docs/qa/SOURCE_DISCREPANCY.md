# OSA S0 official front vs consumer text mismatch

- `S0-ITM-001` (Health Potion): current approved artwork shows **+30 HEAL**; current DEV44 JSON card text omits the number.
- `S0-ITM-002` (Greater Health Potion): current approved artwork shows **+50 HEAL**; current DEV44 JSON card text omits the number and states that the recipient becomes Exhausted.

Both current front assets were supplied by the verified active OSA DEV45 consumer source. This RC5 app adapter references current card IDs only and does not use Season 1 card data. The official OSA archive has been left untouched; source-level correction should be handled through a future versioned OSA source change with regenerated consumers/hashes after designer verification.
