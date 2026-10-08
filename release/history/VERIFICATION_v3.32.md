# Verification — Grandis Legacy PvP v3.32

Date: 2026-09-04

## Runtime-focused tests

- `node tests/run-v332-runtime-parity.cjs` — PASS.
  - Functional battlefield render reproduces stale canonical `OPPONENT` while live names are `JENOZ` / `BELEZE`, and confirms live names win.
  - Executes the real active-match hamburger visibility function against a DOM stub and confirms the hamburger is hidden, then restored in lobby.
  - Executes the shared battle-feedback renderer against a DOM/audio harness and confirms all 4 VFX image paths are actually created and all 4 battle audio playback paths are actually invoked.
  - Confirms ledger → animation-plan → state-delta fallback transport is present.
  - Confirms connection-signal markup and RTT transport.
- `node tests/run-v331-player-name-binding.cjs` — PASS after adapting the assertion to the current dedicated identity markup.
- `node tests/run-v330-mobile-controls-functional.cjs` — PASS.
- `node tests/run-v328-live-vfx-path.cjs` — PASS; retry-safe delayed Hero anchor paints M.Attack + P.Defense.

## Regression / package checks

- `npm run check` — PASS.
- `npm run test:package` — PASS.
- `npm run test:bridge` — PASS.
- `npm run test:ui` — PASS.
- Conditional follow-up audio regression — PASS.
- Unbroken Stand class-row regression — PASS.
- Arcane Duelist legality regression — PASS.
- Card Played audit regression — PASS.
- Attachment-slot parity regression — PASS.
- Defeat/Casting cleanup regression — PASS.
- Runtime sync lock v2.51 self-test — PASS after regeneration for v3.32.

## VS AI asset parity

The SHA-256 hashes of these PvP assets match the corresponding VS AI v6.25 assets exactly:

- `P.Attack.png`
- `M.Attack.png`
- `P.Defense.png`
- `M.Defense.png`
- `P.Atk.mp3`
- `M.Atk.mp3`
- `P.Def.mp3`
- `M.Def.mp3`

## Live WebSocket limitation

A full two-client live WebSocket room test is **not claimed** in this execution environment. The package declares `ws`, but the sandbox does not have a usable installed `ws` module; an attempted install did not complete. The runtime tests above therefore exercise the actual presentation/network functions in VM/DOM/audio harnesses, but deployment should still be checked in a real two-client browser room.
