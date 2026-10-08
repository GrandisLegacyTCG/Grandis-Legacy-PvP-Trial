# Verification — PvP v3.25

## Result
**PASS for the targeted audiovisual/Card Played regression and all offline/runtime/bridge/UI/package coverage executed in the packaging environment.**

## v3.25 targeted regression
- `node tests/run-v325-av-card-played-parity.cjs`: **PASS**.
- The deep PvP parity QA executes while rendering is suppressed, matching the server-headless condition.
- Verified exact server-side battle-feedback records for:
  - **P.Atk + P.Def**: Aura Infusion Bolt vs Chain Mail.
  - **M.Atk + M.Def**: Fireball vs Holy Barrier.
- Verified that the exact feedback ledger is recorded even when the runtime cannot render locally.
- Verified authoritative transport fields for `battle_feedback`, including `attack_kind`, `defense_kind`, `outcome`, target side/lane, and sound flag.
- Verified client handling forwards `battle_feedback` to the shared battle-feedback renderer.
- Verified gameplay audio unlock is installed on pointer/keyboard interaction.
- Verified all P.Atk / M.Atk / P.Def / M.Def image and MP3 assets are present and non-empty.

## Card Played parity
The targeted v3.25 test also verifies:
- committed Human-vs-Human card actions retain a `pvp_event_id`;
- attack resolution applies the VS AI-style `applyAttackAuditToEvent()` structure to the PvP Card Played event;
- Response/result lines are written back to the same authoritative event;
- Defense events are linked to their parent attack and receive final damage results;
- Casting release (`RESOLVE`) can act as the audit parent for Casting Attacks;
- Card Played preview is capped at **4** and uses the current **2x2** responsive contract.

## Preserved v3.24 regression
- `node tests/run-v324-quick-reload-aura-counter.cjs`: **PASS** inside `npm run check`.
- Quick Reload / Rapid Chamber replacement draws still increment Aura Infusion Bolt and `Draw This Turn` correctly.

## Regression coverage executed
- `npm run check`: **PASS**.
- `node tests/run-v309-conditional-followup-audio.cjs`: **PASS**.
- `node tests/run-unbroken-stand-class-row.cjs`: **PASS**.
- `node tests/run-arcane-duelist-legality.cjs`: **PASS**.
- `node tests/run-card-played-audit.cjs`: **PASS**.
- `npm run test:package`: **PASS**.
- `npm run test:bridge`: **PASS**.
- `npm run test:ui`: **PASS**.
- Runtime sync verifier v2.51: **PASS**.

## Root cause verified
PvP's shared runtime executes on the Node server with render suppression enabled. The old battle-feedback queue intentionally returned early under that condition, so the exact P.Atk/M.Atk/P.Def/M.Def event never became part of the authoritative snapshot/animation channel. The client then attempted to infer VFX from HP deltas and Card Played events; this was not equivalent to VS AI and was unreliable.

v3.25 records the exact battle-feedback event before the render-only queue is suppressed, publishes it through the authoritative animation channel, and lets both clients run the same shared battle-feedback presentation path.

Card Played had a separate authority mismatch: PvP displayed `pvpActionEventsBySide`, while detailed resolution audit was being appended mostly to Local Player / Opponent event structures. v3.25 links those structures and mirrors the resolution audit into the PvP event that the H2H panel actually renders.

## Live WebSocket integration limitation
The packaging environment does not have the npm dependency `ws` installed in `node_modules`. Tests that boot the real WebSocket server were therefore not run here. The dependency remains declared in `package.json` and `package-lock.json`; no live-WebSocket result is claimed in this verification note.
