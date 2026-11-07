# Grandis Legacy — VS AI S0 — Stage 5 Implementation Checkpoint (2026-11-04)

**Official game data source:** OSA Season 0 DEV45 / DEV44 pinned consumer exports. **Application base:** original VS AI v6.91.9 + Stages 3/4 source. Season 1 is referenced only for existing mechanic execution; it is NOT a source of official S0 card names, IDs, Mana, damage or rules.

## Newly completed source integration

- Rebound known S1 card identity-specific function routes to current S0 identities across the ACTUALLY LOADED `engine/shared-app/app.bundle.js`. Found and updated additional hidden S1-only Class filtering for Archer/Thief and Legacy costs. A second, unreferenced historical `engine/js/app.bundle.js` was removed from the distributable working source to avoid future accidental use of obsolete S1 effects.
- Updated the actually loaded `shared-app/app-runtime.js` visual Hero IDs (Alden, Lucien, Aurex, Finnian, Thrain) and Chain Mail response source ID to correct S0 IDs. Replaced remote S1 card-back/token fallbacks in the app engine with existing local assets.
- UI Casting counter **0 is rendered visibly** on an active Casting Attachment. Source-authorized S0 Casting: PLAY 0; owner End +1; owner Battle releases at requirement. Runeforged Burst hit-interruption freezes its counter and forces release on next owner Battle. Aura Infusion Bolt stays on its separate Draw-triggered counter handler.
- Added Season 0 source-specific attachment policies and gameplay routes for **Blessing of Accuracy** (ally-chosen SURE HIT through current turn + draw 2), **Grand Finale** (source Hero INVINCIBLE until next owner Draw, draw 3, S0 Attack data), **Provoke** (opponent no-Attack check at each End through second owner Draw), **Wings of Valor** (teamwide +20 / +40 Attack for current turn, no one-Hero picker), and **Singularity Reload** (Draw 3 while Exhausted without further Exhaust).
- Expanded printed S0 Attack status materialization, including Burn+Freeze on Frostfire Nova, Sleep on Sleeping Dart, Bleed on Wild Assault and other source-defined Status rows, while retaining the established response/hit legality and combat effects.
- Aligned two overlooked source-specific Mana effects: S0 Aether Infusion MANA BURN 2 per connected hit (not S1's 1 on HP damage); S0 Aether Ball and Arcane Disruption optional MANA BURN 1 on connected hits only for S0 printed Class branch.
- Added S0 Runic Guard Arcane Warrior REFLECT 30 on connected Hit through existing response/HP/Defeat path; blocked-to-zero Hits qualify, DODGE and NEGATE do not. The existing S0 Blessing of Divinity INVINCIBLE now protects from damage without mislabeling the Attack as a non-Hit.
- Aligned runtime-authority special S0 Mana Void (own Regen) and Colossal Dreadbolt (140 damage cap) where historical S1 IDs and formulas persisted.
- Retained earlier Stage 5 Discard CONDITION atomic UI/Mana commit, Zol/Lun/Vae selection and shuffle, all existing payment/CANCEL/Response infrastructure, and other S0 special-effect bindings.

## Tests completed / truthful limitation

- `node --check`: PASS for all three changed production JS files.
- Original Stage 5 **18/18 targeted function tests**: PASS.
- New Stage 5 **24/24 focused source-function/static checks**: PASS.
- Stage 3 authority & 248 catalog IDs / 426 S0 effect branches / 36 recipe bindings: PASS.
- Stage 4 five starters and 251 current SHA-verified artworks: PASS; actual `validateDeck` negative tests: PASS.
- **36/36 Stage 2 special route IDs have at least one explicit reference** in the current loaded engine. An ID reference is not itself functional proof.
- **Browser/UI integration: UNVERIFIED**. Chromium access to both localhost and file:// is blocked by `ERR_BLOCKED_BY_ADMINISTRATOR` in this environment. No complete human-vs-AI game has been observed. It must NOT be called playable. Stage 6 AI improvements and Stage 7 complete gameplay verification are separate steps.
- The 42 targeted checks cover important changed routes, **not every S0 card or every nested interaction**. New defects in untested branches cannot be ruled out. In particular, newly introduced Runic Guard REFLECT still needs full same-exchange defeat/response regression; complex status and multi-target chains need real interactive verification.

**Stage 5 disposition:** Source-level feature integration of identified Season 0 routes is delivered as the Stage 5 completion checkpoint. Functional acceptance beyond targeted tests, full UI state validity and playable certification are **not established**; those are explicit Stage 7 gates. No work on Stage 6 AI decision weights has been performed in this checkpoint. Do not call the app playable.
