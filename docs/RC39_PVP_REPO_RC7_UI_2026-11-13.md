# Grandis Legacy PvP Season 0 RC39 — Repo RC7 UI Cleanup

Date: 13 November 2026  
Base: Repo RC6 P3 FULL 13 November 2026, including the previously documented RC5 Mana continuation / blink corrections.  
Networking: RC6 Stage 2 / S1 single WebSocket — unchanged.

## RC7-001 — Damage banner
- Fixed battlefield-centered two-line banner: Skill name / current calculated damage and Physical or Magical kind.
- No target lane, no `before Response` suffix.
- If the response window carries a meaningful printed baseline and the engine-computed incoming amount is different, show `60 Magical Damage → 80 Magical Damage`.
- Formula-driven/nonprinted Skills (e.g. Arrow Barrage) display the actual engine-derived amount instead of a false `0 → calculated` transition. Area/multi-target Skills share one active attack disclosure; the engine's separate Response decisions are unchanged.
- Calculated damage remains visible while a legal Response is pending; do not confuse it with final post-Defense HP loss.

## RC7-002 — Remove redundant overlays; keep synchronized SFX/VFX
- Stop generating `OPPONENT PLAYED`, `FIRE BLAST · DAMAGE`, `BLOCKED!` centered popups and `0 DAMAGE` / `−50 HP` floating Hero numbers.
- Keep Active Card, clickable Card Played, HP bar, directional arrows, synchronized card flights, Attack/status/Defense/Dodge/Heal visual effects, and SFX from the donor battle assets.
- Actual HP recovery now drives the two-sided Heal VFX and one Heal sound, not the mere declaration of a Support/Item.
- For an immediately resolved Magical Attack, publish the correct attack damage type so clients use Magical rather than Physical impact animation/sound. Visual feedback is committed from the server; no duplicate replay on synchronization.
- Keep important `COUNTERED` / `RACIAL TRAIT` outcome notices.

## RC7-003 — Owner-only important information
- Keep the confirmed result notification for actual Shards removed (`Regular` or color Class Shards), and the opponent's effect card or ability that caused it.
- Keep the recipient-only notice naming cards sent to Discard from their Hand, Main Deck, or Field by the opponent (Scouting, Calculated Plan, other mechanics).
- Add **viewer-side** effect facts to the matching played card's history (`effect_results`). On Mana removal, prefer an exact action ID or card ID; fall back to an exact public effect title. Discard events prefer the exact action ID and then the card ID.
- Strip that attached detail from **all spectator journal aliases**. Do not publish affected player's private card identities to the opponent or spectators.
- Notifications use the retained previous centered queue; the +1-second PvP hold remains. A notice may only appear once after authoritative confirmation.

## RC7-004 — Card Played UI/Detail
- Retain card artwork and newest-first click history, including Defense/BLOCK/DODGE/Reaction/Counter.
- Change the thumbnail's bottom badge from `RESOLVED` to blue **YOU** and red **OPPONENT**, without a duplicate small owner label.
- Clicking in PvP opens a concise **Action / Hero / Target / actual HP Damage / HP Restored / EXP Gained / important effect results** summary; multi-hit and Area actual HP deltas are grouped by affected Hero.
- Defense also shows the original Attack's name and, when available, Protected Hero and outcome. Keep NEGATED/COUNTERED in the detail only where applicable.
- Remove `Resolution: RESOLVED`, `Resolved by Runtime`, `AI LEFT`, and other engine-debug language from the PvP detail.

## Deliberately unchanged
- All gameplay rules, card requirements and engine calculations.
- Mana payment, blind Mana removal selection, physical Mana return order and Cancel ownership.
- RC6 Stage 2 single WebSocket, reconnect, room lifecycle, authoritative transaction control.
- VS AI runtime: RC7 is **PvP only**; separate handoff notes exist for applying similar UI improvements to VS AI.
- GitHub and Northflank deployments: manual by project owner.

## QA
Focused tests are `npm run test:rc7`; includes recipient / spectator privacy, public detail fields, direct magical attack VFX event, static UI contract, previous RC6 tests and RC5 Mana continuation/cancel regression. Separately run syntax, static assets, server HTTP / compression smoke tests. These are source and headless tests, **not** visual two-browser gameplay acceptance.
