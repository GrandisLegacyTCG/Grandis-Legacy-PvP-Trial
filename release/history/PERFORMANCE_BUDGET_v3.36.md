# Performance Budget — PvP v3.36

The v3.36 battle-presentation fix is intentionally transport-only and low-overhead.

- No new polling loop for gameplay.
- No extra room broadcast for VFX/audio.
- Reuses `lastAnimationEvents` already shipped with authoritative snapshots.
- Removes client canonical battle-feedback ledger diff.
- Recipient board snapshots strip `pvpBattleFeedbackEvents`, reducing serialized payload/history.
- Battle presentation is client-side only after the authoritative render.
- Runtime remains compiled once at Node server boot.
- WebSocket compression remains disabled to avoid low-vCPU compression cost.
- TCP no-delay and the existing payload cap remain enabled.
- Internet RTT remains player-only at approximately one ping per 10 seconds, with in-flight protection; ping/pong does not broadcast the room snapshot.
