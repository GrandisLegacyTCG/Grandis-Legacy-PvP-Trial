# RC32 — Primal Strike + Burn (same-version maintenance, 2026-11-07)

## Designer ruling
Primal Strike is a Racial Trait, not a Skill/Attack Card. If Primal Strike deals positive Physical HP damage after the Defense Response, a target with Burn takes **+10 additional damage**. It does not trigger a Skill-Card-only ability such as Poison Vial.

- Injured target without Burn, no Response: **20**.
- Injured target with Burn, no Response: **30** (20 Physical +10 Burn).
- Burn + Dodge: **0**; Burn + complete Block/reduction: **0**; **INVINCIBLE**: **0**.
- Burn + partial Block/reduction with positive base damage: **remaining base +10**.
- Burn is a status, not consumed by this bonus; stacking duration does not multiply +10.

## Implementation
`engine/shared-app/app.bundle.js`: `resolveAbilityDamageResponseWindow` now reuses the existing `burnIncomingDamageBonus` helper for Primal Strike, after Defense and before HP subtraction; logs the +10 and queues the Burn status indication. The same ability-damage branch checks the existing `opponentInvincibleStatusProtection` function so the new Burn bonus cannot bypass any existing INVINCIBLE source (instead of only checking the side-wide Blessing). `aiChooseBattleFinisherRacialAction` recognizes a Burned target up to 30 HP as a potential finisher, compared with 20 without Burn. Existing Physical VFX/SFX, responses and Skill-Card-only triggers remain in place.

## Rulebook
A complete same-version Player Rulebook v2.9 PDF with a clarified Burn row and a Primal Strike note on printed page 14 is bundled under `docs/rulebook/`. The external original source and official Machine Rules v1.1.5 JSON/YAML remain unchanged; those external machine files should be synced separately if adopted as authority for other applications.

## QA
See `RC32_PRIMAL_STRIKE_BURN_QA.json`. Focused browser integration and ZIP integrity are verified only when recorded; full natural match, native Firefox and real-device sound remain NOT VERIFIED.
