# Grandis Legacy PvP v3.43 — External Real-Network Verification Pending

## Release status

- Source release: **READY**
- Website mirror: **READY after exact `/public/` → Website `/pvp/` synchronization and static route verification**
- Production network acceptance: **PENDING EXTERNAL VERIFICATION**
- Production deployment certified: **NO — pending external real-network verification**

## Why this remains pending

The validated source package retains the canonical production dependency lock for `ws@8.21.0`. The execution sandbox used for Candidate 2R through Candidate 4 could not resolve `registry.npmjs.org` and repeatedly returned `EAI_AGAIN`, so the real production WebSocket dependency could not be installed there. This is recorded as an execution-environment limitation, not as a demonstrated Grandis Legacy application defect.

Candidate 4P does **not** retry the same broken npm environment and does **not** change application source, downgrade `ws`, bypass the lockfile, vendor `node_modules`, or use a WebSocket shim.

## External verification procedure

Run these checks in a normal Node/CI/staging environment with working npm registry DNS and network access.

```bash
npm ci
node -p "require('ws/package.json').version"
```

Expected locked WebSocket package:

```text
8.21.0
```

Then run the actual production server and real transport acceptance:

```bash
PORT=3000 HOST=0.0.0.0 npm start
```

In a separate shell/environment, verify `/health`, then run the repository's production WebSocket integration suite:

```bash
npm run test:partc:websocket
```

Also execute the release-level real-network checklist below against the actual `server.js` production process. No source edit should be required merely to conduct these tests.

## Mandatory external acceptance checklist

1. Production `server.js` boots with real `ws@8.21.0`.
2. `GET /health` succeeds.
3. Real HTTP → WebSocket upgrade at `/ws` succeeds.
4. Two independent clients can create/join a room, select legal current decks, Ready, and Start Match.
5. Player A sees SELF at bottom; Player B sees SELF at bottom.
6. Serialized Player A payload contains no unauthorized Player B Hand IDs, Deck order, private Shard identities, Legacy ordering, blind-selection mappings, or server-only state.
7. Perform the symmetric hidden-information check for Player B.
8. Representative server-authoritative gameplay intents succeed over real transport: Phase, Play, Tribute, Targeting, Mana/Shard payment, Reposition, Response, Rank Up.
9. Representative Class Ability, Racial Trait, and Legacy Effect execute through the real transport path.
10. Exercise Hero defeat, Legacy replacement, and terminal match state over real transport where practical.
11. Disconnect/reconnect Player A twice; preserve room, seat, match, permitted private state, and SELF-bottom orientation.
12. Replaced/stale socket cannot retain mutation authority.
13. Spectator does not consume a player seat, receives viewer-safe state, and cannot mutate gameplay.
14. Reject invalid room, room-full player join, malformed message, wrong-player intent, spectator intent, duplicate `clientActionId`, stale `baseRevision`, and post-match mutation without server crash or state corruption.
15. Boot on an alternate `PORT` and verify both `/health` and WebSocket transport.

## Promotion after external PASS

When these checks pass, update deployment verification documentation from **PENDING** to **PASS**. A new gameplay/UI candidate or PvP version bump is not required unless the external acceptance test discovers a genuine source defect.
