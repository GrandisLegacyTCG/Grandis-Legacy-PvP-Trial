# Grandis Legacy PvP v3.75.1 — Release Notes

Date: 2026-10-08

## Purpose

Create a clean PvP rebuild baseline with PvP v3.51 as the network role model and VS AI v6.90.7 as the UI role model, while salvaging only tested integration work from pvp-fresh v3.73.20.

## Main changes

- Normalized production naming/layout to a v3.51-style `public/js`, `public/css`, `public/shared-ui`, and `public/assets` structure.
- Removed active `public/engine/` and `public/pvp/` nesting.
- Renamed ambiguous Option-B production files to `pvp-ui-runtime.js` and `pvp-ui.css`.
- Unified release identity across server, fallback config, browser client, package metadata, tests, and presentation adapter as **v3.75.1**.
- Kept the server-authoritative network and viewer-safe spectator model.
- Kept the v6.90.7-derived battlefield and exact-payment decision UI adaptations.
- Retained historical browser storage keys only as upgrade-compatibility identifiers.
- Renamed QA files from `v372` to `v3751` and updated them to validate the canonical v3.75.1 paths.

## Versioning rule

Future updates on this line increment only the final component: v3.75.2, v3.75.3, etc.

## Validation target

`npm test` must pass before this package is treated as a candidate for live deployment.
