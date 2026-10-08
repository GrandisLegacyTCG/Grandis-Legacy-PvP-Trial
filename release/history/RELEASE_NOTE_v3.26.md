# Grandis Legacy PvP v3.26 — 2026-09-03

## Scope
PvP only. Source Stack, VS AI, Tutorial, Deck Builder, and Website are unchanged.

## Card Played UI parity fix
PvP v3.25 still had a PvP-only Card Played preview layout even though the detail/audit data had already been brought closer to VS AI.

v3.26 removes that preview divergence and follows the **VS AI v6.24 Card Played component behavior directly**:

- normal desktop: 2 columns × 3 rows, latest 6 combined actions;
- shorter desktop: same 3-row structure with reduced row height;
- mobile/shared compact layout: same six-card horizontal cap used by VS AI;
- constrained desktop-height fallback: same 2 × 2 / max-4 responsive override used by VS AI;
- same `Card Played` header, actor badge, card thumbnail behavior, `Full Card History` button, combined history, and detail entry path.

This is intentionally a UI/presentation parity change. PvP remains server-authoritative and continues to populate the shared Card Played component from H2H authoritative action events.

## Preserved fixes
- v3.25 P.Atk / M.Atk / P.Def / M.Def sound and VFX transport/presentation.
- v3.25 detailed Card Played resolution audit.
- v3.24 Quick Reload / Rapid Chamber draw counting for Aura Infusion Bolt.
- Current PvP deck-format validation and Source Stack v1.7.3 authority.

## Cache
HTML asset query markers were advanced to `gl-pvp-3.26-card-played-ui-parity`.
