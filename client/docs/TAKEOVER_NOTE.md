# RC32 Current Maintenance Checkpoint — Stun / Color Mana (2026-11-07)

Baseline: v1.0 RC32 post Primal Strike + Burn. Two designer-authorized minor runtime changes published under **same RC32**: Stun activated Class/Racial gates (including Class Draw Review and defensive traits), and exact-mana Color Shard(2) removal prioritizing other selected Color Shards. Focused Chromium runtime QA 23/23 PASS; 10 historical self-tests unchanged against baseline (5/10 PASS, five pre-existing failures); full natural match and native Firefox NOT VERIFIED. See `docs/qa/rc32/RC32_STUN_COLOR_MANA_MINOR_2026-11-07.md`. Previous build backed up under working QA staging. No OSA / Rulebook / version changes.

---

**Latest checkpoint: v1.0 RC32 same-version maintenance (2026-11-07)**. All specifically approved post-RC32 staging work and pending audio/Stoneblood/PASS/Runeforged presentation is now packaged. 130 targeted scenarios/checks PASS; full natural match, native Firefox, hosted browser and device audio output NOT VERIFIED. RC32 checklist: `qa/rc32/RC31_TO_RC32_COMPLETE_INVENTORY_2026-11-07.md`; QA specifics: `qa/rc32/RC32_FINAL_MAINTENANCE_2026-11-07.md`. Older checkpoint headings below are historical, not the current build status.

RC32 minor update 2026-11-07: Lobby divider removed, Mana Deck R2 six front art updated, EXP lower edge aligned in production CSS, actual Mana Regen badge fixed, Racial notification 2s. No new RC number; OSA and gameplay unchanged. Details/QA: docs/qa/rc32/RC32_MINOR5_UPDATE_NOTES.md and RC32_MINOR5_QA.json.

# Grandis Legacy — VS AI Season 0 | Complete Takeover Note

**Checkpoint:** v1.0 RC27 — 2026-11-06  
**Status:** RELEASE CANDIDATE, NOT FINAL. A complete normal Human-vs-AI match through the browser UI remains unverified. The RC12 checkpoint was superseded by RC13–RC16; see chronology below.  
**Application baseline:** original `Grandis_Legacy_VS_AI_v6.91.9_2026-10-13.zip` (Season 1), independent app engine/UI.  
**S0 source authority:** `Grandis_Legacy_OSA_Season0_DEV45_Final_Audited_2026-11-04.zip`, current release pointer `CURRENT_SEASON0_RELEASE.dev45.json` and seven `CURRENT_SEASON0_CONSUMERS.dev44.json` exports. OSA remains READ-ONLY.  
**S1 reference:** OSA Season 1 v1.9.5 only for already-working *engine execution*, not any S0 card names, IDs, values, recipes or artwork.  
**Rules:** official S0 Player Rulebook v2.9 / current OSA Machine Rules v1.1.6, plus designer-approved UI/gameplay decisions.

## Guiding decisions

1. All Season 0 card data, including costs, effect parameters, identities, Class/Rank/Lineage, artwork, and starter decks, comes from OSA S0. Never backfill missing data from S1 by matching card names/IDs.
2. Preserve the actual VS AI v6.91.9 engine, local AI, UI, response windows, payment and animation architecture. Reuse established effect handlers, adding S0-only behavior as needed. OSA optional reference applications are not the VS AI runtime.
3. For Ultimate Tribute, use **Color Mana Shard** (S0 term; v6.91.9 called it Class Shard). A matching Color Mana Shard is spent, printed Skill Mana cost is ignored, Ultimate gives **200 EXP**, and only its owning active Hero lineage can receive it. Current S0 Mana Shard colors: Warrior/Red, Mage/Blue, Archer/Green, Cleric/White, Thief/Yellow. Retain the existing engine's internal `kind:'CLASS'`/`class_name` shape for compatibility, but NEVER treat this as a source of S0 card values.
4. New Casting UX: counter **0** shown immediately; +1 during owner's End Phase; check ready counter in owner's Battle Phase. Runeforged Burst locks accumulated count after connected Hit and must release at next owner's Battle Phase; it does not advance further during End Phase.
5. CONDITION must be feasible before PLAY, then mandatory physical CONDITION cost and Mana payment committed atomically before effect. This includes selection and return of Bard/Maestro Zol/Lun/Vae from Discard to Main Deck, followed by shuffle. Preserve pre-commit cancel/response behavior.
6. No unsolicited OSA/Deck Builder/PvP changes. Log evidenced OSA discrepancies before any authority correction.
7. Preserve one enclosing app folder in each ZIP. Root is for boot/runtime essentials; reports, QA, history, and takeover stay under `docs/`.

## Progress already completed (source implementation; not blanket playability proof)

| Step | Work | Status/evidence |
|---|---|---|
| 1 | S1/S0 card identity crosswalk, 248 S0 identities | Completed inventory; name/ID changes are not assumed to preserve historical identity |
| 2 | Addition-first effect compatibility audit, 426 branches, 36 compound bindings | Source audit completed; reuse existing mechanisms where equivalent |
| 3 | S0 runtime/card data integration (155 Skill, 20 Item, 12 Event, 45 Hero, 10 Legacy; separate 6 Mana faces) | Implemented; app-specific generated adapter, not OSA mutation |
| 4 | 5 S0 starter decks, 50-card Main Deck, 12 Mana, 251 active art (248 front/3 back) | Implemented; source/asset checks documented |
| 5 | S0 card gameplay / CONDITION / Casting / Bard abilities | Implemented with targeted QA; complex interactions not exhaustively tested |
| 6 | AI planning (Buff follow-up, tactical Ultimate timing, Bard discard-tune combos) | Implemented with targeted QA; overall AI strength not proven |
| 7 | Browser/gameplay QA and v6.91.9 regression comparison | In progress; historical tests triaged; full normal Human vs AI UI match remains open |
| 8 | Packaging | RC package available, **not FINAL** |

### Previous corrections carried forward (RC3–RC8)

- v6.91.9 lineage/target interoperability, Hero-to-Legacy on Defeat, Stoneblood AI-stuck regression, and Bard/Maestro discard-return actions.
- Market Bargain Draw 2; Blessing of Accuracy duplicate Draw was corrected; Relentless Leveling Hero selection; user/AI Item and Event Hero target routing.
- Skill Class/Rank/Lineage legality; Magic Compass full-width grid; Card Review based on Deck Builder v1.58 without Hero footer selection; keyword/target dispatch; hover temporary card layer priority.
- RC8 QA assets: `docs/qa/RC8_FULL_S1_V6919_S0_KEYWORD_PARITY_AUDIT.md`, `docs/qa/RC8_ALL_242_CARD_RUNTIME_INVENTORY.csv`, `docs/qa/RC8_LEGACY_SELF_TEST_TRIAGE.csv`; historical tests are NOT blanket PASS.

## Current RC9 — Ultimate Tribute / S0 Color Mana check and fix

**Confirmed root cause in RC8:** S0 DEV44 consumer cards correctly flag 15 Ultimates as `is_ultimate`, but the app adapter failed to provide the v6.91.9-shaped `requirement.ultimate.owner_lineage_card_ids` and `tribute.exp_value`. Thus `ultimateMatchesReceivingHero()` rejected all 15 owners (`no legal receiving Hero`), even if matching Color Mana was available. Unhydrated `tributeExpValue()` also defaulted to 100 EXP. **This is an app integration defect, not proof that OSA's Ultimate/card definitions are incorrect.**

**Fix:** bind all 15 S0 Ultimates to their current Hero-owner progression IDs using S0 evidence; materialize `requirement.ultimate` and `tribute` contracts before gameplay initialization. Keep the existing v6.91.9 payment routine and Mana pool/deck card mechanics; translate user-facing Ultimate Tribute and payment copy to S0 Color Mana terminology. `S0_ULTIMATE_OWNER_NAMES` is an app-specific source-backed mapping; inspect `docs/qa/ULTIMATE_S0_SOURCE_BINDINGS.json` before adding/replacing an Ultimate.

**Source evidence:** 13 Ultimate owner names are explicitly printed as restrictions in S0 source card JSON; Grand Finale and Absolute Defense are mapped by their unique Bard/Arcane Warrior Rank II–III class progression in S0 Hero records. Source validation script confirmed 15/15 S0 mappings; no S1 IDs were used. (The 13 historical stage cards contain printed restriction evidence, while the two new Ultimates are matched via current S0 progression. This must be reconsidered if OSA releases an explicit updated owner mapping.)

**Targeted Chromium/gameplay-handler QA:** `GL_S0_ULTIMATE_TRIBUTE_QA_SELF_TEST()` PASS: 15 cards x PLAYER and AI = **30 successful functional Tribute commits**, including legal Hero target, matching Color Mana consumption, 200 EXP, rejection when Color Mana missing, rejection for wrong Hero, Mana card return to deck. `GL_S0_TARGET_SELECTION_QA_SELF_TEST()` PASS; `GL_S0_RC6_LINEAGE_EFFECT_REGRESSION_QA_SELF_TEST()` PASS. JS syntax PASS. Chromium page errors 0 / missing assets 0 in this particular test. See `docs/qa/ULTIMATE_TRIBUTE_CHROMIUM_QA.json`.

**What RC9 does NOT prove:** Manual mouse-driven UI Tribute selection was not individually verified for all 15 Ultimates. Full Human-vs-AI game through normal browser actions remains unverified; do not claim FINAL/fully playable. No OSA modifications.

## Open tasks / must-do before FINAL

1. **Complete at least one normal Human vs AI match in target browser until the actual Win/Loss/Draw terminal screen (not Surrender).** Verify AI progression and no stuck phases.
2. Manually test Ultimate Tribute UI: matching Color Mana, wrong-color/no-color denial, right/wrong owner Hero, 200 EXP and immediate Rank Up. Verify preview and Choice modal wording says Color Mana instead of Class Shard where applicable.
3. Re-test remaining historical S1 regressions against actual S0 cards/effects. RC8 triage split 67 historical tests into 10 PASS, 12 stale S1 assumptions, 27 requiring S0 retest, 18 requiring browser/DOM. These are test classifications, not 57 confirmed gameplay bugs.
4. End-to-end response/exact Mana payment/Stoneblood, multi-target, nested Response, casting and Bard CONDITION paths through actual browser interaction; test UI layers/hover including mobile.
5. Validate unmaterialized S0 effect routes from `RC8_ALL_242_CARD_RUNTIME_INVENTORY.csv` by effect family. Do not equate empty legacy effect arrays with broken gameplay without executing actual handler.
6. Verify AI tactical behavior in real games: Buff follow-up actually played, Ultimate emergency/finisher decisions, Bard choosing discard/return quantities and continuing turns.
7. OSA discrepancy **pending designer/source review only**: Health Potion and Greater Health Potion current official card art reportedly prints HEAL +30/+50 while DEV44 consumer text omits values. Do not silently change canonical OSA based on adapted app fields; source issues tracked in `docs/qa/OSA_DISCREPANCIES_PENDING_REVIEW.md`.
8. Final packaging only after above gates (or with explicit documented waiver). Avoid repeated build ZIPs for tiny changes; keep app root minimal and one parent folder.

## Source and repository notes

- Runtime app entry `index.html`; v6.91.9 engine in `engine/shared-app/app.bundle.js`, data in `engine/js/static-data.js`, starter decks `engine/shared-app/active-starters.js`.
- Internal Mana resource records still use `kind:'CLASS'` and `class_name`; this is app implementation syntax and NOT the player-visible name. Replacing this internal shape without a full migration will break payment and Tribute.
- Preserve original S1 ZIP and OSA DEV45 ZIP as separate rollback baselines. Do not copy historical S0 art or outdated OSA-host experiments into VS AI.
- This note replaces earlier short takeover files for operational status. Earlier stage handoffs remain in `docs/history/` for receipts only.


## RC9 — 2026-11-04 — UI/Legacy/Defense/Ultimate/Bard follow-up

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

## Next mandatory work

1. Obtain a reproducible normal-match Bard Return failing sequence if still observed; inspect live Discard pile IDs, returned count, Deck and Hand after any subsequent Draw. Do not overwrite approved S0 text.
2. Test Bromir full real GUI Response PAY and the two ranks; verify Reflected damage, INVINCIBLE and attachment expiry in actual turns.
3. Test Draxen Execute via actual card selection, including 50% threshold, cost and response.
4. Manually play all ten Legacy abilities including costs/search/return/Token cap; full Chromium click path.
5. Run genuine human-vs-AI match through Win/Loss/Draw without Surrender.
6. Re-evaluate remaining historical test triage and 119 non-Hero S0 effect records without normalized `effect[]` using actual affected card actions.
7. If true OSA discrepancies are established, add to OSA review queue; no OSA modifications made in RC9.


## RC10 — 2026-11-04 — Discard → Main Deck ghost return presentation

**Input / baseline:** Season 0 RC9, OSA DEV45 unchanged. **Requested UI change:** use only a subtle **card-back ghost** like existing Draw/Rank Up card movement, not an animated face card. Implemented in the original app animation queue, not in the OSA engine.

**Implemented:** A physically successful, committed Return from Discard to Main Deck now queues one translucent `assets/ui/back-main.webp` flight per card, Discard Pile → Main Deck. Covers Bard/Maestro note-return CONDITIONS for both normal PLAY and Response PAY, plus Replenish and Legacy abilities that return cards to Main Deck. Does not animate mere validation, cancel, failed payment, or a return to Hand. Original shuffle, effects, AI decisions, animations, card artwork, and Mana behaviors are unchanged.

**QA:** Chromium inline-loaded DOM (direct localhost/file navigation blocked): AI Crimson Crescendo returned 2 Zol, 2 ghost animations were queued and animation node appeared then cleared. No page errors. Prior S0 Lineage 6,975/6,975 and Target 13/13 self-tests still PASS. `docs/qa/rc10/RC10_QA.md` and `RC10_QA.json` contain method and limitations. `node --check` PASS.

**NOT closed:** A normal Human vs AI browser match to Game Over and full visual verification in a hosted match remain UNVERIFIED. The earlier user-reported live Bard Return concern cannot be concluded resolved by a presentation-only change; inspect exact card identities and zones if it recurs. OSA Health Potion textual/art discrepancies still require designer review. Do not state FINAL until actual gameplay has been verified.

**Handoff:** Start from this single RC10 ZIP, preserve all previous fixes / current OSA DEV45 card data, use `docs/TAKEOVER_NOTE.md` as authoritative work history, and minimize future ZIP builds by consolidating substantive changes. App root only `index.html` and `README.md`, other docs grouped under `docs/`.


## RC11 — 2026-11-04 — Full-HP Healing and S0 Double Casting Rank II

- Audited actual v6.91.9 shared pre-play legality and S0 RC10. Found an inherited validator gap: Full-HP pure Healing could reach PLAY on S1 as well as S0, although the target selector correctly rejected full-HP recipients later. Implemented a shared preplay/commit validator for **pure** single- and all-target Heal, both PLAYER and AI. Attack+Heal and legitimate independent effects remain legal. Actual S1 baseline reference in `docs/qa/RC11_S1_HEAL_BASELINE.json`.
- Replaced stale S1 Double Casting Elementalist Rank II behavior (5 Mana, next-turn, Exhaust) with **current S0 DEV45** branch: printed 1 + 2 surcharge = 3 Mana, BUFF/no Exhaust, active this turn, counter 1 to expire at owner End. Rank III costs 1 and is also current-turn. The existing separate Response windows for the two Magical Attack activations are reused. AI Double Casting plan now picks a same-turn follow-up. No official card data changed.
- `docs/qa/RC11_VALIDATOR_QA.json`: 9/9 targeted checks PASS. Additional existing checks: S0 target 13/13, Ultimate Tribute 30/30, 6,975 lineage combinations PASS. Historical S1 regression hooks for Intercept, Double Casting fixture, and Hero registry still fail as recorded in `docs/qa/RC11_VALIDATOR_COMPARISON.md`. They require separate S0-aware triage; do not label blanket PASS.
- **Next**: inspect live full-HP healer UI and the Rank II Double Casting presentation in a normal match; rerun S0-appropriate Response tests; then complete normal Human-vs-AI browser match to Game Over. RC11 remains a release candidate, not verified final.
- OSA DEV45 remains read-only. No confirmed OSA correction required by these two reported defects.


## RC12 — 2026-11-04 — Bard/Maestro Inline Draw Ability & Real Battlefield Ghost Returns

**Authorization:** designer explicitly requested implementation after clarifying button semantics `CONFIRM` + `CANCEL` and the 65% dark/light focus on Hand and ability buttons. Source baseline RC11, no OSA modifications.

- **Problem:** Original S0 Bard/Maestro Draw-phase Hand exchange opened a popup; RC10 Return ghosts were queued in the *hidden legacy engine DOM* while the active Battlefield adapter runs with renderer suppressed. Thus actual game could change card zones correctly without a visible motion.
- **Inline UI:** Before activation, the active Bard/Maestro Hero displays its Class Ability name and `SKIP` to the right (same location as Arbalest). Clicking the name enters a *tentative selection*, shows one `DISCARD` action above every Hand card, and switches the buttons to `CONFIRM` (disabled until at least one card selected) + `CANCEL`. Selected Hand buttons become `UNDO`. `CANCEL` restores the initial choice with zero zone changes; `SKIP` consumes the ability with no exchange. `CONFIRM` makes one authoritative Discard/Draw transaction. Bard allows one; Maestro allows 1 or 2 (never requires 2).
- **Focus:** Reuses current 65% dimmer, highlights only the Hero ability buttons and the Hand during selection, no Bard popup. Other modal systems are unchanged.
- **Return presentation:** On committed physical Discard → Main Deck movements, authoritative engine emits `CARD_RETURNED_TO_DECK` with side and count; Battlefield presentation plays sequential ghost Main Deck back animations and only then same-batch Draw motions. Rollback restores authoritative event state. Supports both PLAYER and AI through shared side-specific zone resolution. No changes to OSA or effect logic.
- **Evidence:** `docs/qa/rc12/RC12_QA.md`, `RC12_UI_CHROMIUM_QA.json`, `RC12_RETURN_CHROMIUM_QA.json`. Real Chromium mouse-driven buttons, CANCEL rollback of tentative selection, 1/2 Maestro commits, Bard max one and SKIP passed. Isolated AI Crimson Crescendo committed two Zol Returns, event count 2, two visible card-back ghosts appeared and finished without JS errors. Baseline target 13/13 and Class/Lineage 6,975 pass.
- **Still open:** A complete normal Human-vs-AI game to terminal Game Over (not Surrender) and the user's particular live Bard Return case. Do not claim FINAL. S0 OSA DEV45, other apps untouched. All previously listed RC11 open validator and Double Casting live checks remain open.


---

## Part 2 — 2026-11-04 — Working Rules & Read-Only Packaging Audit

**Scope:** New designer workflow instructions recorded. Read-only inspection of existing RC12 ZIP only. **No application code, card data, engine, OSA, or original RC12 ZIP was modified. No version bump.**

### Designer-approved working rules (apply to all next tasks)

1. **Bug reports: inspect first.** A bug report authorizes investigation/QA only, not implementation. Reproduce and identify actual root cause, distinguish confirmed engine bug vs data/rules/design vs unverified report, show evidence and proposed fix, and obtain explicit authorization **before changing code or building an updated package**. Do not silently fix unrelated issues.
2. **File naming:** New distributable filenames contain only application name, version, and date, e.g. `Grandis_Legacy_VS_AI_Season0_v1.0_RC13_2026-11-04.zip`. Do not append descriptive change names or extra suffixes. Avoid building new ZIP files for every small change; consolidate once authorized.
3. **Organized package:** Preserve exactly one enclosing application folder. Root contains `index.html` and `README.md` as the only root files; keep runtime essentials in designated `assets/`, `card-art/`, `engine/`, `runtime/`, `shared-app/`, `shared-ui/`. Reports, QA, manifests, history, and takeover note belong under `docs/` with logical grouping. Check for temporary files, unnecessary duplicates, and broken ZIP integrity before delivering. Never delete required runtime assets just to clean structure.
4. **Takeover note on every work session:** Update `docs/TAKEOVER_NOTE.md` covering baseline and version, requested work, investigation/evidence, changes (if authorized), files/functions affected, QA conducted with limitations, unresolved bugs, next concrete tasks, and relevant designer decisions/corrections so previously solved issues are not reintroduced. Record rejected approaches and specific do-not-repeat mistakes when applicable.

### Work completed this session

- Opened and inspected original `Grandis_Legacy_VS_AI_Season0_v1.0_RC12(1).zip` read-only.
- Archive has 523 files under the single folder `Grandis_Legacy_VS_AI_Season0/`; only two files are directly at its root: `index.html` and `README.md`.
- Functional file groups are present (`assets/`, `card-art/`, `engine/`, `runtime/`, `shared-app/`, `shared-ui/`); 116 documentation / QA / report files live under `docs/`.
- ZIP CRC integrity test found no corruption, no duplicate entry paths, and no standard OS/build junk from checked patterns.
- The external handoff note uploaded for Part 2 matches the bundled `docs/TAKEOVER_NOTE.md` byte-for-byte before this documentation update.
- Minor organization opportunity, **not a confirmed functional error**: `docs/RC10_FILE_SHA256.csv` is at `docs/` root while other manifests appear under `docs/manifests/`; historical release status records are also retained. Do not move/delete material without confirming downstream references, especially when cleaning future packages.
- **No browser gameplay or bug reproduction performed in this audit.** RC12 remains a release candidate.

### Next work

- Await concrete bug report or feature task; inspect/reproduce and report evidence first, before any authorized fix.
- Once code changes are explicitly authorized, preserve original v6.91.9 architecture and current S0 OSA DEV45 card authority; regression-test affected paths and record evidence and known limits.
- When an updated release is requested, include the revised takeover note under `docs/`, verify ZIP structure and integrity, and name ZIP only `application_version_date.zip`.
- Continue already-open RC12 acceptance work: real normal Human-vs-AI game through Win/Loss/Draw, original live Bard Return case, full-HP Healing and Double Casting live UI checks, and remaining Response/Legacy/Casting regression work.

---

## Part 2 — 2026-11-04 — RC12 Bug Investigation: Deck Builder v1.58 Import & Primal Strike Response (READ-ONLY)

**Authorization:** Investigation/QA only. Under the designer's standing rule, bug reports do **not** authorize code modifications. No source, executable, official OSA, Deck Builder, or original RC12 archive was edited; no new application ZIP/version. This section is a documentation update only.

### 1. Deck import — CONFIRMED COMPATIBILITY DEFECT (VS AI importer)

- Baseline: `Grandis_Legacy_VS_AI_Season0_v1.0_RC12(1).zip` and original Deck Builder `Grandis_Legacy_Deck_Builder_v1.58_2026-11-01_Rulebook_v2.9_Fix_GitHub_Ready(1).zip`. The RC12 package itself contains five `runtime/season0-authority/DeckBuilder-v1.58-Starter-0X.json` examples.
- Deck Builder Style 2 `style-2/js/app-s0.js` `s0Draft()` and `s0Export()` produce the Season 0 `GL-SEASON0-DECK-DRAFT-1` format, with `deck.main_deck`, `deck.shard_deck`, `deck.legacy_packages`. A normal export also duplicates `main_deck` / `shard_deck` / `legacy_packages` at the top level and may include `legacy_deck_package_slots`.
- VS AI `shared-app/app-runtime.js` lobby input passes the parsed JSON directly to `GL_GAME_ENGINE.importDeck(side,raw)`; `engine/shared-app/app.bundle.js` `glPvpApplyDeckChoice()` calls `normalizeDeck()` and `validateDeck()` without any Deck Builder Season 0 schema adapter.
- The VS AI internal matcher expects **top-level** `main_deck`, **top-level** `legacy_deck_expanded` containing exactly 12 physical card IDs, `legacy_deck_package_slots` (three), `default_formation`, and optionally `mana_deck`. The v1.58 representation uses `deck.legacy_packages` with `hero_rank_ids[3]` + `legacy_card_id` instead of the expected expanded 12-ID array, and `shard_deck` rather than `mana_deck`.
- **Real Chromium JS/engine test (inline-loaded DOM because local navigation is administratively blocked):** All **five bundled nested** v1.58 starter examples rejected with `Deck validation failed: missing main_deck.`; all **five representative full v1.58 exports** assembled according to the actual `s0Export()` field structure rejected with `Deck validation failed: missing legacy_deck_expanded.`. No page JS errors. Representative full exports were constructed from the five official bundled examples following the inspected v1.58 export function; they were not user-supplied downloaded exports.
- **Diagnostic non-persistent conversion QA:** Expanding each `legacy_packages` entry into Rank I, Rank II, Rank III, Legacy physical IDs; mapping the 3 slots by exact `default_formation` Rank I IDs; moving `deck.main_deck` and `deck.shard_deck` to their VS AI equivalents yielded **5/5 successful `GL_GAME_ENGINE.importDeck('PLAYER',converted)`** calls, each with the correct formation. This conversion occurred only as browser evaluation test input, not application code. It isolates the failure to the importer format bridge rather than disproving the v1.58 card/deck authority. Still requires actual hosted import click-path and actual exported user deck end-to-end retest after any authorized patch.
- **Proposed patch AFTER authorization ONLY:** S0 v1.58 schema detection, complete strict conversion/validation into the engine shape before state mutation; accept both nested-only bundled example and full exported form; expand exactly three verified `hero_rank_ids`+`legacy_card_id` packages into exactly 12 IDs; bind slots to correct formation identities; convert `shard_deck` to `mana_deck` while preserving the internal `kind:'CLASS'`/`class_name` contract. Refuse malformed, cross-season, non-50-card, illegal Ultimate/copy/lineage/Color Mana decks; never silently substitute S1 identities. Retain backward compatibility with native existing `GL-DECK-1.0` starter imports.

### 2. Primal Strike — RESPONSE WINDOW EXISTS & FUNCTIONAL, COVERAGE NOT EXHAUSTIVE

- Source: current OSA S0 DEV45 printed Beastman Racial Trait on `S0-ARC-H001`: "During your Battle Phase, you may spend 1 Racial Token to deal 20 Physical damage to an injured opponent's Hero." This is Racial Ability damage, not automatically an Attack Skill. Designer explicitly confirmed for S0: Primal Strike must be respondable; do not inherit S1's non-response behavior.
- RC12 code already opens `kind:'incoming_ability_damage'` with `response_owner` for the defending side via `openPrimalStrikeResponseWindow()`. Uses `primalStrikeResponseOptions()` and `resolveAbilityDamageResponseWindow()`; the implementation intentionally narrows response categories to `dodge` / `block` and special defensive Racial Traits `Second Chance` / `Dragon Scale`.
- Existing `GL_HERO_RACIAL_EFFECT_FIX_QA_SELF_TEST()` returned PASS including `primalStrikePhysicalResponse:true`. This self-test verifies a window and pass/no-response damage; do not misrepresent it as exhaustive hand-card interaction.
- **Focused Chromium browser-engine fixture, AI Primal Strike against player Mage (`S0-MAG-H001`):** Before action target injured; ability spent one AI Racial Token; opened `incoming_ability_damage` Response for PLAYER; `S0-MAG-005` Mirror Image appeared as a `dodge` option. Choosing it entered `response_payment_choice` (no premature damage); exactly 4 Mana Shards were paid; commit succeeded; Mirror Image moved to Discard and target HP remained 50 (20 Physical damage Dodged). Player Battlefield's `PASS` control appeared while awaiting Response. There were zero page JS errors. This uses a constructed, source-backed state and engine/browser rendering, **not** a complete normal-match UI playthrough.
- **Caveat / candidate additional issue requiring separate investigation:** In the constructed fixture, `S0-ITM-016` Chain Mail (printed BLOCK incoming Physical damage) did **not** appear as an eligible Primal Strike hand-card Response; other contexts may differ and item targeting/lineage/handler materialization must be examined before concluding exactly why. `S0-THF-027` Dodge Instinct was tested at a Rank I Thief, which does **not** satisfy its printed Arbalest Rank II restriction; that absence was legal and is NOT a bug. The working `S0-MAG-005` Mirror Image path proves responses are possible, not that every otherwise-legal protection card works. Do not silently extend to NEGATE/REDIRECT/REACTION without checking S0 scope and designer ruling.
- **Proposed next verification (no code until approved):** Test standard Physical BLOCK card and representative legal Dodge/Response types against Primal Strike from Hand through actual mouse UI and actual PAY; if Chain Mail truly should be legal and is missing, isolate its response `effect[]` adapter/`responseKind()` detection before proposing a narrow fix. Include pass/no-response and AI-side defense regression.

### Test-method and release limits

- Executed official RC12 code in Chromium in a single in-memory inline DOM because `localhost` navigation returned `ERR_BLOCKED_BY_ADMINISTRATOR`; therefore results prove actual JS handler behavior, **not** a hosted-deployment import dialog nor a fully natural game from opening through terminal result.
- Evidence outputs stored locally during this diagnostic run at `work_gl/qa_import_matrix_results.json`, `work_gl/qa_inline_results.json` and `work_gl/qa_racial_ui2_results.json` (diagnostic staging only, not part of release ZIP). The final detailed Mirror Image resolution is in the latest `qa_racial_ui2_results.json` generated by the `qa_racial_ui4.py` check.
- **Next tasks AFTER explicit authorization:** implement and retest v1.58 importer in VS AI only; independently triage Chain Mail vs Primal Strike Response; retest existing 5 starters/native import, untouched card data, UI and original S1 engine regression. Update this note with authorized changes and tests. Preserve all RC12 fixes; do not mark FINAL based on these targeted checks.


---

## RC13 — 2026-11-04 — Deck Builder v1.58 Card Review UI parity (AUTHORIZED UI CHANGE)

**Authorization:** Designer requested VS AI Season 0 Card/Hero Review to be visually identical to Deck Builder v1.58, and specifically directed removal of the additional enclosing VS AI container. This is an explicit UI implementation request, not unilateral modification based on an unapproved bug report. Baseline RC12. **OSA DEV45 remains READ-ONLY.** No fixes to the previously reported importer/Primal Strike issues were authorized or included in this change.

### Root cause and decision

- RC12 rendered an approximate Deck Builder layout within an iframe but wrapped it in a second VS AI dialog with its own yellow border, dark title/header with `CLOSE`, and independent scroll/height. This resulted in two modal surfaces and duplicated review titles. The iframe also rebuilt its own stats and effects rather than using the Deck Builder's exact review renderer; e.g. `RANK/HP/EXP` and `MANA COST/TYPE/EXP TRIBUTE` did not match Deck Builder's `CARD TYPE/HP/REQUIRED EXP` and `CARD TYPE/SUBTYPE/MANA COST/EXP TRIBUTE`.
- Removed the *outer visual container*, not the CSS-isolating iframe. The sole visible review card is now the genuine Deck Builder v1.58 modal structure, including its header and `×` close button inside the modal. Outer VS AI overlay remains only as a transparent structural host/backdrop, with its extra border, heading, box shadow, background and scroll removed. Background-click/Escape and iframe `×` close all still work.
- Extracted the **actual presentation-only v1.58 review helpers and `heroReviewHtml` / `standardReviewHtml`** from the supplied Deck Builder `js/app-s0.js` into `assets/review-db158/js/review-renderer-v158.js`. No reimplementation of the actual game engine. Existing bundled Deck Builder styles and keyword presentation remain isolated inside the iframe to protect original battlefield CSS.
- `shared-app/db158-card-review.js` now maps **current OSA S0 DEV45** printed rows to the v1.58 view-model, not S1/source-id guesses. It uses canonical OSA values and card artwork; for Item/Event records whose official printed row is empty, it displays the same card's official `card_text`; for Legacy, it keeps `LEGACY_ABILITY` and `LEGACY_REPLACEMENT` distinct, and resolves class display from existing S0 class code.
- Kept the earlier authorized VS AI choice to hide the Deck Builder's Hero lineage footer: Hero progression is already selected using the separate battlefield progression UI. Do not reintroduce the footer without designer approval.
- Expanded the single review modal to use the available viewport width, reflecting the supplied Deck Builder screenshots, with mobile responsive behavior. The overlay does not add another surrounding visual container.

### Change inventory

- `shared-app/app-runtime.js` — one review host, no redundant header, validated iframe close event.
- `shared-app/db158-card-review.js` — OSA-to-DeckBuilder view-model and one-layer iframe document; no engine data mutation.
- `assets/review-db158/js/review-renderer-v158.js` — new isolated copy of original Deck Builder v1.58 review presentation helpers.
- `shared-ui/battlefield-ui.css` — scoped final RC13 override only for review host frame/overlay; no gameplay UI selectors intentionally changed.
- `README.md`, this note and `docs/qa/rc13/*` — version/status, audit receipt and evidence.

### QA and restrictions

- `node --check` PASS for all three affected JS modules.
- Chromium desktop at 1452×702: Bromir Oathforge and Shield Blast render with exact Deck Builder headings/column names, correct v1.58 renderer, card artwork, one header and inner `×`, transparent/borderless outer host, cross-frame close working, zero page JS errors.
- Chromium responsive smoke: **18/18 cases** (nine S0 cards × desktop/mobile 390×844) rendered without JS errors; Hero Rank I–III, Physical Attack, Tactical, Ultimate, Item, Event and Legacy views checked. Long review pages have scrollable card content at mobile sizes.
- Separate actual iframe resource loading via intercepted HTTP routes: original 18 v1.58 CSS files plus both enhancer/renderer JS files loaded; 2/2 modal close clicks worked, all artwork loaded, no page JS exceptions. No missing review resources. QA's unrelated parent-game audio requests were unserved only because the test route interpreted URI-encoded spaces literally; this was not a gameplay asset test.
- These are **focused Card Review UI checks**, not proof of complete normal Human-vs-AI playthrough or full browser/hosting regression. RC13 remains **RELEASE CANDIDATE, NOT FINAL**.

### Candidate OSA/source mismatch — DO NOT silently alter

- For `S0-MAG-H007` Bromir Rank I: current OSA DEV45 consumer card metadata declares **HP 80**, but the corresponding card artwork visibly prints **HP 90** and Deck Builder v1.58 shows **90**. Since this task authorizes *layout* parity only and OSA is the live gameplay authority, the new review continues to show **80** from OSA. Logged as a source/visual discrepancy requiring an explicit designer/OSA resolution; do not change Hero HP, engine or Deck Builder merely to make the screenshots agree. This issue **predates RC13**. Other Hero HP differences should be audited separately rather than extrapolated.

### Next work (NOT implemented in RC13)

1. Obtain approval for an actual app-side Deck Builder v1.58 deck importer fix; the prior read-only RC12 investigation confirmed nested `deck.main_deck`, `deck.shard_deck` and `deck.legacy_packages` were not converted to native VS AI structures.
2. Investigate Chain Mail availability in Primal Strike Response; existing Mirror Image Response was demonstrated functional. No changes to racial gameplay/Response logic in this UI release.
3. Seek designer/source ruling for Bromir HP 80-vs-90 and the previously recorded Health Potion print/text discrepancies; OSA unchanged.
4. Test actual normal Human-vs-AI game to Win/Loss/Draw and remaining real-browser Response/Legacy/Casting, full-HP Heal and Double Casting paths; do not claim FINAL prematurely.
5. For any future bug report, investigate and report first, wait for authorization before code changes. Preserve file naming (`application_version_date.zip`), one parent folder, root-only `index.html`/`README.md`, and append a fresh takeover entry for each substantial work session.

---

## Six-stage card-code audit — Stage 1/6 ARC: AUTHORIZED FIX (staged, no version increment) — 2026-11-04

**User approval:** After the six-stage code/KEYWORD/STATUS audit (ARC, WAR, THF, CLE, MAG, EVT/ITM) was agreed, designer explicitly requested **fix the first stage now** and **do not increase the application version until all six stages have been audited and fixed**. This permits ARC repairs, not blanket unsolicited fixes elsewhere. **No release/version increment**: code edits are stored in the persistent working tree based on the most recently generated RC13 UI archive; the earlier ARC audit evidence was conducted on RC12, whose gameplay bundle was byte-identical to RC13. No original archive was overwritten. The Card Review visual changes from RC13 are preserved.

### Source code changes (engine/shared-app/app.bundle.js only)

1. **ARC-1 SLEEP:** Enforce printed v2.9 rule at shared `sourceCompatibleForMode`: a Sleeping Hero cannot use Skill (unless keyword DODGE) or Event. Item / Racial Trait / legal DODGE stays available; STUN remains more restrictive. On a later **connected** Attack, `applyResolvedAttackDamage` removes a pre-existing Sleep before applying any status inflicted by the new Attack, even if HP loss is 0 due to BLOCK or damage-prevention. The Attack that first applies Sleep does not wake it; DODGE or prevented/non-connected Attack does not wake.
2. **ARC-2 duration:** Apply all six negative Statuses (Bleed, Burn, Freeze, Poison, Sleep, Stun) additively with max **6 duration counters**, both on first application and reapplication, leaving strength/damage unchanged. Non-status duration markers are not affected. UI Sleep badge now displays its counter.
3. **ARC-3 damage type:** `currentDamageType` now checks official S0 attack/attack-label or `effect` metadata and, for Area/Casting that only label the attack shape, reads the official printed Class row to distinguish `Deal (Area) Magical damage` from Physical. `damageTypeForActionSource` now supplies the source Hero for branch matching. Does NOT infer that all Area/Casting are Magical or change official card data. Aether Infusion conversion remains first-class.

**Touched files:** `engine/shared-app/app.bundle.js` plus `docs/qa/arc/ARC_FIX_QA.json` and this takeover note; no OSA/other-app modifications. Implementation keeps the original response and mana-payment architecture. A portable unified patch is stored beside the staged tree as `Grandis_Legacy_VS_AI_Season0_v1.0_RC13_2026-11-04.patch`.

### Test evidence (targeted, NOT blanket release acceptance)

- JavaScript `node --check` PASS. Chromium page errors 0.
- 6/6 Status additive reapplication and 6/6 first-application/reapplication caps passed; Poison fixed base tick unchanged (previous targeted test).
- Sleep: standard Skill blocked; Event blocked; DODGE Skill permitted and offered as Response; non-DODGE BLOCK Skill forbidden; Item permitted; applying Attack Sleep persists; later zero-damage and fully blocked connected Attack wake; DODGE/non-connection leaves Sleep; another Sleep Attack reapplies correctly after waking.
- **96 Skill Attack identities** checked against current official print/type (40 Magical, 56 Physical), no mismatches in targeted canonical classifier checks. Magical-only Defense option offered against Magical and not Physical. Sample Bow Bash/Poison Arrow/Burning Arrow/Sleeping Dart/Long Range Shot/Zol engine action fixtures still executed.
- Existing self-tests: Target 13/13 PASS, Class/Lineage 6,975 cases PASS, Ultimate Tribute 30/30 PASS. They are focused regression hooks only.
- Detailed machine-readable test results are in staging `qa_arc/` with summary also under `docs/qa/arc/ARC_FIX_QA.json`.

### Still open / next tasks

- **Next stage: WAR 2/6**, code-based keyword/status audit; report findings and obtain approval for their fix before editing WAR-specific code, unless a standing authorization to repair each audited phase is confirmed. Do NOT bump version until six stages audited and fixed.
- ARC code-level fix is not proof all 42 ARC records work end-to-end. Continue tracking Bard Return, Casting, multi-target, skill cost/response and 10 Legacy abilities, full normal Human vs AI match to actual terminal result, and the previous importer incompatibility/Chain Mail investigation as separate issues.
- Other status-related interactions (e.g. cleansing Sleep) and card families must be audited in their corresponding stages; do not silently claim they passed from this focused fix.
- OSA Season 0 DEV45 and existing application ZIPs remain read-only. No new finalized application ZIP created at this stage.


---

## Six-stage card-code audit — Stage 2/6 WAR: READ-ONLY REVIEW — 2026-11-04

**User instruction:** "lanjut cek dlu" means investigate WAR before any code change. **NO WAR fixes applied**, no version bump, no new ZIP. Baseline is RC13 presentation working tree with the earlier authorized ARC repairs staged. Original RC12/RC13 ZIPs and OSA DEV45 remain untouched.

**Scope:** all 42 WAR-prefixed card identities (31 Skill/9 Hero/2 Legacy), S0 printed rows, keyword/status mechanics and S1-engine-to-S0 compatibility paths. Browser-injected isolated code probes executed directly against the current staged JavaScript source. 31 Skill synthetic begin-play smoke attempts are *not* 31 full-effect passes.

**Five confirmed defect groups (evidenced in `Grandis_Legacy_VS_AI_Season0_Audit_WAR_2026-11-04.md` and `.csv`):**

1. **WAR-01, `S0-WAR-005 Taunt`:** no suppression of enemy Area Attack; when Taunt target is outside normal AoA, other target positions remain legal. An active Taunt on RIGHT did not prevent AI LEFT Gladiator Wild Swing Area action. Scope: target and preplay legality, both PLAYER and AI.
2. **WAR-02, `S0-WAR-012 Deflect`:** Gladiator/Conqueror REFLECT 20 printed, but engine reflects 10 after Physical and 0 after Magical. Literal code branch uses `-10` and `damage_type==='Physical'`.
3. **WAR-03, `S0-WAR-013 Enrage`:** +20 damage works, but printed Bleed(1) never applied on connected Physical Slash. Source buff has no Bleed application hook.
4. **WAR-04, `S0-WAR-018 Execute`:** Gladiator Rank II printed 5+2 Mana but engine pays 5; response flags correctly permit Dodge at Rank II, but the final option filter deletes legal DODGE. Rank III SURE HIT correctly disables Dodge.
5. **WAR-05, `S0-WAR-029 Runic Guard`:** Arcane Warrior (`S0-MAG-H008`) correctly reflects 30; Arcane Vanguard (`S0-MAG-H009`) correctly BLOCKs but loses inherited 30 REFLECT. Current special check matches only `heroClass==='Arcane Warrior'`.

**Focused positive evidence:** MELEE Slash direct opposite, RANGE Weapon Throw extended AoA; PIERCING Upward Thrust disallows BLOCK but allows DODGE; connected Rank I/II Bleed and Stun from multiple printed WAR attacks reached their Status helper; Deflect Rank I appropriately had no reflection; Runic Guard Rank II reflects both damage types. These are isolated tests, not blanket 42/42 PASS.

**Unresolved / testing limits:** Full normal browser-driven game still unverified. Legacy II ability and Hero racial/class use beyond historical hooks require real playtests; post-approval regressions needed for all five defect groups, notably atomic Mana payment, response order and both sides. Do not conflate R3 Arcane Vanguard in MAG hero progression with WAR H006 Conqueror; previous initial fixture used that wrong Hero and was corrected **before reporting**. This is a documented test-design pitfall. Another pitfall: `openAttackResponseWindow` alone bypasses Execute's later Rank-specific override, so actual `commitPlayedCard` is required to assess Execute Response.

**Next:** THF (3/6) read-only audit unless user explicitly authorizes WAR repair. Preserve ARC staged fixes, keep notes/evidence, no version increment until all six stages' authorized fixes and integrated tests.

---

## Six-stage card-code audit — Stage 2/6 WAR: AUTHORIZED FIX (staged, no version increment) — 2026-11-05

**User authorization:** After read-only WAR audit identifying five confirmed defect groups, designer explicitly said **"perbaiki"**. This authorizes the five WAR corrections below, not unrelated cards or an immediate new release. Prior instruction still applies: **do not increase version or make a release ZIP until all six stages have been audited/fixed**. Continue using the staged RC13 UI + approved ARC engine fixes; RC12/RC13 ZIP originals and OSA Season 0 DEV45 are read-only.

**Application file changed:** `engine/shared-app/app.bundle.js` only. QA file `docs/qa/war/WAR_FIX_QA.json` and `WAR_FIX_QA.md` added. Unchanged app data/art/rules. Changes:

1. **WAR-01 Taunt (`S0-WAR-005`):** Active Taunt constrains opponent attacks at **preplay/commit** and at actual target selection (both PLAYER and AI). Area Attack plays forbidden; non-Area attacks target only the Taunt Hero if they can actually reach it under normal AoA/MELEE/RANGE. If the Taunt Hero is outside reachable AoA, the attacker does not gain permission to attack another target and does not gain a reach exception. After Attachment expiration, ordinary targeting/Area Attack legality resumes. Previous code erroneously discovered Taunt only *inside* candidate legal targets.
2. **WAR-02 Deflect (`S0-WAR-012`):** Removed early hard-coded 10 Physical-only retaliation. Use current S0 printed `REFLECT 20` at Gladiator Rank II (inherited by Conqueror Rank III), following connected Hit resolution for Physical or Magical attacks. Rank I lacks REFLECT. Zero damage after BLOCK still qualifies, but Negate does not. Shared existing attacker HP/Defeat route.
3. **WAR-03 Enrage (`S0-WAR-013`):** Adds printed 1-turn Bleed through standard Status helper on connected eligible Physical Attack. DODGE prevents it; Magical Attack does not trigger or consume the Physical-only buff. Existing +20 physical damage and 6-counter status cap preserved. No OSA row edited.
4. **WAR-04 Execute (`S0-WAR-018`):** Derive Rank II printed `MANA COST +2` from S0 Class/Lineage effect row; pay 7 Mana instead of 5. Rank III stays printed 5 Mana and has SURE HIT. Restore legal DODGE Response at Rank II, keep cannot-BLOCK non-damage defeat and preserve ≤50% HP target validation.
5. **WAR-05 Runic Guard (`S0-WAR-029`):** Read Rank II `REFLECT 30` from inherited official S0 row, so Rank III Arcane Vanguard now reflects 30 after connected Hit; Rank I still blocks only. No reflection on Negate.

**QA:** Real Chromium engine-injected comprehensive focused probe **36/36 PASS**, no page JS errors. Both attack directions and actual Mana payment/Response routines exercised in selected cases; `S0-WAR-018` R2 DODGE prevented Defeat after 7 Mana payment. Historical WAR stage-2 bug reproductions were rerun; Deflect 20 Physical/Magical, Runic Guard Rank III 30, Enrage Bleed 1, Taunt Area prohibited/out-of-reach no target, Execute R2 7 Mana and DODGE offered. Existing S0 hooks **Target 13/13**, **Lineage 6,975**, **Ultimate 30/30** PASS. `node --check` PASS. Details `docs/qa/war/WAR_FIX_QA.{md,json}`. These do **not** establish all 42 WAR card combos / normal UI match to Win/Loss/Draw; release still RC, NOT FINAL.

**Pitfalls not to repeat:** Do not allow Taunt to grant attacker RANGE; do not discover it from already-filtered legal targets. REFLECT must check connected Hit AFTER Response. Use inherited current S0 printed row for Runic Guard/Deflect, not literal current Class or an S1 hard-coded amount. Execute printed +2 exists at Gladiator Rank II only. Ensure DODGE is not stripped from Execute Rank II Response and remains forbidden for SURE HIT Rank III. Enrage bleed must use the existing status/immunity/cap system, not bypass it.

**Next:** THF Stage 3/6 read-only code/KEYWORD/STATUS audit, report first; repair only after designer approval. Continue CLE, MAG, EVT/ITM. Keep all patches staged without release version increment. After six stages, combined regression and complete match QA are still needed. Older independent issues (Deck Builder import, Chain Mail/Primal Strike, OSA discrepancy) remain out-of-scope/unmodified.

**Additional same-session regression (post-WAR patch):** Re-ran the earlier ARC comprehensive Chromium checks against the cumulative staged source. Six Status stacking scenarios PASS; six 6-counter caps PASS; Sleep legality/wake/DODGE scenarios PASS; 96 Skill attack damage-type classifications matched source expectations (40 Magical / 56 Physical); Magical-only Defense routing PASS; 0 page errors. Evidence at staging `qa_war/arc_post_war_regressions.txt` and refreshed `qa_arc/full_arc_regressions.json`. No new game-code edits resulted from this run.


---

## Six-stage card-code audit — Stage 3/6 THF: READ-ONLY findings — 2026-11-05

**Instruction:** User said “lanjut lagi” after approving and receiving the WAR fix. Per standing requirement, this means **inspect THF first, no automatic repair**. Do not increment the application version until all six stages are audited and authorized fixes completed, then combined QA. Current working baseline: RC13 Card Review UI + authorized ARC and WAR source fixes staged; no new ZIP/release or patch made in this THF session. OSA DEV45 consumer source remains read-only.

**Scope / method:** Inspected 42 THF-prefixed identities (31 Skills, 9 Heroes, 2 Legacy) against S0 official DEV44 consumer printed rows + current app materialization/handlers, and executed isolated Chromium game-engine probes with real payment/Response for selected cases. JavaScript syntax PASS; Chromium page errors 0. These are **not 42 fully played card effects**, nor a normal completed game. Full per-ID audit-level matrix: `Grandis_Legacy_VS_AI_Season0_Audit_THF_2026-11-05.csv`. Narrative and proof boundaries: matching `.md`. Outside-package test fixture: `/mnt/data/audit_work/thf_stage3_probe.js`, runner `.py`, result `.json`.

**Seven confirmed defect groups; NO fixes yet:**

1. **THF-01 (`S0-THF-009 X Cross Slash`) CRITICAL:** Official CONDITION discards Vertical Slash + Horizontal Slash from Hand. RC13 preplay accepts none, and actual Mana PAY spends 3 and resolves 90-damage Attack while neither required card is discarded, even when present. Both legality and atomic cost broken.
2. **THF-02 (`S0-THF-010 Back Slash`) HIGH:** S0 Thief 50/Rogue 60 (+Renegade passive 10) becomes actual 40/50/60 due to stale source-card-specific damage override. Don't copy S1 values.
3. **THF-03 (`S0-THF-004 Smoke Screen`) CRITICAL:** Explicit prohibition on negating Ultimate is ignored. Paid 3-Mana Response against Ultimate `S0-THF-019 Lethal Venom` wrongly negated and returned it. Casting disallow appeared correct in focused probe.
4. **THF-04 (`S0-THF-015 Venom Sovereign`) HIGH:** Official conditional +40 against poisoned Hero never happens; runtime conditional follow-up array absent, actual Rogue 20/Renegade 40 damage instead of 60/80. Also **preliminary shared-adapter warnings** for `S0-WAR-010` and `S0-MAG-008` missing similar follow-up metadata; NOT yet a confirmed bug in those other cards. Do not trust historical tests without executing current runtime.
5. **THF-05 (`S0-THF-017 Venom Binding`) HIGH:** Renegade Magical Hit wrongly queues one opponent physical Mana removal (`REMOVE_ONLY`); official Rogue/Renegade texts only say damage + Poison. Actual final physical Mana transfer **was not tested**.
6. **THF-06 (`S0-THF-022 Deflection`) HIGH:** Physical BLOCK70 succeeds and Magical option is correctly absent, but real paid Spell Blade/Arcane Duelist response gives 0 instead of REFLECT20; Thief Rank I must remain no-reflect.
7. **THF-07 (`S0-THF-023 Shadow Switch`; swap helper also used by `S0-THF-002 Jump Slash`) HIGH:** Paid Shadow Switch DODGE wrongly swapped Stunned allied Hero; S0 v2.9 Stun prohibits Swap. Shared Jump Slash option helper also offered Stunned Hero (not yet full paid-play reproduced). Check other swap card consumers before any generalized fix.

**Targeted positive checks:** Steal opened blind Mana selection but end transfer untested; Venom Strike Rogue/Renegade Poison stacks matched targeted class ability; Poison Mist three synthetic lanes Poison(3); Camouflage exhausted use correctly authorized for Archer Arbalest S0-ARC-H008; THF Legacy `Hidden Stash`/`Hidden Archives` app contracts present (GUI execution still untested). No blanket THF functional PASS.

**Do not repeat / scope guard:** Never skip printed CONDITION payment (X Cross); apply card-rank effects from official S0 rows, including inherited Lineage, not historical S1 overrides; no Ultimate-negate exception inference; `Venom Binding` unprinted Mana effect must not be interpreted as canonical; shared movement must reject Stun *and* Freeze for both source and partner. A stale historical self-test is not current coverage. User has **not authorized** fixing THF yet. Do not accidentally edit game bundle/OSA/other apps, build ZIP or increment version during read-only audit.

**Next:** await explicit THF fix approval, then re-run targeted proof + ARC/WAR regression if authorized. Continue CLE (4/6), MAG (5/6), EVT/ITM (6/6) with code/keyword/status source checks. Prior unresolved Deck Builder import, Chain Mail/Primal Strike, and OSA potion review remain separate. Full Human-vs-AI browser terminal match still unverified.

---

## Six-stage card-code audit — Stage 3/6 THF: AUTHORIZED FIX (staged, no version increment) — 2026-11-05

**Authorization and limits:** After a read-only THF audit reporting seven confirmed bug groups, designer explicitly instructed **"lanjut benerin"**. Applied corrections for THF-01 through THF-07 only, with narrow shared gating changes required for correct Status/Swap semantics. No other app, canonical OSA, rulebook, artwork, starter, or Deck Builder was modified. Maintain existing RC13 working copy **plus** previous approved ARC/WAR fixes. **No version increment and no new application ZIP** until all six audit/fix stages are completed and combined QA is done.

**Files:** `engine/shared-app/app.bundle.js` in the staged VS AI Season 0 app; new `docs/qa/thf/THF_FIX_QA.md` and `THF_FIX_QA.json`. This takeover note is also synchronized into `docs/TAKEOVER_NOTE.md` of the staged app. Portable patch for **RC13 baseline → cumulative ARC+WAR+THF** is `Grandis_Legacy_VS_AI_Season0_v1.0_RC13_2026-11-05.patch`; do **NOT** apply the previous same-name ARC+WAR patch and then the cumulative patch on top. Original RC12/RC13 ZIPs are untouched.

**Seven authorized fixes:**

1. **THF-01 X Cross Slash**: bind its printed CONDITION to exact Horizontal Slash `S0-THF-007` and Vertical Slash `S0-THF-008` physical Hand cards, check both at PLAYER/AI preplay and final action validation, discard both on successful Mana commit, rollback on payment/custody failure. Commit the Hand condition before reactive counter-priority if such a window opens. Missing either card cannot spend Mana or Exhaust a Hero.
2. **THF-02 Back Slash**: remove legacy 40/50 overrides in both damage functions; official Thief 50, Rogue 60, Renegade inherited 60 plus its actual passive +10 = 70.
3. **THF-03 Smoke Screen**: block Casting/Ultimate Attack NEGATE by card kind, Response option list, final payment revalidation and resolver; ordinary paid Single Target negate/return remains allowed. Do not use obsolete S1 Ultimate negation rules.
4. **THF-04 Venom Sovereign**: bind source-printed Poison-target extra 40 into the existing automatic conditional follow-up resolver after Primary; Rogue normal/Poison 20/60 and Renegade 40/80. DODGE/NEGATE suppress it; existing Primary-block-vs-follow-up separation retained. App-only binding not an OSA/source mutation. Do not assume unexamined WAR/MAG follow-ups are already fixed.
5. **THF-05 Venom Binding**: remove unprinted Renegade Mana removal queued after a connected attack. Only official Magical damage and Poison statuses remain.
6. **THF-06 Deflection**: add to shared source-row REFLECT check after connected Hit, 20 only for Spell Blade R2 and Arcane Duelist R3; Thief R1 0. Physical-only BLOCK 70 retained; no reflection on successful Dodge/Negate.
7. **THF-07 Shadow Switch / Jump Slash**: card-effect Swap pair checker now rejects either active Hero with **Stun or Freeze**, both at options and at final chosen-swap commit; mandatory Shadow Switch swap is also checked before a Response is offered or paid. No automatic exception to v2.9 Stun movement restriction.

**Evidence:** injected Chromium THF focused checks **35/35 PASS**, 0 page errors; official S0 WAR post-THF regression **36/36 PASS**; Target 13/13, Lineage 6,975, Ultimate 30/30 PASS; ARC post-THF Status stack/caps/Sleep/type regression PASS; Node syntax PASS. The original audit's seven reproduction categories now exercise corrected behavior. See `docs/qa/thf/THF_FIX_QA.md`/`.json`; this does not establish 42/42 THF end-to-end or a normal Human-vs-AI match through Game Over.

**Pitfalls / do not repeat:** X Cross printed mandatory CONDITION must not be skipped or turned into generic `discard 2`; physical discard and Mana must both commit, with cancel/rollback preserved. X Cross is 90 (older S1 hooks may expect 80); Back Slash is 50/60 and genuine Renegade passive, not historical 40/50. Smoke Screen **cannot** negate Ultimate or Casting; its legality must be checked at both offer and PAY. Venom Sovereign's +40 uses the existing automatic follow-up pipeline; don't multiply the Primary or double-charge it. Venom Binding has **no Mana removal**. Deflection Rank II–III reflect is conditioned on a connected Hit; don't permit it at Rank I. Stun and Freeze prevent card-effect Swaps for both participants, not just manual Reposition. Historical S1 self-tests that assert opposite values are **stale checks**, not a reason to overwrite OSA Season 0 data.

**Next:** Stage **4/6 CLE read-only code audit**, prioritize KEYWORD/STATUS/HEAL/REVIVE/Reaction/Response and compare official printed row per Class/Rank. Report confirmed issues before fixing unless designer separately approves. Then MAG 5/6, EVT/ITM 6/6. Do not release/increment version until all six stages and combined QA, including normal browser match if possible. Existing Deck Builder import, Chain Mail/Primal Strike, Health Potion OSA review remain separate open tasks.


---

## Six-stage card-code audit — Stage 4/6 CLE: READ-ONLY findings — 2026-11-05

**Authority/approval:** User said “lanjut” after THF fixes. Per standing policy this authorizes **CLE investigation only**, not code edits. Current staged VS AI baseline = RC13 UI + approved ARC/WAR/THF corrections. **No CLE fix, no patch/ZIP, no version increase**. OSA DEV45/DEV44 consumer and Rulebook v2.9 remain source authorities; do not write to OSA. App bundle SHA-256 fe4de2a95214b237ed12aefefeab9583ea80f1ac89434aa3b8d7231192aacc9d.

**Coverage/method:** Source/handler review of 42 CLE identities (31 Skill, 9 Hero, 2 Legacy) + isolated Chromium engine-executed probes for target legality, paid Purify and God's Blessing, Rank-dependent Lun Response, REACTION family, Healing Done, Holy Slash post-hit, revive profiles, persistent attach and Bard note conditions. Browser page errors: 0. Full per-card evidence file: `Grandis_Legacy_VS_AI_Season0_Audit_CLE_2026-11-05.csv`; report: matching `.md`. External-only test files in `/mnt/data/audit_work/cle_stage4_*`. The baseline app files remain unchanged. Synthetic fixtures are not 42 completed games.

**Five confirmed code defect groups; NOT FIXED:**

1. **CLE-01 Purify `S0-CLE-003` CRITICAL:** no materialized cleanse `effect[]`, `isRemoveStatusCard` false. Real paid 1-Mana play consumed card but left Poison(2) untouched. Also can PLAY without an afflicted target. Requires explicit target/status choice, legal preconditions and atomic commit.
2. **CLE-02 shared negative-status helper HIGH:** `isNegativeStatusName()` omits **Sleep**, causing empty status choices for sleeping Hero; affects Saint Holy Rejuvenation after Heal and other cleanser target choices, independent of Purify missing handler. Six-status helper matrix confirms only Sleep false.
3. **CLE-03 Binding Light `S0-CLE-012` HIGH:** current S0 `classification:'Defense'` not recognized by `/Defense Skill/` predicate, so `committedResponseCounterFamily()` null; existing valid DefendSkill REACTION option never becomes available via actual Response window path. Preserve Ultimate cannot-negate exception.
4. **CLE-04 Lun `S0-CLE-026` HIGH:** printed Bard Rank II/Maestro Rank III BLOCK20 Physical or Magical, while runtime `block_damage.damage_types=['Magical']` denies Physical; Cleric Rank I correctly Magical only. Four legal/illegal branch pairs checked.
5. **CLE-05 God's Blessing `S0-CLE-013` HIGH:** after valid prerequisite presence, Mana PAY and card removal/Exhaust happen first; then mandatory Hand-card DISCARD choice appears. Must choose/validate CONDITION before PLAY and commit with Mana atomically. Not claiming Draw 3 missing.

**Targeted positive/limits:** Holy Ring Rank I vs Priest/Saint attachment contracts correct in code; Holy Blast independent Heal wired after Area attack despite blank `effect[]`; Holy Slash HP-damage Heal with Priest +20 legitimate healing passive; Resurrection Priest 50 HP Exhausted / Saint 50 HP without forced Exhaust profiles; Bard triple-note Return contracts and Cleric Legacy contracts present (not necessarily GUI-verified). Full 42-card end-to-end, Saint all-status cleanse GUI, nested Defense REACTION and Human-vs-AI terminal Win/Loss/Draw still open.

**Do not repeat:** A source card with `effect[]=[]` may have a working explicit shared handler (Holy Blast, Resurrection, Holy Slash). Conversely a keyword in card text does not prove handler routing (Purify, Binding Light). Ranks differ for Lun damage-type BLOCK. Sleep is one of six standard negative Statuses; do not conflate Sleep movement permissions with an immunity to cleanse. Mandatory printed CONDITION is a pre-payment requirement, not a postpayment selection. Do not treat the initial QA-only undefined helper in a superseded Holy Ring probe as an app bug.

**Next:** obtain explicit approval for CLE-01..05 before fixing; regress ARC/WAR/THF after authorized changes. Then MAG stage 5, EVT/ITM stage 6. Only when all approved fixes, combined QA and release gates are completed may the version be raised. No new ZIP now.

---

## Six-stage card-code audit — Stage 4/6 CLE: AUTHORIZED FIX (staged, no version increment) — 2026-11-05

**Authorization:** Designer explicitly instructed **“benerin terutama purify sleep harus masuk sattus yang bisa di purify”** after the read-only five-defect CLE report. This authorized CLE corrections, particularly Purify and recognition of Sleep as a removable negative Status. Changed only the VS AI staged application file `engine/shared-app/app.bundle.js` plus this takeover and `docs/qa/cle/CLE_FIX_QA.{md,json}`. Official OSA S0 DEV45, Deck Builder, PvP, S1, artwork, source card values and rulebook remain unchanged. **Application version stays v1.0 RC13; no new release ZIP.** Working baseline retains approved ARC, WAR and THF fixes.

**What was repaired:**

1. **CLE-01 Purify:** Detect `S0-CLE-003` by current printed Support text despite empty normalized effect. Do not offer PLAY without allied living negative-Status target. Reuse the existing Elixir status-choice UI for two or more negative statuses **before** Mana PAY. On successful commit, remove exactly one chosen negative status, pay 1 Mana, move Purify to Discard. Never fall back to removing an arbitrary positive marker when a selected status index is invalid.
2. **CLE-02 Sleep cleanse:** Add Sleep to `isNegativeStatusName` (existing Bleed/Burn/Freeze/Poison/Stun remain), making it removable by Purify, Elixir and Saint's post-Heal Holy Rejuvenation. A Sleeping Hero still has normal Sleep usage restrictions, but an *ally* may Purify it. No modifications to Sleep's attack-wake or stacking semantics.
3. **CLE-03 Binding Light:** Treat S0 Defense `classification:'Defense'` as DefendSkill and expose the existing nested counter-Response only against **non-Ultimate Defense** Skills. Avoid negating Ultimate. Preserve response Mana, order and source legality. A complete hand-driven chained play through the live UI is still a separate QA gate.
4. **CLE-04 Lun:** Class-aware BLOCK 20 incoming type selection: Cleric Magical only, Bard/Maestro Physical or Magical. BLOCK remains prohibited on un-blockable incoming attacks. Do not reintroduce S1's fixed single-type assumption.
5. **CLE-05 God's Blessing:** CONDITION must choose a physical *other* Hand card **before** PAY. Supports CANCEL with no state changes, selected card and Mana commit together, then Draw up to 3 only once. PLAYER and AI paths exercised; allows discarding another identical God's Blessing card as the Hand cost. Removes old after-payment discard-choice branch. No four-card Draw.

**QA / evidence:** `docs/qa/cle/CLE_FIX_QA.json` and `.md`: **23/23 focused Chromium checks PASS**, 0 browser page errors; paid Purify individually tested on all six negative statuses including Sleep; no-target rejection and multi-status choice; Saint Sleep cleanse; 6 Lun Rank/type cases; Binding Light family/option/nested counter gate and Ultimate denial; God's Blessing precommit CANCEL, selected Hand card physical discard, 2-Mana PAY, Draw 3, AI and duplicate copy. Existing THF **35/35**, WAR **36/36**, ARC six-stack/cap, Sleep wake/type (96 attacks 40 Magical/56 Physical) regression still pass. S0 Target **13/13**, Lineage **6,975** and Ultimate Tribute **30/30** hooks PASS; `node --check` PASS. These are targeted tests, **not** a full played Human-vs-AI match or 42/42 CLE end-to-end proof.

**Do not repeat:** Never equate empty `effect[]` with a nonexistent effect. Never exclude Sleep from negative status removal (or treat Purify as a positive-status cleaner). Never allow Cleric Lun to block Physical (Bard/Maestro can). Never offer Binding Light to negate an Ultimate Defense. Never pay God's Blessing Mana before its mandatory Hand choice, or execute both a special Draw 3 and an inferred generic Draw count. Roll back payment if physical CONDITION identity changes. Original RC12/RC13 ZIPs untouched.

**Next:** Stage 5/6 **MAG read-only audit**, especially KEYWORD, STATUS, Casting, REACTION, and intertwined Magical Attack/Defense. Report before any MAG code correction unless designer approves. Then EVT/ITM 6/6, consolidated regressions and eventual single version bump/release after user approval. Outstanding separate investigations: Deck Builder v1.58 import, Primal Strike/Chain Mail, S0 Health Potion source discrepancy, and normal Human-vs-AI terminal Game Over.

---

## Six-stage card-code audit — Stage 5/6 MAG: READ-ONLY findings — 2026-11-05

**Instruction/authorization:** Following the completed, authorized ARC/WAR/THF/CLE fixes, designer said **“lanjutkan”**. Under the established workflow that authorizes **MAG inspection and reporting only**, **not a fix**, version increase, production patch, or ZIP. Source baseline is the staged RC13 working app with prior approved fixes. OSA Season 0 DEV45 / DEV44 consumers and all other applications remain READ-ONLY. Current engine bundle SHA-256 `a537198eb160858518274f40f59b0eef188535b4958168cc20121a9b0aee46f3` (1,605,220 bytes); do not substitute historical S1 card metadata for missing S0 runtime effect rows.

**Audit scope/method:** 42/42 MAG identities inventoried (31 Skills, 9 Heroes, 2 Legacies), source-to-runtime/handler route traced with special focus on KEYWORD, STATUS, Defense/Response, Casting, Mana and Rank-specific branching. Targeted real Chromium engine-injected runs used isolated legal fixture states and **physical 12-card Mana conservation**; browser page errors zero in the recorded runs. **This is not 42/42 end-to-end paid-card PASS, nor a normal human-vs-AI game to Game Over.** Source-level no-error or an empty `effect[]` alone is not PASS/FAIL without checking explicit routing. Full findings, per-card classifications and evidence are in `/mnt/data/Grandis_Legacy_VS_AI_Season0_Audit_MAG_2026-11-05.md` and paired `.csv`; external QA fixtures are in `/mnt/data/audit_work/mag_stage5_*`.

**Seven confirmed defect groups affecting six MAG Skill cards — NOT FIXED:**

1. **MAG-01 HIGH — Meditation `S0-MAG-006`:** Official Draw 2 Mana cards to Mana Pool does not execute. After paid/committed free use, test Mana Pool remains 2, Mana Deck 10 (expected Pool 4, Deck 8). `effect[]` empty and missing normal app handler for this draw. Do not confuse physical Mana cards with generic Mana payment units.
2. **MAG-02 HIGH — Tornado `S0-MAG-008`:** Elementalist Rank II conditional **40 damage after target DODGEs** absent; 80-damage Attack was DODGED and follow-up 0 instead of 40. Source-specific handler `conditionalFollowUpsForCard()` has no S0 descriptor. Keep target/Rank/fallback and do not copy S1 values.
3. **MAG-03 HIGH — Ice Block `S0-MAG-011`:** Rank II Elementalist Defense **INVINCIBLE until next turn plus self Freeze 2** never offered in legal Response. Missing S0 `responseKind` despite printed text; since it is unoffered, Freeze is not executed. Test full Rank/Response and expiry after any eventual fix.
4. **MAG-04 HIGH — Fire Wall `S0-MAG-012`:** Physical BLOCK 70 resolves correctly (incoming 80→10), but attacking Hero receives **no Burn(2)**. Existing S0 materialized effect only contains BLOCK; missing retaliatory status side effect. Elementalist duration bonus should make legitimate Burn(3). Don't break existing BLOCK.
5. **MAG-05 HIGH — Mana Void `S0-MAG-025`:** **SURE HIT printed Rank III only**, yet current union-level keyword prevents DODGE for Spell Blade **Rank II**. Both Rank II and III were treated as cannot_dodge in committed Attack/Response. Must resolve keyword per active Hero Class/Rank, while preserving sample correct Mana Regen cost/damage.
6. **MAG-06 CRITICAL — Invincible Stance `S0-MAG-030`:** Rank II and Rank III legitimate INVINCIBLE Response card never offered versus Physical or Magical attacks due to missing dispatch/normalized `effect[]`.
7. **MAG-07 HIGH — Invincible Stance `S0-MAG-030`:** Independent payment defect: Arcane Warrior **Rank II** cost is printed 4 + 1 surcharge = **5**, but runtime computes **4**. Rank III is correctly **4**. Fix must not affect other Rank III cost.

**Targeted positive evidence and bounded coverage:** All 20 MAG Attack identities classified as Magical in current staged data (other nonattack card `currentDamageType` fallback is irrelevant); Wildfire paid on Elementalist applied Burn(3) to 3 enemies; Mana Shield BLOCK60 Magical only and Mirror Image DODGE both types offered appropriately; Permafrost CONDITION rejected un-Frozen and accepted Frozen target; Double Casting Rank II 3 Mana and Rank III 1 Mana with current-turn end expiry aligns approved S0 behavior; Aether Infusion paid and converted Physical Attack to Magical; Casting counter 0 and staged owner End increments observed, required 1 for Tornado/Aether Ball and 3 for Runeforged; Provoke paid and enemy no-Attack End opened blind physical Mana selection (final Mana movement not tested); Absolute Defense Response offer observed, full committed nested sequence not verified. Nine Hero and two Legacy ability contracts inventoried but not fully UI-played. These observations do **not** certify other MAG cards all working.

**Review only, not confirmed bug:** Runeforged Burst interrupted with Casting counter 0 has ambiguous expected release behavior; request designer decision before editing. **Rule conflict:** Rulebook v2.9 p10 says timed Casting increments at owner *Draw* Phase start, but previous specifically approved application UX says owner *End* Phase increment. Leave approved current behavior unchanged until designer resolves. Legacy S1 self-test assumptions and impossible scalar Mana test fixtures must not override official S0 data or valid 12-card Mana conservation. Existing OSA Health Potion art/text discrepancy and Deck Builder v1.58 import incompatibility are separate open tasks.

**Next:** Present seven findings to designer and **wait for explicit MAG repair authorization**. If authorized, correct only these app issues, then perform targeted PLAYER+AI, Rank II/III, exact physical Mana/zone, Response/CANCEL/UI, status/expiry, Casting and regress previous ARC/WAR/THF/CLE checks (6,975 Lineage, 13 Target, 30 Ultimate Tribute). After that, stage **6/6 EVT/ITM** should likewise be audited READ-ONLY and reported before any fixes. **Do not bump version or make release ZIP until six stages are repaired and consolidated QA is completed.** The actual normal Human-vs-AI match to terminal Win/Loss/Draw remains open.


---

## Six-stage card-code audit — Stage 5/6 MAG: APPROVED FIXES COMPLETED — 2026-11-05

**Permission:** Designer explicitly instructed `benerin semua` after the read-only MAG report. This authorizes correction of the seven documented MAG defects only (plus tightly related Invincible damage-prevention continuity). Previous ARC/WAR/THF/CLE corrections remain. No version increase or ZIP build: staged source continues under **RC13**.

**Changes committed in working copy `engine/shared-app/app.bundle.js`:**

1. MAG-01 Meditation (`S0-MAG-006`) now draws up to two **physical** Mana cards from its owner's Mana Deck to Mana Pool after successful card commit. Uses existing `gainMana()` and 12-card invariant; does not draw Main Deck cards.
2. MAG-02 Tornado (`S0-MAG-008`) receives an S0-only post-primary automatic damage contract: on DODGE, Elementalist and Elemental Lord deal 40 Magical damage without a new Response. Mage Rank I does not. Negate is not Dodge.
3. MAG-03 Ice Block (`S0-MAG-011`) is offered as legal INVINCIBLE Defense. Successful paid Response creates existing persistent Attachment and applies self Freeze 2. The active self Freeze is unaffected by opponent-only class duration bonus.
4. MAG-04 Fire Wall (`S0-MAG-012`) preserves BLOCK 70 Physical and additionally applies Burn 2 to attacking Hero, with Elementalist passive +1 correctly resulting in Burn 3 when valid.
5. MAG-05 Mana Void (`S0-MAG-025`) resolves SURE HIT for actual source Class/Rank, not composite card tags. Spell Blade Rank II is DODGEable; Arcane Duelist Rank III is not. Dynamic Mana Regen payment and damage preserved.
6. MAG-06 Invincible Stance (`S0-MAG-030`) is a usable INVINCIBLE Defense Response with existing Attachment slot and owner next-Draw expiry, both Arcane Warrior / Arcane Vanguard.
7. MAG-07 Invincible Stance Rank II `MANA COST +1` applied: 5 Mana for Arcane Warrior, 4 for Arcane Vanguard. Shared class-specific surcharge parsing retained for Double Casting.
8. Closely related correctness: MAG-030 active INVINCIBLE prevents ongoing Poison damage during its duration (Poison counter still ticks); conditional follow-up damage respects MAG-011/MAG-030 and other documented INVINCIBLE attachments.

**QA evidence:** `docs/qa/mag/MAG_FIX_QA.{md,json}`; 20/20 focused PLAYER/AI isolated game-state checks PASS, 2/2 Attachment/Poison/next-Draw expiry checks PASS; S0 Class/Lineage 6,975 cases, Target 13/13, Ultimate Tribute 30/30 built-in hooks PASS; JavaScript syntax PASS; Chromium errors zero. These are engine-injected Chrome tests, NOT a human-driven full match or 42/42 per-card gameplay certification.

**Do not repeat / decision record:** Do not infer Rank II keyword from union-level `runtime_tags` when only Rank III prints it; do not substitute S1 effects or values; do not add general SURE HIT to every Spell Blade Mana Void; never draw Main Deck cards for Meditation. INVINCIBLE blocks damage but does not DODGE or NEGATE, and existing Poison durations keep ticking. Stage 5 audit was permission to inspect only; actual patch was applied only after explicit `benerin semua`. Do not create a new RC version or ZIP until **all six stages** and combined QA are complete.

**Next:** Stage 6/6 EVT/ITM **read-only** code audit, focusing Keyword, Status, Item, Event, Racial/Status interactions and Response. Report findings first, no automatic repair. Keep pending: current Casting End-vs-Draw source conflict (no silent change), Runeforged zero-counter interpretation, Deck Builder v1.58 import, Primal Strike/Chain Mail, Health Potion OSA text/art discrepancy, full Human vs AI Game Over.


---

## Six-stage card-code audit — Stage 6/6 EVT/ITM: READ-ONLY findings — 2026-11-05

**Authorization/baseline:** User said “terakhir” after authorized MAG fixes. This means the **last source-code audit only** — no EVT/ITM code fix, no new patch/ZIP, no version increment. Baseline staged working app is RC13 carrying all approved ARC/WAR/THF/CLE/MAG changes. `engine/shared-app/app.bundle.js` SHA-256 `f2a5d37b448ef37d7452c3decb831a2fcd46d77a8328d6eb3ddc49e4d8e94a15`. OSA DEV45 and other apps are read-only.

**Scope/method:** 32/32 Event+Item identities (12 EVT, 20 ITM) matched to current OSA Season 0 printed text; scanned metadata, handler and exact Response/PAY/CONDITION/Status/Attachment routes. Real bundled app was run through in-memory Chromium isolated fixtures with 12-card Mana conservation and 0 JS page errors. This is **not** 32/32 card effect PASS nor a normal match.

**Confirmed code/runtime defect groups — unmodified:**

1. **EVTITM-01 HIGH — Defensive Formation `S0-EVT-012`:** offered for Dual Arrow (Dual Target) as well as true Area Attack; official trigger requires **Area Attack**. Regex `/Area|All|Dual/` is overbroad.
2. **EVTITM-02 CRITICAL — Ring of Protection `S0-ITM-007` + Chain Mail `S0-ITM-016`:** no BLOCK Response route (`responseKind=null`, block amount 0), unavailable against matching Magical/Physical standard Attack. Existing Primal Strike Chain Mail concern is substantiated at standard Response route, not a Primal Strike full replay. Printed text does not give numeric BLOCK amount; don't invent one.
3. **EVTITM-03 CRITICAL — Spectral Grappling Hook `S0-ITM-012`:** printed discard-one-Hand-card CONDITION omitted from runtime payment. `responsePaymentSpec.discard_from_hand=0`; card offered with no other Hand card. Payment must be atomic and cancel-safe.
4. **EVTITM-04 HIGH — Warp Scroll `S0-ITM-019`:** committed swap moved a Stunned Hero; status follows, but rules prohibit Swap for Stun/Freeze. Target/commit validator filters only alive active Hero.
5. **EVTITM-05 HIGH — Poison Vial `S0-ITM-011`:** official Item text has no printed Thief/Archer restriction, yet runtime rejects Warrior host and accepts Archer. Independently, whether it should require actual HP damage to inflict Poison is designer/source review, **not** an approved ruling/fix.
6. **EVTITM-06 LOW — Stamina Potion `S0-ITM-003`:** preplay shown legal when no Exhausted Hero exists; zero eligible targets. No actual lost card/payment demonstrated.

**Positive but bounded:** Intercept standard Physical/Magical response offered; Tactical Adaptation counters opposing Tactical/Event and Flashpowder Bomb counters Item; genuine Area Defensive Formation offered; Last Resort one-hero gate and Forged Alliance Racial cap work in preplay tests; Elixir targets Sleep/Poison; full-HP Health Potions rejected. Mana Potion/Freeze Bomb commit calls stopped at legal counter-response window and were **not** incorrectly recorded as completed physical effects. Other routes are catalogued, not fully played.

**Files:** external `/mnt/data/Grandis_Legacy_VS_AI_Season0_Audit_EVT_ITM_2026-11-05.md` + `.csv` (32 rows); copied under `docs/qa/evt_itm/EVT_ITM_AUDIT.*`; probe JSON/JS in `/mnt/data/audit_work/evt_itm_*`. **Engine code SHA verified unchanged.**

**Next:** Present six findings and **wait for explicit repair permission**. Then fix EVT/ITM, regression test all six categories together, full response/condition/AI/UI and actual Human vs AI terminal win/loss/draw, and only afterward discuss one consolidated release/version bump. Continue tracking Deck Builder import, Primal Strike, Casting conflict, OSA potion discrepancy as separate issues; no unauthorized OSA edits.

---

## Six-stage card-code audit — Stage 6/6 EVT/ITM: AUTHORIZED FIXES & CONSOLIDATED ENGINE QA — 2026-11-05

**Authorization:** Designer explicitly said **“ok perbaiki semuanya”** after the EVT/ITM read-only audit. Six documented defect groups affecting seven Event/Item cards are now repaired in **the same staged app** as approved ARC/WAR/THF/CLE/MAG fixes. No changes to OSA DEV45/DEV44 consumers or other apps.

**Corrections:**
1. `S0-EVT-012` Defensive Formation responds only to a true **Area Attack**, never Dual Target on target count alone; preserve actual area marker through Response refresh.
2. `S0-ITM-016` Chain Mail blocks incoming **Physical**, `S0-ITM-007` Ring of Protection incoming **Magical**. Both are Protection Item Response cards, refuse PIERCING, and block the entire applicable incoming damage because S0 current printed source states no numeric cap. S1-derived fixed amounts are NOT authority.
3. `S0-ITM-012` Spectral Grappling Hook **CONDITION** requires discarding 1 other physical Hand card at the Response PAY boundary. Cannot be selected as sole Hand card. CANCEL restores precommit; AI pays automatically.
4. `S0-ITM-019` Warp Scroll cannot swap a Stunned/Frozen Hero, filtered on selection and pre-commit/commit; legitimate non-Exhaust card-effect Swap preserved.
5. `S0-ITM-011` Poison Vial now allows any alive active Hero as user/host subject to normal Attachment legality. Its independent Poison trigger ambiguity (**requires actual HP damage?**) remains open and unchanged.
6. `S0-ITM-003` Stamina Potion not playable with no Exhausted allied target; legal target path still works when one is Exhausted.

**Evidence:** `docs/qa/evt_itm/EVT_ITM_FIX_QA.{md,json}` (12/12 isolated actual-engine focused tests PASS; includes normal Physical/Magical BLOCK, Primal Strike+Chain Mail, Hook PLAYER CANCEL/PAY and AI, Stun/Freeze Warp, Warrior Vial, Potion target). `EVT_ITM_REGRESSION_QA.json`: S0 Class/Lineage **6,975/6,975**, Target **13/13**, Ultimate Tribute **30/30** PASS. `SIX_STAGE_CONSOLIDATED_QA.json`: WAR **36/36**, THF **35/35**, CLE **23/23**, MAG **20/20**, MAG attachment expiry **2/2** PASS. Chromium JS page errors **0** in these fixtures. ARC remains previously patched/tested; no new blanket full-match proof.

**Decision record:** Six audit stages now have the evidenced defects fixed in source. Do NOT claim every card effect has been mouse-played or a real Human-vs-AI match to Game Over passed; source audits and focused fixture PASS are bounded. The older S1 v6.91.9 Ring 30 assertion is stale against S0 current printed `BLOCK incoming Magical damage` without a number. No generic S1 number fallback. Preserve Rulebook v2.9, OSA Season 0 authority, untouched source releases. Poison Vial physical-damage trigger, OSA Health Potion values, owner Draw vs approved owner End Casting timing, Runeforged 0-count, Deck Builder v1.58 JSON import, full Legacy/UI response, and actual normal match remain separate open items.

**Next:** A release-candidate package may include the six-stage cumulative fixes only after source/checksum/structure validation; actual browser human-vs-AI game and full manual UI verification must be performed before any FINAL claim. Update release name once only; no micro-version bumps per card.

---

## RC14 — 2026-11-05 — Consolidated six-stage repairs and packaging

- **Authorized scope:** Designer instructed to delay version increments until all 6 audit stages are repaired; authorized Stage 6 repair with “ok perbaiki semuanya”. Six stages have now had their evidence-backed findings fixed in ONE application working copy. Package one new **v1.0 RC14** release-candidate build (never FINAL).
- **Files changed vs RC13 baseline:** `engine/shared-app/app.bundle.js` (six-stage cumulative app fixes, precise current version label), `README.md` (release-candidate and limitations label), appended `docs/TAKEOVER_NOTE.md`, added proper `docs/qa/{arc,war,thf,cle,mag,evt_itm,rc14}` QA receipts. No root pollution. OSA runtime consumers and artwork unchanged.
- **QA:** `docs/qa/rc14/RC14_QA.md` sums the verified Chromium fixture evidence: Stage 6 EVT/ITM 12/12, WAR 36/36, THF 35/35, CLE 23/23, MAG 20/20, MAG expiry 2/2, S0 Lineage 6975, target 13, Ultimate Tribute 30, JS errors 0. Do not treat these as proof of full match; do not claim 242 card effects all played by mouse.
- **Boundary:** RC14 remains RELEASE CANDIDATE. A normal Human vs AI game played through Win/Loss/Draw and significant real UI interactions remain unverified. Track Deck Builder v1.58 JSON import and Poison Vial hit-vs-HP-damage trigger separately; neither silently changed. Casting timing conflict/OSA art-text reviews also remain open.
- **Next:** After RC14 field testing, investigate reported reproducible bugs only; do not patch automatically without designer instruction. Preserve all six stages and record changed behavior here before any later version.


---

## RC15 — 2026-11-05 — Authorized UI/Import Update (RELEASE CANDIDATE)

**Authorization:** After collecting UI issues #1–#10 plus the Battle VFX-center report, designer explicitly instructed “update dulu deh”. Changes were applied only now, in a fresh extracted copy of RC14; OSA, Deck Builder, PvP and Tutorial were not modified. Version bumped once to `v1.0 RC15` after combining approved changes.

**Implemented:** (1) Native import compatibility for Deck Builder v1.58 JSON, both nested `deck` and flat exports, with 3 Hero/Legacy progression packages materialized to 12 cards while preserving all current S0 deck validation. (2) Automatic Bard/Maestro center-screen Draw-phase selection, DISCARD & DRAW and SKIP using authoritative existing exchange. (3) Trigger animations: Poison upward on actual End-phase damage; Burn icon on connected Attack even on 0 final HP damage as visual status reminder (no damage rule change); Freeze icon before Dodge Response; two upper-right diagonal Sleep Z reminders on entering owner's Battle. No extra damage numbers or Stun animation. (4) Larger ALL top-right Hero, Racial and Legacy action buttons. (5) Responsive 12-Shard Mana Pool card overlap. (6) Double Casting and all Ultimate Tactical/Event/Item card NEGATE protected at offer and commit. (7) Status countdown maintained; timed Attachments display elapsed count-up beginning 0; Casting unchanged, expiry times unchanged. (8) INVINCIBLE glint when preventing positive damage and one-way knockback on the reflecting Hero's ATTACKER; original DODGE retained. (9) Single Defense Item arrow toward protected Hero; no fake Flashpowder Bomb → Discard arrow. (10) Battle attack/defense animation anchored to actual visible Hero card face, not the rotated/offset stack.

**QA:** `docs/qa/rc15/RC15_UI_QA.md` + JSON contain actual targeted Chromium results: native Deck Builder-compatible 5 S0 starter formats × two structures 10/10, invalid 3/3 correctly rejected; Bard SKIP with tentative selection leaves zones unchanged, Maestro selects 2 → discards 2 and draws 2, stage visible; 12-card Mana Pool geometry fits at widths 820/900/1024/1280/1600; legacy S0 regression hooks Ultimate Tribute 30/30, Target 13/13, Lineage PASS; zero browser JS errors and JS syntax passed. Results are targeted, not proof of a complete normal Human vs AI Game Over match.

**Decisions / do not repeat:** Negative Status duration indicators remain countdown; ALL timed non-Casting Attachment counters should be elapsed count-up without touching removal timing. Burn visual reminder on connected Hit may appear even if Block prevents actual Burn +10 damage; **never** apply +10 damage in that case. Do not add extra floating HP/damage numbers or STUN animation. Defense Item should never get duplicated attacker/defender arrows; text about discarding a card is not an endpoint. Protect Ultimates across all Response pathways, not only Attack. Preserve official Deck Builder export, do not change it. Preserve all six-stage RC14 effect work.

**Open:** RC15 is still RELEASE CANDIDATE. Need full hosted Human-vs-AI normal match to terminal Win/Loss/Draw, real mouse QA for animations, reactive nested response and attachment lifecycle, and confirm UI Card Review visual parity across more cards. Continue earlier flagged OSA Potion visual/text discrepancy and Casting timing source conflict without silent gameplay changes. Every future bug report is INVESTIGATE ONLY until approved.

---

## RC15 UI Issue #11 — Card Review outer frame and Hero/Skill artwork mismatch (INVESTIGATION ONLY) — 2026-11-05

**Designer report:** Two RC15 Card Review screenshots (Garrick Beastfang Hero and Horizontal Slash Skill) show an unwanted extra gray outer border/container and noticeably different displayed card-image sizes. Designer asks to eliminate the extra outer frame and display Hero/Skill images at the same visual dimensions. This message is part of the ongoing issue-list collection and **does not authorize an RC update**.

**Source inspection (RC15, no edits):** Actual Battlefield Card Review calls `openCardReview()` in `shared-app/app-runtime.js` which mounts `GL_DB158_REVIEW.mount()` into `.gl-card-review-body`. `shared-app/db158-card-review.js` embeds the v1.58 Review UI in an iframe, with `<div id="cardReviewDialog" ...><div class="dialog-card review-card">…</div></div>`. `shared-ui/battlefield-ui.css` RC15 rules (`.gl-card-review-overlay`, `.gl-card-review-panel`, `.gl-card-review-body`) have already zeroed the **host** panel padding/border/shadow; the remaining visible framing is within the iframe's Deck Builder-styled `.review-card` and its border/background (`assets/review-db158/css/s0-modal-parity-v1.52.css`, plus other imported CSS). Do not remove the necessary backdrop or information panels when fixing this.

**Artwork size cause:** `s0-review-v1.43.css` sets non-Hero artwork layout at `24%` width at desktop >1050px; `s0-review-v1.57.css` makes Hero layout `35%` but also constrains artwork by available height via `width:min(100%, calc((min(790px,100dvh - 28px) - 228px) * 5 / 7))`. Combined with further Hero-only v1.56 rules, these independently calibrated sizes yield inconsistent visible card widths. This is CSS/layout disparity, not a mismatch in official artwork data. Numeric pixel difference in supplied screenshots is not a substitute for cross-viewport visual QA.

**Proposed correction (NOT implemented):** In VS AI's **isolated review iframe only**, remove the unnecessary outer frame treatment, retaining review header, close X, detailed information cards, and blackout backdrop; unify Hero, Skill and other card artwork with one responsive artwork width/height policy and `aspect-ratio:5/7; object-fit:contain`, with clamps for narrow/short screens. Override late Hero-/non-Hero-specific widths, and verify Hero Rank I–III, Skill with 1/2/3 effect rows, Item, Event, Legacy at desktop and tablet/mobile. Do not alter underlying Deck Builder v1.58, OSA card data or gameplay. Preserve existing close/Escape behaviors and ability to scroll long effects.

**Status:** Logged and source cause identified. NO app source modification, NO patch, NO ZIP, NO version bump; baseline **RC15**. Wait for explicit designer instruction after issue list is complete.

---

## RC15 UI Issue #12 — Upper-right Hero/Racial/Legacy buttons collide with Hero; Status too small (INVESTIGATION ONLY) — 2026-11-05

**Designer report:** Current RC15 contextual upper-right button (example Human Ambition) overlaps the physical Hero artwork. Negative Status icons/counters remain too small. Designer requests **one common percentage increase from RC14** for both button sizes and Status presentation, calculated to avoid overlap; all same-position action buttons (Hero/Class/Racial/Legacy) must share the rule. This is another listed UI issue; **no permission yet to patch or increment version**.

**Source cause confirmed:** `shared-ui/battlefield-ui.css` RC14 `.gl-hero-action` has `font-size:7px`, `min-height:16px`, `padding:2px 6px`, `.gl-hero-actions max-width:132px`. RC15 appended override makes button `font-size:clamp(10px,1vw,13px)`, `min-height:28px`, padding `5px 9px`, and container max-width `min(220px,68%)` (70% when <=1050px); this is about +86% in desktop font and +75% minimum height, with no avoidance boundary against the centered physical Hero image. Original Status icons in VS AI's active UI are 18x18 desktop CSS px (rendered smaller when battlefield scales), and were not enlarged by RC15.

**Read-only geometry test:** Real RC15 HTML/CSS and engine were loaded in Chromium; test-only buttons "Human Ambition"/"Ancestral Focus" and one Status inserted into a PLAYER Hero lane to compare dimensions. **No game source was edited.** Hero-to-right-lane space measured around 61px at 820-wide viewport, 79px at 1024, 100px at 1280, and 126px at 1600; a fixed-width percentage from the full lane will always risk collisions on smaller viewports.

**Proposed common scale: +25% relative to RC14** (not relative to RC15). Buttons: font **7px -> 8.75px**, minimum height **16px -> 20px**, padding 2px 6px -> 2.5px 7.5px (same 25% scaling). Status icon and its hit target **18px -> 22.5px**; scale counter badge, offsets and status-stack width coherently. Keep negative Status countdown behavior. To guarantee no visual intersection, cap button region by **actual free space to Hero artwork**, not 68% of whole lane: e.g. `max-width: calc(50% - var(--hero-w)/2 - 17px)` with right position ~7px, ~8–10px safety gap, and allow text to wrap at narrow viewports.

**Mock CSS layout readout for proposed +25% with available-space clamp:** at viewport widths **820 / 900 / 1024 / 1280 / 1440 / 1600**, button-to-Hero gaps measured **8.5 / 8.5 / 8.5 / 19.9 / 28.2 / 31.4px** respectively; text did not overflow the button's content box. At narrow widths names wrap onto 2–3 lines (accessibility and height still need interactive QA). RC15 original had a **negative gap** in this test (e.g. -5px at 1600, -10px at 1280, -20px at 820). Measured values reflect this browser fixture, not comprehensive device-proof.

**Required later QA before approval of release:** Test real representative Hero, Racial and Legacy button labels (longest localized names), stacked buttons, simultaneous status counters and HP, Exhausted rotated Heroes, normal game at 820/900/1024/1280/1600 desktop/tablet and any actual mobile layout. Check no hover/tooltip overlays hide permanent labels, and that Status countdown and attachment count-up remain unchanged. Use test-only screenshot proof and bounded DOM intersection checks. Do not change card effects or create a ZIP while list gathering continues.

**Status:** Issue #12 investigated; no app code modified; **RC15 remains baseline**, pending designer authorization.

---

## RC15 UI Issue #13 — Bard/Maestro center-stage focus and Pool seam (INVESTIGATION ONLY) — 2026-11-05

**Designer screenshot / request:** During automatic Prolonged Symphony / Orchestral Crescendo selection, the *center-stage* ability title, choice cards and buttons should be the **only illuminated layer**. The original bottom Hand and player Mana Pool must also be dimmed. Visible horizontal line/seam crosses the top of Mana cards; remove the inappropriate overdraw/clipping. Keep all physical Hand/Pool layout, controls and card-zone state intact when the overlay is closed. This is a list-gathering issue; **no implementation approval yet**.

**Read-only RC15 code inspection:** `shared-app/app-runtime.js` `renderInteractionFocus()` assigns `gl-focus-bard` and enables `.gl-focus-dimmer` (65% veil); `renderCenterChoiceStage()` builds the interactive `.gl-center-choice-stage` independently (z-index 24500). But `shared-ui/battlefield-ui.css` retains older RC12 inline Bard-selection elevation rules: `.battlefield.gl-focus-bard .bottom-hud {z-index:950!important}`, `.hand.bottom {z-index:960!important}`, and a selected-card highlight. Because the dimmer sits at z-index 900, the real Hand and its DISCARD/UNDO controls shine through during center-only Bard choice. Payment modes have extra rules to hide source-zone clones; Bard mode currently lacks analogous suppression. The Mana Pool's cards/count also have high z-index and `overflow:visible` protections; the screenshot shows a horizontal seam across their upper edge, but its exact stacking/overflow producer needs real DOM layer inspection before calling a root cause confirmed. Do not simply add `overflow:hidden` to Pool; that could clip cards at responsive widths and regress RC15 pool layout.

**Proposed correction:** Give Bard choice a single, full-screen dimmer over the entire Battlefield / HUD / real Hand / real Mana Pool, with only `.gl-center-choice-stage` and its selected cards/buttons above it. Remove or scope obsolete inline Bard illumination; hide/disable background DISCARD/UNDO controls in center-only mode rather than rendering competing controls. Check z-index, stacking-context, `overflow`, transforms and pseudo-elements at 820/1024/1280/1600 and with a full 12-card Pool. Verify no bright horizontal seam or clipping, and ensure clones, animations and zone counts do not change until `DISCARD & DRAW`; `SKIP` keeps zones unchanged.

**Status:** Source cause of Hand remaining bright confirmed; Mana seam observed visually but exact producing selector requires browser DOM confirmation. No changes to app code, data, game state, ZIP, or version. RC15 remains baseline.

## RC15 UI Issue #14 — Change Bard selection without UNDO (INVESTIGATION ONLY) — 2026-11-05

**Designer request:** If one card is already selected in Prolonged Symphony, clicking a different card should *immediately replace* the selected card instead of requiring UNDO first. Remove the word UNDO from the selection UI; no extra undo step. The center-stage choice is the authoritative interface, so the real background Hand should not expose a competing inline UNDO control.

**Read-only code finding:** `engine/shared-app/app.bundle.js` `toggleS0BardDrawIndex()` currently toggles off a selected index, but ignores a new index once `selected.length >= p.max_count`. This explains why Bard (`max_count=1`) requires an explicit deselect first. `shared-app/app-runtime.js` `renderHand()` independently labels selected background Hand actions as `UNDO`, while the center-stage choice already handles clicking a selected card and the selected border. `resolveS0BardDrawExchange()` correctly commits only on `DISCARD & DRAW`; selection changes can remain tentative with no engine card-zone modifications.

**Proposed UX (not coded):** Bard (`max_count=1`): clicking another center card replaces the previous selection immediately; clicking the already selected card may deselect it, leaving 0/1. Highlight the selected card and show `SELECTED` (rather than `UNDO`) only if a visible status label is genuinely necessary; otherwise border/highlight is sufficient. Maestro (`max_count=2`): allow choosing any two cards; when 2/2 are already selected and a third is clicked, replace the most recently selected card with the new choice, while clicking a selected card deselects it. Preserve `SKIP` and transactional `DISCARD & DRAW` and do not affect AI/class-ability rules. Confirm Maestro full-selection replacement policy with designer if it conflicts with expectations; screenshot specifically documents Bard 1/1 case.

**Status:** UI selection limitation confirmed in engine source; no code change, no package or version bump. Do not silently apply RC16 while gathering issues.

---

## RC15 UI Issue #15 — Legal Response/Reaction Hero-side button needs stronger attention (INVESTIGATION ONLY) — 2026-11-05

**Designer report / screenshot:** The upper-right actionable `Second Chance` button shown during an incoming Attack/Response window is too subdued. Make right-side buttons used specifically for **Response / Reaction** more visually luminous and immediately identifiable, without reverting the prior no-overlap sizing decision for regular Hero/Racial/Legacy buttons. Continue collecting issues; designer has **not** authorized implementation, release, ZIP, or version bump.

**Source evidence (RC15, read only):** `shared-app/app-runtime.js` `renderHeroActions()` builds Response buttons from `responseWindow.options` when `response_owner==='PLAYER'` and options have no `hand_index` and match the lane. The button DOM currently gets only the generic `gl-hero-action` class. `shared-ui/battlefield-ui.css` uses a nearly black generic background `#081522`, gold thin border, and small gold text. Response-focused CSS at `.battlefield.gl-focus-response .gl-hero-action` resets opacity and filter but does **not** provide a dedicated bright background, strong outline/glow, or attention state. The full-screen `.gl-focus-dimmer` creates a darkened context in which the button can look insufficiently emphasized. This supports a styling/cue issue; it does not establish that Response legality/execution is broken.

**Proposed implementation (not coded):** Add a class/state flag only to genuinely legal Hero-based Response/Reaction buttons (e.g., `gl-response-action`) in `renderHeroActions`, plus a scoped Response-mode CSS rule. Use brighter warm gold text, visible golden border and warm low-radius glow, a modest gold-tinted surface, clear hover/focus-visible state, and optionally a **single short entrance pulse** when the Response window opens. Do NOT apply permanent flashing or glow to all top-right abilities, unavailable actions, or the whole Hero lane. Ensure dimmer stacking doesn't cover these buttons; reconcile sizing and no-overlap solution from Issue #12. Preserve all click handlers, payment and Response logic unchanged.

**QA needed once authorized:** Genuine legal `Second Chance` Response, an alternate Hero/Racial/Legacy Response/Reaction, absent/unavailable Response, Response PASS/cancel and phase transition cleanup; representative 820, 1024, 1280, 1600 layouts; check text contrast, keyboard focus, button-to-Hero intersection and no excessive bright clutter.

**Status:** Recorded, source route identified; no application source altered, no new ZIP/patch, baseline remains **v1.0 RC15**.

---

## RC15 UI Issue #16 — P/M Attack + P/M Defense VFX centering and Poison/Burn animation parity (READ-ONLY INVESTIGATION) — 2026-11-05

**Designer correction:** The main issue in the supplied Firefox battle video is not attack timing, target reaction, or Exhaust choreography. The `P.Attack.png`, `M.Attack.png`, `P.Defense.png`, and `M.Defense.png` battle-effect images should appear **centered over the actual Hero card face**, as in reference VS AI v6.91.9. Compare the actual effect placements in active combat; do not mistake a decorative direction line or Exhaust rotation for the reported defect. Designer additionally requested Poison/Burn's trigger visuals to use the existing Healing visual motion pattern. No authorization to update the app/version yet: investigate and log only.

**Direct code comparison:** Inspected both original ZIP sources (RC15 and v6.91.9), not just notes. Both engines use `battleVfxClip()`, `battleVfxNode()` and `runBattleFeedback()` with the four battle VFX assets; PNG assets' dimensions and alpha bounding boxes match between builds. **One meaningful RC15 difference** is in `engine/shared-app/app.bundle.js::battleHeroRect()`: original v6.91.9 measures the `.hero-card-anchor` bounding rect, whereas RC15 picks nested `.hero-card.hero-main img` / `.hero-card img` and measures that rect; the active Battlefield UI rotates a physical Hero package by -90 degrees while Exhausted. Hero card face, parent physical stack, transformed bounding boxes, and `position:fixed` visual layer require live DOM geometry comparison before definitively attributing the observed offset. RC15 `battleVfxNode` centers the effect logically inside the returned rect; P Attack animates vertical translation during its entrance; M Defense has a special unclipped scale=1.08 branch, so check it independently. **Root cause of the video offset is not yet proven in a real combat DOM fixture.** Do not silently assume sprite images differ or hardcode an arbitrary px adjustment.

**Healing verified:** `queueHealFeedback(side,lane)` queues `kind:'heal'`, and `runBattleFeedback` creates **TWO** instances of `engine/assets/battle/Heal.png` using `battleHealNode()`. Both render over Hero card at `width:46%;height:58%;top:34%`, at left `4%` / `50%`, with CSS `glBattleHeal` for about `0.82s`: rise and fade; right icon staggers by `0.15s`. Heal feedback is called after a real positive HP heal (`healHeroIfLegal` execution path). This is the established reference animation.

**Poison/Burn difference in RC15:** Current `queueStatusIconFeedback` sends `kind:'status'` to `runBattleFeedback`, which creates only **ONE** status sprite (`Icon-Poison.png` / `Icon-Burn.png`) centered at `left:35%;top:36%;width:30%;height:30%`, animating via `glBattleStatusFloat` for `0.85s`. It is **not** using the Healing twin-rising icon pattern. Poison queues this icon on a real End-Phase HP deduction; Burn queues it for a connected attack while Burn is present, including a fully Blocked connected attack (a *visual indicator*, not permission to add damage in contradiction to gameplay rules). Preserve those distinct triggers and existing damage logic.

**Proposed implementation after approval:** Preserve damage/heal/status mechanics; unify *visual geometry* by using one verified rect centered on the visible Hero card in both Ready and Exhausted layouts. For four P/M attack/defense VFX, test visual center with actual browser screenshots and CSS bounding-box measurements in both versions, accounting for transform and sprite transparency. For Poison/Burn create twin rising **status-icon** visuals following the two-node Healing pattern (same relative positioning, stagger, rise/fade), not by actually playing Heal assets or healing. No floating HP numbers. Verify on both sides of battlefield at common screen resolutions, against Block, Dodged, Invincible, and rotated Heroes. Don't alter S0 OSA, card effects or original v6.91.9 baseline.

**Status:** Read-only comparison done. No app source modified. Keep RC15; defer QA proof and patch until designer authorizes.

---

## RC15 UI Issue #16 — Designer clarification: diagonal TWO-icon Poison/Burn inside Hero card (2026-11-05)

**Designer-approved visual intent (design clarification only):** The request that Poison and Burn "follow Healing" means **exactly two copies of the corresponding status icon simultaneously/staggered within the Hero card artwork**, visually rising/fading along the same family of motion as Heal, **but located at opposite diagonal regions** instead of both icons in the central band. Differentiate the two statuses by reversing the diagonal: proposed Poison = lower-left plus upper-right; proposed Burn = lower-right plus upper-left. The exact relative offsets should be measured in the live layout so both icons stay **inside** the visible Hero-card bounds at each screen size and when Exhausted. No extra HP/damage numerals. Keep existing events: Poison on owner End Phase when damage occurs; Burn when a connected Attack encounters Burn, even if Block reduces HP damage to zero. These are visual cues only; do not alter status or combat mechanics.

**Difference from previous note:** The previous proposal to merely replicate Healing's 4%/50% side-by-side positions is superseded by this **diagonal opposing-corners composition**. Reuse Heal's two-node, stagger, rise/fade *motion*, not necessarily Heal's exact static coordinates. Preserve v6.91.9-like centered P/M Attack/Defense VFX investigation as a separate part of Issue #16.

**State:** Design decision logged. No game code or release artifacts changed. Baseline remains RC15 until explicit implementation instruction.


---

## RC16 — 2026-11-05 — Consolidated UI fixes (approved by designer)

**Authorization and baseline:** After RC15 UI issue-list review, designer expressly requested the full update, with additional requirement: dim **all** non-selected surfaces including Hand, Mana Pool, footer, and check other popups for bottom clipping. Start from immutable RC15 ZIP. No OSA/Deck Builder/PvP/Tutorial edits or canonical card-effect rewrites.

**Implemented (seven grouped tasks):**
1. Card Review uses the existing Deck Builder v1.58 iframe renderer without extra VS AI outer border/container. Remove leftover `.review-card` outer border/shadow, use one proportional `--gl-review-art-w` image footprint for Hero, Skill, Item, Event and Legacy; retain type-specific canonical details and working close controls.
2. Top-right Hero/Racial/Legacy buttons now target **125% of RC14** (not RC15's oversized 13px/28px). CSS max-width is computed from the available side gutter outside Hero art, preventing collisions. Status icons and counters grow 25% relative to RC14; retain STATUS countdown and Attachment count-up.
3. Correct center focus (Bard/Maestro, Mana PAYMENT, opponent Shard/Hand, Magic Scope). A new document-body, full-viewport 65% center-only veil covers **Battlefield, Hand, Mana Pool, sidebar, footer and exposed bottom edges** as one uninterrupted plane; decision title, cards and buttons remain above it. The former local focus dimmer is hidden only while center-choice is visible; ordinary non-center Response focus stays intact. Center choice cards/buttons flex/fit at short heights, its wrapper can vertically scroll as last resort. Additional Choice, Played Detail, Hero Progression, Coin and Result popups receive viewport-height caps/internal scrolling so their bottoms cannot be lost on compact windows.
4. Remove RC12's Hand DISCARD/UNDO buttons while a Bard/Maestro center choice is active. Clicking an already-selected center card deselects it; clicking a new card at the maximum replaces the **most recently selected** card (1/1 Bard, 2/2 Maestro). Tentative selection does not move cards; only DISCARD & DRAW commits. SKIP remains available.
5. The top-right actionable **Response/Reaction** button gets a fixed gold border/background/glow with stronger hover/focus contrast. No blinking, pulse or repeating animation. Other Hero/Legacy buttons stay neutral unless actively responsive.
6. P/M Attack and P/M Defense use the stable `hero-card-anchor` rectangle from the original v6.91.9 as their reference rather than RC15's transformed nested image. Both physical and magical Defense clip/center against that anchor consistently. No Attack timing, damage, exhausted-state or asset changes. This fixes a source-level anchor inconsistency but requires real Firefox match visual verification; do not claim it conclusively cures every screenshot-offset scenario.
7. Poison/Burn now create **two** identical status icon nodes following Healing's `.82s` rise/fade pattern with `.15s` stagger, in opposing diagonal positions inside each Hero: Poison lower-left/upper-right; Burn lower-right/upper-left. Same original Poison/Burn gameplay triggers (Poison End-Phase HP loss; Burn on connected Hit including fully BLOCKed). No extra damage text, no actual heal, no STUN effect.

**Code edits limited to:** `shared-app/app-runtime.js` (center backdrop, buttons and no Hand extra action), `shared-app/db158-card-review.js` (single-surface review + common images), `shared-ui/battlefield-ui.css` (focus, modal fit, sizing, glow, twin status motion), `engine/shared-app/app.bundle.js` (Bard selection replacement, Battle VFX anchoring + twin status nodes; version string), `README.md`, this note and `docs/qa/rc16/RC16_UI_QA.md`. Original ZIP remains unchanged.

**Focused Chromium QA:** Scripted real-DOM center choice with Maestro at 820×580, 1024×650, 1280×800, 1600×900, 1920×1080: center cards/actions stay inside viewport, full-screen veil at z-index 24480 and center stage 24500, Hand/Mana remain below, zero page JS errors. Maestro 0,1,2 selection then third card changes selected indices from [0,1] to [0,2]; no Hand UNDO buttons. Gold Response-ready synthetic button is visible, has no animation and has **zero horizontal intersection with Hero Card** across 820/1024/1280/1600 test sizes. Short-viewport Hero Progression popup stays inside viewport and scrolls. Existing JS self-tests: Ultimate Tribute 30/30, Target 13/13, Class/Lineage PASS. JS syntax check PASS and ZIP testzip checked. Review and VFX positioning partly tested by HTML/CSS/source inspection, not a complete Firefox match or screenshot-per-card automated test. Browser QA used inlined assets due local Chromium navigation restriction, so rendered art itself was not visually asserted.

**Next / open:** Manually test Card Review Hero+Skill+Item+Event+Legacy with genuine loaded art; inspect overlay behavior and center card animations in hosted Firefox at several resolutions; confirm all four Battle VFX remain centered in both Ready/Exhausted under live response timing; verify Poison/Burn visual placement and all non-center popup scrolling; complete a normal Human-vs-AI match to Game Over. Continue to distinguish targeted QA from gameplay-wide guarantees. RC16 is **RELEASE CANDIDATE, NOT FINAL**.

**Decisions to retain:** Do not restore Hand UNDO, bright Mana/Hand strips in center selection, pulsing Response glow, oversized Hero-overlapping buttons, extra review container, one-icon Poison/Burn, floating HP numbers, or Status count-up. No unapproved effect-rule changes.


## RC17 UI backlog — Issue #1: Opponent/AI Mana Pool alignment (2026-11-05)

**Report:** AI/Opponent Mana Shards currently begin at the left side of the opponent Pool, near its numeric count (bottom-left). Requested mirrored presentation: first Shard anchored at the **right** (farthest from the count), subsequent Shards extending **right-to-left**, analogous to the Player Pool orientation relative to its count.

**RC16 code inspection (no code changed):** `shared-app/app-runtime.js`, `layoutManaPoolCards(host)`, currently sets `left = start + i * step` for **both** player and opponent. `isPlayer` only changes z-index; it does not mirror the x-position. `index.html` places the opponent Pool number at bottom-left, confirmed by `.opponent-field .opponent-mana-pool > .count { left:-4px; right:auto; ... }`.

**Proposed fix, pending authorization:** For AI use right anchoring (`left = hostWidth - margin - cardWidth - i*step`, within the Pool); retain current player layout, stable shard identity/order and payment interactions, and revise overlap stacking to match the new direction. Re-check count clearance, 1/4/12 Shards, responsive widths, opening draw animation endpoints and blind Mana selections in Chromium and Firefox. No implementation, ZIP or version bump.


---

## RC17 UI backlog — Issue #2: Center/coin overlay has horizontal seam (read-only code inspection, 2026-11-05)

**Designer report:** A visible horizontal boundary leaves the bottom portion of the page/background undimmed or differently colored during center-stage overlays, particularly Opening Coin Flip. Earlier center UI was visually continuous. **No implementation or version increment authorized.**

**RC16 source inspection:** `shared-ui/battlefield-ui.css` sets `.gl-coin-overlay{position:fixed;inset:0;background:#02070c}` and RC16 adds `max-height:100dvh` to overlays. `index.html` has `html.gl-adaptive-stage body{position:fixed;width:1600px;height:747px;transform:var(--gl-stage-transform)}` for touch/pointer-coarse devices. Because Coin Overlay (and other overlays) are appended *inside body*, a transformed body can become the containing block for `position:fixed` descendants, making an apparently full-screen overlay stop at the transformed body's boundary. This is a **plausible explanation**, not yet proven by DOM measurements for the screenshot's device. Compare overlay and viewport rectangles and inspect whether `html.gl-adaptive-stage` is active in Firefox when reproducing. Repair by ensuring backgrounds/veils cover physical viewport independent of the transformed logical battlefield without altering game interaction geometry. Do not blanket-remove the adaptive layout.

**Status:** Investigation only, RC16 unchanged. Test normal desktop, touch-landscape and portrait; verify Coin Flip, Bard/Maestro center, Mana and other overlays are seamless including bottom edges.

---

## RC17 UI backlog — Issue #3: Gray surface behind Card Review despite Deck Builder parity (confirmed CSS override, 2026-11-05)

**Designer report:** Gray area/plate persists around or behind Card Review; wants visual parity with Deck Builder v1.58 rather than another container. **No implementation authorized** (currently collecting UI fixes).

**Verified directly against RC16 and Deck Builder v1.58 ZIPs:** All 19 CSS files copied to `assets/review-db158/css/` are byte-for-byte identical to Deck Builder files (not a CSS-copy omission). RC16 mounts the review as `.gl-card-review-overlay > .gl-card-review-panel > .gl-card-review-body > iframe.gl-db158-review-frame`; inside the iframe, `shared-app/db158-card-review.js::documentHtml()` builds a synthetic `<div id="cardReviewDialog">`, not Deck Builder's `<dialog id="cardReviewDialog">`, and forcibly overrides popup geometry using inline `!important` CSS. It specifies `#cardReviewDialog{width:100%;height:100%;display:flex}` and `.review-card{width:min(1450px,100vw);max-width:100vw;background:#242630}`. Meanwhile RC16 `shared-ui/battlefield-ui.css` sets the wrapper/iframe to `width:100vw;height:min(822px,100dvh)`; although the outer panel background/border were set transparent, the **inner review-card itself remains a full-width gray plate** rather than retaining Deck Builder's constrained, content-sized card modal. Merely copying CSS doesn't cure the RC16 DOM/geometry override. Deck Builder's own gray `#242630` is intentional *inside* its modal; the issue is the extra-wide gray region exposed by VS AI layout overrides, not the color value alone.

**Proposed fix after authorization:** Retain Deck Builder's review markup, CSS, responsive geometry and single visible review surface as closely as practical. Remove the force-full-width/height inline overrides and any unnecessary extra background panels; isolate the battlefield via iframe only if required and leave its exterior transparent. Center the actual review card, size it by Deck Builder original CSS rather than `1450px/100vw`, and preserve the separately approved equalized artwork size only where compatible. Test Hero, Skill, Item, Event and Legacy at desktop and short/mobile resolutions, checking scroll, close button, background outside card, and absence of duplicate gray plates. Do not alter canonical OSA data or gameplay effects.

**State:** Confirmed style/DOM conflict by source comparison; no app source modified, no RC17 ZIP, baseline remains RC16.

---

## RC17 UI backlog — Issue #2 extension: Battle VFX centering may share transformed-body root cause (2026-11-05; investigation only)

**Designer report:** After horizontal seam/partial-viewport Coin/center overlays appeared, the P/M Attack visual also appears displaced from the physical center of a Hero Card, especially toward the end. Designer suspects both symptoms are related. No code changes or new release authorized.

**Verified source relationship:** In RC16 `index.html`, `html.gl-adaptive-stage body` applies `transform:var(--gl-stage-transform)` to the 1600x747 logical body on touch/coarse-pointer devices. In `shared-app/app-runtime.js`, center/coin overlays are appended under `document.body`; in `engine/shared-app/app.bundle.js`, `battleFeedbackLayer()` also appends its fixed-position visual layer under `document.body`, and `battleHeroRect()` uses the **viewport-space** `getBoundingClientRect()` of `.hero-card-anchor`. Then `battleVfxClip()` assigns those viewport coordinates to `position:fixed` children of the **transformed body**. CSS transforms create a containing block for fixed children; this can cause body transform to be applied a second time to already-transformed Hero coordinates. This is a concrete common-cause mechanism for both overlay seams and VFX displacement in adaptive mode. It is not confirmed that the user's Firefox session actually has adaptive mode active; that requires live DOM measurement.

**Reproduction / evidence:** An isolated Chromium DOM/CSS geometry fixture imitating the RC16 transformed-body rules at scale 0.86 (viewport 1600x768, logical body 1600x747) produced: supposedly fixed fullscreen Coin overlay bottom y=642.42 rather than viewport bottom y=768; VFX frame center x=406.78/y=199.69 vs Hero viewport center x=473/y=232.20, errors -66.22 px x / -32.51 px y. This is a **mechanism reproduction**, not a full app Firefox gameplay QA. The demo script is `/mnt/data/_rc16_center_geometry_probe.py` (outside packaged app). Additionally, the Physical Attack keyframe in `app.css` animates vertical translation ending at `translateY(32%)` in RC16 **and** the v6.91.9 reference; that built-in motion should be distinguished from erroneous VFX frame positioning, rather than treated as a new regression.

**Proposed remedy (pending approval):** First measure `html.gl-adaptive-stage`, body CSS transform, `window.innerWidth/Height`, `.gl-coin-overlay`, `.hero-card-anchor`, and `.gl-battle-vfx-clip` rectangles together on the affected Firefox setup. Ensure all viewport-layer overlays cover the physical viewport. Put VFX frame and Hero anchor into the SAME coordinate space (either inverse-transform the anchor rectangle into body-local logical coordinates or use a truly viewport-root visual portal outside any transformed ancestor). Include physical/magical Attack and Defense, Heal, Poison, Burn, Freeze and arrow layers in the compatibility check. Do not change gameplay effect logic, exhaust behavior, approved VFX animation movement, or adaptive-stage sizing indiscriminately. Regression test desktop and touch/coarse-pointer Firefox/Chromium at landscape/portrait and multiple scales, including the final moment of the Attack animation and Coin Flip seam.

**Status:** Root-cause mechanism reproduced in isolated Chromium, real Firefox condition not yet measured; RC16 application unchanged, no RC17 ZIP.

---

## RC17 backlog — Issue #4: Shield Charge mandatory source-front Swap absent (2026-11-05; INVESTIGATION ONLY)

**Designer report:** Playing Shield Charge does not force the user's Hero to Swap with the allied Hero standing opposite the attacked Hero, even when Freeze/Stun does not prevent Swap. Requested **check first**, no implementation or new ZIP/version at this stage; retain RC16 baseline.

**Authoritative card data:** `engine/js/static-data.js` records `S0-WAR-030` **Shield Charge**, Arcane Warrior Rank II Physical Attack 50 / Arcane Vanguard Rank III Physical Attack 70. Both printed rank branches say: `Swap this Hero's position with the allied Hero in front of the attacked Hero.` It is imperative (`Swap`), not optional (`You may swap`). The source card has `effects: []`, `dispatch.enabled: false`; these alone do not establish a bug because the app custom handlers may provide effects.

**RC16 app-code root cause (confirmed by static inspection):** `engine/shared-app/app.bundle.js`, `isChargeSwapCard(c)` enumerates `S0-THF-002`, `020`, `024`, `026`, `S0-WAR-015`, `S0-WAR-025`, but **omits `S0-WAR-030`**. `isSourceFrontSwapCard(c)` also omits `S0-WAR-030`, making `cardEffectSwapModel()` return `null` and `sourceSwapOptions()` offer no partner lane for this card. In single-target Attack resolution the post-attack flag `optional_swap_after` is set only by `isChargeSwapCard(c)`; therefore `resolvePostAttackChoices()` never initiates any Shield Charge swap. `S0-WAR-030` does not occur at all in the runtime `app.bundle.js`. This explains the reported behavior independently of Freeze/Stun. The historical swap self-test also excludes Shield Charge. Earlier WAR 42-card audit row labeled Shield Charge `CODE_REVIEWED_ONLY` and *not* an effect PASS — an audit coverage gap now exposed.

**Adjacent, separate semantic issue to test:** Both `S0-WAR-015` Charge Attack and `S0-WAR-025` Heroic Charge have the same printed imperative `Swap`, yet they currently route into **optional** swap UI with a `Do Not Swap` button. This is code/text mismatch; do not silently conflate them with Thief attacks whose text explicitly says `You may swap`. Validate the forced-swap behavior without inventing new restrictions or timing.

**Proposed repair (not applied):** Wire Shield Charge into the existing position-based allied source/front Swap logic, then separate mandatory Warrior Swap from optional Thief Swap; do not offer a Skip when the mandatory Swap is legally executable. Preserve Hero/Legacy eligibility and Freeze/Stun checks, Hero identity/status/attachment carry-over, and Hero-to-Legacy interactions. Regression-test Warrior three cards, Thief optional swaps, Dodge/Negate/Block and end-of-exchange timing, correct position (`attacked Hero` column rather than arbitrary ally), both PLAYER and AI, and same-column/no-legal-partner edge cases with source-authority review. Verify affected rule timing before expanding semantics beyond printed text.

**Evidence/limitations:** Direct RC16 `static-data.js` + `app.bundle.js` read and static route check only; no full Firefox match or end-to-end reproduction fixture executed. No app files, canonical OSA, or other projects changed. No RC17 ZIP generated.


## RC17 — 2026-11-05 — Mandatory Swap audit and transformed viewport correction

**Approval:** Designer requested a code-wide audit and fix of every card with a printed Swap, with highest priority on Issue #2 (full-screen overlay seam and off-center final Attack/Defense VFX). RC16 is the sole application baseline; original RC16 ZIP retained unchanged. No OSA, Deck Builder, PvP or other application edits.

**S0 Swap catalog crosschecked:** 9 Skill cards explicitly print Swap (S0-ARC-016; S0-THF-002/020/023/024/026; S0-WAR-015/025/030), plus S0-ITM-019 Warp Scroll and S0-WAR-004 Cover Up. These 11 routes were checked for code binding and whether Swap is compulsory. Shield Charge (`S0-WAR-030`) was omitted from both the source-front and charge-swap registries: connected it. Charge Attack and Heroic Charge printed *Swap* but offered *Do Not Swap*: now automatically Swap when a legal partner exists, for PLAYER and AI. Optional Thief effects retain *You may swap* choice. Soul Blast Shot's *When this attack hits, swap* had an incorrect Skip: removed Skip and disabled decline while a partner remains legal. Shadow Switch, Cover Up, Warp Scroll retain existing conditional/legal functionality. Freeze/Stun, Lane, Hero/Legacy eligibility and Response gating preserved. No blanket string-matched execution logic added.

**Issue #2 root cause distinguished:** Adaptive body transform predates RC16 and was already present in RC15; not newly invented by RC16. RC16's added center focus backdrop and `max-height:100dvh` overlay overrides made viewport clipping significantly worse, and battle animations still mixed viewport rect measurements with fixed children under scaled body. Converted viewport-fixed overlays (including Coin) and engine/UI VFX, animation and direction layers to `document.documentElement` so they are not descendants of transformed body. No arbitrary position offsets or changes to P/M Attack/Defense sprites, timing or damage.

**Proof:** `docs/qa/rc17/RC17_SWAP_AND_VIEWPORT_QA.md`. Chromium inline-load desktop and touch-adaptive viewport checks; 40/40 new source-backed Swap checks including Shield Charge real Play/PAY/Response path. Coin fullscreen correctly spans viewport in 3 sizes, VFX alignment probe 0 pixel error. Prior built-in tests whose historical assertions depended on optional Warrior swaps are stale assumptions, not independent regressions. Ultimate Tribute 30/30, Target Selection 13/13, Class/Lineage regression PASS, no page errors. Real full-match Firefox QA remains OPEN, so RC17 is **RELEASE CANDIDATE**, not FINAL.

**Do not regress:** Only mandatory Warrior Swap cards auto-swap; do not force Thief optional swaps. Soul Blast Shot mandatory only after connected Hit. For overlays/VFX, viewport coordinates must not be painted under transformed `body` or the stripe and offset return. Keep STATUS count-down / Attachment count-up and existing card effects. Other RC17 backlog items (AI Mana Pool right-alignment; Deck Builder Card Review gray geometry) were **not modified** in this scope.

**Next:** Real Firefox Battle test at same resolution/scale as user screenshot: confirm P/M Attack and P/M Defense centered during and at final animation frame, Coin/Choice no horizontal seam, Hero Ready/Exhausted; manually play Charge, Heroic Charge, Shield Charge, optional THF swaps, Soul Blast, Shadow Switch, Cover Up and Warp Scroll with Dodge/Negate/Freeze/Stun/Legacy; then normal end-to-end match to Game Over.


## RC18 — 2026-11-05 — Emergency UI rollback and viewport repair (RC17 regression)

**Designer report:** RC17 made the visible Card Review behave as fullscreen, a massive temporary card preview appeared at the screen edge, and Draw/animation origins appeared unreliable. Designer expressly preferred reverting risky UI alterations over additional speculative styling. Opponent Mana Pool was also still left-origin despite an earlier request to grow from right.

**Confirmed cause and rollback:** RC17 moved 17 Battlefield overlays/previews/visual layer insertion points from `document.body` to `document.documentElement` to address transformed-body coordinates. That sweeping portal migration changed the existing renderer's layer/positioning context. RC18 restores the **RC16 body-parent placement** for the complete `shared-app/app-runtime.js` visual/lobby/review overlays and the original v6.91.9 body-based animation/VFX layers inside `engine/shared-app/app.bundle.js`. The RC17 *mandatory position Swap logic* is retained unmodified. No broad gameplay-engine rollback; no OSA changes.

**Adaptive overlay seam root fix:** RC12–RC17 adaptive code transformed `body`, which also owned fixed modal/VFX nodes, so screen-space rectangles were transformed twice on coarse-pointer viewports. RC18 limits `--gl-stage-transform` to `.app` (the logical 1600x747 battlefield only). The untransformed `body` now owns viewport-fixed overlays, coin, review, hover, animation and battle feedback; this eliminates the prior below-modal band without placing the overlays directly under `html`. `shared-app/app-runtime.js` separates `uiRect` (real viewport for visual effects, arrows, ghost flights, overlays) from `uiLayoutRect` (inverse-app-transform logical positions only for layout calculations of Hand, Mana, Swap buttons, PAY button). No arbitrary px offsets or artwork changes.

**Card Review:** Removed force-fullscreen review sizing from the visible VS AI wrapper; centered the review panel within 96vw / 94dvh, capped at 1280x710. Inner read-only Deck Builder v1.58 renderer now fills its single review surface, eliminating the distinct gray frame/plate outside it. The official OSA-derived data still populates the Deck Builder view. Hero artwork and review information remain readable at desktop and compact widths.

**AI Mana:** Opponent Mana Pool now computes per-card `left` starting from the **right** (most distant from the count on the left), accumulating toward the left, with the original payment data and card identities unchanged. Responsive overlap still uses the same bounded step formula and original layering.

**Observed QA (Chromium inline-loaded static assets, not Firefox hosted game):**
- Four layout fixtures: 1600x768 desktop, 1024x650 compact, 820x580 touch landscape, 390x844 touch portrait. Coin fullscreen bounding rectangle matched each physical viewport; Card Review bounded within viewport; opening, closing, and hero review completed without JavaScript page errors.
- On desktop/compact/touch landscape, opponent Mana cards appeared right-to-left and stayed inside the pool. Portrait is a 90-degree rotated logical battlefield, so horizontal first-vs-last coordinates are not a valid direction test; containment held.
- RC17 position Swap engine hook: 40/40 checks PASS, on desktop and adaptive touch fixtures. VFX viewport rect probe: errors left/top/width/height all 0, parent BODY, and body transform `none`, both fixture types.
- No complete normal Human-vs-AI game through Win/Loss/Draw has been run; no guarantee that every animation and preview is correct in actual Firefox play. **RC18 remains RELEASE CANDIDATE, not FINAL.** If the user's exact Firefox path still shows a glitch, record DOM geometry/phase/card trigger before modifying more layers.

**Safeguard:** Future fixes must not wholesale reparent every UI portal to `html`, force all review surfaces to fullscreen, or transform `body` without coordinated visual-pipeline review. Preserve this rollback unless targeted browser tests prove a safer alternative. Keep RC17 ZIP available for comparison; RC16 remains the last pre-portal rollback reference.

## RC19 UI backlog — 2026-11-05 — Issue #1: Magic Compass vertical capacity (investigation only)

**User report:** The Magic Compass “Choose Skill” modal is too short. Its horizontal dimensions and left/right boundaries are already satisfactory. Desired presentation: accommodate **two to three rows of card choices vertically** where enough candidate Skill Cards exist, rather than a cramped single-row view. Do not widen the popup or shrink thumbnails to increase column count.

**RC18 source review (NO CODE MODIFIED):** `shared-app/app-runtime.js::renderAllowedModal()` builds a `.choice-grid.card-search-choice-grid` containing every current `p.candidates` item. `engine/shared-app/app.bundle.js::startCardSearchChoice()` collects eligible Skill Cards directly from remaining Main Deck; it has **no seven-card result cap** for a human player. `shared-ui/battlefield-ui.css` intentionally fixes Main Deck selector at **seven columns** and makes its `.choice-panel` content-driven (`height:auto`, `max-height:84vh`, plus RC16 viewport cap), with `.choice-body` scrolling. Therefore a single visible row may reflect only seven current legal candidates or a display/scroll condition; the screenshot alone does not prove that additional Skill cards are hidden. Do not invent extra candidates.

**Proposed limited UI solution (NOT AUTHORIZED YET):** Preserve horizontal popup width, 7-column card grid, thumbnail sizes, hover previews, one-card selection and deck-shuffle gameplay. Optimize the modal's vertical space to show up to **three full card rows** when enough legal candidates exist; on small-height screens show as many rows as fit and scroll internally, keeping header, instruction and Add Skill button visible. Avoid changing any other choice modal unless explicitly justified, and validate both 7-candidate and 15–21-candidate fixtures at desktop and short/touch viewports. Verify no card or footer clipping and scrollability in Firefox/Chromium.

**Status:** Logged / root CSS and candidate path identified; NOT implemented, no package or version bump. Baseline remains RC18. This is RC19 UI Issue #1.

## RC19 UI backlog — 2026-11-05 — Issues #2–#4, read-only investigation (NO APP CHANGES)

**Designer reports and screenshots:** (2) Card Review in RC18 is appreciably better but still too large; remove the remaining external gray rim/background entirely while retaining the intended dark information panel. (3) Opponent Mana cards now correctly grow from the right toward the left, but the *visually top/foreground overlapping card* should be the card at the LEFT end, not the right. (4) During an incoming Attack the player's Hero HP overlay reportedly disappears. Designer is accumulating issues; no application-code change or release has been authorized. RC18 is the baseline.

**#2 Card Review — inspected source:** `shared-ui/battlefield-ui.css` RC18 overrides `.gl-card-review-panel` to `width:min(1280px,96vw)` and `height:min(710px,94dvh)`, with a 100%-height iframe; `shared-app/db158-card-review.js::documentHtml` forces `#cardReviewDialog` and `.review-card` to 100% width/height, `.review-card` minimum height 100%, background `#242630` and an outer 1px `#414653` border. A large, rigid review footprint and remaining gray/border areas are therefore credible layout/style issues, independent of card effects. Avoid reintroducing the earlier RC17 fullscreen portal/regression: keep the body-owned modal, target a somewhat smaller adaptive dialog (provisionally ~10–15% smaller on large desktop), let internal content dictate height when possible, remove only unwanted *external* gray/border/empty strips, keep intended dark Deck Builder detail panels and identical visual-size treatment for Hero/Skill/Item/Event/Legacy. Test long/high-rank cards and narrow viewports with real screenshots.

**#3 Opponent Mana foreground order — confirmed from source:** `shared-app/app-runtime.js::layoutManaPoolCards` already positions opponent cards using `hostWidth-cw-2-i*step` (right-to-left). But its `z-index` formula is `100+(isPlayer?i:(cards.length-1-i))`, so opponent's first/rightmost card is drawn above later/leftmost cards. The developer comment claiming 'farther left = in front' contradicts the formula. Proposed *display-only* change: retain opponent right-to-left positions and physical shard order, but make the **leftmost** card foreground/highest z in overlapping stacks; verify for 1/3/12 shards, all Color Mana identities, hover/selection and pool bounds. Do not change engine Mana order/payment/regen.

**#4 HP overlay temporarily missing during Attack — not yet proven from a still:** The supplied 1170x569 attack screenshot actually still displays `30/100` above the top-left Finnian, so it does not itself establish the frame/time of disappearance. The regular `renderHero` path retains/creates a sibling `.gl-hp-overlay` with `z-index:230`; the only explicit CSS `opacity:0` targeting that overlay is `.hero-lane.gl-rank-transitioning > .gl-hp-overlay` (Rank Up, not ordinary Attack). This makes a blanket claim that the Attack handler removes HP unsupported. Reproduce a complete Attack/Response phase via timed Firefox/Chromium frames and inspect the attacked player's target Hero overlay `display`, `opacity`, bounding box, stacking/occlusion, React/DOM rendering around the exact moment, and transition from Ready to Exhausted. The desired invariant is continuous HP visibility and correct numeric HP while attacked, unless a deliberate Rank Up transition is occurring. Do NOT alter gameplay damage to fix a presentation defect.

**Status / next:** All three issues recorded. Implement only after explicit approval; no runtime source change, ZIP build, version bump, or OSA edit. RC19 backlog also retains Issue #1 Magic Compass 2–3 row capacity recorded immediately above. When authorized, QA must compare against RC18 and avoid prior RC17 broad portal reparenting.

## RC19 UI/gameplay backlog — 2026-11-05 — designer correction for #4, Poison Vial + Area Attack, and Chain Mail arrow (READ-ONLY INVESTIGATION)

> **SUPERSEDED for Poison Vial:** The statement below that a *Physical Area Attack* qualifies for Poison Vial is incorrect. See the later designer ruling: `Physical Attack` means **Skill subtype Physical Attack only**, regardless of whether an `Area Attack` deals Physical damage.


**Authorization boundary:** Designer explicitly asked to **check/investigate**, not implement. RC18 ZIP and app source remain unchanged; no version bump and no new application ZIP. Investigation inspected the actual RC18 `shared-app/app-runtime.js`, `shared-ui/battlefield-ui.css`, `engine/shared-app/app.bundle.js`, and official OSA S0 DEV45 consumer card data/recipe. An isolated Chromium snapshot fixture was run only in browser memory, not on packaged files.

**Issue #4 — HP overlay correction:** The missing bar in the designer's attack screenshot belongs to **Korvak Ironfang (PLAYER, bottom-left)**, NOT the upper-left Finnian Copperpot. The screenshot shows the Korvak HP overlay absent while other Hero HP overlays remain visible. `renderHero()` normally creates a direct `.gl-hp-overlay` child for an active Hero and does not remove it on ordinary Attack. The only explicit CSS opacity suppression identified is `.hero-lane.gl-rank-transitioning > .gl-hp-overlay {opacity:0!important}` at `shared-ui/battlefield-ui.css:284`, applied during Rank Up and removed in `runPresentationPlan()` reveal; other presentation stacking/occlusion is not yet ruled out. An isolated forced incoming-Attack response snapshot against the PLAYER LEFT active Hero in Chromium still showed the HP overlay (`display:block`, `opacity:1`, `visibility:visible`), so the screenshot-specific failure **was not reproduced** by a simple Response state. This does not invalidate the screenshot. Next QA must capture Korvak's actual lane CSS classes (particularly `gl-rank-transitioning`), overlay element existence/computed opacity/rect/z-index, preceding Rank Up and animation lifecycle at the moment the missing HP occurs. Do not assume all attacks remove HP, or modify HP/damage mechanics to fix the presentation.

**Poison Vial + Area Attack:** Canonical official `S0-ITM-011` printed text: `This turn, attach this card to the Hero that used it. That Hero's Physical Attack card will inflict Poison for 2 turns.` The text does **not** exclude Area Attack cards. Therefore a **Physical Area Attack** card is within the printed category, and a single Area Attack can affect multiple opposing Heroes under normal Area targeting. Physical Area examples in current S0 OSA consumer data include Arrow Volley `S0-ARC-009`, Crescent Moon Slash `S0-THF-031`, Wild Swing `S0-WAR-008`, Whirlwind `S0-WAR-016`, Wild Assault `S0-WAR-019`. Current RC18 `isPoisonVialEligibleAttack(c)` mistakenly tests `isAttackCard(c) && !isPoisonMistCard(c)`, **without checking Physical damage type**, thus it potentially accepts other Magical Attack cards against printed authority. The app's Area resolver deliberately defers Poison Vial consumption through all affected lanes and applies Poison 2 to each target for which `primaryHpDamage>0`, consuming the attachment once after the multi-target Attack. Therefore **RC18 already has a Physical Area Attack combo code path**, not a single-target-only limitation; it has a separate overbroad eligibility bug for Magical Attacks. The code's `primaryHpDamage>0` restriction is an additional implementation condition not literally stated in the printed text; whether a connected zero-HP-loss Hit must also inflict Poison is a **separate interpretation question** requiring current rule semantics/designer ruling before any changes. Do not silently change that rule. The OSA DEV41 recipe is `SPECIFIED_ONLY` and does not supply an unambiguous executable resolution to that boundary condition. No gameplay code changed.

**Defense Item/Skill arrow (Chain Mail):** Designer reports Chain Mail still directs its arrow toward the **attacker**, but desired Defense Skill/Item arrow target is **the Hero being defended**, with one arrow per defense. Confirmed competing routing in RC18 code: `confirmResponseOption()` sets `transientDefenseConnector` to `rw.target_side`/`rw.target_lane` only for a manually confirmed **Item** Response when `findAttackContextInWindow` succeeds; `activeTargetContexts()` can also use a temporary `response_payment_choice` Item fallback for the protected Hero. However, generic `findActiveAttackWindow()` then falls back to the ATTACKER→DEFENDER connector rather than a Defense-card-specific connector; recent resolved Item/Event event records can carry `target_side:rw.source_side,target_lane:rw.source_lane` (the **attacker**) from `recordPvpSideAction` in engine `resolveResponseWindow`, which `itemEventArrowContexts()` visualizes as Active Card→attacker after the temporary defense context ends. This is a credible source-backed route for the bad arrow; it has not yet been reproduced as a complete real Firefox interaction with Chain Mail. Proposed **presentation-only** fix: key any Defense Skill/Item arrow to the actual protected `rw.target_side` and `rw.target_lane`, uniformly for PLAYER and AI, during selection, PAY, and committed/short-lived history; suppress duplicate attack-line rendering while showing defense connector, but restore normal attack line at the appropriate phase. Do not change Response effects, targets, or history facts just to correct the arrow. Regression check Chain Mail, Ring of Protection, ordinary Defense Skills, Area/multitarget responses, and nested responses.

**Status:** RC19 backlog #1 Magic Compass, #2 Card Review, #3 AI Mana foreground, #4 Korvak HP disappearance, #5 Poison Vial Physical Area eligibility/semantics, #6 Defense Skill/Item arrows; investigation only. Preserve RC18 as baseline. No app changes, OSA changes, patch, or release.


## RC19 — 2026-11-05 — AUTHORITATIVE DESIGNER CORRECTION: Poison Vial Physical Attack subtype

**Decision (supersedes the preceding Poison Vial/Area interpretation):** The official Poison Vial (`S0-ITM-011`) wording *“That Hero's Physical Attack card will inflict Poison for 2 turns”* means **a Skill Card whose printed Card Subtype is `Physical Attack`**, not every attack dealing Physical damage. `Area Attack` is its own Card Subtype and therefore **does NOT qualify**, even when the Area Attack deals Physical damage. `Magical Attack` and all other attack subtypes also do not qualify. Damage type (Physical/Magical) and Card Subtype are distinct properties; never treat one as the other in eligibility checks. An effect that explicitly changes damage type alone does not silently change the printed Card Subtype.

**Current RC18 defect found in source (not yet fixed):** `engine/shared-app/app.bundle.js::isPoisonVialEligibleAttack(c)` currently returns `isAttackCard(c) && !isPoisonMistCard(c)`, admitting non-Physical-Attack subtypes. The existing engine contains source-aware helpers `explicitAttackLabel(c)` and `attackLabelQualifies(c, 'Physical Attack')`; use appropriately validated Card Subtype identity rather than `damageTypeForActionSource()` alone when authorized to correct the gate. Check all initiation, Attachment applicability/consumption, AI selection and Area-effect routes; reject unrelated attack subtypes without changing unrelated card effects. No assumptions about the separate zero-HP-damage / connected-Hit question have been authorized; do not add or remove a new hit/damage requirement as part of this category fix.

**Correction to previous assistant finding:** The earlier conclusion that *Poison Vial can combo with a Physical Area Attack* was **WRONG** and is explicitly withdrawn. Do not implement or preserve that conclusion as a desired feature. Keep a regression fixture for `Physical Attack` (eligible), `Area Attack` dealing Physical damage (ineligible), `Area Attack` dealing Magical damage (ineligible), `Magical Attack` (ineligible).

**Change control:** Designer is clarifying rules while listing RC19 issues. Update this note only; **no VS AI source changes, no OSA mutation, no new app ZIP, and no version bump**. Baseline remains RC18.


---

## RC19 — 2026-11-05 — Six approved RC19 fixes (IMPLEMENTED; release candidate)

**Authorization:** Designer requested to fix all six RC19 items after correcting Poison Vial rules. Work was applied to a fresh extraction of **RC18**, never RC17 or a stale working tree. OSA DEV45, Deck Builder and unrelated apps are read-only. This note is authoritative continuation.

**What changed:**
1. Magic Compass: width and 7 columns unchanged; allow up to 3 rows vertically with scroll on shorter displays.
2. Card Review: max panel 1120px (was 1280); iframe fits actual Deck Builder v1.58 rendered card height via scoped resize message; removed unused outer gray slab. Avoid broad DOM portal moves and full-screen sizing overrides that caused RC17 regressions.
3. Opponent Mana: keep cards appearing from right toward left; **leftmost** card is on top by z-index. Never reverse canonical Mana card order/payment.
4. Korvak HP bar: removed the CSS opacity-0 hiding during Rank transition and added stale transition-class cleanup. Snapshot-specific Firefox failure remains unconfirmed; no damage or Rank Up mechanics changed. Further screenshot/gameplay reproduction mandatory before saying permanently resolved.
5. Poison Vial: ONLY a Skill subtype `Physical Attack` qualifies, verified by `attackLabelQualifies()`. Area Attacks that deal Physical damage are excluded. Multi-target `Dual Arrow` still qualifies if subtype is Physical Attack. Do not reinterpret as a damage-type check again; preserve separate hit/HP-loss gate pending explicit ruling.
6. Chain Mail / Defense: Defense Skill and Protection Item temporary arrows point to protected Hero, 1 arrow only; stale resolved Protection Item history does not point to attacker. No Response or effect logic modified.

**QA:** Chromium layouts 1600x768, 1024x650, 820x580 and 390x844; additional 1600x900, 1024x600 and portrait. Synthetic 21-card Magic Compass: 7 columns, 3 rows, scroll when short. Card Review Hero/Skill matches single surface and content-fitted dimensions. AI Mana z-index leftmost highest. Actual S0 Poison Vial helper tested 8 subtype fixtures (Archer Physical Attack true; Physical Area false; Magical/Defense false). Actual UI arrow route tested with mocked incoming Attack/Response payment: Chain Mail and Brilliant Radiance one connector to PLAYER LEFT; attacker-directed Item history suppressed. Legacy regression Swap 40/40, target 13/13, Ultimate Tribute 30/30, Class/Lineage 6975 pass. No Chromium page errors in those fixtures. Details `docs/qa/rc19/RC19_QA.md`, `RC19_QA.json`.

**Explicit limits:** No complete normal Firefox Human-vs-AI game to terminal; Korvak HP original live failure not independently reproduced; Chain Mail real Firefox mouse-driven nested response path not exhaustively retested; Magic Compass full real engine search path not re-run in 21-card layout fixture. DO NOT call FINAL. Before next release, gather live evidence for remaining UI-specific issues without broad scaling/portal rewrites. Avoid unsolicited changes to OSA/other apps. Preserve one enclosing app folder and root only index.html/README.md.

## RC19 — 2026-11-05 — Card Review gray outer rim investigation (read-only; no application change)

**Report:** Designer still sees an unwanted gray surface behind/around the Card Review popup (Forged Alliance screenshot). Designer requested investigation only and asked if it can be eliminated entirely.

**Source checked:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC19_2026-11-05.zip` source working tree, `shared-app/db158-card-review.js`, `shared-app/app-runtime.js`, `shared-ui/battlefield-ui.css`, and Deck Builder v1.58 styling. In a temporary, browser-only Chromium CSS injection, the popup content was mounted without writing app files.

**Findings:** The host `.gl-card-review-panel` and iframe background are already set transparent in the final RC19 CSS. The inner iframe document still explicitly forces `.review-card` to `border:1px solid #414653!important`, `border-radius:14px` and `background:#242630!important` in `db158-card-review.js::documentHtml()`. Computed Chromium style confirmed a visible 1px solid border, and changing just that border to 0 in a **temporary in-browser test** removed the main border line, but a narrow gray bottom strip remained. The frame uses `GL_S0_REVIEW_FIT` with `height=Math.ceil(card.getBoundingClientRect().height)+2`, which should be audited together with the frame/document clipping. Thus removing the border alone is not a complete visual fix. Dark gray `#242630` is the *intentional background of the content panel* inherited from Deck Builder style; do not blindly remove it or render text unreadable. The request refers to any unwanted extra rim/gutter/plate outside the actual content panel.

**Proposed scoped fix (NOT APPLIED):** Remove the unwanted inner review-card rim, ensure wrapper/frame and iframe content tightly match measured content with no extra bottom/edge band, preserve the main Card Review panel and dark backdrop, then visually compare Hero/Skill/Item/Event/Legacy in Firefox and Chromium at multiple resolutions. Do not change global Battlefield scaling or other overlays as part of this issue. **Version stays RC19.**

## RC20 UI backlog — 2026-11-05 — Different colors for simultaneous Casting (INVESTIGATION ONLY)

**User report/request:** Screenshot shows two opposing Hero positions with active Casting locks, both highlighted by the same purple/violet glow. Designer requests visually distinct colors whenever two Castings are active simultaneously. This is a UI/presentation request, **not** permission to alter Casting logic or publish a new build.

**Verified in current RC19 source:** `shared-app/app-runtime.js::castingTargetsPosition()` checks whether *any* pending Casting targets a given position and returns only a boolean; `renderHero()` toggles the same `.gl-casting-target` class for each such lane. `shared-ui/battlefield-ui.css` applies the same violet glow to every `.hero-lane.gl-casting-target::before`. Casting source Attachment glow is likewise uniformly violet via `.attachment-card.gl-casting-active`. Thus multiple simultaneous Castings are indistinguishable by color, even though the underlying `pendingCastings` records separately retain source/side/target information.

**Proposed scoped implementation (NOT APPLIED):** Derive a stable per-active-Casting visual color index from `pendingCastings` (prefer a stable Casting identity or creation ordering; do not reshuffle colors on unrelated rerenders). Assign matching palette to (a) each active Casting attachment and (b) its locked opposing *position*, so players can trace which source targets which lane. Example colors: first violet, second turquoise/green; optional third distinct hue. Keep meaning of target lock unchanged (position, not Hero). Maintain accessible outline/label cues in addition to hue if feasible. Do not modify gameplay, timer/counter, owner, locked target, resolution, or damage. Test two simultaneous Castings targeting different lanes, both sides having Castings, duplicate targets, expiry/cancel/swap, and screen sizes. Be mindful of existing blue Class Ability and gold Racial Trait cue combinations in CSS.

**Current status:** No application code changes, no ZIP, no version bump. Baseline **RC19**. Continue collecting the user's list until explicit authorization to implement.

## RC20 — 2026-11-05 — Arrow / connector remapping for Event & Utility Item (DESIGN PROPOSAL ONLY)

**Designer-specified baseline visual rules:** (1) Attack: attacking Hero -> target Hero; (2) Defense Skill and Protection Item: played Defense card -> defended Hero (one, never also toward attacker); (3) Consumable Item: played Item -> Hero who uses/receives the Item effect; (4) Utility Item: draw a connector only if the effect has a meaningful explicit target; (5) Buff: played Buff card -> Hero(s) receiving the Buff. Avoid extrapolating incidental `discard`, `deck`, `hand` or other effect prose into arrow destinations. The designer specifically requests a complete mapping list for Event and Utility Item; NO approval to implement yet.

**Authority and code inspected:** v1.0 RC19 `runtime/season0-generated/s0-card-definitions.json` (12 Event, 20 Items; 7 with actual printed `Utility` subtype), `shared-app/app-runtime.js::itemEventArrowContexts()` and `activeTargetContexts()`, and `engine/shared-app/app.bundle.js` event/utility handlers and target selection fixtures. The S0 generated data's `target_required` is `false` even for some clearly target-selecting cards; therefore it is insufficient on its own to determine arrow targets. Use the printed text plus actual action/selection context, not that global field.

**Provisional Event mapping (12 cards):**
- EVT-001 Begin Anew — no arrow, own hand/deck shuffle-draw.
- EVT-002 Market Bargain — no arrow, own draw.
- EVT-003 Scouting — Active Card -> chosen enemy Hero whose EXP stack is affected; never Discard Pile.
- EVT-004 Relentless Leveling — Active Card -> chosen allied Hero receiving EXP.
- EVT-005 Last Resort — Active Card -> sole surviving allied Hero granted double damage (single-recipient Buff).
- EVT-006 Dazed — Active Card -> chosen opposing Hero receiving Stun.
- EVT-007 Intercept — during defensive Attack Response, Active Card -> protected Hero; it does NOT point at the attacker. Separate negation-card interactions need respect for actual legal trigger.
- EVT-008 Forged Alliance — no arrow, Racial Token pool.
- EVT-009 Tactical Adaptation — no Hero arrow, negates the played Tactical/Event Card, not a Hero. Do not point at Discard.
- EVT-010 Déjà vu — no Hero arrow, Discard -> Hand card retrieval.
- EVT-011 Coordination Attack — global Buff to all allied active Heroes; **design choice pending** whether 3 fan-out arrows or no arrow to reduce clutter. Never a single misleading Hero.
- EVT-012 Defensive Formation — Area defensive Reaction for each affected allied Hero; **design choice pending** whether card -> each defended Hero vs no connector for global protection. No arrow to attacker, no duplicate arrow per defended Hero.

**Provisional Utility Item mapping (7 cards):**
- ITM-006 Magic Scope — no Hero arrow (opponent Hand reveal; optional zone arrow only if designer wants zone-to-zone interactions visually represented).
- ITM-008 Phoenix Feather — Active Card -> selected defeated allied Hero/Legacy position to revive.
- ITM-009 Crystal Ball — no Hero arrow (view/reorder top own Deck).
- ITM-017 Flashpowder Bomb — no Hero arrow (negates opponent Item; *never* arrow toward Discard Pile because of generic text).
- ITM-018 Magic Compass — no Hero arrow (search own Main Deck, add Skill to Hand).
- ITM-019 Warp Scroll — explicitly selects TWO allied Heroes; show meaningful visual on both (either card -> both, or a purpose-built Hero A <-> Hero B Swap marker), avoid a misleading single target.
- ITM-020 Freeze Bomb — Active Card -> selected enemy Hero receiving Freeze.

**Implementation caution when authorized:** `itemEventArrowContexts()` currently prioritizes `a.target_side + target_lane(s)` and sometimes infers zone from raw target metadata, then `activeTargetContexts()` falls back to generic source/target actions. Those fallbacks must be scoped by actual printed card identity and effect context to avoid false-positive arrows, and attack and defense must never both draw for one defense frame. Prefer a table-driven role/target policy plus actual chosen target(s) from committed actions; no duplicate, no arrows to discard merely because a card goes there. Test each of 12 Event + 7 Utility items against Player and AI, precommit / response / finish, including multi-target and zone-only non-Hero effects.

**Change control:** This is a read-only mapping review. Baseline remains RC19. No app code or OSA changes and no new ZIP/version. Provisional multi-recipient choices are not approved gameplay rules.

## RC20 — 2026-11-05 — APPROVED arrow mapping clarifications for Event and Utility (DECISION ONLY; NOT IMPLEMENTED)

**Designer decision (supersedes the provisional 'no arrow' entries in the previous RC20 mapping):**
- EVENT EVT-001 **Begin Anew**: [SUPERSEDED by later RC20 correction — NO ARROW because effect involves Hand and Main Deck].
- EVENT EVT-002 **Market Bargain**: show arrow to **own Main Deck**.
- EVENT EVT-008 **Forged Alliance**: show arrow to **own Racial Token indicator/pool**.
- EVENT EVT-010 **Déjà Vu**: show arrow to **own Discard Pile**.
- UTILITY ITM-006 **Magic Scope**: show arrow to **opponent's Hand**.
- UTILITY ITM-009 **Crystal Ball**: show arrow to **own Main Deck**.
- UTILITY ITM-018 **Magic Compass**: show arrow to **own Main Deck**.

**Scope restriction:** Keep every other arrow **already implemented in RC19** unchanged unless a designer-approved correction specifically overrides it. Do **not add extra/new arrows** for other Event/Utility cards just because they were suggested in the provisional mapping. This includes the unresolved theoretical multi-arrow options for Coordination Attack and Defensive Formation: do not implement those proposals without separate authorization. Previously agreed base direction rules for Attack / Defense / Consumable / targeted Utility / Buff remain. Draw exactly the intended arrow for an actual completed effect; no duplicates or unrelated Discard targets. Designer has not authorized code changes or a new version here. **Baseline RC19**, decision recorded for a future release.

## RC20 — 2026-11-05 — Designer correction: Begin Anew arrow (DECISION ONLY; NOT IMPLEMENTED)

**Latest designer decision (supersedes the earlier approved EVT-001 arrow to Main Deck):** **Begin Anew (`EVT-001`) must show NO directional arrow.** Its effect involves both **Hand** and **Main Deck**, so an arrow pointing only to Main Deck would misrepresent the operation. This is an explicit exception to the prior RC20 zone-arrow mapping. Do not add either a Hand arrow or a Main Deck arrow for this Event. All other previously approved Event/Utility arrow decisions remain unchanged.

**Change-control:** No application code changed; no ZIP or version bump. Baseline RC19.


## RC20 — 2026-11-05 — IMPLEMENTED: Card Review gray-frame removal, Casting palette, approved Event/Utility arrows

**Approval:** Designer said “ok benerin semua, terutama background review card; pastikan kali ini hilang, cek lagi kalau perlu.” Only the open post-RC19 items (Casting differentiation, approved arrow remap, extra Card Review gray surface) were implemented. RC19 was the immutable build baseline; no new independent feature work or gameplay mechanic changes.

**Card Review regression history (important — do not repeat):** RC15–RC19 repeatedly attempted to remove a gray border by modifying only the host wrapper, but iframe-internal `review-card` still had a 1px border and a `+2` px height pad. More subtly, the iframe `color-scheme:dark` painted *gray canvas pixels underneath its rounded transparent corners* even when the CSS background was `transparent`. The Deck Builder embedded `body::before` pseudo-element also contributed page-level decorative overlay. The successful scoped fix is to remove the inner border, force **light/transparent iframe canvas** while keeping the actual `#242630` review panel, disable irrelevant embedded body decoration, and resize the iframe to the precise rendered card. **Never remove the intended review details background or reparent Battlefield overlays to fix an iframe rim.**

**Measured visual verification:** Chromium comparison at 1381×602 with actual `S0-EVT-008` review: old top-left gray pixel `(132,69)=(97,97,101)` now `(1,2,4)` matching dimmed underlying UI; old lower-left `(131,533)=(53,54,57)` now `(1,2,4)`. Tested five categories (Hero/Skill/Item/Event/Legacy) across four viewport sizes, 20/20 with 0px extra border, iframe/card height difference <=0.53px, no page JS errors. `docs/qa/rc20/RC20_UI_QA.md` contains precise test details. Firefox remains a required live recheck; not claimed completed.

**Casting:** Live `pendingCastings` visual keys receive stable violet/teal/amber colors. The active Casting Attachment matches the opposing target position's hue; two castings on same position show combined hue instead of one being silently hidden. Stable across rerenders and when others end. Existing locked *position* semantics, Casting timers, Exhaust, resolution and damage are unchanged.

**Arrow mapping — explicit designer decisions implemented, with source-side awareness:** EVT-001 Begin Anew NO arrow; EVT-002 Market Bargain -> own Main Deck; EVT-008 Forged Alliance -> own Racial Tokens; EVT-010 Déjà Vu -> own Discard; ITM-006 Magic Scope -> *opponent's* Hand; ITM-009 Crystal Ball -> own Main Deck; ITM-018 Magic Compass -> own Main Deck. Explicit card IDs prevent incidental effect text from inferring arrows. No new arrows for other Event/Utility cards; previously working Attack, Defense, targeted Hero/Item, and Buff behaviors retained. Player and AI zone anchors verified via 14/14 browser policy/DOM assertions, Flashpowder still no arrow, Freeze Bomb still target Hero.

**Important pre-existing engine test failures, not touched:** `testGameplayFoundationFixes()` reports `Brilliant Radiance missing against Double Casting activation 1` on both RC19 and RC20; `testUnbrokenStandClassRows()` returns all false in both. Other `testPlaytestManaRules()` and `testDefeatCastingCleanupRevive()` return ok=true in both. This does **not** establish a new regression or a gameplay fix authorization. Do not claim gameplay fully PASS. Follow up separately only after explicit approval.

**Changed runtime files only:** `shared-app/app-runtime.js`, `shared-app/db158-card-review.js`, `shared-ui/battlefield-ui.css`; docs / readme updated. **Next:** actual Firefox match verification (native Firefox unavailable locally), visual acceptance of no gray extra, 2+ Casting simultaneous, 7 target-zone arrow cases and existing Defense/Attack arrows. Build RC20 remains RC, **not FINAL**.

## RC21 UI backlog — 2026-11-05 — Designer reports: Lobby Hero Review parity and long-name Skill button fit (READ-ONLY)

**Status and control:** Designer explicitly requested to list issues first (not patch immediately). Baseline remains **RC20**; no runtime source changes and no RC21 ZIP prepared. Source was read-only inspected from `Grandis_Legacy_VS_AI_Season0_v1.0_RC20_2026-11-05.zip`, along with user screenshots of the existing three-card Hero Progression modal and desired Deck Builder v1.58 Hero Review. Preserve all RC20 fixes, especially true transparent review outer shell.

**Issue #6 — Lobby Hero Review should match Deck Builder v1.58 completely, including bottom Hero lineage/rank selector.** Actual screenshot: clicking Lobby Hero opens `HERO PROGRESSION` with 3 large Rank I/II/III images/arrows, then opens a separate Card Review only after clicking one. Designer wants direct Deck Builder-like Hero Review in Lobby with the bottom 'HERO LINEAGES' picker (3 thumbnail ranks) and dynamic detail panel, exactly as reference, rather than bespoke three-large-cards progression UI. Code findings: `shared-app/app-runtime.js::openLobbyHeroProgression()` builds bespoke `.gl-progression-overlay`; `openCardReview()` mounts iframe. `shared-app/db158-card-review.js::documentHtml()` already has `#reviewProgression` / `#reviewProgressionCards` markup, but forcibly sets `#reviewProgression{display:none!important}` and exports `heroFooter:false`. Therefore it is not sufficient to only remove the progression popup; must wire the lineage images and switching behavior to actual OSA S0 rank ids using v1.58 renderer/stylesheet, matching Deck Builder bottom footer, while preserving overlay close/scroll/responsive and avoiding two stacked modals. Verify that the Deck Builder v1.58 actual render/behavior is used as the visual reference, not invented styling. Do not alter OSA, card stats/rules, Deck Builder repository, unrelated Battlefield Card Reviews unless expressly needed.

**Issue #7 — Long Skill names in the button should fit without making the button grow.** Designer says (Indonesian): 'untuk skill dengan nama panjang font bisa diperkecil jadi yang di lock buttonnya aja'. Interpret conservatively as: allow font reduction *only for the long Skill name label inside the affected action/button*, keep the button's width/height locked; do not globally shrink skill names on card art, in Card Review or in other UI. Need inspect the latest precise screenshot/control at implementation if needed before selecting selector; avoid broad selectors. Read-only code inspection shows class Skill action buttons are generated in `engine/shared-app/app.bundle.js::v94HeroActions()` as `.actionBtn.gold.classAbilityAction` with `.tablet-ability-label-full` and `.tablet-ability-label-compact`, but this is only a candidate target, NOT confirmed to be the exact button in the user's screenshot. Use adaptive font-size from actual rendered text length/overflow and keep title/aria-label intact. Verify for short and long names at typical viewports, without changing button size or other labels.

**Open earlier RC21 watchlist:** RC20 Card Review corner/backdrop true Firefox validation; simultaneous Casting colors; Event/Utility arrow mapping; transient Korvak HP bar disappearing under Attack (not independently reproduced), and pre-existing Brilliant Radiance/Double Casting engine test failure. These are watchlist items rather than automatically authorized patches. Await designer's explicit approval to implement accumulated RC21 issues.

## RC21 — 2026-11-05 — Issue #8: targeted Hero HP bar appears to disappear due to overlapping z-index (READ-ONLY)

**Designer report:** During a Hero being targeted (attack / Response), the Hero's HP bar is not actually deleted; designer observed it still exists but is **occluded by a foreground Hero card with elevated stacking order**. Screenshot of Draxen / target action supplied. This supersedes the earlier provisional 'Rank-Up transition hides HP' interpretation as the primary user-observed symptom, but must still be independently verified against actual DOM stacking/computed styles.

**Code read (RC20 ZIP immutable):** `shared-app/app-runtime.js::renderHero()` creates/updates `:scope > .gl-hp-overlay` as a sibling of `.gl-hero-physical-stack`, and only removes it in Legacy mode. In `shared-ui/battlefield-ui.css`, `.gl-hp-overlay` has `z-index:230!important`, physical Hero stack has `z-index:3!important` (the engine base image `.hero-card.hero-main` inside has z-index 30). Separately, `renderResponseFocusLights()` marks relevant Hero lane(s) `.gl-focus-lit`; `.battlefield.gl-focus-response .gl-focus-lit` sets `z-index:950!important`, and other controls (e.g. `.gl-hero-actions`) can use z-index 960. The global focus dimmer is z-index 900. These facts support investigating visual stacking/paint order and overlapping stacking contexts rather than missing HP data, but **source alone does not prove that the physical card in the SAME lane is above its HP sibling**, since local z-index 230 normally beats local stack z-index 3. Check overlapping sibling lanes, ancestor stacking contexts, styles from engine, focus mode, and exact screen geometry in a real reproduction before selecting minimal CSS fix. Do NOT simply inflate all HP z-index globally or regress tooltips/active card overlays. Verify attack + response, targeted/exhausted/adjacent Hero, and after the target state ends. No gameplay/rules changes.

**Change control:** User is still accumulating RC21 issues; NO code modifications, NO RC21 ZIP/version. Existing RC21 issues #6 Lobby Hero Review matching Deck Builder incl. footer, #7 long Skill button adaptive font; this is #8 transient target HP occlusion. Previous watchlist stays separate.

## RC21 — 2026-11-05 — Issue #9: Arbalest / Grand Arbalest Class Ability UX parity with Bard / Maestro (READ-ONLY)

**Designer request:** “class ability arbalest dan grand arbales buat sama kaya bard dan maestro aja bisa ga?” Interpreted in the accumulated UI backlog as making the **presentation / decision flow** match Bard/Maestro's foreground centered choice-stage experience, **not** changing the two classes' game mechanics. The spelling in canonical data is **Grand Arbalest**. Await explicit batch approval before implementation; source files and RC20 ZIP unchanged.

**Actual RC20 source reviewed (SHA256 matches immutable RC20 ZIP):** `shared-app/app-runtime.js::centerChoiceModeFor()`, `renderCenterChoiceStage()`, `renderHeroAbilityButtons()`; `engine/shared-app/app.bundle.js::drawReplacementAbilityForHero()`, `maybeOpenDrawReplacementChoice()`, `renderDrawReplacementChoice()`, `commitDrawReplacementChoice()`. Bard/Maestro use `s0_bard_draw_choice` inside foreground `gl-center-choice-stage` with full-screen dimmer, Hand cards, SKIP and DISCARD & DRAW. Arbalest Rank II `Quick Reload` and Grand Arbalest Rank III `Rapid Chamber` instead create `draw_replacement_choice`, show legacy `choiceOverlay` popup for **the one card just drawn**, and presently offer Hero inline ability/`SKIP` buttons; engine's decision choices are **Keep Card** vs **Shuffle & Redraw**, and this occurs during Draw Phase. `Rapid Chamber` additionally has a passive Physical Attack damage modifier; do not alter it or the Draw This Turn counter.

**Proposed scoped UI:** Route `draw_replacement_choice` through the same centered `gl-center-choice-stage` and dimmer as Bard/Maestro; show only the authoritative `pending.drawn_card_id` face up (no selection of any arbitrary Hand card), title `QUICK RELOAD`/`RAPID CHAMBER`, explicit `KEEP CARD` vs `SHUFFLE & REDRAW` actions. Keep the engine's existing `commitDrawReplacementChoice(false/true)` authoritative transaction (shuffle, redraw, usage marker, Draw This Turn counter and Draw Phase mana continuation remain unchanged), suppress competing legacy choice-overlay visual and duplicate Hero-buttons during foreground decision. Animate the physical card only if movement can be implemented safely without premature game-zone changes. Verify both ranks, normal keep/redraw, capped counter, after Rank Up, AI continuation, small screens, no overlays stranded. No S0 OSA changes and no edits to Bard/Maestro existing operation.

**Change control:** User is still listing RC21 issues; no source modifications or new ZIP. This is Issue #9 after #6 Lobby Hero Review, #7 long Skill button, #8 targeted Hero HP occlusion. Existing RC21 QA/watchlist still open.

## RC21 — 2026-11-05 — Issue #9 clarification: Arbalest centered card NOT selectable (DESIGN DECISION ONLY)

**Designer explicit correction:** For Arbalest (`Quick Reload`) and Grand Arbalest (`Rapid Chamber`), the Bard/Maestro similarity applies ONLY to centered foreground presentation/dimmer; **only the ONE card just drawn** appears in the center. **Never move the entire Hand into the foreground**, never show other Hand cards as choice candidates. The drawn card itself **cannot be selected or deselected**: no selection highlight, toggle, or click-to-select mechanic; its identity is fixed by engine `pending.drawn_card_id`. The decision is made ONLY through the existing **KEEP CARD** and **SHUFFLE & REDRAW** controls; do not add Bard-style multi-card selection, SKIP/DISCARD buttons, or change card-zone/engine effects. The Hand remains in its existing place; block unrelated card interaction as required while mandatory modal is open. Retain Quick Reload/Rapid Chamber limits/counters and Rank III passive.

**Change-control:** This supersedes any previous suggestion implying clickable/selectable centered card(s). User is still listing RC21 issues; RC20 unchanged; no runtime edits or new ZIP.


## RC21 — 2026-11-05 — APPROVED: UI fixes #6–#9, DEV NOTES 01–20 and release package

**Authorization:** Designer said “ok lu update versi terbaru sama buat DEV notes ... DEV1-20”. Baseline immutable RC20, changes limited to UI and documentation. **No canonical OSA, engine gameplay, card art or Deck Builder changes**. The term DEV01–DEV20 here is a document outline of 20 developer topics reconstructed from evidence, not proof of historically distinct DEV1–DEV20 builds.

**#6 Lobby Hero Review:** Replaced bespoke giant 3-hero progression modal entry point with immediate Deck Builder v1.58 Card Review iframe. Added true `HERO LINEAGES` footer of 3 rank art buttons (from existing `getHeroProgression` IDs) inside the exact DB review renderer and CSS; clicks post scoped `GL_S0_REVIEW_RANK` to current iframe only. Battle Card Review remains without footer. Kept RC20 color-scheme light/transparent outer frame, implemented scroll for tall Rank III popup instead of clipping the footer.

**#7 Long Skill/Hero ability labels:** Within `renderHeroActions` label longer than 14 chars gets responsive smaller font in a fixed size long-name-only button; no global card artwork/hand/preview font scaling. The upper-right Hero button was identified from screenshot; do not alter engine's alternative tablet buttons unless separately reported.

**#8 Targeted Hero HP:** Source shows bar still exists as direct sibling to physical card. Peer Hero lanes share focus z-index 950; when overlapping, attacker/sibling may cover bar irrespective of local HP z-index. New target lane `.gl-response-target-hero` with peer priority 955 and its own HP overlay 1300; original bar remains outside rotated Hero physical stack. Verify real nested response/adjacent/Exhausted screenshot in Firefox: dynamic overlap not reproduced in harness, so resolution is provisional.

**#9 Arbalest/Grand Arbalest:** `draw_replacement_choice` now routes to `gl-center-choice-stage` (same dimmer as Bard), but maps **only `pending.drawn_card_id`** into single disabled/non-clickable card. Buttons KEEP CARD and SHUFFLE & REDRAW commit existing engine transactions; no Bard hand selection and Hero inline button duplicate. Does not change engine Passive Rapid Chamber / draw limits / Draw This Turn. Synthetic live runtime snapshot DOM probe showed exactly one card, no selectable/selected and exactly two approved buttons; engine Draw QA PASS.

**QA evidence:** `docs/qa/rc21/RC21_QA.md`, `RC21_ENGINE_QA.json`. Chromium inline source harness (native browser launch cannot navigate localhost/file because environment policy) confirmed Lobby Rank I↔III thumbnail switching, 3 lineage thumbnails, short screen scroll to footer, 0 page JS errors. Engine tests: Draw reservation PASS, 13 target, 30 Ultimate, 40 Swap, 6975 lineage. JS syntax PASS. **Full native Firefox normal-match QA still not performed; RC21 is NOT FINAL.**

**DEV notes:** `docs/DEV_NOTES_01-20.md` is permanent running source-based design/implementation summary of 20 topics, covering official data, skill UI, Bard/Maestro, Quick Reload/Rapid Chamber, Poison Vial subtype rule (Physical Attack ≠ Physical damage/Area subtype), Casting/color, status, Swap, arrows, Ultimate, scaling, review gray and open questions. Future contributors should read this before patches. **Do not imply Poison Vial zero-HP-damage gate is settled.**

**Current release:** RC21 dated 2026-11-05. No RC22 created.

**RC21 supplemental CSS verification:** Independently applied Response focus to two real mounted Hero lanes in the Chromium inline harness and read actual computed styles: normal focused lane `z-index:950`; targeted focused lane `z-index:955`; target HP overlay `z-index:1300` and `opacity:1`. This verifies CSS precedence, **not** the entire in-match animation/overlap reproduction or Firefox fidelity.


---

## RC22 — 2026-11-05 — Designer-approved three targeted UI repairs

**Authorization:** After investigating three RC21 issues, designer explicitly instructed "coba fix". Source baseline is the immutable RC21 archive. Scope is **right-side Hero Class Ability (Human Ambition etc.) button sizing**, **Quick Reload/Rapid Chamber card/button vertical gap**, and **Lobby Hero Review wheel scrolling**. The designer specifically corrected an earlier confusion: the first item refers to Hero-side ability names (e.g. Human Ambition), not to the Quick Reload center choice. No original source ZIP was overwritten, no OSA/Deck Builder/other-app edits, no engine gameplay/rules/cards/art changes.

**Changes:**
1. `shared-ui/battlefield-ui.css`: remove the RC21 functional impact of fixed **100×30px** long-name button geometry, enforce the same 20px one-line height for all right-side action names; short names retain natural intrinsic widths. Long names may shrink their font but not increase button height. `shared-app/app-runtime.js`: `fitHeroActionFonts(host)` measures real labels within the already reserved right-side Hero column and computes a CSS-only font scale, also when viewport changes; removes RC21 hard-coded per-character-length size rules. Class/Racial/Legacy action handlers, conditions, timings, and response behavior remain intact. **Caveat:** especially small/scaled screens produce extremely small fonts to satisfy the strict no-wrap + no-button-growth requirement; full name remains in the title attribute. Do not address this by unilaterally expanding the one-line buttons again.
2. `shared-ui/battlefield-ui.css`: scope a `20px` spacing margin above the `KEEP CARD` / `SHUFFLE & REDRAW` action row **only while** `gl-center-draw-replacement` is active; only the already drawn one card is visible. No changes to `commitDrawReplacementChoice`, source Hand, passive effects or counters.
3. `shared-app/db158-card-review.js`: iframe-only CSS overrides for `.review-card`, `.review-rows`, `.review-layout`, `.review-detail-column` prevent nested inherited overflow/overscroll rules intercepting wheel motion; tall Deck Builder-style review content can scroll under the same frame height. The complete 3-card HERO LINEAGES footer, Rank navigation, card information and battle review remain unchanged.

**QA & evidence:** `docs/qa/rc22/RC22_UI_QA.md` + machine output `RC22_UI_QA.json`. Actual Chromium in-memory source-loaded fixture at **1600×747, 1024×650, 820×580**: 3×5 representative Hero-side buttons were one-line, same height per viewport (CSS 20px), fit the available width, short button not enlarged; center Quick Reload single card and two buttons retained, card/button gap 38.9/24.0/25.4px; 3 Hero rank review views rendered and clickable at each size, mouse wheel physically scrolled overflowing review pages 80–171px at compact sizes, close button worked; zero page JS errors/zero missing assets in this harness. JS syntax checks PASS. Engine gameplay bundle unmodified. Real in-match Firefox and a complete Human-vs-AI to normal game-over remain unverified: **RELEASE CANDIDATE, NOT FINAL**.

**Next:** Designer review of RC22 UI in intended hosting/Firefox; verify extremely long ability labels on intended target resolutions, center card/bottom actions during actual Quick Reload and Rapid Chamber activation, and Rank II/III review mouse wheel/trackpad scroll in normal lobby. Continue original RC21 unclosed normal gameplay regression list, do not silently repair non-UI bugs. Archive packaging one enclosing directory, only `index.html` and `README.md` as root files; version/date-only filename.


---

## RC23 — 2026-11-05 — Authorized Ultimate/mana/counter repairs and AI tactical sequencing

**Baseline:** Immutable RC22 ZIP. **Authorization:** designer explicitly requested repair of all previously discussed RC22 gameplay defects plus new Poison Vial/Freeze Bomb/Warp Scroll AI improvements. **Scope:** app-only changes; OSA DEV45 authoritative and read-only; original v6.91.9 engine architecture retained. No Deck Builder/PvP/OSA edits. **Deliverable:** v1.0 RC23, not FINAL.

**Corrections:** Generic current printed-row `MANA COST +` surcharge (Blessing of Divinity Paladin 6 / Crusader 4; prior correct Double Casting 3/1, Invincible Stance 5/4, Execute 7/5 retained); Arbalest/Grand Arbalest Hero Information Draw This Turn indicator restored, physical draw counter uncapped with Dreadbolt printed base 140 damage cap preserved; Grand Ranger Divine Edge 2 physical random enemy Hand cards returned/shuffled on real HP damage; Flame Dragon’s Wrath attacks ALL OPPONENTS with per-hero Response; Venom Detonation attacks poisoned opponents only, per-duration damage and post-Response Poison removal without spurious SURE HIT. AI uses Poison Vial only with eligible same-Hero Physical Attack follow-up (existing planner verified), Freeze Bomb only when reachable same-turn Attack follow-up exists and standard Freeze blocks DODGE, and Warp Scroll strategically rather than on arbitrary first two slots; AI does not immediately undo its Warp at Reform.

**Source files:** `engine/shared-app/app.bundle.js`, `shared-app/app-runtime.js`. Release metadata: `README.md`, `docs/TAKEOVER_NOTE.md`, `docs/qa/rc23/*`. Does not mutate official card source, images, or Rulebook. Source-aware legacy Dreadbolt self-test corrected for current 140 printed base cap (was stale 120). Double Casting previously confirmed correct; no new rewrite.

**Focused QA:** `docs/qa/rc23/RC23_QA.json` 15/15 targeted engine/AI scenarios PASS, including 8 cost cases, 7+ real Draws, two-rank Flame/Venom, Divine Edge, freeze/no-DODGE and AI follow-ups; S0 target/lineage/Tribute existing hooks PASS; Chromium page exceptions 0, missing assets 0. `RC23_UI_COUNTER_QA.json` confirms Rank II/III counter UI and Rank I/no unrelated counter. `RC23_ULTIMATE_EFFECT_SMOKE.json` covers source smoke across the 15 Ultimate identities without claiming exhaustive normal UI uses. JS syntax PASS. Tests use constructed Chromium engine states, not a naturally completed match.

**Do-not-repeat mistakes:** Ultimate 140 damage cap applies to printed base damage, not physical Draw counter, and class passive bonus may make final greater than 140; do not hardcode obsolete v6.91.9 120 cap. `MANA COST +` must follow eligible current printed Hero row, not sibling Rank or stale S1. ALL OPPONENTS must exit Single Target branch. Venom keeps status visible through Response and is not inherently SURE HIT. Do not classify all Physical damage as Poison Vial-compatible Physical Attack Skill. AI Warp swap must not be reversed by generic Reposition in same turn.

**Open:** Real complete Human-vs-AI match to actual Win/Loss/Draw, full 15 Ultimate natural UI and Response PAY tests, field Firefox review, live long-turn AI behavior and any other pre-existing unresolved RC22 issues. **Status: RELEASE CANDIDATE, NOT FINAL.**


---

## RC24 — 2026-11-05 — Six-group keyword/status audit, Batches 01–02 only

**Authorization:** Designer asked to complete all seven keyword/status stages if possible, otherwise group card identities into batches of <=40, reporting proven defects and fixes. This work executes only Batches 01 (22) and 02 (38), NOT the remaining four groups. Source RC23 immutable; OSA DEV45 read-only.

**Confirmed defect and fix:** `engine/shared-app/app.bundle.js` `attackCannotBeDodged()` was union-tag-driven for `S0-WAR-018` Execute and wrongly reported SURE HIT for Gladiator Rank II. Modified the helper to test the current S0 Hero Class/Rank printed row. Gladiator Rank II lacks SURE HIT, Conqueror Rank III has it. Actual Execute PLAY/Response had already made the correct distinction, so do not misrepresent this as a previous undodgeable executed attack. No other gameplay code or OSA changed.

**QA:** Batch01 234 target legality + 78 direct commits = 312/312 PASS (22 identities, PLAYER/AI, source lanes and relevant ranks). Batch02 111/111 source/Response cases PASS (38 identities), previously 110/111 due to helper defect. JS syntax PASS; focused Chromium page errors 0; S0 target 13/13, lineage 6975/6975, Ultimate Tribute 30/30; existing four stale/unfinished S1 self-test hooks still fail and require separate triage. Full normal UI game remains unverified.

**Files:** gameplay `engine/shared-app/app.bundle.js` only; release `README.md`, `docs/TAKEOVER_NOTE.md` and `docs/qa/keyword_audit_2026-11-05/*`. Six-batch matrix and evidence limits in `RC24_AUDIT_REPORT.md`. Source exception watchlist: Soul Charged Shot is not printed unconditional RANGE although existing v6.91.9 special outside-AoA handling was intentionally preserved; no rule change without ruling.

**Next:** B03 REACTION/REFLECT/INVINCIBLE/CONDITION/BUFF (35), B04 HEAL/REVIVE/MANA BURN/MANA STEAL (22), B05 Status A (22), B06 Status B (22). Explicit QA and fixes only on proof. UI Legacy-style hover preview still backlog, not implemented. Preserve RC23 fixes and all earlier UI. Current release RC24 **RELEASE CANDIDATE, NOT FINAL**.


---

## Part 3 — 2026-11-06 — Keyword/Status audits continuation (STAGED ONLY; NO RC ZIP)

# Grandis Legacy — VS AI Season 0
## Keyword / Status Audit — Staged Progress, No Release

**Date:** 2026-11-06  
**Immutable release baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**State:** Local **STAGED** working tree derived from RC24. **NO RC25, no ZIP, no version bump**, no modification to original RC24 archive or official OSA.  
**Rule authority:** Season 0 Player Rulebook v2.9 and official OSA Season 0 DEV45; existing S1 engine behavior is not card/rule authority.

## Important workflow correction

The preceding RC24 package was released too early, after only the first two of the seven planned keyword/status audit phases. The designer explicitly rejected such incremental RC packaging. From this session onward, all approved fixes remain in the **staging working tree** until the remaining audit, targeted regression tests, and final packaging gate are complete. The release pointer remains RC24, which does **not** contain the staged fixes described below.

## Confirmed issues and repairs staged

| # | Area | Confirmed RC24 fault / reproduction | Staged correction | Evidence |
|---|---|---|---|---|
| STAGED-01 | `INVINCIBLE` + existing Poison | A Hero with active **Grand Finale** `S0-CLE-031` or Rank III **Absolute Defense** `S0-MAG-031` lost 10 HP to opponent Poison on their own End Phase despite being INVINCIBLE. Baseline controlled state HP80 became HP70; older Mage defenses were already covered. | Recognize both current S0 INVINCIBLE attachments in the Poison-tick immunity path; Absolute Defense immunity only for Arcane Vanguard Rank III. Duration still decreases normally. | `INVINCIBLE_BEFORE_QA.json`, `INVINCIBLE_AFTER_QA.json` |
| STAGED-02 | `INVINCIBLE` + new non-Attack Status | Opponent **Wildfire** could add Burn, and **Freeze Bomb**/direct status could apply Freeze to an INVINCIBLE Hero. Attack-path Status was already protected; non-Attack status resolver was missing source-opponent immunity check. | Reject *new opponent-inflicted* Status in the shared nonattack status helper when protected by INVINCIBLE, preserving allied/self-inflicted Status such as Ice Block's self Freeze. | Before: 3/8 focused cases passed; after: **8/8 PASS**. |
| STAGED-03 | `MANA STEAL` physical conservation / capacity | When owner had 11 Mana cards in Pool and 1 in Deck, and opponent had >=2 in Pool, `MANA STEAL 2` removed 2 opposing physical cards but gained only 1 own Mana card. At own Pool12/Deck0, effect-only **Steal** was incorrectly playable. | Cap the number *before opposing Mana selection* by opponent physical Pool, own physical Deck, and remaining own Pool capacity. On resolution, remove up to that count and draw **exactly the number removed** from the owner's **own** Mana Deck. Refuse effect-only Steal when no physical exchange possible; preserve damaging Mana Absorption as playable. | `MANA_STEAL_DEEP_QA.json` 6/6; `MANA_STEAL_BOTH_SIDES_QA.json` **16/16 PASS**, PLAYER and AI. |

**Source changed in staging:** `engine/shared-app/app.bundle.js` only. No OSA, Deck Builder, PvP, card definitions, artwork, or shipped RC24 ZIP was changed.

## Complete planned inventory and honest coverage

Original seven-stage matrix contained **126 distinct S0 card identities**. Several cards appear in more than one phase. The original Status phase listed 44 identities, but **six were false positives**: `S0-MAG-020`, `022`, `023`, `024`, `026`, and `028` mention **MANA BURN**, *not the Burn Status*. They remain in the Mana Burn phase, leaving **38 genuine Status identities**. This is a correction to the **audit inventory**, not a mutation of official OSA card data.

| Stage | Scope | Distinct identities | Current verification level |
|---|---|---:|---|
| 1 | MELEE, RANGE, ALL OPPONENTS | 22 | Previously audited and retested on staged engine: **312/312 focused** target/commit checks. Other complex gameplay interactions still possible. |
| 2 | PIERCING, SURE HIT, BLOCK, DODGE | 38 | Previously audited and retested on staged engine: **111/111 focused** checks. |
| 3 | REACTION, REFLECT, INVINCIBLE | 13 | Source/handler survey and selected Response checks, plus INVINCIBLE repairs. No claim all physical response interactions exhaustively tested. |
| 4 | CONDITION, BUFF | 23 | Source/handler survey and selected legal-target/condition/expiry checks. No claim every atomic CONDITION cost/commit path is verified. |
| 5 | HEAL, REVIVE | 14 | Source/handler inspection, **6/6 selected helper assertions** including Bleed, full HP and HP cap. Full Revive-from-Legacy flows remain unverified by this round. |
| 6 | MANA BURN, MANA STEAL | 8 | Source/handler inspection; MANA BURN **20/20** source-branch/hit gating/aggregation checks; MANA STEAL **16/16** bilateral transfer/capacity checks. Normal UI payment and nested Response remain open. |
| 7 | Bleed, Burn, Freeze, Poison, Sleep, Stun | **38 actual** (was 44) | 59 printed Class branches inspected; 51 mention inflicted Status; three triggered effects (Poison Vial, Ice Block, Fire Wall) separately exercised **10/10 PASS** after correct passive handling. Comprehensive End Phase, immunity and ability interaction coverage remains open. |

Because stages overlap, stage-card counts cannot be added to obtain unique identities. The combined stage-3–7 base survey contains 87 distinct identities and **73/73 targeted assertions**; six audit-matrix warning entries were the false positives described above. Additional REACTION/CONDITION/BUFF focused QA: **54/54 PASS**.

**Test design correction, not a gameplay fault:** An initial Fire Wall fixture expected Burn duration 2 from Elementalist, but the same Hero's printed **Elemental Mastery** adds +1 Burn duration, so actual 3 was correct. Adjusted the fixture; do not change gameplay to force 2.

**Test limits:** Focused browser-executed engine probes use controlled states rather than one naturally completed Human-vs-AI match. JavaScript syntax PASS; reported Chromium page exceptions 0 in these scenarios. The older S1 historical regression hooks still contain some stale expectations and are not blanket S0 failures. The full normal game through Win/Loss/Draw, all combinations of 126 card identities and all nested Response/Attachment/AI tactical behaviors are **not proven**.

## Still open before a new release

1. Finish **card-by-card natural PLAY → payment/CONDITION → Response → resolution** verification, especially Status/Heal/Revive and high-interaction cases. Keep batches **<=40 identities**; after inventory cleanup, split 38 Status cards into two batches of **19**.
2. Independently reproduce/triage historical S1 test failures against S0 (without changing engine based solely on stale fixture expectations).
3. Confirm both player and AI choices through live browser UI, particularly blind Mana selection and multi-target Response; include complete match to terminal Win/Loss/Draw and Firefox UI pass.
4. Existing UI backlog: Legacy-style hover enlarged preview in Class Ability card selection. **Not implemented** in this audit.
5. Preserve source authority (OSA DEV45 read-only); resolve pre-existing Soul Charged Shot RANGE/lineage watch item with designer if needed.
6. Only after the full acceptance gate: update version and build **one** consolidated ZIP with matching `docs/TAKEOVER_NOTE.md`, clean folder structure and integrity check.

### Source / evidence artifacts

Local staged application tree: `/mnt/data/keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
QA proof files: `docs/qa/keyword_audit_staged_2026-11-06/` inside the staged tree.  
Standalone source diff against immutable RC24: `/mnt/data/keyword_audit/STAGED_KEYWORD_BUGFIX.patch`.



---

# Grandis Legacy VS AI Season 0 — Keyword/Status Audit: Follow-up (Staging Only)

**Date:** 2026-11-06  
**Immutable packaged baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Current working copy:** `/mnt/data/keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Release policy:** **NO new RC, no ZIP, no version bump.** The RC24 file is unchanged. OSA Season 0 DEV45 remains read-only. This builds on the previously staged three INVINCIBLE/MANA STEAL repairs; those were not shipped in RC24.

## Designer ruling: Soul Charged Shot (S0-ARC-018)

Designer confirmed: **Do not add RANGE keyword to Soul Charged Shot.** The ability to target outside normal AoA comes from the **Marksman Class Ability — Sharpshooter** (and is retained at Grand Ranger through **Dead Eye**), because Soul Charged Shot is a **Physical Attack**. The conditional text on Soul Charged Shot doubles damage when the Attack actually occurs as a Range Attack; the condition is not an independent grant of RANGE.

**Staged source correction:** In `engine/shared-app/app.bundle.js` > `legalTargetLanesFor()`, removed the redundant unconditional `isChargedShotCard(c)` targeting bypass. Range extension now depends on `attackHasRangeForSource(c,sourceHero)`, derived from the current S0 Hero Class Ability (or a printed RANGE keyword). No printed card, cost, passive definition or S0 OSA was changed.

**Verified in Chromium:** 12/12 checks PASS: Soul Charged Shot has no intrinsic RANGE; Archer Rank I does not acquire the passive / cannot use the Rank II card; Marksman Rank II and Grand Ranger Rank III each gain effective RANGE from their Class Ability, can target RIGHT from LEFT, and get 2× Attack damage outside normal AoA relative to an otherwise comparable in-AoA target. Stage-1 312/312 and Stage-2 111/111 focused regressions still PASS after this source change. **This is a targeting source/contract cleanup, not evidence of a previously user-observed incorrect hit.**

## Deep audit: HEAL / REVIVE (14 identities)

New controlled, browser-executed *actual card commit*, physical Mana PAY and resolution checks for **13 of the 14** HEAL/REVIVE identities (including all printed class branches) on both PLAYER and AI: **128/128 PASS**. Checks cover pre-play/commit legality, actual Mana card consumption, HP effects and/or REVIVE HP + Exhaust state. Tested Holy Blast and Holy Slash damage-triggered healing, direct healing, all-Hero healing, item healing and Phoenix Feather, Priest/Saint Resurrection, and Final Grit. **Blooming Harmony** uses its physical Lun + Vae CONDITION precommit (not a fabricated free cast). Final Grit fixtures use coherent Gladiator lineage + Legacy snapshots.

The 14th, **Blessing of Divinity (S0-CLE-025)**, is a Defense/Response Ultimate and cannot be judged by a normal PLAY route. Separate actual PLAYER Response → payment → resolve checks for Paladin and Crusader: **10/10 PASS**. Paladin consumes 6 Mana and gives INVINCIBLE to allies without the extra heal; Crusader consumes 4 and heals allies by 20 as printed. The constructed AI-side direct Response fixture did not complete its manual payment flow under the human-vs-human harness; **AI-side full Response PAY is NOT claimed verified by this round**. Prior RC23/RC24 AI tests are not a substitute for this new deep test.

Early versions of the new HEAL/REVIVE QA fixture generated apparent failures: missing required Bard notes and mismatched Gladiator Legacy lineage. Correcting the *fixtures*, not the engine, yielded 128/128. These were **not gameplay defects**. Separate Source Class healing modifiers and Saint cleanse-choice UI are not comprehensively tested by the new 128 cases.

## Status phase: two batches, 19 identities each

The corrected official-status inventory contains **38 distinct identities**. Direct connected-attack STATUS handler checks were executed in two fixed 19-identity batches, per the designer's <=40-card limit:

| Status batch | Identities in inventory | Explicit connected `Inflict` branches, across PLAYER/AI (including DODGE negative tests) | Result |
|---|---:|---:|---|
| A | 19 | 84 assertions; 8 non-attack / reference-only printed branches excluded from *this route* | **84/84 PASS** |
| B | 19 | 92 assertions; 7 non-attack / reference-only printed branches excluded from *this route* | **92/92 PASS** |

The test asserts that a connected Attack applies its printed Status, while a Dodged Attack does not. For Ultimates, the fixture uses the **specific owning Hero progression**, not simply the first Hero with the same Class name. The initial 16 ownership failures were *invalid test fixtures*, fixed before reporting; no engine changes were made because of them.

**Coverage limitation:** The 15 excluded *branch cases* include non-Attack effects (Freeze Bomb, Ice Block, Wildfire, Dazed, Poison Vial, etc.) and cards that mention a status as a prerequisite/multiplier rather than inflicting it (e.g., Permafrost, Venom Sovereign, Venom Detonation). These need their appropriate distinct routes. Prior special-path QA already covered Poison Vial, Fire Wall and Ice Block 10/10 in selected cases; that is not equivalent to full normal-match UI coverage. Status duration, expiry, cleansing, nested Response and invincibility cross-product tests remain open.

Additional staged repeat: Stage 3–4 source/handler focused checks **54/54 PASS**; no page JavaScript errors in the new Chromium fixtures.

## Confirmed defects in this staging cycle

New user-informed **source-of-RANGE permission correction** above: fixed in staging. **No additional card-effect gameplay defect was confirmed in the new HEAL/REVIVE or connected-hit Status probes.** Previously confirmed INVINCIBLE (2 groups) and MANA STEAL (1 group) defects and their staged fixes remain as documented in the prior `AUDIT_STAGED_PROGRESS.md`.

## What still blocks a new RC

1. Complete real/choice UI testing of 14th Heal/Revive Ultimate on AI Response payment, and targeted stronger validation for printed exact Heal values and Saint follow-up cleanse.
2. Test other Status routes (not `Inflict` from connected Attack), entire CONDITION discard-choice + atomic PAY flow, REACTION nesting, lasting BUFF expiration, and full Revive through legitimate Hero defeat/Legacy transitions. Keep batches <=40 identities.
3. Inspect AI strategic behavior and complete a normal Human vs AI match through actual Win/Loss/Draw (not Surrender); Firefox browser validation.
4. Preserve the separate approved UI backlog **Legacy-style hover enlarged preview on Class Ability card choice**; it has **not** been implemented.
5. After all audit/QA acceptance criteria, build **one** consolidated distribution ZIP/version. Do not package RC25 or bump the version prematurely.

### Machine-readable focused evidence

Staged app `docs/qa/keyword_audit_staged_2026-11-06/` now also includes `MARKSMAN_PASSIVE_QA.json`, `HEAL_REVIVE_ACTUAL_COMMIT_QA.json`, `BLESSING_RESPONSE_QA.json`, `STATUS_CONNECTED_HIT_BATCH_A_QA.json`, `STATUS_CONNECTED_HIT_BATCH_B_QA.json`. The test probes/runners are retained in `/mnt/data/keyword_audit/` outside the release package for reproducibility. The cumulative source diff relative to original RC24 is `STAGED_KEYWORD_BUGFIX.patch` (no new ZIP).

---

## Keyword/Status Seven-Stage Audit — Remaining-Path Follow-up 02, 2026-11-06 (STAGING ONLY)

**Source/version:** Continue from immutable RC24 ZIP and existing staged fixes. Official OSA DEV45 read-only; Rulebook v2.9. **Designer packaging rule:** do not generate any new RC ZIP or increment version until entire audit and integrated acceptance are finished. No gameplay source changes in this follow-up.

**Executed additional controlled Chromium fixtures:** CONDITION physical payment/return/cancel, non-Attack Status actual card commits through Reaction PASS, five authoritative BUFF Attachment expiration paths for both sides — 94/94; Flashpowder Reaction/counter chain and real coherent Warrior Defeat→Legacy→Phoenix Feather Revive — 20/20; AI-side Blessing of Divinity response payment (Paladin 6, Crusader 4) plus existing PLAYER checks — 20/20; Saint Holy Rejuvenation cleanse selection and AI auto-choice — 16/16. 150/150 total assertions; 140 additional after excluding 10 repeated earlier PLAYER Blessing checks. JS syntax PASS; page errors 0.

**Important limits:** All are source-backed controlled Chromium application-engine scenarios, not fully natural browser mouse interaction or a complete match. Nested Response only tested with Flashpowder; 13-condition-card family not exhausted; BUFF card-specific modifiers need full turn play; AI tactical decisions and other Revives remain open. Tests initially appeared to fail when they omitted Reaction PASS, used Rank I Mage for Elementalist-only Wildfire, counted attachment creation checkpoint, and assumed human PLAYER should auto-cleanse; those were invalid fixtures corrected before reporting. Do not modify game source to address such fixture failures.

**Bug/fix ledger:** New confirmed gameplay defects 0; new gameplay code changes 0. Earlier staged INVINCIBLE, MANA STEAL, Soul Charged Shot/Marksman source corrections preserved unmodified. No OSA changes; no RC/ZIP generated. UI hover-preview request remains **backlog/not implemented**.

**Evidence:** `docs/qa/keyword_audit_staged_2026-11-06/REMAINING_PATHS_FOLLOWUP_02.md` and four accompanying QA JSON files. Runnable probe scripts remain under `/mnt/data/keyword_audit/` outside release. Continue full seven-stage coverage and integrated full natural match before final release packaging.


---

# Grandis Legacy — VS AI Season 0
## Seven-Stage Keyword/Status Audit — Follow-up 03 (STAGING, no release)

**Date:** 2026-11-06  
**Immutable distribution:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Working source:** `/mnt/data/keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Authority:** OSA Season 0 DEV45 official printed card text and Player Rulebook v2.9; no OSA edits.  
**Packaging:** NO RC25, NO new ZIP, NO version increment.

## Confirmed NEW defect: Escape Arrow mandatory CONDITION (STAGED-04)

**Card:** `S0-ARC-003` — Escape Arrow (0 Mana, Defense).  
**Printed S0 effect:** `CONDITION: Discard 1 card from your hand. DODGE incoming Physical or Magical damage.`

**Before patch (real staged engine, controlled Chromium Response window):** With Escape Arrow as the *only* card in the defender's Hand, the card still appeared as an eligible Response and could proceed to Dodge without discarding an additional Hand card. The existing `responseExtraDiscardCount(rc)` included a one-off physical Hand-discard binding for Spectral Grappling Hook (`S0-ITM-012`), but not Escape Arrow. The OSA adapter did not otherwise populate the engine's additional response payment count for Escape Arrow. This is an app payment/eligibility integration bug, not a reason to modify the official card text.

**Authorized standing-work staged repair:** In `engine/shared-app/app.bundle.js`, `responseExtraDiscardCount(rc)` now returns one mandatory extra Hand discard for both `S0-ARC-003` Escape Arrow and the previously handled `S0-ITM-012` Spectral Grappling Hook. The existing response payment workflow performs the actual selection, physical discard, and Dodge; no card values, keyword text, or UI layout changed.

**After patch, tested in actual engine Response/PAY path:**
- Escape Arrow cannot be offered as Response without a different Hand card to pay its CONDITION.
- With an extra Hand card, choosing Escape Arrow enters the existing **Response payment choice** instead of bypassing payment.
- The Hand card is physically moved to Discard at PAY; Escape Arrow Dodges the incoming Attack. Its printed Mana cost remains zero.
- Spectral Grappling Hook's own discard-and-Dodge path still works (regression).

Pre-fix evidence: `FOLLOWUP03B_BEFORE_QA.json` (two failing expected assertions for Escape Arrow); post-fix: `FOLLOWUP03B_QA.json` (**25/25 PASS**).

## Broader focused checks in this session

| Scope | Checks | Result | Evidence |
|---|---|---:|---|
| REACTION: Tactical Adaptation against Event, Intercept against Physical Attack, Defensive Formation offered for Area Attack and class-family condition | 31 | **31/31 PASS** | `FOLLOWUP03_QA.json` |
| Response CONDITION: Escape Arrow and Spectral Grappling Hook Hand costs, Swift Movement Lun from Discard, cancel-before-PAY rollback, actual Dodge | 25 | **25/25 PASS after STAGED-04** | `FOLLOWUP03B_QA.json` |
| Genuine Defeat → mandatory Legacy selection → Revive using Resurrection (Priest / Saint) or Final Grit (Gladiator), with HP, Mana, exhaustion, cleared Poison and Legacy card return | 24 | **24/24 PASS** | `FOLLOWUP03C_QA.json` |
| Defensive Formation 20/40 area damage reduction, distinct vs repeated base-Class compositions, actual Response payment and damage through area-sequence continuation | 10 | **10/10 PASS** | `FOLLOWUP03D_QA.json` |
| Existing CONDITION/BUFF and other focused routes rerun | 94 + 20 + 10 | **124/124 PASS** | existing `REMAINING_AUDIT_QA.json`, `REACTION_REVIVE_QA.json`, `STATUS_SPECIAL_QA.json` |

**90/90 current new-probe assertions PASS.** JavaScript `node --check` PASS; Chromium page errors **0** in all four new probes. The 124 other assertions are reruns, **not 124 newly created scenarios**. Multiple assertions may examine the same card/transaction: these are assertion counts, not 90 unique cards.

### Test-design caveats, not bugs

- Some early exploratory probes tried manually committing an `AI` Response while forcing human-vs-human state. The VS AI UI ownership gate rejected that synthetic manual interaction. Final payable Response cases use actual **PLAYER defense against AI attack**; AI cases in these probes are only options/legality where appropriate. Separate prior AI-side Blessing of Divinity and Flashpowder tests remain their own evidence.
- A first Defeat→Legacy fixture expected an immediate Legacy transition for a human-owned Hero, but the correct rule/UI requires a **mandatory Legacy choice**. The final fixture explicitly selects and confirms that choice. Final Grit also requires a coherent defeated **Gladiator/Conqueror**, not merely a rank-I Warrior. No code was changed for either fixture issue.
- Area attacks can be represented as **sequential multi-target windows** (`multi_sequence`), not necessarily one `affected_lanes` array. The corrected Defensive Formation fixture checks the actual area sequence, Response payment, and each lane's HP result; no engine alteration was necessary.

## Cumulative staged issue ledger

1. INVINCIBLE: existing opponent Poison tick incorrectly reduced HP — fixed in staging.
2. INVINCIBLE: opponent non-Attack effects could inflict new Status — fixed in staging.
3. MANA STEAL: opposing Mana removal could exceed receiver's physical capacity — fixed in staging.
4. Soul Charged Shot: removed redundant intrinsic targeting exception; RANGE permission comes from Marksman / Grand Ranger passive — corrected in staging per designer ruling.
5. **Escape Arrow: mandatory one-card Hand discard on Defense Response bypassed — fixed in this session (STAGED-04).**

All staging-only changes are in `engine/shared-app/app.bundle.js`. Cumulative diff versus immutable RC24: `/mnt/data/keyword_audit/STAGED_KEYWORD_BUGFIX.patch`.

## Still open before the requested consolidated release

- Complete remaining card-specific BUFF consequences during natural turn progression, remaining CONDITION and REACTION cross-products (including more than two Response levels and Ultimate exceptions), broader Status + End Phase interactions and more human-facing mandatory modal paths.
- Prove AI decisions in ordinary games rather than just controlled commits. Perform a **normal human-vs-AI browser match to real Win/Loss/Draw** (not Surrender) and Firefox verification.
- Complete UI backlog: **Legacy-style card hover enlargement for Class Ability card selections** (not yet implemented).
- Keep tests in batches of **no more than 40 unique card identities**. Do **not** create a new RC or distribution ZIP until audits, integration regression and acceptance are complete.

**Evidence location:** All four current QA JSON files plus before-fix evidence are stored under staged `docs/qa/keyword_audit_staged_2026-11-06/`. Probe source and runners reside under `/mnt/data/keyword_audit/` outside the distributable app folder. `docs/TAKEOVER_NOTE.md` receives the same decision and bug/fix accounting.


---

# Grandis Legacy — VS AI Season 0 | 7-Stage Keyword/Status Audit — Follow-up 04

**Date:** 2026-11-06  
**Immutable release baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Existing staged working source:** `keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Authority:** OSA Season 0 DEV45 official card print + Player Rulebook v2.9 + designer rulings.  
**This session:** Audit-only. **No gameplay code, official OSA, RC archive, ZIP, or version bump was made.** Previously staged fixes are preserved.

## Scope: BUFF consequences and Status across owner End / next turn

Ran a NEW source-backed Chromium engine test fixture against the actual staged `app.bundle.js`. It performs normal `commitPlayedCard()` payment/activation for the noted buffs, then invokes the same authoritative `resolveEndPhaseCleanupForSide()` and `removeStartOfTurnTargetPreventionForSide()` handlers used by the application. Attack damage uses `currentClassDamage()`; status damage uses real `applyResolvedAttackDamage()` and End Phase status cleanup. PLAYER and AI are each exercised in a coherent controlled state.

| Card / mechanic | Printed S0 behavior and checked consequence | Finding |
|---|---|---|
| `S0-CLE-004` Blessing of Might | +20 Physical Attack to chosen Hero this turn, not Magical; attachment held until owner's End, then removed and discarded | PASS both sides |
| `S0-CLE-005` Blessing of Wisdom | +20 Magical Attack this turn, not Physical; expires and goes to Discard at owner End | PASS both sides |
| `S0-CLE-018` Wings of Valor | Priest +20, Saint +40 Attack damage to **all allied Heroes** for Physical and Magical Attack; effect ends at owner End | PASS both sides, both ranks |
| `S0-MAG-022` Aether Infusion | Spell Blade turns own Physical Attack into Magical through **end of next turn**, including surviving first owner End then expiring at second End | PASS both sides; MANA BURN effect beyond this typing/duration was tested separately in earlier probes |
| `S0-EVT-005` Last Resort | Requires only one active Hero; double Attack damage for **two turns**, including next owner's turn, then restores normal damage | PASS both sides; opponent Reaction window explicitly passed before measuring BUFF |
| `S0-MAG-030` Invincible Stance | Prevent existing Poison damage while INVINCIBLE, but advance Poison duration; protection expires at owner Draw; remaining Poison damages next owner End | PASS both sides, staged protection fix preserved |
| Poison, Burn, Sleep | Poison ticks exactly 10 each owner End then duration decreases; Burn does not tick at End, adds 10 only when Attack actually deals damage; Sleep expires when duration reaches 0; Burn duration reapplication caps at 6 | PASS both sides |
| Burn + BLOCK | 20 Physical Attack with Burn: unblocked 30 HP damage; fully BLOCKed 20 Attack 0 HP damage and 0 Burn extra; Burn duration not consumed by Attack | PASS both sides |

### QA accounting

- **100/100 focused assertions PASS** in Chromium for this set, **0 page JS errors**, no fatal. This is an assertion count, **not** 100 distinct cards or 100 full games.
- **312/312** Stage 1 MELEE/RANGE/ALL OPPONENTS focused regression assertions PASS on current staged source.
- **111/111** Stage 2 PIERCING/SURE HIT/BLOCK/DODGE focused regression assertions PASS.
- `node --check` on the staged engine bundle PASS.
- This run exercises **9 identifiable Main Deck card IDs** (`S0-CLE-004`, `S0-CLE-005`, `S0-CLE-018`, `S0-MAG-022`, `S0-EVT-005`, `S0-MAG-030`, `S0-WAR-001`, `S0-MAG-003`, `S0-THF-001`), so it stays under the designer's maximum 40 cards per group.

### Invalid early QA assumptions — **not game bugs**

First run showed six apparent failures. The fixture initially reapplied Burn *after* its existing duration had expired (expected 6 instead of correct 4), and manually registered INVINCIBLE during End Phase then tried to expire it without moving the fixture's phase to the next Draw. Runtime's creation-checkpoint guard correctly refused that artificial early expiry. The fixture was corrected to reapply Burn while duration remained, attach during Deploy, advance to End, then next Draw. The corrected fixture passed 66/66 before extension.

Second extended run showed six apparent Last Resort failures: the fixture measured damage before the normal Event opponent REACTION window had been passed. After resolving the proper `incoming_card` Response window using PASS, the effect activated and all **100/100** final assertions passed. **No engine change was justified by these invalid fixture states.**

### Bug/fix ledger

**New confirmed gameplay bug in follow-up 04: 0. New code fixes in follow-up 04: 0.** Existing five staged issues remain:
1. Opponent Poison damage ignored INVINCIBLE — fixed in staging.
2. Opponent non-Attack Status bypassed INVINCIBLE — fixed in staging.
3. MANA STEAL exceeded own physical receiving capacity — fixed in staging.
4. Soul Charged Shot no longer carries a redundant unconditional RANGE bypass; Marksman/Grand Ranger passive supplies RANGE — corrected in staging per designer.
5. Escape Arrow mandatory Hand-discard CONDITION was bypassed — fixed in staging.

### Remaining acceptance and audit work

- More card-specific BUFF cross-products under real UI action sequencing (including ability follow-up choices, expired benefits and multi-attachment interactions).
- CONDITION: finish all affected card identities and real mouse-driven modal selection/cancel/payment; REACTION: 3+ nested Responses, Ultimate exceptions and payment both sides.
- Status: opponent non-Attack status, mixed Status interactions and real turn/UI validation beyond these selected fixtures; test ordinary match AI decisions rather than constructed choices.
- Complete at least one **normal** human vs AI browser game to real Win/Loss/Draw without Surrender, then Firefox testing.
- Pending UI backlog: **Legacy-style enlarged hover preview** for Class Ability card-selection overlays — not yet implemented.
- **No new RC or distributable ZIP** until the designer-requested full audit, fixes, integration QA and consolidated packaging have been completed.

**Evidence:** `docs/qa/keyword_audit_staged_2026-11-06/FOLLOWUP04B_BUFF_STATUS_QA.json`. Reproducible test source `/mnt/data/keyword_audit/followup04_buff_status_probe.js` and runner `followup04b_runner.py` are outside the app's distributable root.


---

# Grandis Legacy — VS AI Season 0 | Keyword/Status Audit — Follow-up 05

**Audit date:** 2026-11-06  
**Immutable distributable baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Tested cumulative staging:** `keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Source authority:** OSA Season 0 DEV45 (current DEV44 consumer exports), Player Rulebook v2.9, authorized designer rulings.  
**Action this session:** Investigated additional previously-open REACTION and CONDITION/Status/Ultimate cases; **no new application or OSA code changes, no version increment, no release ZIP**.

## New direct Chromium test coverage (constructed legal states; not normal-match acceptance)

| Test set | Assertions | Detailed tested behavior | Outcome |
|---|---:|---|---|
| Four-depth REACTION counter chains | **109/109 PASS** | Freeze Bomb → 1, 2, 3 or 4 sequential Flashpowder Bomb counters, testing both initial attacker sides; actual response payment/discard, continuation order, original Freeze applying iff parity permits it, 12-physical-Mana conservation, and window closure. Also tests paid Tactical Adaptation counter against non-Ultimate Blessing of Might when PLAYER is responder. | No reproduced defect |
| CONDITION / frozen target | **80/80 PASS** | Permafrost denied without Freeze, zero Mana loss on denial, permitted with Freeze, Damage by Elementalist and Elemental Lord (+10 passive Magical Attack bonus at Rank III), and DODGE unavailable against Frozen Hero. Also source-backed atomic physical Return/PAY for Midnight Lullaby, Resonance Burst, Blessing of Accuracy, and Grand Finale on both sides; required notes absent → denied; committed notes removed from Discard; counted Mana costs; targeted Sleep and Grand Finale INVINCIBLE; Response closures. | No reproduced defect |
| Ultimate exception / defense / real-AI reactive cancel | **22/22 PASS** | Confirm 15 unique Ultimate identities; Double Casting (Ultimate Tactical) cannot be canceled by Tactical Adaptation; Absolute Defense (Arcane Warrior/Vanguard) offered as Defense, 5-Mana PAY, cannot be countered by Binding Light; real VS AI-mode AI Tactical Adaptation successfully counters ordinary non-Ultimate Blessing of Might. | No reproduced defect |
| **Combined new** | **211/211 PASS** | Counts are individual test assertions **not** 211 distinct cards or full playthroughs. Affected source-card identity count is below 40. | No new bug |

**Technical QA:** All three probes ran in headless Chromium loading the actual staged engine (inline-loaded index and asset routes). Zero reported JavaScript page errors. `node --check` on staged `app.bundle.js` PASS. Test evidence is saved as the three `FOLLOWUP05_*_QA.json` files under this folder. Test scripts/runners live outside the distributable app folder: `/mnt/data/keyword_audit/followup05_*_probe.js` and matching `*_runner.py`.

### Invalid initial fixture assumptions, explicitly corrected before reporting

- **Elemental Lord Permafrost:** Expected 100 from the card's own Rank III printed damage, but actual **110** incorporates Elemental Sovereignty's separate **+10 Magical Attack** passive in canonical S0 Hero source. After correcting expected total to 110, both PLAYER/AI scenarios PASS. This is not a game bug.
- **Artificial PvP-mode AI responder:** An initial diagnostic forced the AI side into `pvpHumanVsHuman=true` and manually tried to pay a 3-Mana Tactical Adaptation with human-style controls; this is not a valid VS AI-mode AI payment scenario. The test was replaced by (a) PLAYER-as-responder click/payment-engine test in synthetic PvP mode, and (b) a separate `pvpHumanVsHuman=false` **real AI-side** committed Tactical Adaptation test, which PASSED. No VS AI bug is inferred from the invalid mode fixture.

## Cumulative fix ledger, unchanged from previous staged sessions

1. Opponent Poison ticks did not respect active INVINCIBLE — staged fix present.
2. Opponent non-Attack Item/Tactical Status bypassed INVINCIBLE — staged fix present.
3. MANA STEAL removed opponent Mana beyond the source owner's physically available receiving capacity — staged fix present.
4. Soul Charged Shot previously used an unnecessary intrinsic RANGE exception rather than Marksman/Grand Ranger passive — staged correction present.
5. Escape Arrow mandatory discard-1-from-Hand CONDITION on Response was bypassed — staged fix present.

**New confirmed bugs this session: 0. New fixes this session: 0.** No previously released ZIP changed.

## Acceptance still open

- Full **13 CONDITION** identities through **normal mouse UI** including CANCEL, exact Mana payment, delayed effects, shuffle, response interruption. Current test covers a targeted subset, not blanket 13/13 end-to-end.
- Three-plus level countering has now been tested in an isolated constructed response state; it is not evidence for 3+ nested Responses in a natural Human-vs-AI match, or for all possible Reaction Card families/targeting.
- Extend cross-Keyword Status, attached BUFF, AI decision / card-use sequencing, multi-target Response and Hero/Legacy edge cases with legal normal state progression.
- At least one full, normal Human-vs-AI match to Win/Loss/Draw screen **without Surrender**, and Firefox / real-hosted/UI scroll/responsiveness checks.
- Pending UI backlog: Class Ability selection card enlargement on hover, matching existing Legacy-style popup.

**Release policy:** Keep RC24 as the last distributable. Preserve staged changes and tests, complete audit/combined QA first; package a single new RC only after the designer-requested acceptance work is complete.

---

# Keyword / Status Audit — Follow-up 06 (2026-11-06, cumulative staging only)

**Designer request:** Continue unfinished seven-stage audit; no version increment or release until audit/fixes/combined QA complete. Source baseline remains immutable VS AI Season 0 RC24, OSA S0 DEV45 read-only. Previous five approved staged engine corrections preserved.

**New confirmed external UI bug:** In real RC24 external Battlefield `.gl-vsai-choice-overlay`, CONDITION choices displayed only CONFIRM; the existing engine `cancelPendingAction()` was functional but its old Cancel control could not be reached through the external modal. Thus Bard/Maestro discard-note return and God's Blessing mandatory Hand-cost choices appeared to have no way to cancel **before** committing payment. Reproduced in Chromium from legal constructed states for `S0-ARC-030` and `S0-CLE-013`. This is an app presentation gap, not an OSA discrepancy or Mana mechanics change.

**Scoped fix in staging:** `shared-app/app-runtime.js` adds and conditionally shows one `CANCEL` button for exactly three `card_search_choice.resolve_to` precommit contracts: `s0_condition_precommit`, `gods_blessing_precommit`, `s0_response_condition_precommit`. It calls existing `GL_GAME_ENGINE.intent('cancelPendingAction')` through `intent`, restoring original no-cost rollback / Swift Movement Response. It is hidden for mandatory or postcommit modal choices. No other engine, official card data, Deck Builder, OSA, or application changed in this session.

**New evidence:** 7 source-backed choice-condition identities (Midnight Lullaby, Crimson Crescendo, Resonance Burst, Blessing of Accuracy, Blooming Harmony, Grand Finale, God's Blessing) were subjected to actual Chromium mouse-click UI precommit CANCEL and reselect → CONFIRM → PAY; **42/42 assertions PASS** at desktop, plus **12/12** mobile assertions for two cards. Swift Movement actual choice/CANCEL/PAY and Escape Arrow/Spectral Grappling Hook Hand DISCARDS were clicked in actual external UI; all three response sequences completed without browser JS errors. X Cross Slash/Permafrost/Last Resort non-modal precondition and physical Mana/effect tests **14/14 PASS**. All 13 CONDITION card identities have at least one direct check, **not** all 13 natural-match click paths. Existing staged regression reruns: CONDITION **80/80**, nested REACTION **109/109**, Ultimate/Response **22/22** PASS; `node --check` PASS; browser page errors 0. Complete report and evidence under `docs/qa/keyword_audit_staged_2026-11-06/FOLLOWUP06_*`. Runner/fixtures remain out of distributable root.

**Current cumulative staged-fix ledger (six groups):** INVINCIBLE vs existing opponent Poison, INVINCIBLE vs incoming opponent non-Attack Status, physical MANA STEAL recipient capacity, Soul Charged Shot passive RANGE source, Escape Arrow discard-1 Response CONDITION, new precommit CONDITION modal CANCEL.

**Open acceptance:** At least one full **natural Human-vs-AI match to terminal result without Surrender**, 3 nonmodal CONDITION source/target click paths through normal lobby, extended real-turn multi-Status/BUFF/Response and AI decisions, hosted/Firefox QA; Legacy-style Ability selection card hover remains UI backlog. Do not call this FINAL or generate RC25 yet.


---

## Keyword / Status Audit — Follow-up 07 (2026-11-06, staging only)

**Baseline:** Unchanged RC24 distributable; six earlier staged fixes retained. **No app engine/UI/data edits, no RC/ZIP.**

**New checks:** 66/66 focused Chromium multi-target/Response/Legacy assertions and 20/20 AI tactical sequencing assertions PASS. Glacial Spike and Poison Mist each opened individual defensive decisions; Mirror Image DODGE prevented Status on its target but did not cancel other targets; one Legacy replacement paused and then resumed Holy Blast Area sequence. AI used Blessing of Might → Slash (30+20=50), skipped a BUFF without Physical follow-up, and automatically completed Freeze Bomb → Slash against a Frozen target, leaving Mirror Image unused. Prior CONDITION 80/80 and nested REACTION 109/109 regression PASS; `node --check` and Chromium errors 0. Assertions are not full match coverage.

**Corrected test-design mistakes:** Manual AI-side Response in forced PvP mode is invalid for local UI; one Wild Assault synthetic owner fixture was illegal and excluded; Slash printed base damage is 30 (not 20); the live AI director can already complete a planned Slash before an isolated test explicitly re-invokes it. None was called a new game defect.

**Remaining:** Full human-vs-AI normal UI game to terminal Win/Loss/Draw without Surrender, wider multi-target defeat and REDIRECT/NEGATE/REFLECT interactions, AI decisions amid changing resources/plans, finite Mana and BUFF+Status turn interactions, hosted/Firefox UX. Legacy-style hover card enlargement is still UI backlog and not implemented. See `docs/qa/keyword_audit_staged_2026-11-06/REMAINING_PATHS_FOLLOWUP_07.md` and two machine-readable QA records. No release package until integrated QA complete.


---

## Keyword / Status Audit — Follow-up 08 (2026-11-06, cumulative staging only)

New confirmed RC24/pre-fix defect: if a final Hero dies from an incoming Attack and its Absolute Defense REFLECT also defeats the opponent final Hero, the engine prematurely declared a one-sided victory rather than DRAW. Original RC24 targeted repro: 36/37 with the Draw failure; post-patch staged reproduction and single-sided regression: 37/37 PASS. Fix in `engine/shared-app/app.bundle.js`: defer last-Hero adjudication during `incoming_attack` Response resolution, preserve live Response until REFLECT, and explicitly recognize both sides defeated at exchange end. No OSA/data changes.

New checks: AI plan invalidation 12/12 PASS; full-deck rapid, test-harness-guided engine match reached AI-win terminal on round 21 with 12-card physical Mana invariant, 2 Legacy selections and 19 hand-limit cleanups, but it is **NOT** a natural mouse-to-Game-Over UI test because engine AI timing was accelerated and one post-Legacy immediate continuation was explicitly invoked. Real external UI with mouse Lobby/coin/phase/Response/Legacy operations progressed only to round 8 before execution budget; localhost hosted navigation blocked by administrator, Firefox unavailable. No claim of a full UI match or Firefox PASS. Prior focused regressions (312 targeting, 111 defense keywords, 109 nested reactions, 80 conditions, 100 buffs/status, 14 nonmodal) PASS in reported reruns. One older AI runner did not complete in this session; do not mark it as a rerun PASS.

Cumulative staged bugfix ledger now has SEVEN groups (previous six + final-Hero simultaneous Draw). Last distributed release stays RC24; do not package a new RC until acceptance gates documented in `docs/qa/keyword_audit_staged_2026-11-06/REMAINING_PATHS_FOLLOWUP_08.md`. Legacy-style hover preview remains unimplemented backlog.

---

## Designer decision — 2026-11-06 — Skip remaining acceptance QA and switch to UI work

Designer explicitly instructed **skip the three outstanding acceptance categories discussed after Follow-up 08**: (1) complete ordinary Human-vs-AI mouse-driven match to the terminal screen, (2) additional complex defensive interactions in natural games, and (3) hosted/native Firefox verification. Treat each as **WAIVED/NOT VERIFIED**, never PASS. No further work is required on those three categories unless designer reopens them. This is a waiver of those tests, **not** proof that the application is FINAL or defect-free.

Designer wishes to prioritize **UI changes** next. Previously requested UI backlog: Legacy-style enlarged hover preview for cards in Class Ability selection (e.g., Prolonged Symphony / Orchestral Crescendo). Await the concrete next UI scope before editing. Keep the seven approved keyword/status engine fixes staged and untouched. No new RC/ZIP; RC24 remains the last distributed archive. No application source changed in this documentation entry.

## Part 3 — 2026-11-06 — UI bug intake: Shard Pool, Card Played response attribution, Counter notification (INVESTIGATION ONLY)

- **Working baseline:** staged RC24 plus previous approved gameplay fixes. **No source UI or game logic modified in this session; no new RC or ZIP.** User-supplied screenshots analyzed.
- **Shard Pool:** Nine Shards visibly extend outside the border on another computer. `shared-app/app-runtime.js` layout uses independently scheduled pool-width sync and card positions; source and CSS inspected. Chromium desktop in-memory 9-Shard viewport matrix did not reproduce at 1440×747, 1230×740, 1050×650, 850×580, 1600×900, 1600×747. Treat external zoom/DPI/browser/timing as hypotheses, not confirmed root cause. Proposed ResizeObserver/live width-clamp regression fix after approval. Keep physical Mana state untouched.
- **Card Played:** screenshot falsely shows Flashpowder Bomb Response under Singularity Reload while Singularity's Draw 3 resolved. Official `S0-ITM-017` only counters Item; Singularity `S0-ARC-022` is Skill. `v96CombinedPlayedEvents`/`v520CanAttachResponse` heuristically links events by round/phase/lanes; synthetic Chromium event matrix reproduces Flashpowder incorrectly grouped under Singularity instead of Health Potion. UI attribution bug confirmed, but the exact user's live sequence and gameplay outcome are not independently replayed. Proposed explicit parent event/chain ID at commit and strict link after approval.
- **Counter notification:** Designer suggests a transient prominent feedback element similar to turn banners for non-arrow Counter/NEGATE. Proposal: brief `COUNTERED!` status with exact source/target, persistent `NEGATED` flag in Card Played; ensure nested counters show final outcome. Design request only, no code.
- **Existing backlog:** Class Ability selection Legacy-style hover enlargement remains open. Preserve designer-waived manual full-match/Firefox/complex field acceptance as NOT VERIFIED, not PASS. Follow standing audit-before-fix and consolidate to one RC only when authorized UI fixes and regression work complete.


## Part 3 — 2026-11-06 — Grand Finale temporary designer nerf (STAGING ONLY; OSA READ-ONLY)

- **Explicit designer request:** Update ONLY the VS AI Season 0 card `S0-CLE-031 Grand Finale` now; official OSA Season 0 will be updated later alongside several artwork changes. Current submitted card front authorizes **Bard Rank II 60** and **Maestro Rank III 90** base Magical Attack damage (old OSA DEV45: 80 / 120).
- **No OSA file changed**: `runtime/season0-authority/` and both original OSA ZIP/archive remain unmodified. Leave source `s0_authority` and `canonical_execution` provenance snapshots as historical official DEV45; patch only app-facing values with an explicit local override, not a fake OSA release.
- **App files changed:** `card-art/S0-CLE-031.webp` replaced with supplied revised art; new `runtime/overrides/grand-finale-designer-nerf.js` applies only to `GL_CARD_DEFINITIONS`/derived active preview and local asset-manifest records; `index.html` loads this override immediately after generated S0 data, before engine initialization. Internal generated source snapshots remain intact.
- **Mechanics unchanged:** 6 Mana; Ultimate; Bard/Maestro requirement; mandatory physical Return of one Zol, Lun and Vae from Discard to Deck, then shuffle; INVINCIBLE until next own turn; Draw 3. Damage changes for both player and local AI via the same class-specific `attack.damage_by_class` map, not a battle-only hack. All other cards untouched.
- **Release decision:** staging only; do not increment RC24 or generate an app release ZIP until bundled audit/UI changes are finished. Re-evaluate/remove this app-local override once new authoritative OSA includes the revised card.
- **Targeted QA (2026-11-06):** Node validation confirmed patched Grand Finale attack map Bard=60/Maestro=90, printed review rows 60/90, root/family card mirror identical, other 241 card definitions byte-identical in JSON and source OSA snapshots still 80/120. Chromium engine-injected `GRAND_FINALE_LOCAL_OVERRIDE_QA.json`: 30/30 checks PASS, testing PLAYER/AI × Bard/Maestro payment (6 Mana), physical note Returns, base damage, 3-card Draw and Invincible; page JS errors 0, missing assets 0. Original 15 `/runtime/season0-authority/` files match RC24 ZIP checksums; new artwork SHA256 `1d05629b76b52da42cbb384ece2ea37e505432aa580ad9cdb12dc44ca69d9489`. This is targeted QA, not full browser match or Firefox verification.

---

## Part 3 — 2026-11-06 — MANA STEAL DESIGNER CORRECTION (STAGING ONLY)

**Explicit designer correction:** The prior staged STAGED-03 change (capping opposing Mana removal by the acting player's own receiving capacity) was **wrong**. `MANA STEAL X` must remove **up to X opponent physical Mana Shards**, limited **only by opponent's current Mana Pool**. Subsequently, draw up to that many own physical Mana Shards from **own Mana Deck**, independently limited by own Deck and own Pool (max 12). The removed opponent Mana is **not refunded** if own draw is smaller or zero. Examples: opponent Pool5/own Pool11, STEAL2 => opponent -2, own +1; opponent Pool1/own Pool4, STEAL2 => opponent -1, own +1. Opponent Pool5/own Pool12 STEAL2 => opponent -2, own +0.

**Source edit:** `engine/shared-app/app.bundle.js` only: `manaStealEffectiveCount` uses opponent Pool as removal cap; `finishOpponentManaInteraction` no longer clips chosen physical opposing Shards to own capacity; `validateCardPreconditions` for effect-only `S0-THF-005 Steal` requires opposing Mana only. Own draw stays capped by existing `drawManaCards`. `S0-MAG-021 Mana Absorption` continues independent Attack/damage, with Mana Steal only after connected Hit. No change to MANA BURN.

**QA:** Chromium-controlled engine fixtures (PLAYER + AI, five cases each) 68/68 PASS, JS errors 0; Mana Burn QA rerun PASS. Evidence: `docs/qa/keyword_audit_staged_2026-11-06/MANA_STEAL_DESIGNER_CORRECTION_2026-11-06.md`, external QA JSON `MANA_STEAL_DESIGNER_RULING_QA.json`. Prior STAGED-03 symmetric 16/16 expectations and earlier narrative are historical and superseded, not the currently approved rule.

**Release:** No new RC, no app ZIP, no OSA/Player Rulebook/other app changes. RC24 release remains immutable. Official rulebook v2.9 printed MANA STEAL summary (“same number”) should be reconciled in a future authorized rulebook/OSA update to reflect this designer instruction. All other staged fixes, Grand Finale local nerf+art, and pending UI backlog remain intact.


## Part 3 — 2026-11-06 — RC25 single consolidated authorized release (NOT FINAL)

**Designer authorization:** Implement all previously enumerated gameplay, UI and card changes in one combined release, after correcting MANA STEAL to prioritize opposing Mana removal. This is the sole RC increment after the RC24 partial-audit packaging; original RC24 archive and OSA Season 0 DEV45 remain unchanged.

**Implementation:** preserved seven staged gameplay corrections and 60/90 Grand Finale temporary VS AI override/new supplied artwork. Extended `engine/shared-app/app.bundle.js` Card Played exact Response parent association and committed `CARD_NEGATED` presentation signal. Updated `shared-app/app-runtime.js` contextual hover previews for Class Ability card selections, responsive Mana Pool layout/ResizeObserver, history NEGATED/RESOLVED badges, and transient center counter banner. Scoped CSS in `shared-ui/battlefield-ui.css` supports responsive Mana layout, result labels and notification. Updated `README.md`; `docs/qa/rc25/` contains a focused QA report and machine-readable evidence. No OSA, PVP, Deck Builder, website or unrelated app edit.

**Regression evidence:** 9/9 grouped reaction/Counter/UI engine probes, 20/20 responsive Pool geometry probes (both sides), actual Chromium mouse-hover preview on a Bard/Maestro choice candidate, correct counter banner, 68/68 designer-MANA-STEAL, 30/30 Grand Finale, 109/109 nested Response, 22/22 Ultimate Response and 37/37 complex defense/last-Hero DRAW checks. Edited JS syntax PASS; Chromium targeted page errors 0. Reports are targeted checks, not complete gameplay acceptance.

**Designer-waived/not verified:** full natural Human-vs-AI UI game to terminal, exhaustive natural-match defense paths, native Firefox. UI behavior on the specific user-reported external computer/browser zoom remains field-unverified; responsive mitigation is supported by browser simulation only. Retain RELEASE CANDIDATE / NOT FINAL. No more RC build until a new approved change, avoid non-atomic mini releases.


---

# Grandis Legacy — VS AI Season 0 | RC25 Staging Follow-up

**Baseline:** v1.0 RC25 (2026-11-06), unchanged original ZIP. **Status:** source changes staged only; no RC26 ZIP. OSA DEV45 source unchanged.

## Designer report and desired UX

1. Re-audit ALL five dual/hybrid Class paths after Melody Bard/Maestro could not use `S0-ARC-003 Escape Arrow` in Response.
2. On any card selection with a maximum, clicking a new candidate while the maximum is already selected **replaces the most recently selected card**. No preliminary deselect required. Clicking a selected card still deselects it. For an exactly-one choice, click another card simply replaces the old one. No game-state commit until the existing CONFIRM/PAY control (unless a specific flow already auto-commits by design).
3. During a Response, the selectable Hand cards and their PLAY buttons must be in front of the 65% focus dimmer; other dimmed UI stays dimmed.
4. Preserve the already approved Legacy-style left/right hover preview fix from the preceding RC25 staging follow-up.

## Root causes found

**Dual Class:** Current `window.GL_CARD_DEFINITIONS` / `static-data.js` DEV44 app consumer omits the secondary Base Class from `active_class_lineage` of 10 hybrid Rank II/III Hero records. However, the 10 corresponding **individual OSA DEV45 Hero JSON** records explicitly provide both Base Classes under `identity.activeLineages`:

| Hybrid | Official two Base Classes | Affected Rank II/III IDs |
| --- | --- | --- |
| Paladin / Crusader | Warrior + Cleric | S0-WAR-H008 / H009 |
| Arcane Warrior / Arcane Vanguard | Mage + Warrior | S0-MAG-H008 / H009 |
| Bard / Maestro | Cleric + Archer | S0-CLE-H008 / H009 |
| Spell Blade / Arcane Duelist | Thief + Mage | S0-THF-H008 / H009 |
| Arbalest / Grand Arbalest | Archer + Thief | S0-ARC-H008 / H009 |

In RC25, `s0MaterializeSkillLegality()` used the incomplete consumer Hero lineage to build `legal_active_classes`; the shared runtime `cardLegalForLineage()` also read the incomplete Hero lineage. That made eligibility incorrect for Skills tied to the second Base Class (e.g. Bard/Archer Rank I `Escape Arrow`). **Hybrid status does not grant the second Base Class's Rank II/III promotions** (e.g. Bard cannot use Marksman-only Skill).

**Choice UI:** For `legacy_card_choice` and `legacy_cost_selection`, the engine only appended a new selected index when count was **below** max; when max was full, clicking a different candidate did nothing. Some other card choice paths had similar handling. `legacy_defeat_choice`, one-card search, and blind opponent-hand selection already replaced the single selected index correctly; no change needed there.

**Response PLAY:** The Hand action button was rendered at a layer that could be visually suppressed by the focus dimmer. Increasing only the individual button's z-index within a lower Hand/HUD stacking context was insufficient; the focused Hand/HUD stacking levels also require elevation. The Hand must remain absolutely positioned to avoid layout shifts.

## Application-only changes staged

- `engine/shared-app/app.bundle.js`: 10-ID OSA-backed secondary Base Class bridge, strictly applies to current expected Base/Rank and to the *application's copies* of runtime Hero records. Read-only OSA/DEV44 exports and artwork unchanged. Update Skill legal classes and both normal and Response gate using the shared runtime. Update lineage QA expected source mapping.
- `engine/shared-app/app.bundle.js`: shared `s0ChooseCardIndex()` to replace previous tentative picks when all slots are full, used for `legacy_card_choice`, `legacy_cost_selection`, `card_search_choice`, `opponent_mana_selection`, `response_payment_choice`, `hand_limit_discard`, and Bard/Maestro optional Draw selection. Existing exact-shard Mana payment and action commit logic remain unchanged.
- `shared-ui/battlefield-ui.css`: scoped `.gl-focus-response` rules for the Hand, legal card actions, and PLAY button stacking. Keep Hand `position:absolute`; preserve dimming elsewhere.
- `shared-app/app-runtime.js` and `shared-ui/battlefield-ui.css`: preserve earlier approved class-ability hover preview staging changes (persistent pointer hover + left/right docking outside real card bounds).

## QA evidence (real Chromium browser loading current staged files)

- **10/10** source-identified hybrid Hero Rank II/III records have both official Base Class identities.
- **1,550/1,550** hybrid-vs-Skill Class/Rank lineage decisions match the current printed Class/Rank requirements. **10/10** negative checks do **not** grant advanced Skills of the other Base Class.
- `S0-CLE-H008` Bard and `S0-CLE-H009` Maestro are eligible to Response with Archer Rank I `S0-ARC-003 Escape Arrow` (assuming normal target/CONDITION/response legality); neither receives Marksman-only Skill eligibility.
- Engine's built-in full Skill/Hero lineage QA **6,975/6,975 PASS**, Target **13/13 PASS**, and Ultimate Tribute **30/30 PASS**; no browser JS errors and no missing assets in the run.
- Direct choice logic QA **8/8 PASS** for single replacement, deselect, multi-pick replacement, legacy cost replacement, card search, and Bard/Escape authorization.
- Focused synthetic DOM: Response Hand stays positioned absolutely; PLAY button is hit-testable above visible focus dimmer, `elementFromPoint` returns PLAY, dimmer z-index 900 / HUD 980 / card action button 1051.
- Earlier approved class-choice hover component QA rerun: **12/12** side placement cases across 1600/1024/820 px, hover >1 s persists and leaving closes; no JS errors.

**Not yet verified:** genuine Firefox behavior of new focus/choice changes, a natural mouse-driven Legacy Choice as a player in a complete match, and full Human-vs-AI end-to-end match. Per designer's prior waiver these remain **NOT VERIFIED**, not PASS. This staging verification does not constitute a new release.

## Next

Preserve this cumulative patch over the **original** RC25 when preparing a future combined release. Verify final UI behavior in a natural match before claiming Firefox compatibility. Do not ship a new RC until designer requests consolidation.


## Part 3 — 2026-11-06 — Holy Barrier BLOCK 0 on allied Crusader (INVESTIGATION ONLY)

Screenshot: Fiery Thrust 90 incoming and Holy Barrier displayed BLOCK 0. Official S0-CLE-010 Priest Rank II BLOCK 60. Read-only Chromium engine reproduction with legal Priest source on a different lane defending Crusader target: Response offered; 4 Mana paid; engine erroneously resolves BLOCK 0 and 90 HP damage. Root cause: `resolveResponseWindow` and AI choice scoring pass target Hero to `responseBlockAmount` instead of actual Response source Hero for source-specific amount map. Original RC25 functions byte-identical. Separate unresolved concern: screenshot shows only Crusader/Conqueror active plus Legacy, and neither can legally play Priest-only Rank II Holy Barrier; investigate legality/record source before claiming precise live root cause. No code changed; proposed fix requires separate authorization, test source-vs-target values and response legality for both sides. See `/mnt/data/Grandis_Legacy_Holy_Barrier_Readonly_Investigation_2026-11-06.md` for focused QA details.

---

## 2026-11-06 — Allied-source Defense audit and selection UX (staged, no release)

Designer clarified Holy Barrier is cast by a qualifying Priest or Saint onto an allied attacked Hero (e.g. Crusader). In Response, PLAY must allow source Hero choice and the protected destination as distinct pre-payment steps, just as normal Attack chooses its source and target. For explicitly all-Hero Defense cards, only source is selected; printed all-allies effect must not be narrowed. Existing stages and original RC25 ZIP/OSA remain unchanged.

Inspected official allied-effect families; confirmed class-scaled Block source-target confusion in `S0-CLE-010 Holy Barrier` and `S0-CLE-022 Sacred Bulwark`. `responseBlockAmount` used defender's Class instead of the actual Response source Hero, causing 0 BLOCK on nonmatching allied Heroes. AI defense scoring had the same source mistake. Narrow correction is in staged `engine/shared-app/app.bundle.js`; no rule/data changes. `shared-app/app-runtime.js` and `shared-ui/battlefield-ui.css` now stage explicit source→protected target route UI for Holy Barrier/Cover Up, and source-only selection for team-wide Sacred Bulwark/Blessing of Divinity. Pre-PAY CANCEL preserved. Focused engine 6/6 and UI route 4/4 tests PASS with 0 JS errors; full hosted-mouse/Firefox tests NOT VERIFIED. See `docs/qa/allied-defense/ALLIED_DEFENSE_AUDIT.md` and JSON receipts. The original screenshot's actual lawful Priest/Saint availability still needs field evidence; do not assume its Response was legal solely because an engine source bug was reproduced. No RC26 or new application ZIP created.


---

# VS AI S0 RC25 Staging — Sacred Bulwark Route & Self-Hosted Taunt Glow (2026-11-06)

## Designer clarification

- `Sacred Bulwark (S0-CLE-022)` protects all allied Heroes by effect, so Response UI must be **PLAY → choose a legal Paladin/Crusader user → PAY**, **without a separate target-selection click**. Affected allies are determined by the printed effect; no manual protected target should be asked.
- A self-hosted, ongoing Attachment such as `Taunt (S0-WAR-005)` should visibly glow around the **Hero carrying the Attachment**, analogous in emphasis to the existing Casting-target highlight, but unlike Casting it is NOT an opposing target-position highlight.

## Source verification and implementation

1. Verified `shared-app/app-runtime.js`: `RESPONSE_ALLIED_SOURCE_CARDS` already includes Sacred Bulwark, but `RESPONSE_SINGLE_PROTECTED_CARDS` excludes it. In `selectResponseRouteHero`, the source click directly calls `confirmResponseOption` for Sacred Bulwark, proceeding to Response payment. This source-only route was **already implemented in the preceding staged allied-defense change**; no additional gameplay/UI route modification made today.
2. Verified existing lane illumination: `gl-casting-target` identifies the locked position of pending Casting, while ordinary Attachments were shown only as Attachment cards. No generic self-hosted effect glow existed.
3. Added a **presentation-only** self-hosted Attachment indicator, initially scoped solely to OSA-confirmed `Taunt (S0-WAR-005)`. The helper requires a live Hero, the actual physical Taunt card in a valid Attachment slot, a matching active attachment record on that Hero's current lane, and remaining duration >0 if provided. No mere pending/paid-but-negated card will trigger it. Glow is warm amber/red and occupies the Hero's own panel; the Taunt Attachment thumbnail also gets an outline. Existing Casting target highlighting and effect logic are unchanged. Future self-targeting cards require explicit classification; do not apply this to teamwide or allied-targeted attachments blindly.

## Changed staged files

- `shared-app/app-runtime.js` — `GL_SELF_HOST_FOCUS_CARD_IDS`, `activeSelfHostAttachment`, conditional self-panel + attachment classes.
- `shared-ui/battlefield-ui.css` — `gl-self-attachment-active` panel and thumbnail visuals.
- `docs/qa/rc25_staging_followup/self_attachment_glow/TAUNT_SELF_GLOW_CHROMIUM_QA.json` — targeted DOM computed-style fixture.
- `docs/TAKEOVER_NOTE.md` — appended.

No gameplay engine changes, OSA edits, or distributable ZIP/version increment.

## QA and limitations

- JavaScript syntax `node --check`: PASS.
- Taunt visual state checks in Chromium: **5/5 PASS** (active host, expired, detached, Legacy, wrong-side attachment). Actual CSS pseudo-element amber `box-shadow` was verified after transition settle; no page JS errors.
- Reran prior staged allied-Response DOM interaction checks for Holy Barrier, Sacred Bulwark and Blessing of Divinity: `Sacred Bulwark` proceeds from selected source into `response_payment_choice` immediately, with no `protected` target step. Existing focused DOM checks PASS.
- The Chromium test uses an artificially constructed engine/UI state (the default lobby/coinflip layout is not a natural visible match), so its screenshots do **not** prove finished real-game visuals or Firefox parity. No full match was played. Previous designer waivers remain Not Verified, not PASS.

## Next

- When producing the next consolidated release, include this staging change; verify a normal live Taunt activation and expiry in the player's UI and Sacred Bulwark payment in an actual Response opportunity if possible. Do not prematurely cut RC26.


---

## RC26 — 2026-11-06 — Consolidated approved UI, Lineage, allied Defense and Taunt glow release

User explicitly requested update after completing RC25 cumulative staged fixes. Released one consolidated v1.0 RC26 from the unchanged RC25 baseline and prior **cumulative staging**, not from any older RC. No new gameplay/rules changes in packaging. Source changes only: `engine/shared-app/app.bundle.js`, `shared-app/app-runtime.js`, `shared-ui/battlefield-ui.css`; README/docs and QA receipts updated. Preserved RC25 data, artwork and Grand Finale local nerf as-is; OSA DEV45 and other apps unchanged.

Features: two-base-Lineage Hybrid legality for 10 Rank II/III Heroes including Bard/Archer Escape Arrow; optional choice replacement with click; focused Response Hand/PLAY button above dimmer; persistent left/right Class Ability hover; Holy Barrier single-ally Response source→recipient routing and correct source-based BLOCK + AI valuation; Sacred Bulwark/Blessing of Divinity source-only route with automatic allied coverage; Cover Up source→protected; Taunt own-Hero/Attachment glow while active. Existing Casting visuals unaffected.

Re-run QA for RC26: JS syntax PASS; full Skill/Hero lineage 6975/6975, specific hybrid legality 1550/1550, target 13/13, Ultimate Tribute 30/30, tentative selection 8/8, hover placement 12/12, allied BLOCK engine 6/6, three allied routes plus click wiring 4/4, Taunt glow 5/5. Chromium page errors 0, missing boot assets 0. These are focused/synthetic tests and do **not** prove a complete real match.

Explicit waivers still **NOT VERIFIED**: full normal Human-vs-AI browser match through Game Over; exhaustive natural defense interactions; native Firefox QA. Original Holy Barrier screenshot's exact legitimate source identity remains unresolved without live match state. Keep status RELEASE CANDIDATE, NOT FINAL. Reference: `docs/qa/rc26/RC26_RELEASE_NOTES.md` and `RC26_SUMMARY.json`.

---

## RC27 — 2026-11-06 — Authorized single-bug UI fix: Class Ability hover flicker

**Baseline:** official RC26 ZIP. **User authorization:** “lu benerin deh 1 bug itu aja, jangan lupa takeover note ya”. Limit scope to this one hover-preview lifecycle defect and update takeover/QA/release metadata. Preserve all other RC26 content. OSA DEV45, other Grandis Legacy applications, gameplay, AI and card definitions are unchanged.

### Investigation / root cause

- Firefox user video showed the left/right preview positioned correctly but disappearing while the pointer stayed over a Prolonged Symphony selection card.
- RC26 `renderNow` runs every 120 ms and calls the unrelated generic `renderAllowedModal`. For `s0_bard_draw_choice`, that generic handler's no-modal branch called `hideModalHoverPreview()` each tick, erasing the *shared* preview owned by center-choice hover. Hover pointer movement could reopen it until the next tick. A controlled original-code Chromium reproduction confirmed this with 19 hide calls over 2,150 ms and preview closed while pointer stationary.
- Earlier RC26 fix prevented repeated cleanup in `setCenterChoiceBodyMode`, but omitted `renderAllowedModal`. Do not fix flicker with CSS layering, timers, or new global preview instances; preserve already-correct left/right positioning.

### Authorized change, files/functions

- **Only functional edit:** `shared-app/app-runtime.js` → `renderAllowedModal`: the generic modal cleanup now honors active, connected `classChoiceHoverOwner` during `s0_bard_draw_choice`, and retains original cleanup for all other modal states. Existing pointerleave/blur and actual center-stage transitions clear the preview as before.
- Packaging/docs: `README.md`; `docs/TAKEOVER_NOTE.md`; new `docs/qa/rc27/RC27_RELEASE_NOTES.md` and `HOVER_FLICKER_QA.json`. No other runtime files modified, no OSA source changes, no new game rules.

### Verification / limits

- `node --check`: PASS. Controlled Chromium DOM tests using original runtime function extracts: **21/21 PASS**, at 1600×848, 1024×650 and 820×580 (stationary 2,150 ms hover with 120 ms polling; switch hovered cards; pointerleave; keyboard focus/blur; pending transition cleanup; no page errors). The unmodified RC26 fixture fails the stationary-hover check.
- ZIP CRC, one enclosing app folder, only `README.md`/`index.html` in app root, and unmodified source/asset contents verified at packaging.
- **Not verified:** real native Firefox replay of the user's match and complete game to terminal Win/Loss/Draw. Existing designer waivers remain **NOT VERIFIED**; status is **RELEASE CANDIDATE, NOT FINAL**.

**Next:** User Firefox confirmation with Prolonged Symphony/Bard selection; if hover still disappears, record state/owner/DOM and hide callers before any additional changes. Preserve all prior RC26 gameplay and UI fixes.


## Part 3 — 2026-11-06 — RC27 read-only Full Fallback Lineage + Replenish Hover Audit

**Read-only audit; no implementation and no release ZIP.** 155 Skill × 45 Hero = 6,975 Class/Rank checks; 1,059 permitted. Runtime legal gate 0 mismatches, but **11 wrong fallback effect rows** for Rank III hybrids (Maestro Zol/Sleeping Dart; Crusader Hammer of Justice/Holy Light; Arcane Duelist Aether Ball/Mana Absorption; Grand Arbalest Blink Strike; Arcane Vanguard Skull Crush/Colossal Bash/Weapon Throw/Runic Guard). Root: `GL_RULES_RUNTIME.selectClassRow` reverses a lineage list with the secondary Base Class appended at end, making Rank I win over Rank II. RC6 6,975-pass legality self-test does not test selected effect-row. Separate direct Chromium DOM shows Replenish contextual preview opens on mouseenter, then `renderCenterChoiceStage` idle `closeCenterChoiceStage()` clears shared preview on next render. Report and matrix generated OUTSIDE release archive: `Grandis_Legacy_RC27_Full_Fallback_Lineage_Audit_2026-11-06.md`, `Grandis_Legacy_RC27_Full_Fallback_Lineage_Matrix_2026-11-06.csv`; no OSA or app changes. Await designer authorization before patching; retest actual damage, heal, reflect, casting Burn, nested response/hover on Firefox.

---

## RC28 — 2026-11-06 — Authorized fallback Lineage and generic hover repairs



Designer requested **"benerin semuanya"** following RC27 read-only audit: correct 11 wrongly chosen hybrid Class/Rank effect rows and remove Replenish/Legacy choice popup hover flicker. Start from **RC27** and preserve its prior UI/gameplay/artwork/AI behavior. Official OSA Season 0 DEV45 remains **READ-ONLY**.

### Confirmed gameplay defect and correction

`engine/js/runtime-authority.js` → `GL_RULES_RUNTIME.selectClassRow()` previously reversed `active_class_lineage`. Because hybrid Class bridge appended secondary Rank-I Base Class last, reverse-iteration preferred that Rank I over an available primary Rank II printed effect row on Rank III Heroes. Runtime legality was correct; **value/branch selection was not**.

Selector now prioritizes exact current Class, then the **highest applicable official printed Class/Rank effect row** in the Hero's legal Lineage. For equal Ranks, it prefers the Hero's `evolution_path`; if no printed rows exist for a dynamic map, it checks primary evolution first before other legal Lineage classes. No extra Class eligibility is granted. All 11 confirmed mismatches now select the proper row:

| Card | Rank III Hero | Correct row | Selected effect |
|---|---|---|---|
| Zol | Maestro | Bard | 20 damage |
| Sleeping Dart | Maestro | Bard | 30 damage, Sleep 1 |
| Hammer of Justice | Crusader | Paladin | 60 damage, Stun 1 |
| Holy Light | Crusader | Paladin | Heal 60 |
| Aether Ball | Arcane Duelist | Spell Blade | 70 damage and printed on-Hit MANA BURN 1 |
| Mana Absorption | Arcane Duelist | Spell Blade | 40 damage and printed on-Hit MANA STEAL 2 |
| Blink Strike | Grand Arbalest | Arbalest | 30 damage |
| Skull Crush | Arcane Vanguard | Arcane Warrior | 50 damage |
| Colossal Bash | Arcane Vanguard | Arcane Warrior | 60 damage |
| Weapon Throw | Arcane Vanguard | Arcane Warrior | 60 damage |
| Runic Guard | Arcane Vanguard | Arcane Warrior | BLOCK 50 and printed REFLECT 30 |

`GL_RULES_RUNTIME.cardLegalForLineage()` is unchanged. No 11 individual card-specific overrides were added.

### Confirmed UI defect and correction

`shared-app/app-runtime.js` → `renderCenterChoiceStage()` closed its stage on **every 120 ms render** even when there was **no center-choice session**. `closeCenterChoiceStage()` hid the **shared preview owned by the generic popup**, causing Replenish and Legacy card preview flicker under a stationary pointer.

Now the center stage is closed only when a real center-choice session is active/being exited. When idle, its renderer does not erase a generic modal's preview. The existing centered Bard/Maestro preview, preview cleanup on genuine session transitions, and left/right placement are retained. No CSS redesign or artificial delay.

### Verification and boundaries

- `node --check` passed for both modified runtime JS files.
- **155 Skill × 45 Hero = 6,975 static legality/row checks**: 1,059 legal combinations; **0** legality differences and **0** wrong effect rows (RC27 had 11 wrong rows).
- Actual application JavaScript in controlled Chromium DOM: **11/11** expected fallback rows and printed numeric/secondary text values matched; `Aether Ball` printed MANA BURN 1, `Mana Absorption` printed MANA STEAL 2 and `Runic Guard` printed REFLECT 30.
- Browser DOM: Replenish (Discard search), Legacy Defeat Choice, Legacy Card Choice and Hand search preserved hover through **25 repeated render cycles**, then closed on mouseleave; Bard hover preserved through 24 cycles and correctly cleared on session change. **0 browser page errors**.
- These are targeted source/runtime/UI tests. They do not prove complete damage/secondary effect resolution for every possible game state, a native Firefox match, or a normal Human vs AI game to terminal. The previous waivers remain **NOT VERIFIED**, not PASS.

### Changed files

- `engine/js/runtime-authority.js` — effect-row fallback precedence.
- `shared-app/app-runtime.js` — no idle-stage hover destruction.
- `README.md`, `docs/TAKEOVER_NOTE.md`, and `docs/qa/rc28/*` — documentation/QA.

**Not changed:** card database/official OSA, engine attack/response code, AI, artwork, animations, other apps. Release status **RELEASE CANDIDATE, NOT FINAL**.



---

## Post-RC28 Staging — 2026-11-06 — Stoneblood Center Choice + Mana/Arcane Surge Payment Toggle

**User instruction:** Focus solely on Stoneblood and Mana Surge / Arcane Surge. Stoneblood decision should visually mirror Arbalest's central one-card Draw Review, but display the Hero that would be defeated. For Spell Blade/Arcane Duelist, offer one additional Surge toggle during the main Mana payment. Disabled Surge must explain why on hover (e.g., not a Magical Attack). **No release requested; keep RC28 official and OSA DEV45 read-only.**

### Source-verified authority

- `Stoneblood`: Dwarf Hero about to be defeated may spend **1 Racial Token**, stay with **30 HP**; use/decline resolution remains the authoritative existing engine flow, including mandatory Legacy fallback on decline. The displayed Hero card is a **visual clone only**, not taken from the battlefield.
- `Mana Surge` / `Arcane Surge`: Spell Blade **+10** / Arcane Duelist **+20** Magical Attack damage for **1 additional physical Mana Shard**; no unrelated Hero receives this action. A current Aether Infusion's conversion of a Physical Attack into a Magical Attack is considered by the existing authoritative predicate.

### Narrow staging changes

1. `shared-app/app-runtime.js`: added `racial_stoneblood` to the existing central single-card decision stage; buttons **DECLINE & CONTINUE DEFEAT** and **SPEND 1 TOKEN & STAY AT 30 HP**. Removes redundant Stoneblood / SKIP Hero-side buttons. Display identity stays keyed to source Hero / lane to avoid stale content.
2. `engine/shared-app/app.bundle.js`: moves paid PLAYER Surge choice into pre-commit `mana_shard_payment_choice`, retaining default OFF and reusing the existing effect resolver/1-Shard spend. Added source/attack-aware summary and `toggleManaPaymentSurgeChoice` intent. Disabled unless attack is currently Magical, base payment valid, and **at least 1 physical Shard remains after the selected base payment**. Payment commit rechecks the additional-Shard constraint. AI Surge decision logic is not modified.
3. `shared-app/app-runtime.js`: adds **one** Surge toggle only when the selected source has Mana Surge / Arcane Surge, including during payment for non-Magical cards (disabled with explanatory tooltip). Enabled tooltip explains additional Shard and +10/+20 benefit. Button defaults OFF; clicking toggles; selected state persists across render cycles; changes in payment rerender correctly and can invalidate a selected Surge. The existing `CANCEL` rolls back before costs; `PAY` commits. Contextual identity/sig includes payer's Hero to prevent stale button reuse.
4. `shared-ui/battlefield-ui.css`: reuses the Arbalest one-card sizing for Stoneblood, adds selected/disabled Surge styling and wrapper-owned `title` tooltip for disabled-button hover, including Firefox pointer-events mitigation.

### Controlled QA

- JS `node --check` **PASS** for the two modified JS files.
- Chromium loaded scripts into `about:blank` DOM (normal file/localhost navigation blocked by the container). **16/16 targeted synthetic-state/DOM tests PASS, 0 JS page errors**. These included: Magical payment vs old Surge popup, Arcane Surge enabled/info/toggle persistence, actual **Arcane Bolt 20 + Arcane Surge 20 = 40** damage and 3 total Shards spent (2 base +1 extra), physical attack disabled with reason, insufficient spare Shard disabled with reason, Spell Blade +10 label, non-Surge Mage button absent, Stoneblood central Hero card and no Hero-side SKIP, Stoneblood use spending token and setting HP30, Stoneblood decline preserving token and continuing to Legacy decision, payment CANCEL with Surge selected leaves Mana and card intact.
- **NOT VERIFIED:** Full natural match with genuine mouse hover/positions, native Firefox tooltip/hover behavior, and complete complicated AI defense / PvP flows. Local Chromium synthetic DOM events are not evidence of those categories. No release/ZIP created.

### Guardrails / follow-up

- Do not overwrite RC28 or issue RC29 without user authorization.
- On next release request: retest full merged staging before packaging and verify Stoneblood vs Arbalest / Legacy / Response / Replenish hover regressions.
- AI Surge heuristics remain unchanged because this scope is the human payment UI. AI already evaluates its extra-Shard availability on the post-payment state during Attack resolution; this new UI QA does not constitute an AI regression test.

---

## Post-RC28 Staging — 2026-11-06 — Hover Explanations for Hero-side Ability Buttons

**User instruction:** Add a hover explanation to the remaining Hero-side Class Ability / Racial Trait buttons. Examples: Second Chance must explain spending 1 Racial Token to DODGE; Human Ambition must explain spending 1 Racial Token to draw 2. Preserve the existing staged Stoneblood central choice and Mana/Arcane Surge payment toggle. **No release requested.**

### Authority and scope

- Tooltip descriptions are read from the **S0 DEV45 consumer-printed Hero `racial_ability.text` or `class_ability.text`**, not from invented fixed gameplay data. Example Human Ambition: `During Deploy Phase, you may spend 1 Racial Token to draw 2 cards.` Example Second Chance: `Spend 1 Racial Token to dodge incoming Physical or Magical damage.`
- Dragon Scale's **50 BLOCK** value is displayed from its official printed Block badge (`-50`), because it is not in the printed description text.
- Legacy Hero-side buttons also receive their **LEGACY_ABILITY** printed row (excluding `LEGACY_REPLACEMENT`), so all actionable buttons that share this component have relevant explanations. Any non-racial Hero-side response without a specific official text receives a limited generic response label rather than an invented effect.
- The Stoneblood choice is still centered; no new Hero-side Stoneblood/SKIP action. Mana/Arcane Surge still uses its existing hover-enabled payment control, with no payment logic changes.

### Changes made (staging only)

1. `shared-app/app-runtime.js`: a single contextual tooltip bound to Racial, Class, Legacy, and eligible Response Hero-side action buttons. Keyboard-focus support, `aria-describedby`, cleanup on exit/blur/click, and tooltip-owner cleanup when actions change. Renderer signature includes description content, while unchanged buttons survive recurring 120ms UI polling so the hover stays stable.
2. `shared-ui/battlefield-ui.css`: narrow fixed-position, pointer-transparent tooltip presentation with constrained viewport width. Tooltip is a `document.body` portal, avoiding Hero-lane clipping. Original Hero action sizes, positioning, gameplay button actions, and card previews are unchanged.
3. `docs/TAKEOVER_NOTE.md`: this entry.

### QA and known limitations

- `node --check shared-app/app-runtime.js`: **PASS**.
- Chromium synthetic-state/DOM suite: **23/23 PASS**, **0 JS page errors**. Cases: Human Ambition cost/draw-2 text; Second Chance cost/DODGE text; Ancestral Focus; Primal Strike; Holy Resurgence; Radiant Oblivion; Dragon Scale; Warrior's Relic Legacy text; stable tooltip after repeated Hero render; mouse enter/leave, actual mouse hover, focus/blur; cleanup when actions change; tooltip fits 820/1024/1600px test viewports.
- QA script (workspace, not release): `/mnt/data/rc28_surges_stoneblood_staging/hero_action_tooltip_qa.py`; result JSON `/mnt/data/rc28_surges_stoneblood_staging/hero_action_tooltip_qa_results.json`.
- The browser UI test uses **controlled fixture states**; it is **not** a natural complete Human-vs-AI match. Firefox and physical touchscreen long-press: **NOT VERIFIED**.
- **No changes** to engine mechanics, AI, OSA DEV45, artwork, RC28 release ZIP, or version number; no new release/package created.


---

## RC29 — 2026-11-06 — Authorized Release of Stoneblood + Surge Payment + Hero-side Ability Tooltips

**User authorization:** “ok update versi”. The official baseline is RC28; issue a single consolidated **v1.0 RC29** from the staged work that was previously approved (two groups: Stoneblood/Surge and actionable Hero-side hover help). Do not add unrelated game changes.

### Packaging and scope
- Include: Stoneblood defeated-Hero center-stage decision (no Hero-side SKIP), Mana Surge/Arcane Surge toggle only for eligible Spell Blade/Arcane Duelist when choosing card Mana payment, with disabled hover explanation and +1 physical Mana requirement; Hero-side Racial/Class/Legacy/eligible Response tooltips based on authoritative printed text.
- Relative to the official RC28 ZIP, the only *functional* files changed were `engine/shared-app/app.bundle.js`, `shared-app/app-runtime.js`, and `shared-ui/battlefield-ui.css`. The existing pre-release staging TAKEOVER text was already modified. Added release documentation, including QA outputs and status. Original RC28 archive and OSA DEV45 remain untouched.
- Keep other RC28 fixes (fallback lineage, hover preview, allied defense, etc.) unchanged; no new game rules or card definitions.

### QA
- Controlled Chromium engine/DOM Stoneblood and Surge scenarios **16/16 PASS**, zero page errors.
- Controlled Chromium hover and tooltip scenarios **23/23 PASS**, zero page errors; includes actual pointer hover for one Human Ambition button, synthetic repeated render, accessibility focus/blur and 820/1024/1600 px test viewports.
- JS syntax for game bundle, UI runtime, and rules authority **PASS**. RC28 original app files are byte-identical unless listed above; all original assets retained. ZIP CRC and structure checked during release packaging.
- **NOT VERIFIED**: native Firefox match/tooltips and native Firefox disabled-button hover, full normal Human-vs-AI match to Win/Loss/Draw, exhaustive complex defense interactions. Targeted tests are not evidence for those.

### Release
- **New** `Grandis_Legacy_VS_AI_Season0_v1.0_RC29_2026-11-06.zip`, single `Grandis_Legacy_VS_AI_Season0/` top-level app folder.
- `docs/qa/rc29/RC29_RELEASE_NOTES.md`, `RC29_QA_SUMMARY.json`, and per-feature QA outputs included.
- Latest official status **RC29 RELEASE CANDIDATE — NOT FINAL**.

---

## Post-RC29 Staging — 2026-11-06 — Mana Surge / Arcane Surge payment is visibly 5/5 and selects a fifth Mana

**User instruction:** Screenshot: with a 4-Mana Magical Attack, the `PAY MANA` center stage remained `MANA 4 / 4 + 1 SURGE SHARD` after turning on Mana Surge, and only 4 Mana cards had the selection glow. User wants `MANA 5 / 5 (+1 Mana Surge)` (or the correct ability name) with the additional Mana **actually selected and paid**. User also explicitly retired the *Shard* wording in this payment context: use **Mana**, not **Surge Shard**. This is a narrowly scoped staged fix; no release requested.

### Verified baseline behavior / root cause
- Official RC29 `engine/shared-app/app.bundle.js`: `commitManaShardPaymentChoice` selected/committed only the **base printed cost**; `maybeApplyMagicalSurge` did spend an additional physical Mana card **automatically later** during Attack resolution. Thus the screenshot proves a UI/payment-selection inconsistency, **not** that the old engine never charged an extra Mana in a resolving Attack.
- Official RC29 `shared-app/app-runtime.js`, `renderCenterChoiceStage` pay mode: status label concatenated `+ 1 SURGE SHARD` without incorporating the additional Mana in the numerator/denominator or glowing the physical card that would be spent. The PAY exit animation likewise only included base-selected cards.

### Authorized staged changes (no new version)
1. `engine/shared-app/app.bundle.js`: reserve one **specific** unused physical Mana card upon enabling Mana/Arcane Surge (prefer Regular Mana when available), with `selected_surge_mana_uid` separate from the printed-cost selection. When changing base Mana selection, maintain a valid, non-overlapping Surge reservation; turn-off clears it. Commit revalidates the reservation and carries its UID to the Attack resolver. The existing AI automatic Surge spend path is preserved; PLAYER Surge now spends the **physical Mana card displayed and selected**. Matching Color Mana used as a base card can still represent 2 Mana when legal; the additional Surge card counts only as 1 Mana. Internal fallback Mana payment display also reports the selected extra Mana; payment wording changed from Shard to Mana.
2. `shared-app/app-runtime.js`: `PAY MANA` status becomes e.g. **`MANA 5 / 5 (+1 Mana Surge)`** or **`MANA 5 / 5 (+1 Arcane Surge)`**, with one additional physical card visibly selected/glowing and included in PAY animation. OFF still reports `MANA 4 / 4`. Toggle hover says `Spend 1 additional Mana ...`; payment helper now uses `Class Mana`. Class/racial and other UI untouched.
3. No card, balance, official OSA DEV45, AI decision, lineage, layout, or general game rule changes. Only the two runtime files above and this staging takeover note changed relative to RC29. Official RC29 ZIP left unmodified.

### QA / proof
- Focused Chromium controlled-state/DOM suite: **22/22 PASS, zero JS page errors**, `/mnt/data/rc29_surge_payment_staging/run_payment_regression.py`, raw `/mnt/data/rc29_surge_payment_staging/payment_qa_results.json`. Includes: base 4/4 -> Surge 5/5; fifth physical Mana highlighted/reserved and actually spent; Spell Blade +10 / Arcane Duelist +20; toggle OFF; shortage and non-Magical disabled explanations; 15 recurrent renders; viewport 820px; CANCEL no cost; 6-card pool spends exactly the five selected cards; Class Mana as *Surge surcharge* costs exactly 1; live base Mana swap retains 5/5; matching Color Mana as *base* contributes 2, one separate Surge Mana contributes 1.
- Previous Stoneblood/Surge targeted Chromium regression suite re-run **16/16 PASS**, zero JS page errors, `/mnt/data/rc29_surge_payment_staging/old_suite_qa_results.json`.
- JavaScript syntax `node --check` on both edited runtime files: **PASS**. Original RC29 official baseline immutable.
- **NOT VERIFIED:** native Firefox replay of the screenshot, full natural Human vs AI match, all reactive/Countered/canceled attack interactions, and visual layout via normal full match. Controlled DOM behavior is not identical to a natural end-to-end browser playthrough.

**Status:** `FIXED IN POST-RC29 STAGING — NOT RELEASED`. Latest official release is still **RC29 (NOT FINAL)**. Package only if user explicitly requests a new RC.


---

## RC30 — 2026-11-06 — Released (Surge selection payment and consistent hover tooltip)

**User authorization:** First requested actual 5/5 selected Mana while Surge ON, including retiring “Surge Shard” wording; next requested hover color consistent with other ability buttons and explicitly said **“langsung update aja sekalian”**. Authorized **single v1.0 RC30 release**. Baseline official RC29.

### Evidence and changes
- Official RC29: base 4/4 payment, Surge text +1, fourth/fifth Mana highlight mismatch, while attack engine separately spent a later extra Mana. Post-RC29 staging now selects a real fifth card as Surge reservation, displays `MANA 5 / 5 (+1 Mana Surge/Arcane Surge)`, and commits **that selected card**. This is a payment-UI/reservation fix, not a change to printed abilities or their bonuses.
- Official RC29 Surge help used `span.title`, creating the browser-default (light/white) tooltip. The release uses existing `gl-hero-action-tip` portal, with original dark navy/gold CSS reused from RC29; the wrapper supports pointer hover on disabled Surge buttons, and focus/blur for keyboard. Live tooltip wording uses **Mana**, not **Shard**. Existing Class/Racial/Legacy tooltips unchanged.
- Relative to official RC29, **only functional JS files** changed: `engine/shared-app/app.bundle.js` and `shared-app/app-runtime.js`. No CSS, game card/OSA, art, AI, other UI or lineage authority changes. RC29 archive preserved.

### QA
- Re-run real engine/controlled UI Mana payment regression **22/22 PASS**, 0 page errors.
- Prior Stoneblood and Surge controlled regression **16/16 PASS**, 0 page errors.
- New Surge tooltip rendered/pointer/focus/disabled/repeated-render/820px suite **19/19 PASS**, 0 page errors.
- Regression harnesses updated to use the shared wrapper’s `aria-label` rather than obsolete `title`; these test-only changes are not distributed as app code.
- Node JavaScript syntax **PASS**; RC30 ZIP CRC, single application root, manifest completeness and source diff checked in release build.
- **NOT VERIFIED:** Native Firefox, full natural match to Game Over, naturally occurring complex defense combinations. Release Candidate **NOT FINAL**.

### Next checkpoint
- RC30 becomes new official baseline. User may verify tooltip color and Surge 5/5 in Firefox; do not claim native verification until actually performed. OSA DEV45 remains immutable.

---

## Post-RC30 Staging — 2026-11-07 — UI-001: Reopen Game Result from Surrender slot

**Baseline:** Official Grandis Legacy VS AI Season 0 v1.0 RC30 (2026-11-06); original ZIP preserved. Official OSA DEV45 unchanged.

**Authorization / scope:** Designer requested that the current Surrender button be reused after Game Over to reopen the Game Result popup after it is closed. Scope is **only** UI-001. Other queued issues (Greater Health Potion/Item Exhaust and favicon) remain PENDING, not fixed in this staging change. No new RC/release authorized.

**Observed behavior / cause:** `shared-app/app-runtime.js` created the final Game Result popup once (`resultShown`), and `CLOSE` hid it. The bottom sidebar Surrender button retained its original label/click handler and did not reopen the result. A previous 60-second auto-return to lobby could make any reopen control inaccessible; for the persistent reopen UX, navigation is now explicit through the preexisting `BACK TO LOBBY` button.

**Changes in staging:**
- `index.html`: stable `matchActionButton` ID in existing sidebar Surrender position.
- `shared-app/app-runtime.js`: while match active, normal Surrender confirmation is unchanged. When `gameOver=true`, switch the existing control to `Match Result`, use it to reopen the same frozen result popup without modifying match state, and reset to Surrender for a new match. Keep the initial automatic result popup, CLOSE and BACK TO LOBBY. Remove the 60-second auto-return so results remain reviewable until the player chooses to leave; replace popup's old auto-return hint with reopen instructions.
- `shared-ui/battlefield-ui.css`: minimal gold/navy finished-state styling of that button, no layout/position changes.

**QA (source + controlled Chromium engine/DOM):** `node --check` for `shared-app/app-runtime.js` and unchanged engine `app.bundle.js` PASS. 16/16 focused actual-engine controlled Chromium UI checks PASS: lobby/coin/live match Surrender; dismissed/accepted confirmation; surrender -> auto result; changed label; CLOSE; two reopen cycles; winner/reason/round unchanged; no game state mutation; 820, 1024, 1600 px button-fit checks; BACK TO LOBBY control present; zero JavaScript page errors. QA uses inline-loaded Chromium scripts because browser navigation is policy-blocked, so normal hosted asset loading is NOT VERIFIED. Genuine natural terminal Win/Loss/Draw without Surrender, Firefox, full match browser flow and actual Back-to-Lobby reload are **NOT VERIFIED**. Do not label these PASS.

**Status:** FIXED IN STAGING — NOT RELEASED / NOT FINAL. No ZIP or new RC made. Do not silently include favicon or Item Exhaust mechanics until their own authorized scope is addressed. On next release instruction, merge staged changes with other approved work, rerun integration QA, verify pending release blockers, and update checkpoint.


---

## RC31 — 2026-11-07 — Released (UI-001 Match Result reopen and favicon)

**Baseline:** Official RC30 (2026-11-06), with already-tested post-RC30 UI-001 staging applied. **Authorization:** Designer explicitly requested “buat aja versi baru”, replacing prior staging-only instruction with a release request. A prior explicit standing requirement to add the missing favicon on the next app update applies here. No gameplay or OSA edit authorization implied.

**Scope/changes:** `index.html`, `shared-app/app-runtime.js`, `shared-ui/battlefield-ui.css` incorporate the approved Surrender→Match Result state-specific button. Game Over auto-result persists after CLOSE; the user can reopen with the same button; original 60-second auto-return removed to preserve feature; BACK TO LOBBY stays explicit. `index.html` now links the **already present and byte-identical** canonical shared icon in `engine/assets/favicon.png`, with no asset duplication. `README.md`, `docs/RELEASE_STATUS.md`, and `docs/qa/rc31/*` updated. No engine logic, cards, OSA DEV45, AI choices, other UI or payment changes.

**QA:** Re-ran focused controlled Chromium actual-engine UI regression on release candidate, **16/16 PASS**, no JS page errors; includes confirmed-Surrender Game Over, popup dismissal/reopen twice, static result data/game state, width 820/1024/1600. Node syntax checks (`shared-app/app-runtime.js`, `engine/shared-app/app.bundle.js`) PASS. Static favicon PNG and HTML reference validated; icon matches Website v1.40 / Deck Builder v1.60 SHA-256. Hosted localhost asset loading BLOCKED by environment; full natural browser match to terminal Win/Loss/Draw, real BACK TO LOBBY navigation, and native Firefox NOT VERIFIED. The prior RC30 22/22, 16/16 and 19/19 QA were **not re-run**. ZIP CRC/structure/source diff to be checked at packaging. Do not claim final.

**Open:** Greater Health Potion (Item that explicitly Exhausts Hero) should require Ready Hero unless card explicitly permits exhausted use; designer ruling confirmed verbally, **NOT implemented in RC31** because earlier instructions treated it as a separate queued fix; no silent broader gameplay change. Prior full-match, Firefox, natural Defense edge-case verification still outstanding. OSA DEV45 remains unchanged.

**Release:** v1.0 RC31 is published as a new ZIP; original RC30 ZIP preserved, not overwritten. Next baseline: RC31.


## RC32 — 2026-11-07 — Released (consolidated approved UI, AI, gameplay, and Taunt UI hardening)

**Baseline:** RC31. **Scope:** 6 approved UI groups, 2 AI priorities, 3 gameplay fixes, Taunt renderer hardening. Refer to `qa/rc32/RC32_RELEASE_NOTES.md` for itemized details, decision sources, and QA limitations.

**Gameplay decisions:** Ready required for Greater Health Potion Item that exhausts target; Health Potion unchanged. Poison Vial applies to actual HP Physical damage from the attached Hero's Skill Card only, not Racial Trait damage; retained through owner End Phase, allowing multiple qualifying hits. Deflect vs PIERCING is playable; BLOCK ignored, REFLECT occurs on connected Hit.

**Source/authority:** official OSA S0 DEV45 not modified. `card-art/S0-ITM-011.webp` and local runtime printed text are a designer-approved post-snapshot exception; read `docs/LOCAL_DESIGNER_OVERRIDES_2026-11-07.md` before syncing a later OSA.

**QA in RC32:** Node VM production-gameplay 14/14, status AI 13/13, healing AI 26/26, Chromium scripts/fixture state 9/9, Stoneblood 10/10; JS syntax PASS. The original Player-Taunt screenshot state was not reproduced, so renderer changes are preventative and the original root cause is NOT VERIFIED. Full naturally played Human-vs-AI match and native Firefox remain NOT VERIFIED.

**Release:** v1.0 RC32 newly packaged without modifying RC31 or OSA. Next baseline: RC32.


## RC32 SAME-VERSION UPDATE — 2026-11-07
Designer-authorized consolidation (no RC increment): EXP Ready geometry, Unified Discard, corrected Counter/Regen styling/position, Poison Vial and Grand Finale Review synchronization, 7 Thief artwork fronts, Primal Strike Physical VFX + SFX pipeline. See `qa/rc32/RC32_SAME_VERSION_UPDATE_2026-11-07.md`. All changes integrated in this RC32 ZIP, not merely staged. OSA unchanged. Controlled Chromium regressions: Counter 15/15, EXP 5/5, Unified Discard 26/27 (1 existing Escape Arrow failure, also on unmodified RC32), Review 8/8, Primal VFX routing 1/1. Full natural match and native Firefox NOT VERIFIED.


## RC32 SAME-VERSION FOLLOW-UP — Escape Arrow QA fixture (2026-11-07)

The previously reported 26/27 Unified Discard test result was **an invalid test fixture**, not verified product behavior. `buildInitialMatchState()` deliberately has empty physical Mana Pools, so assigning `s.aiMana=30` could not pay for the synthetic AI Slash and never opened its Response Window. The old test also mutated Hero Card IDs without rebuilding lineage/instance identity. Updated only embedded `GL_V511_ESCAPE_ARROW_QA_SELF_TEST` fixture: real `heroState()` for both Heroes and transfer exactly three physical AI Shards from Deck to Pool. `commitPlayedCard` must succeed before expecting Escape Arrow. After this adjustment, **Unified Discard 27/27 PASS**, EXP 5/5, Counters 15/15, Review 8/8, Primal Strike VFX routing PASS; **full natural match / Firefox / audible SFX NOT VERIFIED**. No gameplay engine behavior changed; original RC32 backup retained. See `qa/rc32/RC32_ESCAPE_ARROW_REGRESSION_CORRECTION_2026-11-07.md`.
