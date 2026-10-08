# Grandis Legacy PvP v2.6.18

- Fixes the Northflank startup failure caused by a stale `1.4.0` schema guard while active Season 1 runtime/effect data is schema `1.4.1`.
- Keeps the v2.6.17 spectator, room-link, rename, finished-match cleanup, and gameplay/effect fixes.
- Shares VS AI v5.61 card-priority desktop scaling so Hero/Hand cards stay readable across desktop viewport and browser-zoom changes.
- Preserves the desktop no-page-scroll and mobile scrollable policies.
- Keeps server telemetry disabled on the 0.1 vCPU / 256 MB Northflank services.
- Sends authoritative gameplay snapshots to players first and defers spectator snapshot work by one event-loop turn during player intents.
