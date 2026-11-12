# RC39 Intermediate AI — Aura Infusion Bolt 2-Turn Combo Guard

Date: 12 November 2026. Base: RC39 Intermediate Target / Mana Banner Hotfix, with the revised PvP donor adapter.

## Cause found

1. The previous Aura cast gate applied only to Starter 4, so Intermediate AI with custom decks could CAST Aura without any Draw support.
2. A support card could be in Hand but not truly usable during the next Deploy phase (Casting source stays Exhausted, Attachment slots, Mana costs, and Replenish's Discard condition matter).
3. Earlier planner did not consistently model Quick Reload's two actual Draw events versus only one extra card in Hand, creating false future capacity assumptions.
4. The ordinary Draw-2 Hand threshold and Dreadbolt hold could postpone advancing an Aura that was already Casting, creating 3+ turn progress.
5. Before casting Aura, Draw supports were freely played for generic Hand refills even while an Aura remained in Hand or Main Deck.

## Revised policy (Intermediate ONLY)

- Never CAST `S0-ARC-021` unless at least one **usable, already-held, genuine Main Deck Draw card** produces a 1- or 2-Draw-Phase path to five counters. The plan may use only one extra Draw 1: `Camouflage` or `Replenish` (if its legal Archer discard returns exist), as well as `Reload`, `Singularity Reload`, `Market Bargain`, and other verified Deploy Draw cards.
- Next-turn support legality is tested after simulating Aura payment, the Casting Hero's Exhaust state, Aura's Attachment slot, and upcoming Mana Regen. No speculative top-deck Draw card is assumed.
- 1-turn path: Quick Reload 2 actual Draws + `Singularity Reload` 3 = 5.
- 2-turn path: first Quick Reload 2 + a legal Draw 1 (`Camouflage`/`Replenish`) + next Quick Reload 2 = 5. A Draw 2 also suffices in two turns.
- Prioritize the real Draw enabler once Aura is casting. Do not delay it because the Hand is above four cards or because Colossal Dreadbolt is also in Hand; respect actual Hand room.
- **Conserve ALL real Main Deck Draw cards** (including conditional Draw riders) while any unplayed Aura remains in AI Hand or AI Main Deck and Alden/Arbalest is alive. Also value them higher during Hand-limit discard and ordinary Tribute selection.
- Limited exceptions: needed to complete a *live* Aura, a proven same-turn Dreadbolt finisher, a match-winning Attack whose own Draw rider triggers, or emergency 2-or-fewer-card Hand starvation when Aura itself is not held.
- Normal Draw strategy resumes as soon as no unplayed Aura remains in Hand or Main Deck, or Alden/Arbalest has been defeated.
- This changes **AI choices only**. Aura card mechanics, player card use, Beginner AI, legal action validation, Rank Up, targeting, Mana banner, artwork and inactive PvP donor adapter are unchanged.

## Verification

- New targeted VM scenarios: **21/21 PASS**, including Starter 4 and custom deck, Camouflage/Replenish Draw 1, Singularity 1 turn, Market Bargain 2 turns, pre-cast support conservation, live Aura advancement at Hand >4, actual engine Draw counters across 1- and 2-turn paths, Dreadbolt conflict, defeated Arbalest, Hand-value retention.
- Existing Intermediate target 12/12 PASS, Mana / Beginner 20/20 PASS, Heal / Import 37/37 PASS, Tribute 38/38 PASS, Mana-loss / banner 13/13 PASS, 25/25 seeded pair matches finished with no recorded errors.
- RC38 Draw-2 regression (Hand 4 threshold) updated to reflect intentional exception: an Aura already Casting at 2/5 counters may use a Draw 2 at Hand >4 to progress toward the second-turn deadline. Existing unrelated tests pass.
- `GL_RC36_1_S4_DRAW_POLICY_QA_SELF_TEST` was already stale (23 failures against previous RC39 build); its historical assumptions about draw usage and Dread heuristics are not used as the release gate. Use the dedicated RC39 Aura Combo suite instead.

## Limits

This is a decision policy, **not a forced two-turn auto-resolve**. If the opponent negates a necessary Draw, defeats/stuns/sleeps the caster, removes the support card, or empties the Main Deck, the normal Rulebook casting mechanics remain authoritative. This implementation was tested with engine VM and seeded simulations, not manually through Firefox. The PvP server was not modified. No GitHub commits or pushes.
