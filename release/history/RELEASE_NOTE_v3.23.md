# Grandis Legacy PvP v3.23 — 2026-09-02

## Scope
PvP-only update. Website is intentionally untouched and remains independent.

## Turn-flow parity with VS AI
- Removed the mandatory **Acknowledge Your Turn** gate.
- Draw Phase now resolves automatically at turn start: Ready/mandatory draw/Mana Regen, then advances directly to Deploy when no mandatory Draw choice is pending.
- If a Draw Review or other mandatory Draw choice opens, PvP remains in Draw until the owner resolves it; completion then continues to Deploy automatically.
- The same automatic Draw-to-Deploy behavior applies to both canonical PvP sides, including turn transitions after End Phase / hand-limit cleanup.
- `Your Turn` may remain as presentation feedback, but it is no longer an input gate.

## Preserved from v3.22
- Card Played HF1: up to 4 entries in a 2-column preview with internal scroll when needed; Phase Tracker remains protected from overlap.
- 50/60 custom-deck validation, max 3 normal copies, Ultimate max 1.
- Spectral Grappling Hook response-cost + lineage fixes.
- Immediate Defeat → Legacy mandatory choice.
- Draw This Turn parity, battle-log phantom Resolution fix, Hero/Legacy size parity.
- Sword Attack Direction Indicator, favicon, and VS AI audiovisual parity.
- Source Stack v1.7.3 / Runtime Data v0.14.2 / Runtime Foundation v1.89 / Core v0.57 remain unchanged.
