# VS AI Season 0 — RC9 Targeted Regression QA

**Baseline:** original VS AI Season 1 v6.91.9 behavior; official OSA Season 0 DEV45 card data. Application-only changes; OSA and other applications not changed.

## Confirmed fixes and focused checks

| User report | Root cause in RC8/RC9 pre-fix | RC9 correction | Current evidence |
|---|---|---|---|
| Attachment hover obstructed by Active Card | Attachment used the old preview binder inside the battlefield, unlike body-level temporary preview for Hand | Reuse existing `bindBattlefieldPreview(..., 'attachment')` portal | Chromium DOM pointer enter: preview open, appended last under BODY, z-index 2147483000; legacy hover hidden; 0 JS errors |
| Legacy abilities unusable | S0 DEV44 app card export has no S1-shaped `ability` contract, while v6.91.9 executor requires `ability.action_key` | Materialize the existing v6.91.9 ability contract from each of 10 **S0 printed Legacy texts**, with strict mismatch checks | 10/10 contracts loaded; Warrior's Relic selection/payment/Draw applied through browser-executed handler; remaining nine not exhaustively played through UI |
| Shield Blast ongoing damage reduction ignored | `S0-WAR-031` stored as attachment, but reducer only checked Shield Bash | Add official S0 Shield Blast active reduction of 20, physical-only for Arcane Warrior and physical/magical for Arcane Vanguard | Four synthetic incoming damage scenarios in Chromium: 20 mitigation on the three legal class/type branches and zero on illegal Magical/Rank II branch |
| Bromir Absolute Defense Ultimate not offered | Official S0 `effect[]` empty; Response router returned null, ignoring printed REFLECT/INVINCIBLE | Give `S0-MAG-031` Response kind and reuse existing pay/Response/attachment resolver; reflect damage on connected hit, Rank III temporary immunity | Chromium: Ultimate offered when legal/affordable; simulated response Rank II receives damage and reflects, Rank III prevents damage and reflects; full hand-driven PAY not exhaustively verified |
| Draxen Execute offered on full HP | `isExecuteEffect` consulted only absent `defeat_target_if_hp_threshold` S0 descriptor | Recognize official S0-WAR-018 printed threshold in existing target validator | Chromium: full HP legal targets `[]`; 50% HP target allowed |
| Bard/Maestro note-return apparently missing while attack/draw happens | **Not reproduced** as a missing physical return in focused real engine paths; duplicates remaining in Discard, or an immediate Draw after Return, can mislead visible pile/deck counts. Root cause in user's reported live match remains **OPEN**. | Strengthen atomic post-selection physical move validation and logging; AI Crimson Crescendo now returns all eligible Zol instead of always one (legal damage multiplier) | 6 normal AI actions + Swift Movement AI Response physically transferred note cards; 3 player pre-commit CHOOSE → PAY tests physically transferred; no page errors. **Do not claim full live-case fix**. |

## Bard return details

- Midnight Lullaby: Zol + Lun to Main Deck before effects.
- Swift Movement: Lun to Main Deck on Response PAYMENT, then Draw 1.
- Crimson Crescendo: AI returns 2 available Zol in the fixture (previously 1); damage parameter based on actual count.
- Resonance Burst: Zol + Vae to Main Deck before Response.
- Blessing of Accuracy: Vae returned; the next Draw 2 can reduce total Deck size below its prior size.
- Blooming Harmony: Lun + Vae returned.
- Grand Finale: Zol + Lun + Vae returned; Draw 3 can leave net Main Deck count unchanged, despite all 3 cards physically returning.

**Critical distinction:** Return + Draw is not an assurance that Deck size must increase. For example, Grand Finale's +3 Return and Draw 3 yields no net change in Deck size; the physical Discard identities must be inspected, not just deck totals. When multiple identical Zol exist in Discard, returning one can leave another visible.

## Other baseline change in this package

- RC9 Ultimate Tribute fix from the preceding authorized patch: 15 S0 Ultimates linked to appropriate S0 Hero owners; matching **Color Mana**, 200 EXP, v6.91.9 Tribute handler reused. Previous targeted 30/30 PLAYER/AI functional tests recorded in `docs/qa/ULTIMATE_TRIBUTE_CHROMIUM_QA.json`.

## Explicit limits

- No complete normal Human vs AI match through actual browser UI has been verified to terminal Win/Loss/Draw. RC9 remains **RELEASE CANDIDATE**, not FINAL.
- Bromir Ultimate end-to-end GUI payment, all Legacy abilities in an actual match, and user-specific live Bard Return failure still require independent field reproduction/QA. Targeted test PASS is not proof of full card gameplay coverage.
- OSA has not been changed. The earlier separate Health Potion art / text discrepancy remains in OSA review queue, without a confirmed source-side correction.

Evidence: `FOCUSED_QA.json`, `DEEP_QA.json`, `BARD_EXTENDED_QA.json`, `BARD_PLAYER_QA.json`, `HOVER_QA.json` in this directory.
