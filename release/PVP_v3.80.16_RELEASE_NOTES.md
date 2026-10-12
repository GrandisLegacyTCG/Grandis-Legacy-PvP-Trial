# Grandis Legacy PvP v3.80.16 — Release Notes

Date: 2026-10-13

## Gameplay-critical fixes

### Mana is committed before reactive cancel priority

When PAY is accepted for a normal Skill/Item/Event, the exact authoritative Shards are now spent before an Intercept/Flashpowder/reactive-cancel window is opened.

Example: a player with 4 Mana pays 3 for an Event. The authoritative Shard Pool immediately represents the remaining 1 Mana before the opponent chooses Intercept. Any later counter-response legality therefore uses the post-payment resource state. If the played card is canceled, its committed Mana is not refunded. The action is marked as already paid so PASS/cancel continuation cannot double-spend it.

### Response payment can be canceled before PAY

A selected Response that still requires Mana/additional-cost payment is now pre-commit until PAY.

- PAY: spend Mana/additional costs and commit the Response.
- CANCEL: restore the original Response Window, clear the selected Response, keep the Response card in Hand, and spend nothing.

All centered Response PAY MANA screens expose CANCEL before commitment.

## Battle presentation fix

Low-latency battle audio remains immediate, but geometry-dependent battle VFX no longer fires before the authoritative board is imported/rendered. The authoritative event is replayed after render with sound suppressed, so P.Atk/M.Atk/other target-anchored visuals resolve against current target geometry on desktop and transformed tablet stages without playing the SFX twice.

## Regression coverage

Added/updated checks cover:

- Event payment reducing authoritative Mana before Intercept priority.
- No illegal counter-response using Mana that should already be spent.
- No double-spend when the chain resumes or the card is canceled.
- Response payment CANCEL spending nothing and restoring Response selection.
- Response payment PAY retaining nested Intercept behavior.
- Early SFX + deferred authoritative VFX split.
- Existing final selected-Shard-UID payment behavior.

## Intentionally unchanged

- Mana selection UX / v6.91.6 exact replacement behavior.
- Center-only PvP Mana selection surface.
- Seat mirroring/privacy/reconnect architecture.
- Response focus and Hand hit-testing fixes from v3.80.15.
