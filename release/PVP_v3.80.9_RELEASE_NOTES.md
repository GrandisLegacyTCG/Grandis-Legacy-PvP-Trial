# Grandis Legacy PvP v3.80.9 — 2026-10-12

## Scope
Focused donor/sync cleanup after real-browser Mana Payment was confirmed working in v3.80.8.

### Gameplay-critical
- Updated gameplay donor baseline to VS AI v6.91.6.
- Center Mana Payment draft follows v6.91.6 exact replacement behavior and prefers normal Mana Shards for automatic replacement.
- PAY networking stays center draft → one final UID list → authoritative validation → donor commit once.
- Opponent-Shard effects auto-resolve when no meaningful identity choice exists; blind center selection remains when Class Shards make the choice meaningful.
- Donor delegated gameplay DOM clicks are gated while PvP external UI owns input.
- Meditation/zero-Mana transport is regression-tested for both seat orientations.

### Snapshot / seat / render pipeline
- Gameplay sender receives its result snapshot once; broadcast goes to other viewers.
- Explicit resync and intent-result recovery can force-import authoritative state at the same revision.
- Seat views are pure canonical → localized → privacy projections; read-only view generation no longer mutates the headless engine.
- Removed PvP 120ms render polling; authoritative snapshots and explicit UI drafts own renders.

### Presentation / assets / donor cleanup
- Adopted v6.91.6 disabled PLAY UX for cards blocked only by Mana.
- Adopted v6.91.6 Legacy-under-Hero indicator placement.
- Retained image decode guarding and unordered own-deck/visible-board preloading; no top-deck-order preload.
- Removed stale `public/engine/js/app.bundle.js`; active gameplay bundle is `public/engine/shared-app/app.bundle.js`.
- Authority module renamed to `server/v6916-authority.mjs`.
