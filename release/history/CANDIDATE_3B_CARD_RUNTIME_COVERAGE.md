# Candidate 3B — Card Runtime Coverage

**Candidate:** PvP v3.43 Candidate 3B  
**Result:** PASS  
**Canonical Registry Hash:** `7ac1f90f6a9654cf575ac41db64a052901005905b1cf01f3bfc7532873cc9389`

## Summary

- Canonical cards: **200**
- Effect recipes: **200**
- Executable: **200**
- Unsupported / blocked active paths: **0**

The matrix is generated from the canonical runtime recipe/card authorities. It proves that all active canonical cards map to an executable structured runtime path; it does not duplicate card text.

## 200-card matrix

| Card ID | Name | Family | Classification | Effects | Dispatch / Runtime | Coverage |
|---|---|---|---|---:|---|---|
| `S1-ARC-001` | Bow Bash | Skill | Physical Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-ARC-002` | Poison Arrow | Skill | Physical Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-ARC-003` | Escape Arrow | Skill | Defense Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-004` | Eyes of the Hawk | Skill | Tactical Skill | 1 | resolve_opponent_hand_back_card_to_deck | EXECUTABLE |
| `S1-ARC-005` | Reload | Skill | Tactical Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-ARC-006` | Aim Shot | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-007` | Burning Arrow | Skill | Physical Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-ARC-008` | Ambush Shot | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-009` | Arrow Volley | Skill | Area Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-010` | Arrow Barrage | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-011` | Back Step | Skill | Defense Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-012` | Deflect Arrow | Skill | Defense Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-ARC-013` | Triple Shot | Skill | Tactical Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-014` | Replenish | Skill | Tactical Skill | 4 | resolve_discard_recovery_to_deck_then_draw | EXECUTABLE |
| `S1-ARC-015` | Power Shot | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-016` | Soul Blast Shot | Skill | Physical Attack | 1 | target_adjacent_swap_after_connected_hit | EXECUTABLE |
| `S1-ARC-017` | Dual Arrow | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-018` | Charged Shot | Skill | Physical Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-ARC-019` | Long Range Shot | Skill | Range Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-ARC-020` | Piercing Bolt | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-021` | Aura Infusion Bolt | Skill | Casting Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-ARC-022` | Singularity Reload | Skill | Tactical Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-ARC-023` | Cross Bolt | Skill | Range Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-ARC-024` | Colossal Dreadbolt | Skill | Physical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-ARC-H001` | Korvak Ironfang | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-ARC-H002` | Korvak Ironfang | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-ARC-H003` | Korvak Ironfang | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-ARC-H004` | Alden Sterling | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-ARC-H005` | Alden Sterling | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-ARC-H006` | Alden Sterling | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-ARC-L001` | Golden Arrows | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |
| `S1-ARC-L002` | Falconer’s Whistle | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |
| `S1-CLE-001` | Smite | Skill | Magical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-002` | Sacred Bolt | Skill | Magical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-003` | Brilliant Radiance | Skill | Defense Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-CLE-004` | Purify | Skill | Support Skill | 2 | resolve_purify_choice | EXECUTABLE |
| `S1-CLE-005` | Flash Heal | Skill | Support Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-006` | Blessing of Might | Skill | Support Skill | 4 | structured canonical execution | EXECUTABLE |
| `S1-CLE-007` | Blessing of Wisdom | Skill | Support Skill | 4 | structured canonical execution | EXECUTABLE |
| `S1-CLE-008` | Holy Fire | Skill | Area Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-009` | Holy Ring | Skill | Magical Attack | 2 | resolveHolyRing | EXECUTABLE |
| `S1-CLE-010` | Holy Blast | Skill | Area Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-011` | Holy Barrier | Skill | Defense Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-012` | Binding Light | Skill | Tactical Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-013` | God's Blessing | Skill | Tactical Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-CLE-014` | Wrathful Radiance | Skill | Area Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-015` | Resurrection | Skill | Support Skill | 2 | resolve_revive_hero | EXECUTABLE |
| `S1-CLE-016` | Sanctuary | Skill | Support Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-017` | Lay on Hands | Skill | Support Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-018` | Heaven’s Fury | Skill | Support Skill | 4 | resolveHeavensFury | EXECUTABLE |
| `S1-CLE-019` | Divine Punishment | Skill | Area Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-020` | Holy Slash | Skill | Magical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-021` | Hammer of Justice | Skill | Magical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-022` | Sacred Bulwark | Skill | Defense Skill | 1 | response_block_damage | EXECUTABLE |
| `S1-CLE-023` | Holy Light | Skill | Support Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-024` | Divine Judgement | Skill | Area Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-CLE-025` | Blessing of Divinity | Skill | Defense Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-CLE-H001` | Elara Heavens | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-H002` | Elara Heavens | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-H003` | Elara Heavens | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-H004` | Thrain Sunborn | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-H005` | Thrain Sunborn | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-H006` | Thrain Sunborn | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-CLE-L001` | Sun God Church | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |
| `S1-CLE-L002` | Wand of First Light | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |
| `S1-EVT-001` | Begin Anew | Event | Event | 2 | structured canonical execution | EXECUTABLE |
| `S1-EVT-002` | Market Bargain | Event | Event | 1 | structured canonical execution | EXECUTABLE |
| `S1-EVT-003` | Scouting | Event | Event | 1 | resolve_discard_opponent_exp | EXECUTABLE |
| `S1-EVT-004` | Relentless Leveling | Event | Event | 1 | resolve_event_tribute_exp_rankup | EXECUTABLE |
| `S1-EVT-005` | Last Resort | Event | Event | 1 | resolveLastResort | EXECUTABLE |
| `S1-EVT-006` | Dazed | Event | Event | 1 | structured canonical execution | EXECUTABLE |
| `S1-EVT-007` | Intercept | Event | Event | 2 | resolve_cancel_opponent_event | EXECUTABLE |
| `S1-EVT-008` | Forged Alliance | Event | Event | 1 | resolve_gain_racial_token | EXECUTABLE |
| `S1-EVT-009` | Tactical Adaptation | Event | Event | 2 | structured canonical execution | EXECUTABLE |
| `S1-EVT-010` | Déjà vu | Event | Event | 1 | resolve_discard_recovery_to_hand | EXECUTABLE |
| `S1-EVT-011` | Coordination Attack | Event | Event | 1 | resolveCoordinationAttack | EXECUTABLE |
| `S1-EVT-012` | Defensive Formation | Event | Event | 1 | resolveDefensiveFormation | EXECUTABLE |
| `S1-ITM-001` | Health Potion | Item | Item | 1 | structured canonical execution | EXECUTABLE |
| `S1-ITM-002` | Greater Health Potion | Item | Item | 2 | structured canonical execution | EXECUTABLE |
| `S1-ITM-003` | Stamina Potion | Item | Item | 1 | resolve_remove_exhaust | EXECUTABLE |
| `S1-ITM-004` | Elixir | Item | Item | 2 | resolve_purify_choice | EXECUTABLE |
| `S1-ITM-005` | Mana Catalyst | Item | Item | 1 | resolve_mana_regen_gain | EXECUTABLE |
| `S1-ITM-006` | Magic Scope | Item | Item | 1 | resolve_magic_scope_reveal | EXECUTABLE |
| `S1-ITM-007` | Ring of Protection | Item | Item | 1 | structured canonical execution | EXECUTABLE |
| `S1-ITM-008` | Phoenix Feather | Item | Item | 1 | resolve_revive_hero | EXECUTABLE |
| `S1-ITM-009` | Crystal Ball | Item | Item | 1 | resolve_crystal_ball | EXECUTABLE |
| `S1-ITM-010` | Arcane Scroll | Item | Item | 1 | structured canonical execution | EXECUTABLE |
| `S1-ITM-011` | Poison Vial | Item | Item | 1 | resolvePoisonVial | EXECUTABLE |
| `S1-ITM-012` | Spectral Grappling Hook | Item | Item | 1 | structured canonical execution | EXECUTABLE |
| `S1-ITM-013` | Ring of Grace | Item | Item | 1 | structured canonical execution | EXECUTABLE |
| `S1-ITM-014` | Holy Medallion | Item | Item | 1 | structured canonical execution | EXECUTABLE |
| `S1-ITM-015` | Invisibility Cloak | Item | Item | 1 | resolveInvisibilityCloak | EXECUTABLE |
| `S1-ITM-016` | Chain Mail | Item | Item | 1 | structured canonical execution | EXECUTABLE |
| `S1-ITM-017` | Flashpowder Bomb | Item | Item | 1 | resolve_cancel_opponent_item | EXECUTABLE |
| `S1-ITM-018` | Magic Compass | Item | Item | 1 | resolve_magic_compass_search | EXECUTABLE |
| `S1-ITM-019` | Warp Scroll | Item | Item | 1 | resolve_warp_scroll_swap | EXECUTABLE |
| `S1-ITM-020` | Freeze Bomb | Item | Item | 1 | resolve_freeze_bomb | EXECUTABLE |
| `S1-MAG-001` | Arcane Bolt | Skill | Magical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-002` | Ice Lance | Skill | Magical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-003` | Fireball | Skill | Magical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-004` | Mana Shield | Skill | Defense Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-005` | Mirror Image | Skill | Defense Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-006` | Meditation | Skill | Tactical Skill | 1 | resolve_gain_mana | EXECUTABLE |
| `S1-MAG-007` | Tornado | Skill | Casting Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-MAG-008` | Frostbite | Skill | Magical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-009` | Fire Blast | Skill | Magical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-010` | Glacial Spike | Skill | Area Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-011` | Ice Block | Skill | Defense Skill | 2 | resolveIceBlock | EXECUTABLE |
| `S1-MAG-012` | Fire Wall | Skill | Defense Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-MAG-013` | Wildfire | Skill | Tactical Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-014` | Lightning Strike | Skill | Range Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-015` | Permafrost | Skill | Magical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-016` | Nova Strike | Skill | Magical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-017` | Frostfire Nova | Skill | Magical Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-MAG-018` | Double Casting | Skill | Tactical Skill | 1 | resolveDoubleCasting | EXECUTABLE |
| `S1-MAG-019` | Flame Dragon's Wrath | Skill | Area Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-MAG-020` | Aether Ball | Skill | Casting Attack | 1 | resolve_casting_attack | EXECUTABLE |
| `S1-MAG-021` | Mana Absorption | Skill | Magical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-022` | Aether Infusion | Skill | Tactical Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-023` | Aether Slash | Skill | Magical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-024` | Aether Sweep | Skill | Area Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-MAG-025` | Mana Void | Skill | Magical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-H001` | Vaelis Stormweave | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-H002` | Vaelis Stormweave | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-H003` | Vaelis Stormweave | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-H004` | Aldric Ashford | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-H005` | Aldric Ashford | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-H006` | Aldric Ashford | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-MAG-L001` | Ancestral Tome | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |
| `S1-MAG-L002` | Arcane Wand | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |
| `S1-THF-001` | Dash Stab | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-002` | Jump Slash | Skill | Physical Attack | 1 | source_front_lane_swap_after_successful_attack | EXECUTABLE |
| `S1-THF-003` | Evasion | Skill | Defense Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-004` | Smoke Screen | Skill | Defense Skill | 3 | structured canonical execution | EXECUTABLE |
| `S1-THF-005` | Steal | Skill | Tactical Skill | 2 | resolve_mana_transfer | EXECUTABLE |
| `S1-THF-006` | Sixth Sense | Skill | Tactical Skill | 3 | resolve_defense_skill_search | EXECUTABLE |
| `S1-THF-007` | Horizontal Slash | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-008` | Vertical Slash | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-009` | X Cross Slash | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-010` | Back Slash | Skill | Physical Attack | 1 | damage_attack_restriction_cannot_be_dodged | EXECUTABLE |
| `S1-THF-011` | Elusive Escape | Skill | Defense Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-012` | Poison Mist | Skill | Tactical Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-THF-013` | Venom Strike | Skill | Physical Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-THF-014` | Viper’s Fang | Skill | Physical Attack | 3 | structured canonical execution | EXECUTABLE |
| `S1-THF-015` | Venom Sovereign | Skill | Magical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-016` | Finishing Strike | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-017` | Venom Binding | Skill | Magical Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-THF-018` | Venom Detonation | Skill | Area Attack | 2 | structured canonical execution | EXECUTABLE |
| `S1-THF-019` | Dash Slash | Skill | Physical Attack | 1 | source_front_lane_swap_after_successful_attack | EXECUTABLE |
| `S1-THF-020` | Sword Slash | Skill | Physical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-THF-021` | Deflection | Skill | Defense Skill | 1 | resolve_block_damage | EXECUTABLE |
| `S1-THF-022` | Step In | Skill | Defense Skill | 2 | dodge_then_reposition | EXECUTABLE |
| `S1-THF-023` | Flash Slash | Skill | Physical Attack | 2 | source_any_allied_hero_swap_after_successful_attack | EXECUTABLE |
| `S1-THF-024` | Sword Combo | Skill | Physical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-THF-025` | Blink Strike | Skill | Physical Attack | 1 | source_front_lane_swap_after_successful_attack | EXECUTABLE |
| `S1-THF-026` | Dodge Instinct | Skill | Defense Skill | 1 | resolve_dodge_damage | EXECUTABLE |
| `S1-THF-027` | Camouflage | Skill | Tactical Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-028` | Calculated Plan | Skill | Tactical Skill | 1 | resolve_opponent_hand_back_card_to_discard | EXECUTABLE |
| `S1-THF-029` | Flash Combo | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-THF-030` | Crescent Moon Slash | Skill | Area Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-THF-H001` | Finnian Copperpot | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-THF-H002` | Finnian Copperpot | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-THF-H003` | Finnian Copperpot | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-THF-H004` | Lucien Voss | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-THF-H005` | Lucien Voss | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-THF-H006` | Lucien Voss | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-THF-L001` | Hidden Stash | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |
| `S1-THF-L002` | Hidden Archives | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |
| `S1-WAR-001` | Slash | Skill | Physical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-002` | Power Slash | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-003` | Parry | Skill | Defense Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-004` | Cover Up | Skill | Defense Skill | 1 | response_redirect_reposition | EXECUTABLE |
| `S1-WAR-005` | Taunt | Skill | Tactical Skill | 1 | resolveTaunt | EXECUTABLE |
| `S1-WAR-006` | Savage Blow | Skill | Physical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-007` | Upward Thrust | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-008` | Wild Swing | Skill | Area Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-009` | Rage Swing | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-010` | Rage Blast | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-011` | Side Step | Skill | Defense Skill | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-012` | Deflect | Skill | Defense Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-WAR-013` | Enrage | Skill | Tactical Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-WAR-014` | Final Grit | Skill | Tactical Skill | 1 | resolve_revive_hero | EXECUTABLE |
| `S1-WAR-015` | Charge Attack | Skill | Physical Attack | 1 | source_front_lane_swap_after_successful_attack | EXECUTABLE |
| `S1-WAR-016` | Whirlwind | Skill | Area Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-017` | Fiery Thrust | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-018` | Execute | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-019` | Radiant Cleave | Skill | Physical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-020` | Shield Bash | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-021` | Sacred Stormblade | Skill | Physical Attack | 1 | structured canonical execution | EXECUTABLE |
| `S1-WAR-022` | Unbroken Stand | Skill | Defense Skill | 2 | structured canonical execution | EXECUTABLE |
| `S1-WAR-023` | Divine Slash | Skill | Physical Attack | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-024` | Heroic Charge | Skill | Physical Attack | 1 | source_front_lane_swap_after_successful_attack | EXECUTABLE |
| `S1-WAR-H001` | Draxen Blacksand | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-H002` | Draxen Blacksand | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-H003` | Draxen Blacksand | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-H004` | Aurex Sunsworn | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-H005` | Aurex Sunsworn | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-H006` | Aurex Sunsworn | Hero | Hero | 0 | structured canonical execution | EXECUTABLE |
| `S1-WAR-L001` | Warrior’s Relic | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |
| `S1-WAR-L002` | Statue of the Lightbringer | Legacy Card | Legacy Ability | 0 | resolveLatestLegacyAbility | EXECUTABLE |

## Coverage decision

**CARD RUNTIME COVERAGE: 200 / 200 — PASS**

Generated machine-readable evidence is retained under `tests/artifacts/candidate3b/coverage/`.
