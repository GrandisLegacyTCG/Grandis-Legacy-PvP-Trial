# Grandis Legacy PvP — v3.78.0

## Release identity

- PvP Version: **v3.78.0**
- Package Version: **3.78.0**
- Date: **2026-10-10**
- Architecture: **PvP v3.76.6 Lobby + VS AI v6.91.3 approved game client + PvP v3.51 multiplayer authority**

## Architecture

Grandis Legacy PvP v3.78.0 is a clean three-donor integration:

- **Pre-match / Lobby presentation:** PvP v3.76.6
- **Gameplay presentation / timing / interaction:** VS AI v6.91.3
- **Server / network / multiplayer authority:** PvP v3.51

The v6 game client remains viewer-relative; the PvP adapter replaces local AI authority with remote authoritative multiplayer state. PvP v3.51 gameplay UI is not part of the visible game presentation.

See the release audit files under `release/` for donor parity, changed files, asset checks, and QA results.

---

# ⚠ Mandatory deployment guard — read before every new version

A browser page that says:

```text
no healthy upstream
```

means the reverse proxy cannot reach a healthy application process. **Do not treat this as a frontend/browser bug.** First prove that `node server.js` actually starts and `/health` becomes healthy in the same production package/container that will be deployed.

This repository contains a permanent checklist in:

**`DEPLOYMENT_GUARDRAILS.md`**

Every future PvP release must preserve and follow that file.

## Historical recurring causes to check first

1. **Dockerfile omitted a required runtime directory.**  
   In the first v3.78.0 package, `server.js` and the runtime-sync verifier required `authority/browser-runtime/*`, but the Dockerfile did not copy `authority/` into the production image. The process therefore crashed before listening on the port, which produces `no healthy upstream`.

2. **Runtime sync lock was generated before the final edits.**  
   The sync verifier runs before `server.listen(...)`. A stale hash intentionally stops boot.

3. **Manifests were generated before the final edits/package contents changed.**

4. **Production dependency install failed or `ws` is unavailable.**

5. **Health/port contract changed.**  
   The server must use `process.env.PORT`, bind to a reachable host (`0.0.0.0` in production), and expose `/health`.

6. **Blocking static compression/memory regression was reintroduced.**  
   Do not bring back per-request `brotliCompressSync()` / `gzipSync()` for large assets.

## Mandatory commands before packaging/deploy

After the **last** source/Dockerfile/package edit:

```bash
npm ci --omit=dev --ignore-scripts
npm run release:seal
npm run test:startup
```

What these protect against:

- `release:seal` regenerates runtime sync + frontend/repository manifests, verifies them, and checks that the Dockerfile contains every path required by the runtime sync lock.
- `test:startup` launches the **real** `server.js` and requires the **real** `/health` endpoint to return HTTP 200 with `ok: true`.

Do not ship a package as deployment-ready if `test:startup` was not actually executed successfully.

After creating the final ZIP, extract it into a **clean empty directory** and run the same commands again. This catches files that existed in the builder workspace but were omitted from the final package/deployment context.

## Northflank production contract

- Builder: `Dockerfile`
- Production dependency install: `npm ci --omit=dev --ignore-scripts`
- Start: `node server.js`
- Health path: `/health`
- Port: `process.env.PORT`
- Bind host: `0.0.0.0`

If deployment still shows `no healthy upstream`, inspect service logs and fix the **first fatal startup error**. Do not blindly increase memory/health timeout and do not disable runtime verification.

---

## Useful release commands

```bash
npm run test:v378
npm run release:seal
npm run check:deployment
npm run test:startup
```

`npm run check:deployment` is a source/package topology check.  
`npm run test:startup` is the required live process + `/health` check and requires production dependencies to be installed.

