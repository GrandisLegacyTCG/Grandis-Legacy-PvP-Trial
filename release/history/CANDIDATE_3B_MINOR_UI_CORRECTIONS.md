# Candidate 3B — Minor UI Corrections

**Scope:** exactly two authorized presentation corrections. No other visual redesign.  
**Result:** PASS

## 1. Redundant decorative card stroke removal

Corrected the owning/base art rules instead of appending a large patch-on-patch override:
- `public/css/app.css`: physical card-art surfaces (`.back`, `.hero-main img`, `.hand-art img`, `.played-tile img`, `.preview-card-art img`) no longer add a redundant decorative border around already-framed card artwork.
- `public/css/battlefield-authority.css`: active `.gl-lab-sidebar .combined-played-card` wrapper no longer adds its own decorative border/background frame.
- Existing quick-preview/detail rules that were already borderless were preserved.
- Structural separators, buttons, deck/pile zones, sidebars, and resource boundaries were not removed.
- Functional target/selection highlights remain active and were verified from computed style.

## 2. Card Played equal physical scale

- Removed the old responsive image shrink constraint equivalent to `max-width:25px; max-height:34px`.
- The legacy/fallback responsive rule now uses one stable physical card box per stack item.
- The active Candidate 15 Battlefield authority keeps each Card Played child at equal geometry; overlap/stack offset remains allowed.
- Desktop behavior was regression checked.

## Real-browser computed-style / geometry results

| Viewport | Mode | Card 1 | Card 2 | Card 3 | Max Δ W/H | Decorative border | Functional highlight | Result |
|---|---|---:|---:|---:|---:|---|---|---|
| 1366x768 | desktop | 139.500×36.000 | 139.500×36.000 | 139.500×36.000 | 0.000px | PASS | PASS | PASS |
| 1024x768 | tablet-landscape | 102.125×36.000 | 102.141×36.000 | 102.125×36.000 | 0.016px | PASS | PASS | PASS |
| 1180x820 | tablet-landscape | 119.297×36.000 | 119.297×36.000 | 119.297×36.000 | 0.000px | PASS | PASS | PASS |
| 768x1024 | tablet-portrait | 114.500×159.938 | 114.500×159.938 | 114.500×159.938 | 0.000px | PASS | PASS | PASS |
| 820x1180 | tablet-portrait | 151.719×211.938 | 151.719×211.938 | 151.719×211.938 | 0.000px | PASS | PASS | PASS |
| 360x800 | phone | 40.594×30.000 | 40.594×30.000 | 40.594×30.000 | 0.000px | PASS | PASS | PASS |
| 390x844 | phone | 40.594×30.000 | 40.594×30.000 | 40.594×30.000 | 0.000px | PASS | PASS | PASS |
| 412x915 | phone | 40.594×30.000 | 40.594×30.000 | 40.594×30.000 | 0.000px | PASS | PASS | PASS |

Browser evidence: `tests/artifacts/candidate3b/ui-corrections.json`.

## Backportability

These two corrections are isolated in PvP Candidate 3B. VS AI was not modified; the changes can be reviewed/backported later after PvP completion.
