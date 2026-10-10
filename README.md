# Grandis Legacy PvP v3.79.0

Grandis Legacy PvP v3.79.0 is an **architecture reset**. It is not a continuation of the v3.78.x compatibility stack.

## Locked bases

- **Presentation base:** VS AI v6.91.3
- **Lobby base:** PvP v3.76.6
- **Architecture reference only:** the handshake pattern used by VS AI Tutorial v6.48 and PvP v3.51
- **Server gameplay authority:** the exact VS AI v6.91.3 shared gameplay engine, executed headlessly in Node

PvP v3.51 is **not** shipped as an authority/runtime dependency and is **not** the implementation baseline for this release.

## New handshake

```text
v6.91.3 desktop / tablet / mobile UI
                |
                | intent / intent batch
                v
        thin PvP client adapter
                |
                | WebSocket + base revision
                v
  v6.91.3 gameplay engine in headless Node
                |
                | viewer-safe localized snapshot
                v
        thin PvP client adapter
                |
                v
       v6.91.3 presentation runtime
```

The active remote human is always executed as v6.91.3's local `PLAYER` in an actor-local seat orientation. This prevents the multiplayer server from invoking v6 Local AI for Player 2.

See `ARCHITECTURE_V379.md` for the full contract.

## Asset policy

This standalone trial package intentionally carries the local Season 1 WebP/media set. Visible card and Shard URLs are resolved through the PvP presentation boundary to packaged local assets:

- `card-art/<CARD_ID>.webp`
- `assets/shards/*.webp`
- `assets/ui/*`
- `engine/assets/audio/*`

The exact v6.91.3 donor engine still contains some website/CDN strings internally. Those are not the active standalone presentation path: donor rendering is suppressed, authoritative snapshot imports are silent, and visible card/Shard resolvers are overridden locally.

When PvP is integrated into the main website later, this resolver boundary can be changed to the shared Website asset repository without changing gameplay authority.

## Coin Flip and opening boundary

The v6.91.3 battlefield stays mounted behind a fully opaque black Coin Flip overlay. While the Coin Flip gate is active the battlefield is `inert`, has no pointer events, and must not leak hover/click/focus behavior.

The server does not begin the first authoritative Draw until both clients finish the v6.91.3 opening presentation and acknowledge it.

## Local run

```bash
npm ci --omit=dev --ignore-scripts
npm start
```

Default endpoint: `http://127.0.0.1:3000/` when `HOST=127.0.0.1`, or production bind `0.0.0.0` when no HOST is supplied.

Health endpoint: `/health`.

## Validation

```bash
npm test
npm run frontend-manifest
npm run manifest
npm run verify:manifest
npm run check:deployment
npm run test:startup
```

`npm run release:seal` runs the static/source validation plus final manifest generation. `npm run test:startup` is a separate **real process startup** check and requires production dependencies to be installed.

## ⚠ Mandatory Deployment Guardrails — read before every new version

A browser message such as **`no healthy upstream`** means the reverse proxy has no healthy application process behind it. It is not, by itself, a frontend diagnosis.

Before a release is treated as deployable:

1. Make all source changes first.
2. Run `npm run release:seal` **after the last edit**.
3. Run `npm ci --omit=dev --ignore-scripts` in the environment that will execute the package.
4. Run `npm run test:startup` and require a real HTTP 200 `{ "ok": true }` from `/health`.
5. After the final ZIP is created, clean-extract it and repeat the source/manifest checks. Do not claim live deployment PASS unless the real server process actually started.

The Docker runtime contract is deliberately small: `server.js`, `server/`, and `public/`. If a future server startup imports or reads another runtime root, the Dockerfile must copy that root too.

See `DEPLOYMENT_GUARDRAILS.md`.

## Project workflow rules

`PROJECT_WORKFLOW_RULES.md` is mandatory project policy:

- a bug report does **not** authorize creating another ZIP;
- consolidate fixes in the working tree where practical;
- when the candidate is ready, ask the user for explicit permission before packaging;
- every future Takeover Note must repeat those workflow rules.
