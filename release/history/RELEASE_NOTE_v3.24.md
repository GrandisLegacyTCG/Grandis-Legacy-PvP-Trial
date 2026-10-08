# Grandis Legacy PvP v3.24 — 2026-09-03

## Scope
PvP-only runtime fix. Website, VS AI, Tutorial, Deck Builder, and Source Stack are intentionally unchanged.

## Quick Reload / Aura Infusion Bolt Draw Counter
Fixed the server-authoritative Draw Review path used by **Quick Reload** and **Rapid Chamber**.

### Bug
PvP's Node Draw Review runtime looked for Aura Infusion Bolt's draw-counter metadata only inside an older nested `card.rules` structure. Current Runtime Data v0.14.2 exposes the relevant authority at the card root (`runtime_tags`, `staging`, `attachment_policy`, `casting_delay`, and `effects`).

The result was that the replacement card drawn through Quick Reload could increase `Draw This Turn` while failing to increase **Aura Infusion Bolt**'s Draw Counter in the authoritative PvP state.

### Fix
- Draw Review now consumes the current flat Runtime Data v0.14.2 fields first, with the older nested shape retained only as a compatibility fallback.
- Mandatory Draw Phase draws increment Aura Infusion Bolt normally.
- Quick Reload / Rapid Chamber replacement draws increment Aura Infusion Bolt once for the actual replacement card drawn.
- The visible Attachment counter is synchronized with the authoritative casting counter.
- `Draw This Turn` continues to count actual draws: mandatory draw + replacement redraw = 2.

## Preserved from v3.23
- Automatic Draw → Deploy parity with VS AI; no mandatory `Your Turn` acknowledgement gate.
- Card Played preview up to 4 entries with Phase Tracker priority.
- 50/60 PvP custom deck validation; normal max 3, Ultimate max 1.
- Spectral Grappling Hook response-cost and lineage fixes.
- Immediate Defeat → Legacy choice.
- Battle Log phantom-resolution fix, Hero/Legacy display parity, sword attack indicator, favicon, audiovisual parity.
- Source Stack v1.7.3 / Runtime Data v0.14.2 / Runtime Foundation v1.89 / Core v0.57 remain unchanged.
