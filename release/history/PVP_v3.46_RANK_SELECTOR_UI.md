# PvP v3.46 — Rank Selector UI Authority

Deck Builder v1.31 Style 1 is the visual authority. The authoritative source inspected for this release was `style-1/index.html` plus `css/app.css`.

The v3.45 Rank wrapper dimensions already copied the 31 / 74 / 31 grid, but PvP global `button` styling leaked `padding: 6px 11px`, `border-radius: 10px`, and the Lobby inherited heavier font weight into the arrow buttons. The Rank label also inherited the PvP Lobby weight/color rather than Deck Builder Style 1.

v3.46 uses the Deck Builder `rank-control` DOM structure directly and isolates only this component so its computed dimensions/treatment match Style 1 while preserving existing Rank I/II/III preview behavior. No WebSocket message is sent by Rank preview.

## Direct authority comparison

Actual Deck Builder v1.31 authority files used during verification:

- `style-1/index.html` SHA-256: `70a229b83016b7eae9932b324c58a21b2aa045d0ed3d8ed260ef295fa668971f`
- `css/app.css` SHA-256: `676ce6e89ca0ceab58a484a4cc203b5deccafaaad85ebe0bff0ef95f1a002728`

Chromium computed-style parity passed at 1366×768, 1024×768, 768×1024, and 390×844. At all four viewports the Rank control is 138×33 CSS px externally with a 31 / 74 / 31 grid, 17 px top margin, 31×31 arrow cells, 74 px label cell, Deck Builder gold label color, and matching button padding/radius/weight.

Detailed evidence is stored at `tests/artifacts/v346-rank-selector/direct-deck-builder-style1-computed-parity.json`.
