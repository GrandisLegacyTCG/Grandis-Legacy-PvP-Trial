# Grandis Legacy PvP v3.49 — Shard Parity Final Release

Date: 2026-09-26

PvP v3.49 completes the accepted Shard System parity work while keeping PvP server-authoritative. The accepted Part 1 interaction fixes are retained: normal and Response Class Shard routing, Ultimate Tribute Shard flow, authoritative pending-choice rehydration, opaque opponent-Shard selection, stale-choice recovery, Seat perspective mapping, responsive Shard preview, and hidden Shard information protection.

The final pass adds one server-derived presentation path for physical Shard gains. Opening Starting Shards, Draw Phase Mana Regen, pool-cap-limited gains, and real effect-based Shard gains animate from Shard Deck to the authoritative final Shard Pool without performing a second client-side gameplay mutation. The server emits only presentation-safe destination metadata; canonical Shard identity remains server-owned.

Main Deck Draw presentation was also corrected so Draw events are derived from the actual Main Deck → Hand state transition rather than relying only on the per-turn draw counter, which resets during Draw Phase. Mobile/tablet pre-flight staging was reduced to the same practical range as Desktop while preserving Hand geometry and centering.

Locked v3.48 features remain in place: Seat 1 pre-match Kick, kicked-session invalidation, mobile Lobby navigation, Lobby-only Swap PNG, Surrender visibility/authority, card-stroke cleanup, reconnect, and spectator-safe state.

Final acceptance uses real Chromium clients connected through the production WebSocket/runtime path plus fresh-extracted package verification. Website v1.38 mirrors the final PvP `/public/` bytes exactly under `/pvp/`.
