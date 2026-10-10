# Grandis Legacy PvP — Deployment Guardrails

> **MANDATORY FOR EVERY NEW PvP VERSION.**  
> Keep this file in every release package and run the checks below **after the last source change** and **before creating/uploading the final ZIP**.

## Why this exists

A public URL showing only:

```text
no healthy upstream
```

is a reverse-proxy symptom: the deployed service has **no healthy application process behind it**. It is not a browser/UI error by itself.

Grandis Legacy PvP has repeatedly hit this class of failure when a new package changed files but the production image/startup contract was not revalidated.

## Known Grandis Legacy failure modes

### 1. Production Docker image omits a runtime directory

The server can work from a full repository checkout but crash inside Northflank because the Dockerfile copied only part of the repository.

**v3.78.0 correction example:** `server.js` and `sync/runtime-sync-verifier.mjs` require `authority/browser-runtime/*`, but the first v3.78.0 Dockerfile did not copy `authority/` into the image. The process therefore failed before `server.listen(...)`, so `/health` never became available and the proxy displayed `no healthy upstream`.

**Rule:** every file required by the runtime sync lock must also exist inside the production image.

### 2. Runtime sync lock is stale

`verifyRuntimeSyncOrThrow()` runs before the HTTP server starts. If a locked file is edited after the lock was generated, the process intentionally exits before opening the port.

**Do not disable the verifier.** Regenerate the lock after all final source edits.

### 3. Package manifest is stale

If files are added/edited after `FILE_MANIFEST_SHA256.csv` or `public/PVP_FRONTEND_SHA256.csv` is built, verification can fail or the release package can become internally inconsistent.

### 4. Production dependency is missing

`server.js` imports `ws`. Production must run `npm ci --omit=dev` (or equivalent) successfully before startup.

### 5. Wrong port/health contract

Northflank must be able to reach the process on `process.env.PORT`. The server must bind to `0.0.0.0` (unless the platform explicitly requires otherwise), and the configured health path must remain `/health`.

### 6. Runtime static compression/memory regression

Do not reintroduce per-request `brotliCompressSync()` or `gzipSync()` of large assets. Earlier builds showed that blocking compression can create CPU/memory pressure and make health checks unreliable on small instances.

---

# Mandatory release sequence

Run this **after the last code, CSS, asset, Dockerfile, or package.json edit**:

```bash
npm ci --omit=dev --ignore-scripts
npm run release:seal
npm run test:startup
```

`release:seal` must regenerate and verify the runtime lock/manifests, then run the deployment topology guard.

`test:startup` performs the check that matters most for `no healthy upstream`: it launches the real `server.js`, waits for the real `/health`, validates HTTP 200 + `{ ok: true }`, and fails if the process exits before becoming healthy.

Only after both commands pass should the final repository ZIP be created.

## Clean-package verification

After creating the ZIP, extract it into a **new empty directory** and run again:

```bash
npm ci --omit=dev --ignore-scripts
npm run release:seal
npm run test:startup
```

This clean-extract step catches files that existed in the builder workspace but were accidentally omitted from the package/deployment context.

---

# Northflank checklist

The repository currently expects:

- Builder: `Dockerfile`
- Start command: `node server.js`
- Health path: `/health`
- Application port: `process.env.PORT` (fallback `3000` locally)
- Bind host: `0.0.0.0`

Do **not** treat a longer health timeout or more RAM as the first fix for `no healthy upstream`.

If deployment is unhealthy:

1. Open the Northflank service/container logs.
2. Find the **first fatal exception before** `Listening on http://...`.
3. If the error mentions runtime sync/hash mismatch, regenerate `sync/runtime-sync-lock.v2.63.json` **after** final edits.
4. If it says `ENOENT`, identify the missing path and verify the Dockerfile copies its top-level directory.
5. If it says `ERR_MODULE_NOT_FOUND` / cannot find `ws`, verify `npm ci --omit=dev` completed and `package-lock.json` matches `package.json`.
6. If the process listens but health still fails, verify the platform health check is `/health` and uses the service port provided in `PORT`.
7. Re-run `npm run check:deployment` and `npm run test:startup` in the same build context before redeploying.

## Forbidden shortcuts

Do not “fix” the symptom by:

- disabling runtime-sync verification;
- deleting the health check;
- hardcoding a Northflank port;
- binding only to `127.0.0.1` in production;
- blindly increasing memory/timeout;
- copying the entire historical repository without checking dependencies;
- claiming deployment PASS when the live startup `/health` test was not executed.

---

# Release builder rule

Every future Grandis Legacy PvP release task must explicitly include:

> **Deployment regression guard:** preserve `DEPLOYMENT_GUARDRAILS.md`; verify Docker production-copy coverage against the runtime sync lock; regenerate runtime sync lock and manifests after the final edit; install production dependencies; launch the real server and require `/health` PASS before packaging. A ZIP is not deployment-ready if live startup was not executed successfully.

