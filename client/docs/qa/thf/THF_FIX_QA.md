# VS AI Season 0 — THF Stage 3/6 Authorized Fix QA

**Date:** 2026-11-05  
**Status:** Working copy only, **no version increment / no release ZIP**.  
**Base:** RC13 Card Review UI + authorized ARC and WAR repairs.  
**Authority:** OSA S0 DEV45 / DEV44 consumer current printed card data, Player Rulebook v2.9, previously implemented S0 damage/Response pipeline. OSA, Deck Builder, PvP and S1 sources unchanged.

## Authorized defect corrections (seven groups)

| ID | Card(s) | What changed | Focused evidence |
|---|---|---|---|
| THF-01 | X Cross Slash (`S0-THF-009`) | Bound exactly `S0-THF-007` Horizontal Slash and `S0-THF-008` Vertical Slash as **mandatory physical Hand discards**. PLAYER and AI pre-PLAY and authoritative commit reject missing prerequisites; spend exactly 3 Mana and discard both before resolution, or nothing. Reactive pre-counter payment also commits the Hand condition. | Valid/missing scenarios, card zones, Mana, Exhaust, 90-damage response, and AI legality pass. |
| THF-02 | Back Slash (`S0-THF-010`) | Removed the old 40/50 S1-style overrides from both base-damage paths. Uses official S0 rows 50/60 and Renegade passive +10 once. | Thief 50, Rogue 60, Renegade 70 pass. |
| THF-03 | Smoke Screen (`S0-THF-004`) | Gate on Casting **and** Ultimate in Response type, option list, availability message, revalidation before paid Response commit, and final resolver. Ordinary Single Target Attack remains negatable/returned. | Ultimate Lethal Venom excluded; Casting excluded; ordinary paid attack negated/returned. |
| THF-04 | Venom Sovereign (`S0-THF-015`) | Source-backed app-local 40 Magical conditional follow-up against a Poisoned Hero in the existing after-primary component pipeline (no unrelated WAR/MAG card data edits). Reuses existing DODGE/NEGATE gating and primary BLOCK separation. | Rogue: 20/60, Renegade: 40/80 unpoisoned/poisoned; DODGE prevents follow-up; primary BLOCK behavior checked. |
| THF-05 | Venom Binding (`S0-THF-017`) | Removed Renegade-only, **unprinted** queued Mana removal. Printed Magical Attack + Poison behavior left untouched. | No `REMOVE_ONLY` interaction added by the card. |
| THF-06 | Deflection (`S0-THF-022`) | Added to existing source-row `REFLECT` handler on a **connected Hit**, only when its actual printed Rank/Lineage row contains REFLECT. Existing Physical-only BLOCK is unchanged. | Rank I 0, Spell Blade II 20, Arcane Duelist III 20 retaliation, while BLOCK70 remains effective. |
| THF-07 | Shadow Switch (`S0-THF-023`), Jump Slash (`S0-THF-002`), common reposition consumers | Reject both Stun and Freeze for card-effect Swap participants at candidate selection **and final Swap commit**. Shadow Switch with required illegal swap is not offered in Response. | Stunned partner and source excluded, Frozen partner excluded, normal option still present; paid Shadow Switch incident no longer available. |

## QA method / results

- **THF focused regression:** **35/35 PASS** in injected real Chromium app-engine context, page JS errors **0**. Evidence: `THF_FIX_QA.json`. Includes payment/Hand/Discard/HP, ordinary Smoke Screen paid response, AI X Cross pre-PLAY and Poison follow-up DODGE/BLOCK.
- **WAR post-THF regression:** **36/36 PASS**, no browser JS errors. S0 target selection **13/13 PASS**, Lineage **6,975 PASS**, Ultimate Tribute **30/30 PASS** (15 Ultimates × PLAYER/AI).
- **ARC post-THF regression:** six Status stacking cases PASS; six cap cases PASS; Sleep legality/wake/DODGE probes PASS; 96 Skill Attack damage type classifications match expected (40 Magical, 56 Physical); Magical-only Defense routing PASS; browser page errors 0.
- `node --check engine/shared-app/app.bundle.js` PASS.

### Proof limits

These checks are targeted injected Chromium engine exercises, **not** exhaustive mouse-driven UI matches or 42/42 THF end-to-end card plays, and **not** proof of full Human-vs-AI playability. The 35-case number counts assertions against focused scenarios; do not treat it as coverage of all possible card interactions. Existing historical S1-specific self-tests may still assert obsolete X Cross, Back Slash, Venom Binding, or other card values; those are not Season 0 authority.

**Pending separate audits:** CLE 4/6, MAG 5/6, EVT/ITM 6/6; previous Deck Builder import/Chain Mail investigation, OSA potion review. All further bug reports remain inspect-first; no automatic changes. Do not increment version or generate release ZIP until all six stages have authorized corrections and combined QA, then make a release decision. Preserve this report and the updated `docs/TAKEOVER_NOTE.md` in the staged source.
