# Grandis Legacy PvP v2.6.17

## Performance
- Reduced redundant Node VM canonical snapshot imports in the server-authoritative bridge.
- Acting player receives the authoritative broadcast first after a runtime intent.
- No server analytics/telemetry was added, preserving the 0.1 vCPU / 256 MB Northflank budget.

## PvP UX
- Fixed Deck Builder and fixed-room deployment links.
- Fixed spectator hidden Hand back artwork.
- Spectators can return to Room Select or switch rooms without resetting/disturbing the match; player flow is unchanged.
- Finished rooms auto-clean after 5 minutes if players leave the old result state in place.
- Added compact CHANGE NAME action and stable rename draft handling.

## Shared UI/effects
- Adaptive desktop fit and +4px mobile Next Phase touch target.
- Blessing of Divinity now blocks literal any damage.
- Existing v2.6.16 first-turn Attack, Tornado, and Double Casting response fixes remain active.
