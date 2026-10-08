# Grandis Legacy PvP v3.45 — Release Notes

Version: **v3.45**

## Scope

- Fix the proven Northflank Docker build omission that left `server/gameplay-intent-router.mjs` and `server/headless-runtime-compat.mjs` outside the production image.
- Preserve the confirmed Room 1 and Room 2 public endpoints and `/ws` path.
- Preserve v3.44 actionable WebSocket connection/error states.
- Remove the standalone Lobby **Change Name** button; the Player Name input commits through Enter/blur/current reconnect behavior.
- Use the Deck Builder v1.31 Style 1 control pattern for Hero formation swap buttons, Rank I–III selector, and deck dropdown chevron asset.
- Hero formation swaps are server-validated match setup state. Rank selection remains preview-only local UI.
- Preserve the current Battlefield/gameplay/runtime authority.
- Website Mirror Target: **Website v1.34 `/pvp/`**.

Exact PvP v2.6.14 source was not available in the execution workspace; the existing `pvp-v260` Lobby family already present in the validated baseline was retained as the available old-Lobby lineage rather than fabricating a direct comparison.
