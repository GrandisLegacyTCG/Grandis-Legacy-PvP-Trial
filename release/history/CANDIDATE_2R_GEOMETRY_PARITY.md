# Candidate 2R Geometry Parity

Exact reference: VS AI v6.42 Candidate 15. Measurement: production DOM + `getBoundingClientRect()` + relevant computed styles. Tolerance: <= 2 CSS px.

| Viewport | Family | Max shared rect delta | Horizontal overflow | Result |
|---|---|---:|---|---|
| 1366x768 | desktop | 0.00px | NO | PASS |
| 1440x900 | desktop | 0.00px | NO | PASS |
| 1920x1080 | desktop | 0.00px | NO | PASS |
| 1024x600 | tablet-landscape | 0.00px | NO | PASS |
| 1024x768 | tablet-landscape | 0.00px | NO | PASS |
| 1180x820 | tablet-landscape | 0.00px | NO | PASS |
| 1195x615 | tablet-landscape | 0.00px | NO | PASS |
| 1366x1024 | tablet-landscape | 0.00px | NO | PASS |
| 768x1024 | tablet-portrait | 0.00px | NO | PASS |
| 820x1180 | tablet-portrait | 0.00px | NO | PASS |
| 360x800 | phone | 0.00px | NO | PASS |
| 390x844 | phone | 0.00px | NO | PASS |
| 412x915 | phone | 0.00px | NO | PASS |

## Important shared components

- `shell`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `p_left`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `p_center`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `p_right`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `o_left`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `o_center`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `o_right`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `hp`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `hero_control`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `status`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `attachment`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `hand`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `hand_card`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `shard_pool`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `shard`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `racial`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `legacy`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `shard_deck`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `discard`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `main_deck`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `mana_regen`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `phase`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.
- `card_played`: PASS at every required viewport; max rect delta 0.00 CSS px; computed-style comparison matched where rendered.

## Evidence artifact

Raw per-component rectangles and computed-style results: `tests/artifacts/candidate2r-partb/geometry-all-viewports.json`.
