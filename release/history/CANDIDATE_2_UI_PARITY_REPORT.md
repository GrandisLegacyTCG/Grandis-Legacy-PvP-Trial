# Grandis Legacy PvP v3.43 — Candidate 2 UI Parity Report

## Candidate
- Candidate: PvP v3.43 Candidate 2
- Release Ready: **NO**
- Baseline: PvP v3.43 Candidate 1
- Visual Authority: VS AI v6.42 / Tutorial v0.68 Candidate 15

## Candidate 1 Preflight
- OSA v1.9.5: PASS
- Shared Runtime v1.94.2: PASS
- Runtime Data v0.16.2: PASS
- Effect Recipe / Checkpoint v0.15.2: PASS
- Hero Components v1.1.0: PASS
- Starter Authority v1.6.1: PASS
- 5 current starters: PASS
- 200 canonical cards: PASS
- Canonical remote shared asset authority: PASS
- Lobby Hero rendering: PASS in real Chromium
- Server/network source architecture: preserved

No blocking Candidate 1 inconsistency was found before the presentation migration.

## Shared Battlefield Presentation
- Shared Battlefield renderer: `public/js/app.bundle.js`
- Shared Battlefield CSS: `public/css/app.css`, `public/css/battlefield-authority.css`, `public/shared-ui/battlefield-ui.css`
- Shared UI helper: `public/shared-ui/battlefield-ui.js`
- PvP presentation adapter: `public/js/pvp-presentation-adapter.js`
- Old PvP Battlefield renderer active: **NO**
- Old PvP Battlefield CSS active as primary Battlefield authority: **NO**

`app.css`, `battlefield-authority.css`, `battlefield-ui.css`, and `battlefield-ui.js` are byte-identical to Candidate 15. The shared app bundle differs from Candidate 15 only in PvP build identity, Starter source fallback, and three preserved Candidate 1 network-turn semantics lines.

## Presentation Result
- Desktop shared renderer family: PASS by shared source parity
- Tablet Landscape: PASS in real Chromium at 1024x600, 1024x768, 1180x820, 1195x615, 1366x1024
- Tablet Portrait: PASS in real Chromium at 768x1024 and 820x1180
- Phone: PASS in real Chromium at 390x844; shared Candidate 15 responsive CSS is active for 360x800 and 412x915 contract as well
- Shard Landscape quick-preview: PASS
- Shard Portrait quick-preview: PASS
- Shard Phone quick-preview: PASS
- Hero-control / Legacy Effect geometry: Candidate 15 authority active
- Opponent Deck/Pile count-top / label-bottom fix: Candidate 15 authority active
- Hand presentation: Candidate 15 renderer active
- Phase Tracker: Candidate 15 renderer active
- Card Played / Detail / inspection renderers: Candidate 15 renderer active

## PvP Authority
- Server remains authoritative: YES
- Viewer-safe snapshot path remains the source of PvP rendering.
- `pvp-network.js` imports server board snapshots through `GL_PVP_PRESENTATION_ADAPTER`, which delegates to the shared bridge without locally mutating authoritative match state.
- Hidden opponent identities are not added by Candidate 2.

## Candidate 3 Deferred Wiring
Candidate 2 intentionally does not broadly rewrite the final gameplay intent/network protocol. Full server-authoritative action wiring remains Candidate 3 scope.

## Validation Actually Executed
PASS:
- `node --check public/js/app.bundle.js`
- `node --check public/js/pvp-presentation-adapter.js`
- `node --check public/js/pvp-network.js`
- `node tests/run-runtime-bridge-test.cjs`
- `node tests/run-package-check.cjs`
- `node tests/run-v343-candidate2-ui-parity.cjs`
- `node tests/run-v343-candidate2-browser.cjs`
- `GL_WEBSITE_SOURCE=/mnt/data/site_ref node tests/run-v343-candidate1-lobby-browser.cjs`
- Candidate 1 authority / asset checks executed through `npm test` before dependency-backed server tests were reached.

Environment-blocked in this workspace:
- `npm ci` could not complete because registry access timed out.
- `node tests/run-server-health-test.cjs` could not start the server because the external `ws` dependency is not installed in this execution environment.
- Therefore room/reconnect/spectator server-backed tests and the aggregate `npm run verify` are **not claimed PASS** in this Candidate 2 report.

## Status
**PARTIAL** — Battlefield/UI/Responsive presentation parity is implemented and browser-validated; dependency-backed server verification remains to be rerun in an environment where `npm ci` can install `ws`.
