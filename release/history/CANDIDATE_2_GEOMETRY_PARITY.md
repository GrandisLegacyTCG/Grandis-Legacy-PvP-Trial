# Candidate 2 Geometry Parity

Candidate 15 presentation authority is copied directly into Candidate 2:
- `public/css/app.css` SHA256 `a4bd309daf2904dc08020606e5ff690cbee8e2c064e6785eb2f1398cd239bdbd`
- `public/css/battlefield-authority.css` SHA256 `916a82f96b88fb6523d14646e6740d95b0ba2be86306b0cc457a49351eff565d`
- `public/shared-ui/battlefield-ui.css` SHA256 `2b70d63c74081a8809b2a2d456ec1b620a9a078ab84f597c0607a928503a9378`
- `public/shared-ui/battlefield-ui.js` SHA256 `110394df12e3052bbcc961de24dad29b5734af65d0a7c0afdd2c8ffdaf8a81cb`

Because the canonical geometry sources are byte-identical, Candidate 2 uses the same Battlefield measurements as Candidate 15 rather than reimplementing them.

## Real Chromium Candidate 2 Geometry
| Viewport | Battlefield | Player Hand | Shard | Phase Tracker | Horizontal overflow |
|---|---|---|---|---|---|
| 1024x600 | 0,0,1024,600 | 3,546.61,787.73,50.39 | 335.30,64.92,37.30,52.22 | 795.73,79.80,225.27,211.30 | NO |
| 1024x768 | 0,0,1024,768 | 3,714.61,787.73,50.39 | 314.50,66.98,51.16,71.63 | 795.73,79.80,225.27,284.91 | NO |
| 1180x820 | 0,0,1180,820 | 3,764.92,909.41,52.08 | 368.48,69.27,55.16,77.23 | 917.41,79.80,259.59,307.70 | NO |
| 1195x615 | 0,0,1195,615 | 3,561.61,921.11,50.39 | 399.19,65.11,38.53,53.95 | 929.11,79.80,262.89,217.88 | NO |
| 1366x1024 | 0,0,1366,1024 | 3,965.56,1055.00,55.44 | 416.33,76.00,71.11,99.56 | 1063.00,79.81,300.00,397.09 | NO |

Units are CSS pixels and values are `x,y,width,height` from `getBoundingClientRect()`.
