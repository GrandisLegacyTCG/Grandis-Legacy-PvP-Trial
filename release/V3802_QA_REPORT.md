# PvP v3.80.2 QA Report

## Gameplay parity regressions

- Seat 1 and Seat 2 first mandatory Draw resolve exactly once and automatically enter Deploy.
- Normal opponent Shard Pool cards keep real public identity/UID and remain visible.
- Steal opens face-down opponent-Shard candidates whose UIDs map to the visible pool, accepts selection, commits, and resolves for both seat orientations.
- Paid Event flow is exercised end-to-end for both seats: source selection -> Mana Shard payment -> deselect/reselect -> PAY -> opponent Response pass -> card resolution/discard and Shard spend.
- Opening events preserve real Shard destination UIDs while the presentation owns temporary hiding.
- Opening state is imported with `render:false` before `playOpening`, preventing the normal diff presenter from owning a duplicate animation/SFX pass.
- Coin Flip leaves `.gl-lobby-hidden` active until opening starts and PvP CSS does not override donor `.app` visibility or `.gl-coin-overlay` backdrop.

## Existing regressions retained

- Seat-2 actor-local ownership and Shard ownership.
- Hidden Hand/Main Deck/Legacy-package privacy and private pending/log redaction.
- Surrender -> finished -> return-to-lobby lifecycle.
- Tab-scoped reconnect identity and reconnect-loop hardening.
- Setup-only room reset and build-mismatch recovery.
- Custom Deck 50-card acceptance.

## Donor integrity

The four headless authority sources are hash-locked against VS AI v6.91.4. Donor engine/card-art/runtime trees covered by `V380_DONOR_PARITY.json` are verified by the repository QA.

## Live boundary

A true two-browser WebSocket/browser-animation test is only claimed when the production `ws` dependency and browser runtime are available. Static lifecycle checks plus headless gameplay regressions are not described as a substitute for that live test.
