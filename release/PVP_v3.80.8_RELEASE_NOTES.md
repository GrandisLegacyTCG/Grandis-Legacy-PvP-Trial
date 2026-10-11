# Grandis Legacy PvP v3.80.8

Date: 2026-10-12

## Scope

This patch deliberately narrows work to the critical Mana/payment path needed to unblock real gameplay testing. It does not attempt a broad PvP architecture cleanup.

## Critical payment changes

- Restored VS AI v6.91.4 exact-Shard payment semantics: every visible Mana/Class Shard in the centered payment row may be selected, with the donor recommendation preselected.
- Removed the real battlefield Shard Pool as a payment input surface. Battlefield Shards are presentation/hover only during payment.
- Removed the separate legacy battlefield PAY controller. The centered payment UI is the only PAY owner.
- Browser Shard clicks now modify only an ephemeral UI UID draft. They do not call the donor bridge and do not mutate gameplay state locally.
- PAY sends the final selected canonical Shard UIDs once to the authoritative server.
- Server validates duplicate/foreign/non-pool UIDs, injects the validated selection into the authoritative pending payment, then calls the untouched v6.91.4 donor commit once.
- Response Mana payment uses the same center-only UID-draft/final-commit boundary, including additional Hand-cost draft selection when required.

## Input divergence fix required to reach payment

- PvP battlefield clicks now stop before the donor legacy body click router can run a second local gameplay mutation.
- Legal Hero panel clicks route through the PvP authoritative handler even when the user clicks HP/status/empty panel space rather than the Hero card image.
- This specifically targets the observed Meditation/source-selection rollback where the browser advanced locally while the server remained on the earlier pending choice.

## Preserved behavior

- Active gameplay donor remains byte-identical to VS AI v6.91.4.
- Seat mirroring remains in place.
- Existing artwork decode/preload protection remains in place; no top-deck-order preloading is introduced.
- Opponent blind Shard selection remains a separate authoritative effect and is not changed by the Mana-payment input cleanup.

## Verification target

Automated checks cover both seats, exact normal/Class/mixed payment values, final UID validation, response payment transport, zero-Mana Meditation authority flow, donor integrity, assets, manifests, and deployment static readiness.

Real two-browser WebSocket behavior must still be confirmed in a deployed/browser environment before this patch is treated as a proven gameplay fix.
