# Grandis Legacy PvP RC36.8 — Combat Target / Feedback Hotfix 3
9 November 2026 · Trial / staging only

## User-reported issues
- START MATCH and initial battlefield loading feel slower than gameplay once running.
- Area Attack waits for opponent Response, but final damage/status animations are missing.
- Single Target attack cannot select opponent Hero when tapping its lane.

## Fixes
- Legal target/source selection now accepts tapping anywhere in the highlighted Hero lane; the engine remains the authority for legal lanes, and card artwork/double-click review keep their existing handlers.
- Browser presentation tracks the public attacked lanes and pre-Response HP/Status. After the final Response (including payment and nested Response) is settled, affected Heroes animate in one parallel batch, showing existing Physical/Magical Attack VFX, HP damage shakes only for actual HP damage, and new Poison/Burn/other status effects. This is visual-only; no gameplay damage is recalculated or sent.
- Viewer-safe opponent Response masking now also preserves only the publicly attacked Area positions; private Response choices, Hand, and deck data remain masked.
- The runtime's cache-busting query string and lobby prefetch reference now agree, so the browser requests the same updated interaction script.

## Startup performance finding
The lobby creates the battle iframe on START/Coin transition. The client must load and parse multi-megabyte game data/runtime on cold entry. Local headless server bootstrap was roughly tens to hundreds of milliseconds and is not evidence that Northflank, devices, or browser parsing meet that latency. A separate hosted cold/warm START and browser network timing profile is still required. No broad networking or gameplay engine changes were made.

## Verification and limits
- Full local `npm run check`: PASS (RC5 Mana, RC6 transport/privacy, nested Response, new target/Area VFX tests).
- `npm run build:precompress`: PASS. Northflank Docker regenerates compressed assets.
- Simulated UI/VM regression verifies one simultaneous 3-target animation batch after final Response, new status, zero-damage shake suppression, single-target lane click and server viewer masking.
- Browser end-to-end on two real devices and hosted Northflank performance/visual accuracy remain unverified. Stage in PvP Trial, not PvP main.
