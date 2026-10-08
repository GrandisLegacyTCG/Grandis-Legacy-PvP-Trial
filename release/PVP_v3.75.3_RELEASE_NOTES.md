# Grandis Legacy PvP v3.75.3 — Release Notes

Date: 2026-10-08

## Purpose

Fix the two remaining Start Game / early-game presentation issues identified during two-browser testing: opening cards were moving too quickly to read, and the centered Mana payment UI could remain locked after PAY while the network transaction settled or failed.

## Changes from v3.75.2

- **Mana payment is now server-transaction-first.** PAY submits `commitManaShardPaymentChoice` / `commitResponsePaymentChoice` immediately. Card motion is presentation-only and no longer delays or controls whether the intent reaches the server.
- The centered payment layer tracks the submitted `clientActionId`. On server rejection, stale revision, timeout, or socket close, the UI unlocks and re-renders the authoritative pending payment instead of staying permanently `is-busy`.
- On authoritative snapshot resolution, the payment transaction is marked settled and the normal server snapshot closes/advances the decision layer.
- `sendIntent()` now returns the queued `clientActionId`, and the network layer exposes read-only intent state for diagnostics.
- Opening Hand and Starting Shard order remains interleaved exactly as v3.75.2, but setup motion is changed from 110 ms to **190 ms per card with no extra gap**. This keeps the opening close to 2x normal pace while preserving visible card travel.
- First-player Draw Phase remains visually separate and stays at the normal 360 ms motion speed.
- Removed the Windows case-collision duplicate `public/assets/lobby/swap.png`; the single canonical asset is `public/assets/lobby/Swap.png`.
- Release identity advanced only at the final version component: **v3.75.2 -> v3.75.3**.

## Gameplay authority

No card rule, Mana cost rule, exact-payment calculation, draw count, turn ownership, or server-authoritative gameplay transition was changed. The Mana fix changes the browser/network transaction lifecycle around an already-authoritative payment implementation.

## Versioning rule

Future maintenance releases on this line increment only the final component: `v3.75.4`, `v3.75.5`, and so on.

## Validation target

`npm test` must pass before this package is treated as a candidate for live deployment. A real two-browser check should specifically verify PAY success, PAY rejection/retry recovery, and readable opening animation.
