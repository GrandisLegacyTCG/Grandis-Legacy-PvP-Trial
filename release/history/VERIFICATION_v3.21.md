# PvP v3.21 Verification — 2026-09-01

Result: **PASS**

Verified:
- Custom Main Deck size is accepted only at exactly 50 or 60 cards.
- A 50-card custom deck reaches shared-match startup successfully.
- A 60-card custom deck reaches shared-match startup successfully.
- A 55-card custom deck is rejected as invalid.
- Normal Main Deck cards are limited to maximum 3 copies.
- Ultimate cards remain maximum 1 copy.
- A 60-card deck containing a normal card at 4 copies is rejected.
- Lobby import validation, shared runtime validation, and server-side sanitization use the same 50/60 and copy-limit contract.
- Existing Cover Up / Redirect fresh Defense Window behavior remains passing.
- Pending Attack Direction Indicator regression remains passing.
- Runtime sync verification remains passing.
- Existing gameplay, UI, and mobile regression checks remain passing.
- Package contract, bridge contract, UI contract, and file-manifest verification pass.

Executed successfully:
- `npm run check`
- `npm run test:package`
- `npm run test:bridge`
- `npm run test:ui`
- `npm run manifest`
- `npm run verify:manifest`

Environment note:
- Full WebSocket server/room integration tests were not executed in this sandbox because the `ws` dependency is not installed in the active environment. This does not alter the repository dependency declaration/lock. Static, runtime-bridge, package, UI, sync, and manifest verification passed.
