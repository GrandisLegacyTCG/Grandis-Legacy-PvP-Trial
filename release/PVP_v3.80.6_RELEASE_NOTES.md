# Grandis Legacy PvP v3.80.6 Release Notes

## Primary fix

- Replaced the fragile `intent-ack` + later snapshot correlation and silent client intent queue with one atomic `intent-result` carrying the authoritative viewer-safe snapshot for the originating browser.
- Exactly one gameplay action may be in flight; busy clicks are rejected instead of silently queued.
- Added timeout recovery that releases the action gate and requests an authoritative resync.
- Keeps the battlefield non-interactive until Opening is globally complete and match status is `started`.

## Mana payment regression protection

- Normal Mana Shards remain automatic FIFO and non-clickable.
- Class Shards remain the only manual Shard selection for Skill/Event payment.
- Class toggle and PAY both use the same atomic gameplay transport.
- PAY only sets the center payment UI busy after the transport actually accepts the commit request. A rejected/busy send can no longer freeze the payment overlay.

## New transport tests

- Zero-Mana `Meditation`: browser intent gate -> authority -> result snapshot -> resolve.
- Class-Shard toggle: browser intent gate -> authority -> result snapshot -> selected state.
- PAY: browser intent gate -> authority -> result snapshot -> payment pending exits and selected Class Shard is spent.
- No silent action queue and timeout/resync recovery are separately regression-tested.
