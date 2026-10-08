# PvP v3.40 Verification

Verified 2026-09-13 with `npm run verify`.

PASS coverage includes Playtest v0.14 promotion, Shard Deck/Shard Pool gameplay, Starting Shards, Class Shard payment, Ultimate Tribute, blind opponent-Shard selection, Range + Area, Base-Class Legacy selection, simultaneous defeat, current Response/payment flow, authoritative feedback/VFX path, network/topology contracts, 200-card package validation, deck legality, runtime bridge, UI contract, sync lock, and SHA-256 package manifest.

Live `test:server` / `test:room` could not execute in this build environment because npm dependency installation for `ws` was unavailable. The repository keeps `ws` in package dependencies/lockfile; static server syntax, bridge, topology, network-contract, and package tests pass.
