# Candidate 2R Responsive Parity

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

For every required viewport: shared layout PASS, horizontal overflow absent, Hero/Hand/Shard/Deck-Pile/Phase/Card Played geometry matched exact Candidate 15 at 0.00 CSS px maximum measured delta. Tablet Portrait and Phone routed through the shared mobile renderer; Desktop and Tablet Landscape routed through the shared field renderer. No separate old PvP geometry renderer was activated.

Interaction checkpoints:
- Desktop 1440×900: shared hover/focus preview path compared.
- Tablet Landscape 1180×820: native-touch Shard stress and Hero two-stage behavior compared.
- Tablet Portrait 768×1024: native-touch Shard and first-tap behavior compared.
- Phone 390×844: 12-transition A/B Shard quick-preview comparison; no Detail in the stable parity harness.
