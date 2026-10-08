# Grandis Legacy PvP v3.75.4 — Gameplay Sync Architecture

## Reason for this change

PvP v3.73.20 could let the acting browser advance its local presentation while the other browser was still waiting for the authoritative step. That failure pattern appeared across multiple card flows, including Meditation, Steal, and paid Skills.

## v3.75.4 contract

The gameplay transaction model is restored to the PvP v3.51 pattern:

1. A browser submits exactly one gameplay intent.
2. That browser is locked from submitting another gameplay intent while the first is in flight.
3. The server validates and commits the intent against the submitted board revision.
4. The server broadcasts the new authoritative snapshot to both players.
5. Each browser imports that snapshot, re-synchronizes pending/response ownership, and renders from the imported revision.
6. Only after the authoritative revision settles may the next gameplay intent be submitted.

There is no general gameplay intent queue on the client. UI convenience flows that require two canonical steps use an explicit follow-up only after the first authoritative snapshot has been imported.

## Hidden opponent Shard choices

Opponent Shard selection uses the v3.51 security/sync path: an opaque `choice_handle` plus the authoritative board revision. The browser does not submit a client array index for hidden opponent Shards.

## UI rule

The VS AI v6.90.7-derived UI remains the presentation layer. In PvP client mode, `sendIntent()` does not immediately force a local gameplay render. The visible gameplay state is refreshed from authoritative snapshots. Presentation animation may accompany a committed revision, but animation does not commit gameplay state.

## Regression targets

- Meditation: source selection and final resolution must appear from the same authoritative revisions on both browsers.
- Steal: blind opponent-Shard selection must use `choice_handle + revision`, then resolve on both browsers.
- Paid Skill: Mana selection/payment must settle on the server and the resulting pending state must close/advance on both browsers.
