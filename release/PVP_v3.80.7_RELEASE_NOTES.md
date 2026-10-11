# Grandis Legacy PvP v3.80.7 Release Notes

## Goal

Make Mana Payment testable in the real PvP flow without carrying forward the failed v3.80.6 Class-only/FIFO experiment. This patch deliberately keeps the wider v3.80.x architecture stable so gameplay can be tested beyond the payment gate.

## Mana Payment

- Restored `public/engine/` to the exact VS AI v6.91.4 donor tree.
- Removed the PvP-only auto-FIFO / Class-only payment behavior from the active gameplay engine.
- Normal Mana Shards and Class Shards are selectable according to the donor's exact-payment interaction.
- Shard clicks update only the browser-local mounted donor state; they do not require a WebSocket round-trip.
- The selected Shard identity stays canonical end-to-end through `selected_shard_uids`.
- PAY sends the final selected Shard UID list once.
- The server rejects duplicate/non-pool UIDs, injects the validated final draft into its actor-local donor state, then calls the untouched donor commit once.
- Response payment uses the same final-UID seam and can include final required Hand-discard choice indices.
- Matching Class value, nonmatching Class value, exact cost validation, spending, Response flow, and resolution remain donor-owned.

## Asset loading

- Keeps selected own-deck artwork preload in the lobby as an unordered asset set.
- Keeps opening-board visible asset decode before opening presentation.
- Keeps the dynamic image decode guard so card names/alt text do not flash before artwork.
- Removes full-game `warmAllCardArt()` background preload.
- Does not preload future top-deck order, avoiding a PvP information leak.

## Intentionally unchanged in this patch

- Seat mirroring / actor-local Player 1 and Player 2 orientation.
- Atomic intent-result transport and timeout/resync behavior.
- Viewer privacy projection and public opponent Shard Pool behavior.
- Coin Flip / Opening presentation dedupe.
- Custom Main Deck acceptance remains 50–60 cards.

## Validation target

Automated authority/transport tests now prove both seat orientations for:

- zero-Mana control action (`Meditation`);
- browser-local exact Shard draft without a Shard-click network packet;
- matching Class-only exact payment submitted as a final UID set;
- mixed Event payment using normal Mana + Class Shard;
- invalid and duplicate final UID rejection;
- PAY leaving the Mana gate and normal Response/resolution continuation.

A real two-client browser run is still the final acceptance requirement for the historical DOM/payment regression.
