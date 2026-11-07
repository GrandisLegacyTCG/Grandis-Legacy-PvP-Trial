# RC15 — UI Update, Deck Builder Import & Focused QA

**Authority/baseline:** VS AI Season 0 RC14; OSA Season 0 DEV45 remains read-only. Approved by designer 2026-11-05 after the complete UI issue list. No card balance/canonical rules altered. All six-stage RC14 effects retained.

## Authorized implementation

1. Deck Builder v1.58 Season 0 native JSON: accept both top-level and `deck` nested main/shard/legacy arrays, expand three `legacy_packages` into 12 Hero/Legacy identities, infer slots from formation, validate S0 IDs, 50 Main, 12 Mana, legal Color Mana, and legal copy limits. Source Deck Builder unchanged. Preserve its deck name.
2. Bard/Maestro: automatic center-stage Draw Phase choice reusing existing authoritative `s0_bard_draw_choice`. Full Hand selection, up to 1/2, `DISCARD & DRAW`, `SKIP`; speculative selection never changes Hand/Deck/Discard; AI still uses original path. No duplicate small Hero ability button during center choice.
3. STATUS feedback: Poison when actually applying owner-End damage, Burn indicator on connected attacks even when fully Blocked (does *not* apply extra damage contrary to Rulebook), Freeze hint before a Response, Sleep two upper-right diagonal Z icons upon owner's Battle entry. No floating HP numbers; no extra Stun effect. Restore Sleep status icon using readable in-app glyph fallback.
4. Enlarge and make responsive all top-right Hero/Racial/Legacy actions.
5. Fit 12 face-down/face-up Mana Shard cards horizontally in their Pool through geometry-based overlapping. Responsive layout recomputed on window resize.
6. Generic Tactical/Event/Item reactive counter is now prohibited against all Ultimate cards, including Double Casting. Non-Ultimate response path unchanged. Offer and final commit both guarded.
7. STATUS countdown unchanged; timed non-Casting Attachments *display* elapsed count-up 0→1 etc using immutable `initial_count`, without changing actual authoritative expiry tick. Casting continues its preexisting progress behavior. Persistent attachments without timers have no counter.
8. INVINCIBLE shimmer only when preventing positive damage; actual REFLECT moves attacking Hero one direction, distinct from two-way DODGE; no extra numbers.
9. A Defense Item displays a single Active Card → protected Hero arrow; Flashpowder Bomb has no arrow to Discard; textual outcomes are not visual target zones.
10. Anchor Battle attack/defense/other VFX to precise visible Hero image bounds instead of the potentially rotated physical stack.

## Focused verification (inline Chromium)

- **Deck Builder formats:** five S0 official starter decks × nested and flat export = **10/10 accepted**. Three deliberately invalid decks rejected (0 Legacy packages; incorrect Main count; bad Hero ID); JavaScript errors 0.
- **Bard/Maestro stage:** center UI appears for Bard and Maestro; selecting Card enables confirmation; Bard SKIP even after selection causes **0 Discard**; Maestro selects two then confirms to Discard **2** and Draw **2** (Hand count unchanged). JavaScript errors 0.
- **Mana responsive:** 12 visible Mana card elements in the Player Pool at viewport widths 820, 900, 1024, 1280, and 1600 px. Geometry showed no right-side overflow. This is a 12-card DOM geometry fixture, not a naturally played 12-card Mana match.
- **S0 built-in regression:** Ultimate Tribute **30/30 PASS**; Target Selection **13/13 PASS**; RC6 Class/Lineage regression **PASS**. No Chromium page JavaScript errors observed in these runs. JS syntax (`node --check`) passed.
- **Boundaries:** status VFX, arrows, actual hosted user report Battle center, and full Human-vs-AI Game Over path are not exhaustively mouse-tested. Don't claim final or universal 242 card PASS. No official OSA, Deck Builder, PvP or Tutorial app changed.

## Next

Run normal browser-hosted match (not Surrender) and manually verify user-reported VFX positioning, nested Response Ultimate/Tactical Adaptation, Item Defense arrows, 12 Mana in a natural match, Bard/Maestro appearance after Draw, and timed attachment counters at 0/1/expiry. If issues reported, investigate first; do not patch automatically.
