# Grandis Legacy PvP v3.75.7 — Build Notes

## Why this build exists

v3.75.7 stops patching the v3.73.20 gameplay synchronization model. Earlier diagnostic builds showed the same family of failure across Meditation, Steal, and paid Skills: one client could enter a local/transient step while the opponent waited for a different authoritative step.

## What was rebuilt

- Base repository and active gameplay contract: PvP v3.51.
- Latest presentation: VS AI v6.90.7 Option-B UI adapted on top of the v3.51 browser/runtime contract.
- Lobby/start/opening: presentation concepts/assets retained from pvp-fresh v3.73.20, but gameplay/network authority is not imported from it.
- Source naming follows v3.51-style paths.

## Payment

The active browser gameplay core is the PvP v3.51 payment model. The UI adapter exposes enough presentation data for the v6 PAY MANA screen, including auto-selected Mana Shards for display, while only legal Class Shard choices are interactive. Event/Item and other payments retain v3.51 authoritative behavior.

## Synchronization

Gameplay actions use the v3.51 one-intent-in-flight flow. The client waits for an authoritative board revision, imports that board, synchronizes pending UI, and only then accepts the next dependent gameplay step.

## Hidden information

Opponent Shard choices use opaque server-issued handles. The latest Card Played UI is sourced from public played-card events only, not from opening/draw presentation events.

## Opening

Opening Hand and Starting Shards are presented alternately Player/Opponent. The first player's Draw Phase is presented only after both players complete the opening 6 Hand + 3 Shard setup.

## Release gate

This package is a **candidate**, not a live-ready declaration. Promote only after two-browser manual verification of Opening, Round-1 Event, Meditation, paid Skill, Steal, and Card Played privacy.

## v3.75.7 deployment integrity correction
- Root cause of `no healthy upstream`: the fail-closed runtime sync lock in v3.75.6 was stale after final donor/UI edits.
- `server.js` calls `verifyRuntimeSyncOrThrow(BASE)` during process boot; the stale lock rejected `package.json`, `server.js`, `public/index.html`, `public/js/app.bundle.js`, and `public/js/pvp-network.js` before the HTTP listener started.
- v3.75.7 regenerates the runtime sync lock only after all source/version edits are complete.
- Gameplay/network/UI donor architecture is unchanged from v3.75.6.
