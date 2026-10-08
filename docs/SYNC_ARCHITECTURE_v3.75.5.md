# Grandis Legacy PvP v3.75.5 — Gameplay Sync Architecture

## Goal

Keep the VS AI v6.90.7 UI/UX while removing the v3.73.20 gameplay sync failure mode where the acting browser could advance and the opponent browser could remain on an older pending/payment state.

## Match transaction contract

After the match begins, gameplay follows the v3.51 authoritative model:

1. A browser submits one gameplay intent.
2. The client does not mutate canonical gameplay state locally.
3. The server validates and commits that intent in the v3.51 gameplay runtime.
4. The server increments/broadcasts the authoritative board revision.
5. Both player browsers import the authoritative snapshot for their seat/view.
6. Pending/response UI is re-derived from that imported state.
7. Only then may the next gameplay step be submitted.

The client has no general gameplay intent queue. Presentation animation cannot commit or block server gameplay authority.

## Dual runtime boundary

The server and browser intentionally use different runtime artifacts:

- **Server:** exact v3.51 gameplay runtime in `server/runtime/`.
- **Browser:** v6.90.7-derived runtime needed by the latest UI/presentation.

This avoids forcing the local VS AI transaction model into online PvP while retaining the current visual experience.

## Payment

The server owns payment using v3.51 behavior. The UI is an adapter over that pending state rather than an independent exact-payment engine.

For a normal Skill with Class Shards available, the player may toggle Class Shard use. Mana Shards automatically fill the remaining cost. Normal PAY confirms through the authoritative v3.51 pending action. Event/Item payment is not forced through the newer universal exact-Shard selection flow.

## Hidden opponent Shard choice

The browser selects the server-issued opaque choice handle plus authoritative revision. `server.js` resolves that handle to the v3.51 engine's internal choice index only on the server. The player does not receive hidden Shard identity before the choice is committed.

## First-turn rule

The v3.51 authoritative runtime restricts only an Attack by the first player during Battle on Round 1. Event/Item/Tactical/Support actions remain governed by their normal timing.

## Primary regression targets

- **Meditation:** source selection resolves to `pending = null` authoritatively, then both clients consume the new snapshot.
- **Steal:** blind Shard selection uses the authoritative handle/revision path and resolves through the v3.51 engine.
- **Paid Skill:** Class Shard decision + automatic Mana fill + authoritative confirm settle before both clients advance.
- **Round-1 Event:** Deploy/Reform Event remains playable; only Attack is first-turn restricted.
