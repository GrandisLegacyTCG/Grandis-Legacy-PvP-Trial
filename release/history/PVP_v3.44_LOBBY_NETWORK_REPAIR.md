# PvP v3.44 Lobby / Network Repair

## Root-cause audit

The v3.43 and historical v3.42 frontends resolve Room 1 and Room 2 to the same configured `code.run` WSS hosts and use the same `/ws` path. The current WebSocket URL-construction architecture therefore did **not** contain a source-level regression relative to v3.42.

Two release/deployment problems were found:

1. The source/package release had been promoted while real Northflank room-service deployment/acceptance was still explicitly pending. A static GitHub Pages release cannot make a missing/stale/unavailable remote room service become live.
2. When a WebSocket failed or closed before a snapshot arrived, the Lobby rendered every disconnected state as `Connecting to PvP Room …`, masking the real deployment failure and producing the observed permanent “Connecting…” symptom.

v3.44 fixes the second defect and hardens the deployment boundary without changing server-authoritative gameplay. It keeps explicit remote endpoints, prevents a GitHub Pages same-origin WebSocket fallback, adds an explicit connection timeout, and displays actionable failure state in the Lobby.

## Reference boundaries

- v3.42 was used as the primary GitHub Pages → remote WebSocket deployment reference.
- The exact `Grandis_Legacy_PvP_v2.6.14_2026-07-28.zip` archive was not physically available in the execution workspace. Exact v2.6.14 byte/visual certification is therefore not claimed. The already-active legacy `pvp-v260` Lobby family in v3.43 is byte-compatible with the v3.42 Lobby source and is preserved as the available historical Lobby reference.
- v3.43 remains the gameplay/Battlefield authority.

## Required external deployment verification

Verify both configured services in an environment with outbound DNS:

1. deploy/redeploy the exact v3.44 server package to Room 1 and Room 2;
2. verify `/health`;
3. verify WSS `/ws`;
4. load Website `/pvp/`;
5. verify player count, Ready, second player join, and Start Match.

No claim of live Room 1/Room 2 PASS is made from this sandbox.

## Verification completed in this workspace

- Static v3.44 network/Lobby architecture test: **PASS**
- Canonical cards: **200 / 200**
- Active Starter Decks: **5 / 5**
- Candidate 3A server intent regression: **PASS**
- Candidate 3B card runtime coverage: **PASS (200 / 200)**
- Candidate 3B Hero Component regression: **PASS**
- Candidate 3B UI correction regression: **PASS**
- Candidate 3C defeat/Legacy lifecycle regression: **PASS**
- Locked Battlefield/presentation files byte-identical to v3.43 baseline: **PASS**
- Lobby browser test at 1366×768, 1024×768, 768×1024, 390×844: **PASS**
- All 5 Starters × Rank I/II/III × Left/Center/Right Hero preview: **PASS**
- Starter change resets Rank preview to Rank I: **PASS**
- Rank preview gameplay/network mutation: **NO**
- Failed-transport Lobby state transitions from Connecting to actionable Error: **PASS** (simulated failure used only for UI-state verification, not network acceptance)
- Direct external Room 1 / Room 2 service verification: **EXTERNAL VERIFICATION REQUIRED**; this sandbox cannot resolve the `code.run` hosts.

Evidence for the sandbox DNS limitation is retained at `tests/artifacts/v344/external-room-probe.txt`.
