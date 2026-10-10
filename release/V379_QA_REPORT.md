# PvP v3.79.0 QA Report

## Source / architecture checks

PASS in the release working tree:

- JavaScript/module syntax checks.
- Exact v6.91.3 headless authority source hashes: 4/4 locked sources.
- Five v6.91.3 starter decks available to the authority.
- Actor-local seat orientation for first player seat 1 and seat 2.
- Wrong-seat normal phase action rejection.
- Viewer-safe hand/deck masking for player and spectator views.
- Recognized v6 `commitManaShardPaymentChoice` intent boundary.
- Native v6 PvP popup-ownership self-test.
- Native v6 PvP v1.17 action-sync self-test.
- v3.79 static handshake contract: no v3.51 runtime shipped, no v3.78 sync layer shipped.
- Explicit intent acknowledgement + revision snapshot queue release contract.
- Coin Flip black/inert/no-pointer presentation gate contract.
- Active standalone asset resolver audit: 200/200 card-art WebP, local Shard/UI/audio paths, zero broken HTML/CSS refs.
- Exact donor tree parity for v6.91.3 engine/card-art/shared-ui/runtime and the v6 asset subset.
- Lobby donor asset hashes 5/5, one-line JOIN AS PLAYER contract, 28×28 kick button / 16×16 icon.

## Live deployment startup

**UNVERIFIED in this sandbox.**

A production dependency install was attempted with `npm ci --omit=dev --ignore-scripts --prefer-offline --no-audit --no-fund`, but the environment hit a transport timeout before `ws` was installed. No claim is made that a real local `/health` startup passed here.

The package includes `npm run test:startup`, which must be run in CI/deployment after a successful production dependency install.

## Real two-client / device-browser acceptance

**UNVERIFIED in this sandbox.**

No claim is made that a real two-client WebSocket match across desktop/tablet/mobile was executed. The architecture/source/authority regressions above are automated; deployed device acceptance still requires an actual session.
