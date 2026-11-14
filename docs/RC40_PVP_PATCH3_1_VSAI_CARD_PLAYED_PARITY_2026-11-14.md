# RC40 PvP Patch 3.1 - exact VS AI Card Played renderer

## Objective
One Card Played formatter for PvP and VS AI. Source of truth is the latest RC40 donor implementation of `v94EventDetailHtml` in `engine/shared-app/app.bundle.js`. Do not introduce another independently formatted detail renderer in PvP.

## Implementation
- The canonical 14,800-byte donor `v94EventDetailHtml` function is source-identical and invoked by `GL_GAME_ENGINE.getPublicCardPlayedDetail(side,eventId,publicEvents)`.
- The PvP runtime's `openPlayedDetail` always invokes this canonical engine API; the former `pvpPlayedDetailHtml` is absent from production. Its historic copy is retained only as a legacy-test fixture for old regression checks.
- `pvpCanonicalPlayedEvent` adapts the committed, already viewer-filtered server action journal (Damage Resolution per Hero, modifiers, Status, Healing, Mana Burn/Steal and Response IDs) to the canonical event structure. It does **not** emit HTML.
- Server viewer-safe projection carries only public Attachment text for Card Played; the formatter is never handed private Hand/Deck/Mana information. The ephemeral readonly engine state is restored with `finally`.
- Latest RC40 Attachment and Casting descriptive helpers copied source-identically. Full donor Card Played CSS selectors included: summary fields, Related Cards, damage breakdown sections.
- Printed Ancestral Focus wording synchronized as `Mana cards` across static-data, generated definitions/recipe and Card Review; mechanics unchanged.
- Build ID cache busting updated for standalone and website addon; site uses existing root `/card-art/` on the same origin with no duplicate artwork.

## QA & limitations
`npm run check:rc40-p31` plus precompression/HTTP tests passed. New donor-parity checks passed 11/11. Exact renderer, not just similar layout, is in the production path.
Live 2-browser match and production Northflank WSS are not tested. The two viewers may legitimately see different details because PvP preserves hidden information. No GitHub writes.
