# Grandis Legacy VS AI Season 0 — WAR 2/6: authorized fix QA

**Date:** 2026-11-05  
**Base:** staged RC13 UI + approved ARC changes. **Version unchanged. No release ZIP.**  
**Authority:** OSA Season 0 DEV45 card rows, Player Rulebook v2.9; no S1 card-value substitution and no OSA edits.

## Authorized repairs

- `S0-WAR-005` Taunt: globally forbid opponent Area Attack play while active, on both player/AI legality paths. Non-Area Attack target remains Taunt Hero ONLY if within normal legal AoA/range. A Taunt Hero outside AoA does NOT enable attacking someone else and does NOT grant extra reach. Expiry restores normal options.
- `S0-WAR-012` Deflect: use printed Rank II `REFLECT 20` for connected Physical **or** Magical Hit. Rank III Conqueror inherits Rank II print; Rank I has no REFLECT. Reflection now happens AFTER Hit resolution, so Negate does not retaliate; zero-HP-damage connected hits do retaliate. BLOCK 50 retained.
- `S0-WAR-013` Enrage: connected eligible Physical Attack inflicts Bleed(1) through shared status/immunity/stacking helper. Physical-only bonus cannot be applied by a Magical Attack, and Magical Attack does not consume the buff. DODGE does not inflict Bleed.
- `S0-WAR-018` Execute: read official Rank II printed `MANA COST +2` for 7 total Mana, Rank III retains 5 and SURE HIT. Keep BLOCK disallowed against non-damage defeat; restore legal DODGE/Second Chance to Rank II Response; Rank III cannot DODGE. Existing at-or-below-half-HP condition retained.
- `S0-WAR-029` Runic Guard: `REFLECT 30` based on official inherited Arcane Warrior printed row, including Arcane Vanguard Rank III. Rank I still lacks REFLECT, Physical/Magical connected Hits qualify, canceled Attacks do not.

## Evidence and limitations

- 36/36 targeted real-Chromium-JS-engine checks PASS, including Taunt outside AoA and expiry, Defense Rank I/II/III both types, reflection on zero-damage Hits and no reflection on Negate, Enrage DODGE/Magical/zero-damage, Execute exact Mana consumption and real Response DODGE preventing Defeat.
- Previous WAR probe rerun: all five previously confirmed defects now pass their reproduction routes; no browser JavaScript page errors in probes.
- Existing focused S0 self-tests: Target selection 13/13 PASS; Class/Lineage 6,975 combinations PASS; Ultimate Tribute 30 PLAYER/AI functional commits PASS. Node syntax check PASS.
- Browser tests instrumented the actual app engine via injected fixture/Chromium rather than completing a manual full match; **NOT** verified through normal full Human vs AI UI playthrough or every 42-card WAR combination. No claim of FINAL.
- Do not regenerate a release ZIP or change version until six stages (ARC/WAR/THF/CLE/MAG/EVT+ITM) are audited/fixed and integrated QA performed. Next THF audit remains **read-only** until user authorizes fixes.

## Patch handling

- The staged working tree at `/mnt/data/gl_s0_working/Grandis_Legacy_VS_AI_Season0` contains both ARC and WAR approved changes atop the RC13 UI.
- Portable patch `Grandis_Legacy_VS_AI_Season0_v1.0_RC13_2026-11-05.patch` is **cumulative RC13 → current ARC+WAR state**, not solely WAR. Do not apply earlier ARC incremental patch and then this cumulative patch a second time.
