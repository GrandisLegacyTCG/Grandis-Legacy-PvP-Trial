# Card Played Responsive Hotfix 1 — PvP v3.22

Date: 2026-09-02

## Scope
Presentation-only responsive hotfix. PvP gameplay/network/runtime semantics are unchanged.

## Change
- Card Played remains max four entries, 2-column grid, at constrained desktop/resolution heights.
- Removed the <=720px-height hard fallback that displayed only two entries.
- Card Played fills remaining sidebar height after Phase Tracker.
- If four entries do not fit fully, the Card Played grid receives a small internal vertical scroll instead of removing entries.
- Phase Tracker remains non-overlapping and higher priority.
- Full Card History remains complete.

## Verification
Targeted PvP responsive, mobile-scroll, footer/draw, UI-contract, and v3.22 next-fix tests pass.
