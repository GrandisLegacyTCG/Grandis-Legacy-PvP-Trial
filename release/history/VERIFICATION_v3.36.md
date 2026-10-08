# Verification — PvP v3.36

Verified locally in the packaged source environment:

- `npm run check` — PASS.
- Functional authoritative-feedback delivery test: `lastAnimationEvents -> seat localization -> board import -> post-render bridge`, exact once per event ID — PASS.
- Shared renderer functional test creates P.Attack, M.Attack, P.Defense, M.Defense images and invokes P.Atk, M.Atk, P.Def, M.Def audio paths — PASS.
- Player-name binding regression — PASS.
- Mobile lobby-only hamburger / Hero action regression — PASS.
- External per-player signal markup and separate signal-side bindings — PASS.
- Card Played parity — PASS.
- Quick Reload / Aura Infusion Bolt counter — PASS.
- 60 / normal max 3 / Ultimate max 1 deck validator — PASS.
- `npm run test:package` — PASS.
- `npm run test:bridge` — PASS.
- `npm run test:ui` — PASS.
- Runtime sync lock — PASS for 25 files.
- File manifest verification — PASS.

Not claimed: live two-browser Northflank WebSocket verification. The sandbox does not have the `ws` dependency/runtime access needed to validate production Room 1/Room 2 connectivity. Production validation therefore still requires both Northflank services and the Website `/pvp/` mirror to be deployed from the matching release.
