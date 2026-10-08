# Verification — PvP v3.35

Verified locally:
- `npm run check` PASS.
- Runtime sync v2.51 PASS for 25 locked files.
- Production-topology test PASS.
- Player-name binding test PASS.
- Mobile lobby-only hamburger / Hero-action functional tests PASS.
- P.Atk / M.Atk / P.Def / M.Def VFX/audio functional harness PASS.
- Card Played parity PASS.
- Quick Reload → Aura Infusion Bolt counter PASS.
- 60-card / normal max 3 / Ultimate max 1 deck validation PASS.
- Package check PASS.
- Runtime bridge PASS.
- UI contract PASS.
- Manifest verification PASS.

Not claimed:
- A live two-browser production WebSocket test against Northflank Room 1 and Room 2 was not possible from the sandbox network.
- Room 1's current production deployment cannot be inspected from this environment. Both Northflank services must be redeployed from v3.35 and checked via `/health`.
