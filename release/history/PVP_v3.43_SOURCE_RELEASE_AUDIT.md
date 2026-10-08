# Grandis Legacy PvP v3.43 — Final Source Release Audit (Candidate 4P)

## Decision

**SOURCE RELEASE READY: YES**  
**EXTERNAL REAL NETWORK VERIFICATION: PENDING**  
**PRODUCTION DEPLOYMENT CERTIFIED: NO — pending external real-network verification**

Candidate 4P promotes the already validated Candidate 4 application source into the final PvP v3.43 **source/package release** without changing production gameplay, network/session, runtime, or UI code. The previous sandbox-only WebSocket acceptance blocker remains explicitly documented and is not converted into a PASS.

## Locked validated state

- Source Authority: v1.9.5
- Canonical Card Authority: v1.6.0
- Canonical Cards: 200 / 200
- Shared Runtime: v1.94.2
- Runtime Data: v0.16.2
- Effect Recipe: v0.15.2
- Effect Checkpoint: v0.15.2
- Hero Components: v1.1.0
- Starter Authority: v1.6.1
- Application Runtime Sync: v2.63
- Active Starters: 5 / 5
- Candidate 3A gameplay backbone: PASS
- Candidate 3B advanced gameplay / Hero Components: PASS
- Candidate 3C full-match lifecycle: PASS
- Candidate 4 static/UI/security hardening: PASS
- 200-card runtime coverage: PASS
- 30-turn soak / 21+ turn stability: PASS
- Desktop / Tablet Landscape / Tablet Portrait / Phone responsive regressions: PASS
- Candidate 3B card-stroke and equal-scale Card Played fixes: PASS
- Provider-agnostic / Northflank-compatible architecture: preserved

## Candidate 4P change scope

Production application source: **UNCHANGED**.

Candidate 4P changes are release/package metadata and QA/documentation only:

- package identity promoted from Candidate 4 blocked label to v3.43 source release;
- QA version assertions updated to the promoted package identity;
- external-network-pending release note added;
- source-release audit documentation added;
- manifests regenerated after packaging metadata changes.

No production source under `server.js`, `server/`, `runtime/`, or `public/` was changed during Candidate 4P promotion.

## Real network status

The repository still locks real `ws@8.21.0`. Real production WebSocket acceptance is **PENDING EXTERNAL VERIFICATION** because the prior execution sandbox could not resolve the npm registry (`EAI_AGAIN registry.npmjs.org`). Candidate 4P intentionally did not retry npm in the same environment and did not introduce a shim/workaround.

See `release/PVP_v3.43_EXTERNAL_NETWORK_VERIFICATION_PENDING.md` for the exact external acceptance procedure.
