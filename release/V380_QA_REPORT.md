# PvP v3.80.0 QA Report

## Automated release-tree checks

PASS in the release working tree:

- JavaScript/module syntax checks.
- Exact v6.91.3 headless authority source hashes: 4/4 locked sources.
- Five v6.91.3 starter decks available to authority.
- Native v6 PvP popup-ownership self-test.
- Native v6 PvP action-sync self-test.
- Actor-local seat orientation for first player Seat 1 and Seat 2.
- Seat 2 canonical Shard ownership after first-turn Mana Regen.
- Wrong-seat normal phase action rejection.
- Draw completion state allows `NEXT PHASE` for both seat orientations.
- Surrender authority ends the match for either seat.
- Viewer-safe Hand/Main Deck/Shard masking for players and spectators.
- Opponent Legacy package identity masking.
- Opponent last-Draw / presentation metadata masking.
- Blind opponent Shard candidate tokens cannot expose UID/kind/class.
- Blind opponent Hand selection does not expose canonical Hand-index mapping.
- Nested opponent pending payloads are projected through an allow-list.
- Opening opponent Shard event UID/art/class privacy.
- Hidden-zone Battle Log privacy for Draw Review, deck search, Crystal Ball, failed Hand choices, and rollback paths.
- Full public Battle Log history/order preserved after sanitization.
- Seat mirror involution across side-owned state.
- Existing 50-card Custom Deck acceptance regression: PASS.
- v3.80 static handshake contract: no v3.51 runtime shipped and no v3.78 sync layer shipped.
- Authoritative finished-match return-to-lobby contract.
- Setup-only `reset-room` guard.
- Seat-token reconnect guard.
- Kick reconnect fallback to spectator in the normal client flow.
- Build-ID request/connection validation and build-mismatch recovery contract.
- Imported Custom Deck reconnect/refresh retention contract.
- Prototype Local-AI identity badge removal.
- Active standalone asset audit: 200/200 card-art WebP, local Shard/UI/audio paths, zero broken HTML/CSS references.
- Lobby donor asset hashes 5/5, one-line `JOIN AS PLAYER`, 28x28 kick button / 16x16 icon.

## Additional self-check findings fixed before sealing

The final self-check found and fixed issues that were not covered by the first v3.80 pass:

- Crystal Ball and Draw Review could still leak private card names through durable logs after pending state cleared.
- Legacy deck-search result logs could reveal the card added to Hand.
- Failed resolver/Hand-to-EXP logs could reveal a card that returned to a private Hand.
- Seat 2's mirrored initialization log could still reveal both Shard class compositions.
- `aiLegacyPackageSlots` exposed opponent Legacy/progression package metadata even though the Legacy Deck itself was masked.
- Blind opponent-Hand candidate payloads exposed canonical Hand indices.
- An intermediate log sanitizer revision kept the wrong portion of newest-first history; the final code preserves the full history and ordering.

Regression coverage was added for these cases before the release seal.

## Live deployment startup

**UNVERIFIED in this sandbox.**

A production dependency install was attempted with `npm ci --omit=dev --ignore-scripts --prefer-offline --no-audit --no-fund`, but the environment hit a transport timeout and left an incomplete `ws` directory. The incomplete install was removed from the release tree. No claim is made that a real local `/health` startup passed here.

The repository includes `npm run test:startup`, which should be run in CI/deployment after a successful production dependency install.

## Real two-client / device-browser acceptance

**UNVERIFIED in this sandbox.**

No claim is made that a real two-client WebSocket match across deployed desktop/tablet/mobile browsers was executed. Automated server-authority and contract checks are passing; deployed device acceptance remains a separate final acceptance step.
