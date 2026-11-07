# MANA STEAL — Designer correction, 2026-11-06 (STAGING ONLY)

**Reference:** RC24 release ZIP remains unchanged. This is a targeted correction in the accumulated staging working tree, **not a new RC**. OSA DEV45, official card texts/art and Player Rulebook v2.9 are **unchanged**.

## Designer's confirmed behavior (supersedes earlier staged MANA STEAL repair)

MANA STEAL X comprises **two distinct, ordered steps**:

1. Remove **up to X physical Mana Shards from the opponent's Mana Pool**, based **only** on how many physical Shards are present in that opposing Mana Pool. Return the selected opposing Shards to their owner's Mana Deck (blind selection as before).
2. Then draw from the acting player's **own Mana Deck** into their own Mana Pool, **up to the number of opponent Mana cards actually removed**, subject to actual available own Mana Deck cards and the maximum 12 physical Shards in the acting Mana Pool. If own Pool/Deck capacity is insufficient, the opposing Shards already removed **are not refunded**; drawing fewer than were removed is legitimate.

The opponent removal count must never be capped by the acting player's available Mana Deck/Pool space. The sum of physical Mana Deck + Mana Pool remains exactly 12 for each side independently. A standalone effect-only Steal requires at least one opposing Mana Shard but does not require receiving capacity; a connected-damage Mana Absorption continues to resolve damage independently.

| Scenario at resolution | Opponent removes | Acting player's own draws |
|---|---:|---:|
| MANA STEAL 2; opponent Pool=5; own Pool=11, Deck=1 | 2 | 1 |
| MANA STEAL 2; opponent Pool=1; own Pool=4, Deck=8 | 1 | 1 |
| MANA STEAL 2; opponent Pool=5; own Pool=12, Deck=0 | 2 | 0 |
| MANA STEAL 2; opponent Pool=5; own Pool=10, Deck=2 | 2 | 2 |
| MANA STEAL 2; opponent Pool=0 | 0 | 0 |

## Why changed

The prior staging repair (STAGED-03) incorrectly **limited opponent Mana removal by the acting player's own receiving capacity**. The designer clarified that the core effect is denying Mana to the opponent; the gain is second and independently capacity-limited. The previous staged 16/16 test expectations that required symmetrical removal/gain are **superseded**, not to be treated as the present acceptance criteria.

## Specific changes

In `engine/shared-app/app.bundle.js`:

- `manaStealEffectiveCount` now checks **requested X and opposing Pool count only**.
- `finishOpponentManaInteraction` no longer truncates selected opponent Shards by own receiving capacity. `drawManaCards` continues to cap the own draw naturally at own Mana Deck availability and Pool capacity 12.
- `validateCardPreconditions` on effect-only Steal requires opposing Shards to exist, **not** own drawing capacity.
- `startOpponentManaSelection` inherits the opponent-only removal count; blind choice and PLAYER/AI interaction architecture preserved.

## Verification / limitations

- Test script: `/mnt/data/keyword_audit/mana_steal_designer_ruling_probe.js`, runner `.py`; recorded JSON `MANA_STEAL_DESIGNER_RULING_QA.json`.
- Chromium-injected engine controlled-state matrix: **68/68 PASS**, tested both PLAYER and AI across five scenarios, including no own receiving capacity, opponent shortage, standalone Steal legality and both players' 12-card conservation; no JS page errors.
- MANA BURN regression script rerun: PASS, no page errors.
- This does not prove a complete browser-driven normal match or every future card/Response scenario. The designer explicitly waived separate full-match/Firefox acceptance for this release phase.
- The current printed Player Rulebook v2.9 keyword summary says “then take the same number” for MANA STEAL. If this new ruling is meant to be reflected in published wording, synchronize the future rules/OSA update separately; DO NOT change source authority silently.
