# Candidate 3C — Full Match Regression

## Deterministic scenarios

| Scenario | Starter A | Starter B | Turn count | Rank Ups | Hero defeats | Legacy replacements | Response events | Reconnect | Spectator | Terminal result | Viewer-safe | Result |
|---|---|---|---:|---:|---:|---:|---:|---|---|---|---|---|
| Full canonical lifecycle | starter_01_elemental_lord_conqueror_renegade | starter_02_saint_crusader_grand_ranger | 4 | 1 | 3 | 2 | 3 | BLOCKED by real-WS environment | BLOCKED by real-WS environment | PLAYER victory | PASS | PASS |
| Whirlwind + Stoneblood + Legacy Area chain | starter_01_elemental_lord_conqueror_renegade | starter_02_saint_crusader_grand_ranger | focused resolution | 0 | 3 | 2 | 3 | N/E | N/E | PLAYER victory | PASS | PASS |
| Long-turn stability | starter_01_elemental_lord_conqueror_renegade | starter_02_saint_crusader_grand_ranger | 30 | 0 | 0 | 0 | 0 | N/E | N/E | non-terminal stability run | locked viewer-safe serialization | PASS |

## Full deterministic match details

The full-match harness starts from the canonical shared match/opening flow, then applies a deterministic public gameplay fixture using real Starter, Hero and card IDs. It does not invent test-only cards or gameplay rules.

Sequence:

1. Player A advances to Reform.
2. A real Skill card is Tributed to the Center Hero.
3. Canonical Rank Up changes the Center Hero to Rank II and commits the rank progression result.
4. Turn ownership passes to Player B and back through canonical phase progression.
5. Player A plays three real Attack Skills across LEFT, CENTER and RIGHT in successive turns.
6. Player B receives and passes each canonical Response window.
7. LEFT lethal opens canonical Stoneblood; it is declined; Legacy selection commits.
8. CENTER lethal commits a second Legacy replacement.
9. RIGHT lethal is the third/final Hero defeat and ends the match.
10. Terminal state is verified for both viewer orientations.

Observed final state:

- winner: PLAYER in canonical / seat-1 view
- mirrored seat-2 winner: AI
- terminal reason mirrors PLAYER/AI terminology correctly
- `pending = null`
- `responseWindow = null`
- exactly one GAME END log
- no old-Hero component action remains legal on replaced slots

## 30-turn soak

The long-run harness completed 30 active-player turns, crossing 21 turns and reaching Round 16 from Round 1 under pair-based round semantics. Mandatory hand-limit cleanup was exercised 13 times. After the Candidate 3C hand-limit lifecycle correction:

- round progression remains monotonic
- active-player ownership alternates coherently
- Draw-to-Deploy lifecycle completes
- no stale pending choice remains at completed turn boundaries
- no stale Response window remains
- Hero references stay stable
- no accidental game-end occurs

## Real transport note

Reconnect and spectator fields are not reported as PASS because production `ws@8.21.0` could not be installed in this environment. They remain mandatory Candidate 4 release/deployment gates.
