# Grandis Legacy PvP Deployment Guardrails

This file is mandatory for future PvP releases.

## What `no healthy upstream` means

It means the platform proxy cannot reach a healthy application process. Diagnose the **first server/build failure** before changing frontend code.

Historical recurring classes of failure include:

- a runtime directory used at startup was not copied by the Dockerfile;
- production dependency installation was incomplete (`ws` missing);
- an integrity/manifest file was stale after a final edit;
- the process ignored `process.env.PORT`, bound only to localhost in production, or lost `/health`;
- startup code crashed before `server.listen()`;
- synchronous compression or other unnecessary startup/request work caused memory pressure.

## v3.79 runtime-copy contract

The production process requires:

```text
package.json
package-lock.json
server.js
server/
public/
```

The Dockerfile must copy every one of those runtime roots. If a future startup import/read adds another root, update Docker COPY coverage in the same change.

Do not silence a startup failure by deleting verification, hard-coding a platform port, binding production only to `127.0.0.1`, or removing `/health`.

## Mandatory release sequence

After the **last source edit**:

```bash
npm test
npm run frontend-manifest
npm run manifest
npm run verify:manifest
npm run check:deployment
```

In an environment where production dependencies can be installed:

```bash
npm ci --omit=dev --ignore-scripts
npm run test:startup
```

`test:startup` launches the real `node server.js`, gives it an isolated port, polls the real `/health`, requires HTTP 200 with `ok:true`, and fails if the process exits before becoming healthy.

After creating the release ZIP, clean-extract it and repeat the static/source/manifest verification. If dependency installation is available, repeat the real startup test from the clean extract too.

## Honest QA reporting

- Static checks PASS does **not** mean live deployment PASS.
- A ZIP integrity PASS does **not** mean `/health` PASS.
- Do not report two-client/device/browser QA as PASS unless that session was actually executed.
- If network/dependency/environment constraints prevent a live test, report it as **UNVERIFIED**, not PASS.
