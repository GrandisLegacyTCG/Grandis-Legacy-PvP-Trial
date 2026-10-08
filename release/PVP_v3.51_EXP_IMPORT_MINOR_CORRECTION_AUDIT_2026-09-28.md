# Grandis Legacy PvP v3.51 — EXP / Invalid Import Same-Version Correction Audit

Date: 2026-09-28

## Version

- PvP: **v3.51 — SAME-VERSION CORRECTION**
- Website mirror target: **v1.40 — SAME-VERSION CORRECTION**
- OSA / Source Authority: **v1.9.5 — unchanged**
- Player Rulebook: **v2.6 — unchanged**
- Gameplay semantics changed: **NO**

## Scope lock

This correction changes exactly two presentation / interaction areas:

1. Hero EXP Ready / Exhausted physical-size parity.
2. Invalid custom Deck Import feedback / recovery interaction.

No AI gameplay planner, card effect, Response legality, damage, Mana/Shard, Tribute, Rank, Reposition, defeat/revive, phase/turn, or network gameplay-authority logic was intentionally changed.

## EXP Stack

### Old root cause

Active production owner: `public/js/app.bundle.js`, function `v628SyncHeroExpStackGeometry()`.

The Exhausted branch derived physical dimensions from an explicit special scale:

`exhaustScale = .86`

This made Exhausted EXP approximately 14% smaller than Ready EXP.

### Final correction

The exhausted-only scale was removed at the geometry owner. Exhausted geometry now uses the same physical card length as Ready geometry; only orientation / anchor changes.

No CSS `scale()`, `zoom`, viewport compensation, or late `!important` sizing patch was introduced.

Active CSS authorities `public/css/app.css` and `public/css/battlefield-authority.css` were audited; their orientation-aware slot rules consume the JS geometry variables and did not require an additional scale override.

### Real Chromium geometry

Production Battlefield DOM, same semantic Hero/EXP state:

| Viewport | Ready long dimension | Exhausted long dimension | Ratio |
| --- | ---: | ---: | ---: |
| 1366×768 | 170 px | 170 px | 1.00 |
| 1024×768 | 172 px | 172 px | 1.00 |
| 768×1024 | 110 px | 110 px | 1.00 |
| 390×844 | 133 px | 133 px | 1.00 |

Both Player 1 and Player 2 were tested. EXP count matrix 0 / 1 / 2 / 3 / 4 passed. Repeated Ready → Exhaust → Ready → Exhaust → Ready retained the same physical dimensions without progressive shrink or anchor drift.

- Old Exhaust scale: **0.86**
- Exhaust-only scale removed: **YES**
- Ready physical scale: **1.00**
- Exhausted physical scale: **1.00**
- Ready / Exhaust ratio: **1.00 — PASS**
- Player 1: **PASS**
- Player 2: **PASS**
- Desktop: **PASS**
- Tablet landscape: **PASS**
- Tablet portrait: **PASS**
- Phone: **PASS**

## Invalid Deck Import

### Old root cause

Active PvP import owner: `public/js/pvp-network.js::importCustomDeck()`.

Invalid import feedback was written into the Deck Setup / connection-status presentation instead of acquiring top interactive modal ownership. The Deck Setup surface could therefore remain the active interaction layer while the error was displayed. In addition, the PvP import path duplicated only a subset of deck validation rather than routing through the shared canonical `validateDeck()` owner, which could allow partial client-side custom-deck state mutation before a server-side rejection for package-level validation.

### Final correction

- Invalid import now uses the existing `.pvp-utility-modal` top-layer architecture.
- `#pvpSetupOverlay` becomes inert / aria-hidden / pointer-blocked while the error modal owns focus.
- Dismiss restores prior setup ownership and focus.
- No arbitrary giant z-index was added.
- The file input is reset before async parsing so the exact same invalid file can immediately trigger the import handler again.
- Client import validation now reaches the existing shared canonical `validateDeck()` through `GL_LOCAL_AI_BRIDGE.validateImportedDeck()` before any custom-deck state mutation.
- Invalid input does not send `set-deck` and does not replace the current valid deck / Ready server state.

### Real Chromium production import path

Both Player 1 and Player 2 tested at 1366×768, 1024×768, 768×1024, and 390×844.

Invalid cases:

- 49 Main Deck: **REJECTED**
- 61 Main Deck: **REJECTED**
- unknown card ID: **REJECTED**
- illegal copy count: **REJECTED**
- invalid Ultimate count: **REJECTED**
- invalid Hero package: **REJECTED**
- invalid Legacy package: **REJECTED**
- malformed JSON: **REJECTED**

For every invalid case:

- error topmost / visible: **PASS**
- dismiss button clickable: **PASS**
- click-through to Deck Setup: **NO**
- current valid deck preserved: **PASS**
- no `set-deck` network mutation: **PASS**

Valid cases:

- 50 cards: **PASS**
- 55 cards: **PASS**
- 60 cards: **PASS**

Same-file retry sequence:

invalid A → fail → dismiss → invalid A again → handler fires again → **PASS**.

## Locked regression

- Flashpowder nested committed Response: **PASS**
- Execute → Tactical Adaptation: **PASS**
- Tactical → Intercept: **PASS**
- Block / Dodge / Negate lifecycle: **PASS**
- Held Attack cleanup: **PASS**
- Authoritative Attack / Block / Dodge / Negate VFX/SFX: **PASS**
- Sound OFF: **PASS**
- Sound OFF → ON same-family playback: **PASS**
- Custom Main Deck 50–60 inclusive: **PASS**
- 49 / 61 rejection: **PASS**
- two-seat production-handler/runtime integration: **PASS**
- reconnect / spectator / hidden information / Surrender: **PASS**
- Kick layout regression: **PASS**
- mobile Draw / render continuity / timer / connection continuity: **PASS**
- canonical cards: **200 / 200 — PASS**
- official Starter Decks: **5 — PASS**, still 60-card Main Decks

### Live WebSocket environment note

A true standalone production Node/WebSocket boot cannot run in this sandbox because the release intentionally has no `node_modules`, and the external `ws` dependency is not installed. Direct `node server.js` reports `ERR_MODULE_NOT_FOUND: ws`.

This is reported as an **external environment blocker**, not a fabricated live-server PASS. Production server handlers and canonical runtime two-seat integration pass through the existing transport-only test harness.

## Build / package gate

Final source bytes are followed by normal repository regeneration of generated data, Runtime Sync v2.63 lock, frontend manifest, root manifest, and Website mirror. Final packages are fresh-extracted and revalidated before release certification.
