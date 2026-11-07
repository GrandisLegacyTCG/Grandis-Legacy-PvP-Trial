# GRANDIS LEGACY — VS AI SEASON 0
## Stage 8 final packaging audit — 2026-11-04

**RELEASE STATUS: RELEASE CANDIDATE — NOT YET VERIFIED AS A COMPLETE PLAYABLE RELEASE.**

### Source
- Baseline: original standalone VS AI v6.91.9, carried forward through Stage 7.
- Authoritative Season 0 data: OSA DEV45 with DEV44 pinned consumer exports (read-only); the source application consumes the S0 card data/effect recipes/artwork.
- Original S1 app runtime is retained for UI, existing card-effect handling patterns, AI, Mana/Response interactions; S1 card stats are not the gameplay authority.
- No changes to OSA DEV45, Deck Builder or PvP.

### What was actually rerun for packaging
| Check | Result |
|---|---|
| JavaScript syntax: app bundle, external UI, runtime authority, two adapters | PASS (5/5) |
| Seven pinned S0 consumers, 248 IDs, 242 gameplay registry records, 426 effect branches, 36 bindings | PASS |
| Five starter decks (50 Main / 12 Mana / 12 Legacy), reject invalid decks | PASS |
| 248 current card fronts + 3 backs, SHA validation | PASS |
| Stage 5 targeted gameplay assertions | PASS (18 + 24) |
| Stage 6 Bard/AI assertions | PASS (20) |
| Five fresh Node VM full terminal matches running existing app engine against passive human | PASS (5/5; rounds 16, 14, 17, 13, 29, AI victory) |
| Chromium lobby, coin flip, battlefield/phase progression | PARTIAL PASS based on Stage7 and supplementary browser checks |
| Chromium Game Result UI reached by clicking Surrender | PASS; **terminal UI smoke only** (not an ordinary match) |
| Full natural Human-vs-AI match completed through external Chromium UI | **UNVERIFIED — STILL OPEN** |
| Hosted/GitHub Pages production deployment and physical mobile battle | **UNVERIFIED** |
| Full special-card and tactical AI real-match quality | **NOT CLAIMED** |

The browser full-game automation in this checkpoint did not complete a real match through the original interactive UI. Some runs reached multiple rounds before automation execution timed out. This is not evidence of a specific gameplay bug, and it is not a successful complete browser match. The explicit missing acceptance from Stage 7 remains open. The source is packaged for user-side testing and further verification, not certified production-ready.

### Retained design decisions
- All official S0 card identities, printed cost/damage, abilities and art are supplied by OSA DEV45.
- Existing S1 effect execution handlers are reused when mechanic semantics match, not S1 card data.
- Casting count starts at visible **0**, increments at each **owner End Phase**. Runeforged Burst locks its count when Hit and must release at the following owner Battle Phase.
- Discard-based CONDITION uses existing choice/payment transaction patterns; no partial costs on failed legality.
- AI aims to reserve temporary BUFFs for legal follow-up, use Ultimate when strategically valuable, and manage Bard note cards for discard/return combos; automated scenarios test narrow cases only.

### Release decision
- One coherent source ZIP is delivered with reports and takeover instructions.
- **Do not label this build fully playable/production-verified until an unscripted or automated real UI match reaches normal win/loss/draw, plus hosted-asset smoke.**
