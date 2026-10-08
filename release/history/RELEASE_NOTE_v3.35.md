# Grandis Legacy PvP v3.35 — Production Frontend Topology Correction

## Root cause fixed

The live `https://grandislegacytcg.github.io/pvp/` frontend is served from the Website repository's `/pvp/` directory. Previous PvP packages updated their own `public/` source, but that source was not what the public `/pvp/` URL was serving. This left production on an older embedded PvP frontend even when the standalone PvP package had newer UI/VFX/name/mobile fixes.

v3.35 makes the deployment boundary explicit and provides the exact frontend payload that Website v1.24 mirrors into production.

## Preserved clean runtime behavior

- Lobby/player display names map from authoritative room seats.
- Connection signal indicators render beside both player name/deck headers.
- Mobile gameplay does not keep the lobby hamburger node visible.
- Mobile Hero Action/Racial Trait uses the shared VS AI interaction path with PvP authoritative intents.
- P.Atk, M.Atk, P.Def, and M.Def presentation uses the authoritative post-render battle-feedback ledger and VS AI assets.
- Card Played parity, Quick Reload/Aura draw counter, and 60/3/1 deck legality remain intact.

## Performance

No new gameplay polling or server broadcast loop is added. WebSocket compression remains disabled, the large browser runtime remains precompiled once at server boot, and the signal RTT loop remains low-frequency/player-only.

## Deployment

Website v1.24 + Northflank Room 1 + Northflank Room 2 must all be deployed for the live system to reflect this release. See `docs/APPLY_GITHUB_NORTHFLANK.md`.
