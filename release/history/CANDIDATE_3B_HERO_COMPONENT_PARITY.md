# Candidate 3B — Hero Component Parity

**Candidate:** PvP v3.43 Candidate 3B  
**Hero Component Authority:** v1.1.0  
**Result:** PASS

## Reconciliation result

- Before Candidate 3B, `runtime/pvp/draw-review-runtime.mjs` independently implemented Draw Review / Quick Reload / Rapid Chamber outcome logic. Classification: **DUPLICATE gameplay authority**.
- Candidate 3B retires that module from the active repository. `server.js` now provides only a thin transport alias from `confirmDrawReplacement` to canonical `commitDrawReplacementChoice`.
- Draw replacement, shuffle/redraw, Rapid Chamber passive continuation, Aura counter progression, Mana/phase continuation, and related outcomes are resolved by the canonical Candidate 15/shared runtime.
- No active PvP-specific Hero Component rules remain as a parallel outcome authority.

## Authority inventory

- Racial Trait definitions: **6**
- Class Ability definitions: **16**
- Hero profiles: **10**
- Hero rank compositions: **30**
- Legacy Mode definitions: **10**

## Active component assignments

| Hero / Card | Component Type | Component ID | Canonical Runtime Path | PvP Adapter Path | Duplicate Rule? | Test | Result |
|---|---|---|---|---|---|---|---|
| Korvak Ironfang — Rank I (S1-ARC-H001) | Racial Trait | `RACIAL-BEASTMAN-PRIMAL-STRIKE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Korvak Ironfang — Rank II (S1-ARC-H002) | Racial Trait | `RACIAL-BEASTMAN-PRIMAL-STRIKE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Korvak Ironfang — Rank II (S1-ARC-H002) | Class Ability | `CLASS-MARKSMAN-SHARPSHOOTER` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Korvak Ironfang — Rank III (S1-ARC-H003) | Racial Trait | `RACIAL-BEASTMAN-PRIMAL-STRIKE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Korvak Ironfang — Rank III (S1-ARC-H003) | Class Ability | `CLASS-GRAND-RANGER-DEAD-EYE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Alden Sterling — Rank 1 (S1-ARC-H004) | Racial Trait | `RACIAL-HUMAN-HUMAN-AMBITION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Alden Sterling — Rank 2 (S1-ARC-H005) | Racial Trait | `RACIAL-HUMAN-HUMAN-AMBITION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Alden Sterling — Rank 2 (S1-ARC-H005) | Class Ability | `CLASS-ARBALEST-QUICK-RELOAD` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Alden Sterling — Rank 3 (S1-ARC-H006) | Racial Trait | `RACIAL-HUMAN-HUMAN-AMBITION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Alden Sterling — Rank 3 (S1-ARC-H006) | Class Ability | `CLASS-GRAND-ARBALEST-RAPID-CHAMBER` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Elara Heavens — Rank I (S1-CLE-H001) | Racial Trait | `RACIAL-ELF-ANCESTRAL-FOCUS` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Elara Heavens — Rank II (S1-CLE-H002) | Racial Trait | `RACIAL-ELF-ANCESTRAL-FOCUS` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Elara Heavens — Rank II (S1-CLE-H002) | Class Ability | `CLASS-PRIEST-HOLY-GRACE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Elara Heavens — Rank III (S1-CLE-H003) | Racial Trait | `RACIAL-ELF-ANCESTRAL-FOCUS` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Elara Heavens — Rank III (S1-CLE-H003) | Class Ability | `CLASS-SAINT-HOLY-REJUVENATION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Thrain Sunborn — Rank I (S1-CLE-H004) | Racial Trait | `RACIAL-DWARF-STONEBLOOD` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Thrain Sunborn — Rank II (S1-CLE-H005) | Racial Trait | `RACIAL-DWARF-STONEBLOOD` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Thrain Sunborn — Rank II (S1-CLE-H005) | Class Ability | `CLASS-PRIEST-HOLY-GRACE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Thrain Sunborn — Rank III (S1-CLE-H006) | Racial Trait | `RACIAL-DWARF-STONEBLOOD` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Thrain Sunborn — Rank III (S1-CLE-H006) | Class Ability | `CLASS-SAINT-HOLY-REJUVENATION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Vaelis Stormweave — Rank I (S1-MAG-H001) | Racial Trait | `RACIAL-ELF-ANCESTRAL-FOCUS` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Vaelis Stormweave — Rank II (S1-MAG-H002) | Racial Trait | `RACIAL-ELF-ANCESTRAL-FOCUS` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Vaelis Stormweave — Rank II (S1-MAG-H002) | Class Ability | `CLASS-ELEMENTALIST-ELEMENTAL-MASTERY` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Vaelis Stormweave — Rank III (S1-MAG-H003) | Racial Trait | `RACIAL-ELF-ANCESTRAL-FOCUS` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Vaelis Stormweave — Rank III (S1-MAG-H003) | Class Ability | `CLASS-ELEMENTAL-LORD-ELEMENTAL-SOVEREIGNTY` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aldric Ashford — Rank I (S1-MAG-H004) | Racial Trait | `RACIAL-HUMAN-HUMAN-AMBITION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aldric Ashford — Rank II (S1-MAG-H005) | Racial Trait | `RACIAL-HUMAN-HUMAN-AMBITION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aldric Ashford — Rank II (S1-MAG-H005) | Class Ability | `CLASS-ELEMENTALIST-ELEMENTAL-MASTERY` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aldric Ashford — Rank III (S1-MAG-H006) | Racial Trait | `RACIAL-HUMAN-HUMAN-AMBITION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aldric Ashford — Rank III (S1-MAG-H006) | Class Ability | `CLASS-ELEMENTAL-LORD-ELEMENTAL-SOVEREIGNTY` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Finnian Copperpot — Rank I (S1-THF-H001) | Racial Trait | `RACIAL-HALFLING-SECOND-CHANCE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Finnian Copperpot — Rank II (S1-THF-H002) | Racial Trait | `RACIAL-HALFLING-SECOND-CHANCE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Finnian Copperpot — Rank II (S1-THF-H002) | Class Ability | `CLASS-ROGUE-VENOM-MASTERY` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Finnian Copperpot — Rank III (S1-THF-H003) | Racial Trait | `RACIAL-HALFLING-SECOND-CHANCE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Finnian Copperpot — Rank III (S1-THF-H003) | Class Ability | `CLASS-RENEGADE-NIGHTSHADE-VENOM` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Lucien Voss — Rank 1 (S1-THF-H004) | Racial Trait | `RACIAL-ELF-ANCESTRAL-FOCUS` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Lucien Voss — Rank 2 (S1-THF-H005) | Racial Trait | `RACIAL-ELF-ANCESTRAL-FOCUS` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Lucien Voss — Rank 2 (S1-THF-H005) | Class Ability | `CLASS-SPELL-BLADE-MANA-SURGE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Lucien Voss — Rank 3 (S1-THF-H006) | Racial Trait | `RACIAL-ELF-ANCESTRAL-FOCUS` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Lucien Voss — Rank 3 (S1-THF-H006) | Class Ability | `CLASS-ARCANE-DUELIST-ARCANE-SURGE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Draxen Blacksand — Rank I (S1-WAR-H001) | Racial Trait | `RACIAL-HUMAN-HUMAN-AMBITION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Draxen Blacksand — Rank II (S1-WAR-H002) | Racial Trait | `RACIAL-HUMAN-HUMAN-AMBITION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Draxen Blacksand — Rank II (S1-WAR-H002) | Class Ability | `CLASS-GLADIATOR-VANQUISHER-S-RESOLVE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Draxen Blacksand — Rank III (S1-WAR-H003) | Racial Trait | `RACIAL-HUMAN-HUMAN-AMBITION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Draxen Blacksand — Rank III (S1-WAR-H003) | Class Ability | `CLASS-CONQUEROR-ARENA-DOMINATOR` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aurex Sunsworn — Rank I (S1-WAR-H004) | Racial Trait | `RACIAL-DRAGONBORN-DRAGON-SCALE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aurex Sunsworn — Rank II (S1-WAR-H005) | Racial Trait | `RACIAL-DRAGONBORN-DRAGON-SCALE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aurex Sunsworn — Rank II (S1-WAR-H005) | Class Ability | `CLASS-PALADIN-HOLY-RESURGENCE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aurex Sunsworn — Rank III (S1-WAR-H006) | Racial Trait | `RACIAL-DRAGONBORN-DRAGON-SCALE` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Aurex Sunsworn — Rank III (S1-WAR-H006) | Class Ability | `CLASS-CRUSADER-RADIANT-OBLIVION` | `data/season1/hero-components.runtime.v1.1.0.json` → shared runtime | `pvp-network` → intent router → `server.js` engine → shared runtime | NO | `run-v343-candidate3b-hero-components.cjs` | PASS |
| Golden Arrows (S1-ARC-L001) | Legacy Effect | `golden_arrows` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |
| Falconer’s Whistle (S1-ARC-L002) | Legacy Effect | `falconers_whistle` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |
| Sun God Church (S1-CLE-L001) | Legacy Effect | `sun_god_church` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |
| Wand of First Light (S1-CLE-L002) | Legacy Effect | `wand_of_first_light` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |
| Ancestral Tome (S1-MAG-L001) | Legacy Effect | `ancestral_tome` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |
| Arcane Wand (S1-MAG-L002) | Legacy Effect | `arcane_wand` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |
| Hidden Stash (S1-THF-L001) | Legacy Effect | `hidden_stash` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |
| Hidden Archives (S1-THF-L002) | Legacy Effect | `hidden_archives` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |
| Warrior’s Relic (S1-WAR-L001) | Legacy Effect | `warriors_relic` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |
| Statue of the Lightbringer (S1-WAR-L002) | Legacy Effect | `statue_of_the_lightbringer` | `cards.runtime.v0.16.2.json::canonical_execution.ability` → shared runtime | `beginActivatedLegacyAbility` → intent router → shared runtime | NO | Hero Component + shared-runtime QA | PASS |

## Mandatory Draw Review regressions

- **Draw Review:** PASS — canonical draw replacement choice owns the result.
- **Quick Reload:** PASS — canonical `draw_replacement` component.
- **Rapid Chamber:** PASS — canonical `draw_replacement_and_passive_attack_modifier` component.
- Compatibility regression `run-v324-quick-reload-aura-counter.cjs`: PASS.

## Conclusion

Every active Hero Component resolves through canonical Hero Component/shared runtime ownership. PvP remains transport/validation/presentation adaptation only.
