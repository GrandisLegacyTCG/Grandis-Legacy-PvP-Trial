> **PvP v3.72 note (2026-10-04):** These are retained VS AI runtime wiring/history notes. The active PvP release is **v3.72**, with VS AI v6.90.7 battlefield/decision presentation selectively adapted through the PvP boundary while the server remains authoritative; current release details live in the repository-root `BUILD_NOTES.md`.

# Grandis Legacy — VS AI v6.80 — Runtime Wiring Notes

Promoted from Option B Runtime Wired v6 — New UX Stage 1.5.14 on 2026-10-02. Promotion itself introduces no additional gameplay or UX changes.

## Architecture lock
- Original Option B DOM/CSS remains the battlefield/layout base.
- Existing VS AI runtime remains the gameplay/rules authority.
- `option-b-runtime.js` is the adapter/interaction layer; it must not reconstruct Option B geometry.
- Existing VS AI gameplay visuals that were not explicitly redesigned are preserved/reused where possible.

## Response / action chain
- Opposing Attack, Event, and Item actions that open a Response Window now hard-pause for the player.
- `PASS` uses the single contextual action slot beside `NEXT PHASE`.
- Legal Reaction/DEF cards expose persistent `PLAY` buttons in Hand.
- Response payment/additional discard continues through the same no-popup Hand/Mana controls.
- Active Card shows the current/top action in the chain; when the top response resolves it falls back to the underlying action.
- The last resolved Active Card stays visible until the phase changes.
- Event/Item responses such as Scouting do not auto-resolve just because the player has zero legal Reaction cards.

### Root cause fixed
The legacy runtime previously used render suppression as a headless flag and auto-passed PLAYER Response Windows. External-human-UI ownership is now separated from legacy-render suppression, so Option B can hide the old renderer while still owning the player's real Response decisions.

## Attack / targeting visual
- Uses the existing VS AI attack-direction visual language: thin gold path, Blade marker, high layer that may pass over the phase tracker.
- The line persists for the full target Response Window instead of disappearing after a short animation.
- Redirect updates the same line to the new target.
- Multi/Area Attack resolves one target at a time through the runtime's existing sequence: target line -> response -> result -> next target.
- Targeted card visualization follows the New UX Fix 8 anchoring rules documented below; duplicate target copies are not used.
- Runtime `legal_targets` is the targeting authority.
- Logical lane binding follows the old VS AI order on both sides: LEFT / CENTER / RIGHT = visual slot 0 / 1 / 2. Option B's old mirrored lane labels are hidden.

## Temporary played cards
- Event/Item action cards may appear once on a Hero anchor. Hero Skill cards remain in Active Card and use line/arrow targeting without a smaller battlefield duplicate.
- Multiple cards from the same source stack downward with a small offset so earlier cards remain visible.
- They are temporary combat/action visuals, not Attachments.
- Cleanup to Discard/other destination happens after the relevant chain fully resolves.
- No-source actions with a Hero target anchor their card on that target; actions with neither Hero source nor Hero target use Active Card only.

## Active Card / Card Played sidebar
- Active Card follows the current/top action and then retains the last resolved action until phase change.
- Active Card card art uses the full internal width authored by Option B.
- Card Played only receives resolved actions, not the currently active chain.
- Card Played reserves the original Option B 3 x 2 geometry, so two rows remain available.

## Hero area / Exhaust / EXP
- Hero-card dimensions stay Option B dimensions.
- Hero micro-UI/state placement follows the proven VS AI behavior: status/info on the Hero area, class/racial controls in their established positions, and overlays remain upright.
- Physical Hero + EXP layout copies the old VS AI physical-stack behavior.
- Exhaust uses the old VS AI `rotate(-90deg)` physical Hero orientation.
- Ready EXP stack stays on the Hero's right edge.
- Exhausted EXP edges move with the physical Hero package using the old VS AI geometry.
- HP bar / HP number / status / racial-class controls stay upright and do not rotate with the physical card.
- Exhaust presentation is delayed until the action/response chain finishes resolving.
- Tribute keeps the visible EXP/card-stack presentation instead of collapsing to numbers only.

## Hand
- No added stroke/border around the Hand.
- Legal actions keep persistent `PLAY`, `TRIBUTE`, or `DISCARD` buttons above the relevant card.
- The card + action button behave as one hover interaction unit, including the Option B hover leave delay, so moving to the button does not flicker the card.
- Original Option B fan geometry is kept for 1-7 cards.
- The 8-card Hand has an explicit symmetric fan so the right-most card no longer falls out of the fan.
- A bounded fallback is used only for temporary >8-card states before cleanup.

## Mana payment / Shards
- Every paid PLAYER action stops at Mana Payment before commit.
- Normal Mana Shards are auto-selected and rise above baseline.
- Legal Class Shards can be clicked; selected Class Shards rise and redundant normal Mana Shards return to baseline.
- Selected Shards are never pushed below the normal baseline.
- Selected Shards may overflow above the Mana container; they are not clipped.
- Shard-count badge stays above all Shard layers.
- `PAY` is the commit gate. Pre-commit `CANCEL` remains available in the contextual action slot.
- Spend-all-Mana actions use the same payment surface.

## Opponent Shard discard / steal
- Before blind opponent-Shard selection, candidate Shards are shuffled/randomized to destroy positional memory.
- All candidate Shards render face-down.
- Selection is made from the card backs and only then committed/resolved.

## Reposition
- `REPOSITION` only appears when the action is available.
- Entering Reposition mode changes the contextual action button to `CANCEL`.
- Swap markers use the existing VS AI `engine/assets/lobby/Swap.png` asset.
- Swap markers are positioned at the midpoint between each legal adjacent pair.
- Cancel/resolve removes the markers without shifting the phase tracker.

## Phase tracker
- Uses the locked Option B geometry.
- Current phase receives the authored gold active state.
- Contextual button changes (`REPOSITION` / `CANCEL` / `PASS`) do not move phase labels.

## Allowed popups
Off-field/pile choices intentionally remain popups and use the proven VS AI choice-panel structure rather than the oversized custom Option B modal. Examples:
- Main Deck search/selection
- Legacy defeat / Legacy Deck choice
- hidden pile card choices
- Crystal Ball reorder

Direct battlefield/Hand choices remain popup-free.

## AI pacing
- Existing VS AI AI-director sequencing remains enabled; renderer suppression does not switch AI to an immediate-result path.
- Area/Multi Attack uses the existing serial target sequence rather than resolving all affected Heroes at once.

## Validation performed
- `option-b-runtime.js` JavaScript syntax check passed.
- Static integration assertions verify the locked Option B base, old VS AI lane order, response ownership split, Event/Item response gate, common target line + arrow marker, physical Hero/EXP package, Shard overflow/count layering, persistent Hand actions, 8-card fan, 2-row Card Played reserve, full-width Active Card, hidden lane labels, and existing Swap asset.
- Browser validation was completed through an intercepted local-resource harness because direct local navigation is sandbox-blocked; final human visual review can still be done in Firefox/Chrome using `index.html`.


# New UX — Fix 8 pass (2026-09-30)

## 1. Relentless Leveling — remove Hand popup
- Keep the runtime order: PLAY -> choose source Hero -> PAY MANA.
- After Mana is committed, the Hand itself becomes the choice surface.
- Every legal non-Ultimate Skill candidate receives the existing `TRIBUTE` button; no new UX vocabulary is introduced.
- Clicking `TRIBUTE` selects that card but does not resolve yet.
- Only the Hero already selected for Relentless Leveling becomes clickable. Clicking that same locked Hero confirms the choice and resolves the EXP tribute.
- The normal Reform Tribute tracker is not consumed; gameplay resolution still uses the existing v6.48 `card_search_choice` / `source_exp` runtime path.

## 2. God's Blessing — remove Hand popup
- Keep the runtime order through source selection and Mana payment.
- The required other Hand card is selected directly in Hand with the existing `DISCARD` button.
- Clicking `DISCARD` selects and commits the existing `discard_then_draw_three` runtime choice.
- Deck / Discard / Legacy Deck choices remain popup-based.

## 3. Scouting battlefield visualization
- Scouting is rendered only once on the battlefield, anchored to its source Hero.
- The target Hero never receives a duplicate Scouting card.
- Source-to-target relationship is shown by one target line ending in the common arrow marker.

## 4. Common target arrow
- The Blade/sword endpoint marker is removed.
- Attack and other targeted source-to-target visuals use the same simple gold arrow marker.

## 5. Item / source-less card anchoring
- Source Hero + target Hero: card anchors at source, with a line/arrow to target.
- Source Hero only: card anchors at source.
- No source Hero + target Hero: card anchors at the target Hero.
- No source Hero + no target Hero: no battlefield duplicate; the action appears only in Active Card.

## 6. Functional HP bar
- Option B now copies the established VS AI v6.48 HP behavior.
- Bar length scales from current HP / Max HP.
- `>60%` = green, `41-60%` = warning yellow, `<=40%` = low red.
- HP text and bar remain upright outside the rotating physical Hero package.

## 7. Hero Skill visualization
- Hero Skill cards are not duplicated as smaller battlefield cards.
- The Skill remains visible in Active Card while the source/target relationship is communicated directly by the line + arrow.
- Event/Item battlefield cards continue to use the anchoring rules above when a Hero anchor exists.

## 8. Legacy defeat confirm
- `Choose Legacy` remains a popup.
- `Enter Legacy Mode` now recognizes a selected Legacy whether `selected_index` arrives as a number or numeric serialized value.
- Once selected, the button enables and commits through the existing mandatory Legacy runtime gate.

## UX Fix 8 validation
- `option-b-runtime.js`: `node --check` PASS.
- Direct browser harness loaded the full runtime with zero page errors.
- Relentless Leveling end-to-end UX path validated: source selection -> Mana payment -> 2 Hand `TRIBUTE` candidates -> selected card -> locked source Hero click -> +100 EXP -> source Event discarded exactly once.
- God's Blessing end-to-end UX path validated: source selection -> Mana payment -> direct Hand `DISCARD` -> draw 3 -> source card discarded exactly once.
- Visual renderer assertions validated:
  - Hero Skill: 0 battlefield card duplicates + target line.
  - Scouting: exactly 1 battlefield card at source + target line/arrow + 0 target duplicate.
  - target-only Item: exactly 1 battlefield card at target + no source line.
  - source-less/target-less Item: 0 battlefield card duplicates; Active Card only.
- HP regression validated at 20/100: red low state + `scaleX(0.2)`.
- Legacy mandatory choice validated with Runtime Authority OPEN ledger: select -> button enabled -> Enter Legacy Mode -> pending cleared -> Legacy mode entered -> ledger RESOLVED.
- Existing bundled engine QA failures were checked against the unmodified RuntimeWired v6 baseline and are identical there; this UX pass does not introduce those baseline failures.

## UXFix8.1 correction — 2026-10-01
- Corrected targeted Hero Skill visualization after UXFix8: the played Skill card remains above its source Hero (for example, Shield Bash above Aurex).
- The source-to-target connector uses only the line + arrow at the target. The played card is never duplicated at the end of the line.
- Source-less targeted Item/Event behavior from UXFix8 is preserved: anchor the card on the Hero target; cards with no Hero source and no Hero target remain Active-Card-only.

## UXFix10 — fixes #9 and #10 — 2026-10-01

### 9. Response payment: show DISCARD only when discard is actually required
- `response_payment_choice` no longer automatically puts the Hand into DISCARD mode.
- Hand DISCARD actions are rendered only when `required_discard_count > 0`.
- Mana-only Defense/Response cards such as Deflect now show only the Mana payment flow.
- Existing discard-cost responses still expose only their legal discard candidates.

### 10. Choose Legacy: explicit selection before Enter Legacy Mode
- Fixed the Option B null-selection bug where `selected_index: null` was coerced to index `0`, making the first Legacy look pre-selected.
- A newly opened Choose Legacy popup now starts with no Legacy selected and `Enter Legacy Mode` disabled.
- The player must click `Select` on a Legacy card first. Only then is `Enter Legacy Mode` enabled and allowed to commit the mandatory Legacy replacement.
- This preserves the existing Legacy popup and runtime authority/commit path; only the Option B selection-state interpretation was corrected.

### UXFix10 validation
- `option-b-runtime.js`: `node --check` PASS.
- Selection helper assertions: `null`/`undefined` -> no selection; numeric `0` -> first Legacy selected.
- Response discard predicate assertions: `required_discard_count = 0` -> no Hand DISCARD mode; values above `0` -> discard mode enabled.



## UXFix15 — collected UI batch #1–#5 — 2026-10-01

### 1. Phase tracker height
- Reduced the Option B phase tracker to 32px with tighter vertical padding.
- Context action buttons inside the tracker were reduced proportionally so the tracker clears the Deck / Discard / Legacy count badges without changing its horizontal layout.

### 2. Choose Legacy: one-click selection / direct reselection
- The Legacy modal keeps its DOM nodes stable while the choice state is unchanged, instead of rebuilding the card buttons during the short polling render loop.
- One click now registers `Select` immediately.
- With multiple candidates, clicking another Legacy moves `Selected` directly to that candidate; no separate deselect step is required.
- `Enter Legacy Mode` remains disabled until an explicit Legacy selection exists.

### 3. Legacy Mode has no Hero HP UI
- Option B now suppresses/removes the HP overlay entirely while a slot is in `legacy_mode`.
- Legacy cards never show an HP bar or `0/0`, matching the VS AI rule/presentation that Legacy is not a Hero and has no HP.

### 4. Contextual action buttons register on one click
- SWAP buttons are now preserved across polling renders when the legal swap descriptor set has not changed; only their geometry is recalculated.
- Hero contextual action nodes are likewise preserved while their action signature is unchanged.
- This covers SWAP, activated Class Ability, Racial Trait, Legacy Ability, and response Hero-action buttons that use the same Option B action area.
- The change prevents a pointer press from landing on a button that is replaced before the matching click event is delivered.

### 5. Played/response card visualization follows Hero identity after Reposition
- Runtime response options now retain `source_card_id` for the Hero that actually used the response/ability.
- Option B resolves that Hero identity back to its current battlefield lane on every render.
- A response such as Deflect therefore remains visually attached to the Hero that used it even if that Hero Repositioned earlier; cached/original lane data is only a fallback.
- The same source-identity remap is applied to retained combat cards and target-line context.

### UXFix15 validation
- Browser harness: phase tracker computed height = 32px.
- Legacy Mode browser assertion: Legacy slot class active and `.ob-hp-overlay` absent.
- Choose Legacy browser assertion: first click selects; clicking a second candidate moves selection directly and enables confirm.
- SWAP browser assertion: button node remains stable across polling; one click swaps LEFT/CENTER and clears pending choice.
- Racial Trait browser assertion: button remains stable; one Ancestral Focus click spends 1 Racial Token and adds 2 Shards.
- Activated Class Ability browser assertion: Holy Resurgence button remains stable; one click opens `hero_ability_target_selection`.
- Reposition/source-identity browser assertion: a deliberately stale Deflect `source_lane` is remapped by `source_card_id`, and the Deflect battlefield card renders on Draxen's current lane rather than the old lane.
- All 8 JavaScript files: `node --check` PASS.


## UXFix23 — collected UI/runtime batch #1–#8 — 2026-10-01

### 1. Selected Mana / Class Shard visual cleanup
- A selected Shard still rises to show payment selection.
- Removed the extra gold selection glow/shadow.
- Selected Shards now use the same normal drop shadow as unselected Shards.

### 2. Phase tracker vertical centering
- Kept the 32px tracker height from UXFix15.
- Shifted the whole phase strip down 4px so its visual gap between the upper and lower battlefield is more balanced while retaining Deck/Pile badge clearance.

### 3. EXP stack follows Ready / Exhaust smoothly
- Ready/Exhaust rotation is now applied to the physical Hero + EXP package as one group.
- EXP no longer switches instantly between separate ready/exhaust geometries while the Hero animates.
- The existing Hero rotation easing is retained, and the EXP stack remains physically attached during the transition.

### 4. Event / non-Skill payment may manually use Class Shards
- Mana Shards remain the default/recommended automatic remainder payment.
- Any available Class Shard is now exposed as a manual payment choice for paid Event/non-Skill cards.
- A Class Shard used for a non-Skill payment counts as 1 Mana.
- This is an explicit requested runtime behavior override from the current Source Authority v1.9.5 generic-first wording; Source Authority files themselves are not modified in this package.

### 5. Magic Compass / explicit-choice popup starts truly unselected
- Option B no longer coerces `selected_index: null` into card index 0.
- A single-select `card_search_choice` opens with no card visually selected and Confirm disabled.
- The first explicit click selects the card; clicking another choice moves selection directly.

### 6. Double Casting / repeated attack / multi-target connector parity
- Target connector state now tracks the currently resolving attack instance.
- Double Casting keeps the visual combat chain alive while choosing/entering activation 2.
- A new response window for activation 2 gets its own line/arrow exactly like activation 1.
- Multi-target attacks read the full affected-lane sequence and render a connector to every affected target while keeping one played card at the source.

### 7. Paid nested Response / Intercept always requires explicit PAY
- Every paid PLAYER Response now enters `response_payment_choice`, regardless of whether it is a Skill, Event, Item, first response, or nested counter-response.
- No player card with Mana Cost > 0 is silently auto-paid inside a response chain.
- Zero-cost Responses still skip Mana payment when no other mandatory cost exists.
- Response payment also exposes Class Shards as manual choices, using the same value rules as normal payment.

### 8. Source-less targeted Item anchors to the correct side
- Removed the response-window fallback that could fabricate a second copy of the same incoming source-less card.
- When an `incoming_card` already carries its canonical `action`, only that action is rendered.
- Pending response-window state is no longer interpreted as an independent played-card action.
- A source-less targeted Item such as AI Health Potion therefore anchors once to its actual AI target Hero, not the PLAYER Hero in the same lane.

### UXFix23 validation
- All 8 JavaScript files: `node --check` PASS.
- Custom executable engine QA PASS:
  - paid Event exposes Class Shards for manual selection; selected Class Shard contributes exactly 1 Mana;
  - paid PLAYER Intercept enters explicit `response_payment_choice`;
  - Magic Compass engine choice starts with `selected_index: null`.
- Adapter QA PASS:
  - source-less AI Health Potion produces one canonical action anchored to AI/AI target side;
  - repeated attack context uses the current attack target;
  - multi-target response sequence returns connectors for every affected lane;
  - Double Casting target-selection continuation keeps the combat visual chain active;
  - null popup selection is not treated as index 0.
- CSS/runtime assertions PASS for Shard shadow cleanup, phase 4px vertical shift, and grouped Hero+EXP Ready/Exhaust rotation.
- The legacy v6.42 full integration QA still reports the pre-existing RuntimeWired UXFix15 AI Warp Scroll self-test failure; reproducing the same test against the unmodified UXFix15 package produces the identical failure, so it is not introduced by this UXFix23 batch.

## New UX Stage 1 — parity batch #1, #3, #4, #5, #7, #10, #13, #16 — 2026-10-01

This stage continues from UXFix23 and intentionally does not implement the later-discussion items (Game Result, Coin Flip, Casting pair highlight, terminal defeat presentation) or the explicitly excluded Scouting EXP picker, Tutorial integration, full card modal, and dedicated mobile UX.

### #1 Multi-card discard selection persistence
- Direct-Hand discard choices now expose their current engine selection state in the New UX Hand.
- A selected discard-cost card stays lifted using the existing selected/hover geometry.
- Its contextual action changes from `DISCARD` to `CANCEL`.
- Clicking `CANCEL` toggles that selection back off.
- Applied to `hand_limit_discard`, `response_payment_choice` discard costs, and `legacy_cost_selection`.
- Existing runtime commitment timing is preserved; this change does not invent a second discard rules flow.

### #3 Inspect Discard Piles
- Player and opponent Discard Piles are clickable when no pending gameplay decision is active.
- Inspection uses the established Option B / VS AI choice-overlay shell rather than adding a new popup family.
- Both Discard Piles are treated as public information and show the actual current pile contents.

### #4 Inspect Player Legacy Deck
- The player's Legacy Deck is clickable when no pending gameplay decision is active.
- It displays the current player Legacy Deck contents in the same inspection shell.
- Opponent Legacy Deck remains non-inspectable from this direct battlefield action.

### #5 Inspect Hero underneath Legacy
- Legacy slots render the current VS AI-style `!` information control whenever `defeated_hero_snapshot.card_id` / fallback original Hero id exists.
- The control opens an inspection view of the defeated Hero underneath the Legacy.
- Legacy remains HP-less; this does not reintroduce Hero HP UI into Legacy Mode.

### #7 Lobby / Deck Setup
- Option B no longer auto-starts a match immediately on boot.
- A New UX Deck Setup overlay is shown first.
- Uses the current VS AI starter authority (`getStarterDeckOptions`) for both Player and AI selections.
- Custom JSON import routes through the existing VS AI deck normalization/validation path.
- Invalid imported decks return the runtime validation error in the lobby.
- Deck formation preview is shown for LEFT / CENTER / RIGHT.
- Start Match uses the chosen/imported decks and currently calls `startLocalMatch('PLAYER')`.
- Opening Coin Flip is deliberately deferred to its own later stage; Stage 1 does not silently implement it.

### #10 Sound system
- The existing bottom `Sound On/Off` button now reads and toggles the current VS AI card-motion sound setting.
- The underlying current VS AI storage key and persistence behavior are retained.
- External Option B presentation is permitted to use the current battle audio and card-motion audio while the legacy battlefield renderer remains suppressed.
- Runtime media paths are wired to the packaged `engine/assets/audio/...` files.

### #13 Animation / presentation parity layer
The old battlefield renderer remains suppressed. Instead, compatible current VS AI presentation behavior is surfaced through the Option B DOM:
- Turn-change banner.
- Main Deck -> Hand draw motion for new authoritative draw events after initial presentation priming.
- Shard Deck -> Shard Pool motion when a new Shard enters the pool.
- Legacy Deck -> battlefield transition cue for Legacy entry and Hero Rank image transitions.
- Reposition destination feedback flash.
- Current VS AI battle feedback VFX/SFX for Physical/Magical attacks, block/defense, dodge, damage pulse, and healing.
- Option B Hero physical stacks are exposed as `.hero-card-anchor` targets so the current battle-feedback runtime resolves the correct live Hero geometry.
- Runtime media paths are wired to the packaged `engine/assets/battle/...` and `engine/assets/audio/battle/...` files.

### #16 Mana Regen visual counter
- Each Shard Deck receives a Mana Regen badge at the upper-left.
- Uses the existing `engine/assets/counters/Counter-1.png` through `Counter-6.png` assets.
- The Shard Deck count remains in its existing upper-right count badge.
- Counter updates from live `manaRegen` / `aiManaRegen` state.

### Stage 1 validation
- Browser DOM harness PASS:
  - Lobby is shown before battlefield and hides the battlefield underneath it.
  - 5 current starter options are available for PLAYER and AI.
  - Changing a starter selection updates the runtime deck setup state.
  - Start Match closes the lobby and produces a live PLAYER match.
  - Valid current starter JSON import succeeds; invalid `{}` import is rejected with `missing default_formation` validation.
  - Player Discard inspection opens and closes correctly.
  - Player Legacy Deck inspection opens and renders all 12 current Legacy Deck cards.
  - Legacy-under-Hero `!` control opens the defeated Hero inspection view.
  - Sound button toggles the live VS AI sound-enabled state.
  - PLAYER and AI Shard Decks each render a live Mana Regen counter.
- Multi-discard browser state PASS:
  - with `required: 2`, selecting the first card produces one persistent lifted selected card and changes its button to `CANCEL`;
  - clicking `CANCEL` returns the selection to empty.
- Presentation browser state PASS:
  - injected authoritative draw event creates one temporary `.ob-flying-card` Deck -> Hand motion and cleans it up after completion;
  - Shard pool gain creates one temporary Shard Deck -> pool motion;
  - battle-feedback harness resolves an Option B `.hero-card-anchor`, creates current VS AI Physical Attack VFX using `engine/assets/battle/P.Attack.png`, applies the damage pulse, then cleans up the VFX.
- Static media-path check PASS for all Stage 1 Counter, card-motion audio, battle VFX, and battle SFX assets.
- Baseline engine self-check comparison: the pre-existing `testGameplayFoundationFixes`, `testV69SourcePendingAudit`, `testRoundAdvanceAfterEnd`, and `testUnbrokenStandClassRows` results are identical to UXFix23; no new regression was introduced by Stage 1. `testPlaytestManaRules`, `testDefeatCastingCleanupRevive`, and `testCandidate6ResponseOwnerFlow` remain PASS / expected.


## New UX Stage 1.1 hotfix — Scouting direction + sequential Draw — 2026-10-01

### Scouting target direction
- `scouting_exp_selection` now explicitly provides its already-locked source Hero and target Hero to the Option B connector renderer.
- AI Scouting can finish its EXP selection before an Option B paint occurs. When Scouting is still the latest resolved action / Active Card in the current phase, the renderer therefore falls back to the authoritative played-event source/target snapshot and keeps the line + arrow visible.
- The Scouting card remains single-instance at its source Hero; this hotfix does not reintroduce a duplicate card at the target.

### Sequential draw presentation
- Stage 1 originally started each draw animation only 55 ms apart while each motion lasted ~360 ms, causing multi-draw effects to visually fire at the same time.
- Draw presentation now uses a serial callback queue: one Main Deck -> Hand card motion completes, waits 50 ms, then the next begins.
- Shard gain presentation begins only after the Main Deck draw sequence has completed and is itself serial (390 ms motion + 55 ms cadence), matching the current VS AI presentation order more closely.
- Gameplay state remains authoritative in the v6.48 runtime; this is a presentation-only sequencing correction.

### Stage 1.1 validation
- All 8 packaged JavaScript files pass `node --check`.
- Static QA confirms Scouting has both pending-target and latest-resolved-event connector fallbacks.
- Static QA confirms the previous overlapping `forEach(... i*55)` draw/shard animation launchers are removed and replaced by serial `runDrawSequence` -> `runShardSequence` queues.

## New UX Stage 1.2 hotfix — serial Area target cue + Class Shard visibility + Card Played detail — 2026-10-01

### Serial Area / multi-target connector
- The v6.48 runtime already resolves normal multi-target / Area Attacks as a sequence of per-Hero Response windows through `multi_sequence`.
- Option B previously expanded `multi_sequence.affected_lanes` and drew every queued connector simultaneously.
- When an active Attack has `multi_sequence`, Option B now uses only the authoritative current `target_lane` for its line + arrow.
- The next target receives its connector only after the previous Hero's Response frame resolves and the runtime advances the sequence.

### Class Shard visibility
- Visible Shard Pools are presentation-sorted as `Class Shards -> Mana Shards` while preserving original order inside each group.
- Class Shards receive a higher render layer than overlapping Mana Shards and a small 7 px visual lift.
- Selected Shards still use the existing payment selection lift and remain the highest layer.
- This does not mutate `playerManaPoolCards` / `aiManaPoolCards`; all gameplay/payment selection continues to address authoritative Shard UIDs.
- `opponent_mana_selection` is explicitly excluded from visual sorting so its shuffled face-down candidate order remains hidden-information safe.

### Clickable Card Played audit
- Recent `Card Played` tiles and `Full Card History` tiles are now real buttons.
- The engine exposes an Option B read-only `getCardPlayedDetail(side,eventId)` adapter.
- The adapter reuses the current VS AI combined Card Played grouping and `v94EventDetailHtml`, including linked chain/response detail.
- Clicking a response event that belongs to a combined chain resolves back to the same authoritative combined action group when available.
- The Option B detail overlay is presentation-only and does not mutate runtime state.

### Stage 1.2 validation
- All packaged JavaScript files pass `node --check`.
- Static QA confirms multi-target `multi_sequence` connector rendering uses only current `target_lane`.
- Static QA confirms Class Shard visual grouping/layering is UID-based and blind opponent Shard ordering is untouched.
- Static QA confirms recent and full-history Card Played tiles call the current VS AI detail adapter.

## Stage 1.3 notes
- Input isolation: Option B Hero/ability handlers stop bubbling into the suppressed legacy UI event layer after state changes.
- Presentation reveal queue: newly drawn Hand cards and newly gained Shards are temporarily deferred/hidden and revealed one at a time after their own motion finishes.
- Legacy transition detection checks whether the same visual Legacy identity was already on the battlefield before playing an entry animation.
- Inspect hover is local to modal context and does not reuse the battlefield hover container.


## Stage 1.4 hotfix — 2026-10-01

### Attachment counter parity
- Attachment counter lookup now follows the current VS AI authority chain: attached record -> pending Casting record -> active Attachment record -> source-linked status fallback.
- String-only Hero attachment slots therefore still show a counter when the authoritative counter lives in `pendingCastings` or `activeAttachments`.

### Rank Up presentation sequencing
- In external-human-UI mode, the engine skips its own Rank-Up Legacy-to-field and EXP-to-Discard motions so Option B does not render duplicate/conflicting Rank animations.
- Option B detects the actual Rank transition, derives the EXP cards moved to Discard from the state delta, hides the final Rank card/HP until arrival, animates EXP to Discard, then the new Rank card from Legacy Deck, and only then begins sequential Rank reward Draws.
- Card-motion SFX begins with the corresponding EXP / Rank / Draw visual step.

### Shard Pool deterministic layout
- Class Shards stay left; Mana Shards stay right.
- Final card spacing is recomputed after battlefield geometry sync, window resize, Shard reveal, and every relevant Mana rerender.
- Layout uses the live Mana Pool width rather than a stale pre-sync width, eliminating the intermittent compressed Mana stack.

### Connector timing
- `mana_shard_payment_choice` and `mana_spend_choice` are pre-commit states and do not render a source-to-target connector when no Response Window exists.
- After payment commits and an opponent decision/Response Window exists, the connector is rendered normally.
- `response_payment_choice` continues to preserve the incoming attack connector because that opponent decision chain is already active.

### Validation
- All 8 JavaScript files: `node --check` PASS.
- Browser harness assertion: Tornado string attachment + pending Casting counter renders `1`.
- Browser harness assertion: one Class + five Mana Shards keeps identical left positions across repeated render/resize cycles.
- Browser harness assertion: initial Mana payment renders 0 target connector paths; an active incoming-attack Response Window renders 1.
- Rank-Up browser harness: final Hero is hidden during the Rank sequence, EXP discard motion precedes the Rank-card arrival, and Rank reward Hand cards reveal sequentially afterward.


# Stage 1.5 approved five-point hotfix (2026-10-01)
- Hand Draw sequencing is protected from the 120 ms Option B polling renderer so old Hand cards remain visible while only incoming cards animate/reveal one at a time. Opening Hand events remain non-animated; live Draw Phase and Rank Up reward Draws use the same sequence.
- Legacy engine attack-direction SVG is disabled while Option B owns the battlefield connector layer; this removes stale/pre-payment arrows and prevents duplicate arrows after PAY.
- `computeManaPayment` now chooses generic Mana Shards from the right edge first (LIFO visual order). Option B's selected-Shard highlighting mirrors this order for normal and Response payment.
- Execute's non-damage defeat response list is filtered to Negate/Cancel families only; Dragon Scale rejects all `cannot_block` incoming actions.
- Authored prototype cards/history/active-card content is cleared before live use and `.app` starts hidden so the old dummy battlefield cannot flash on `index.html` load.

Validation: all 8 JavaScript files pass `node --check`; static assertions confirm Stage 1.5 hooks are present. Direct browser navigation is blocked by the execution sandbox, so final visual playtest remains the packaged `index.html` in Chrome/Firefox.


### Stage 1.5.1
- Player Hand uses stable fan hitboxes. Hover/selected motion no longer transforms the hitbox itself; only the card art and contextual actions move.


### Stage 1.5.2 — Firefox Hand hover regression
The Stage 1.5.1 CSS-only fix was insufficient in Firefox because overlapping fan cards still allowed native `:hover`/z-index hit-testing to feed back into the visual state. Stage 1.5.2 makes hover state explicit via pointerenter/pointerleave, removes the pseudo hover catcher, keeps action controls fixed relative to the stable hitbox, and persists the hovered index through runtime hand rerenders.

## Stage 1.5.3 Hand hover fix
Player Hand hover now keeps the outer fan hitbox stationary and moves the card artwork and contextual action buttons together inside a single visual group. This removes Firefox hover oscillation without detaching PLAY/TRIBUTE/DISCARD controls from the card.


### Stage 1.5.4 — Hand hover root-cause fix

A reproduction harness that forcibly rebuilt the Hand every 120 ms matched the video cadence. The wrapper itself was moving because `.hand-card { transition: .14s ease; }` re-ran its fan transform whenever DOM nodes were recreated. Stage 1.5.4 disables transitions on the outer Hand wrapper, retains explicit hover state across rerenders, and keeps lift animation isolated to `.ob-hand-visual`.

## Stage 1.5.5 hover alignment hotfix
- Fixed the remaining horizontal Hand jitter seen in Firefox after Stage 1.5.4.
- Root cause: player Hand centering was re-measured and cumulatively corrected every 120 ms render tick, producing a transient ~3 px whole-Hand oscillation.
- Hand centering is now absolute/idempotent and runs on actual Hand/geometry changes, not every gameplay render poll.
- Hover lift behavior from Stage 1.5.4 is otherwise unchanged.

### Stage 1.5.6 Hand rollback
The Player Hand subsystem was reverted to Stage 1.4 behavior only. This intentionally removes the Stage 1.5.x Hand-hover experiments while retaining later non-Hand fixes (including Execute response filtering, Mana LIFO payment behavior, connector ownership, and initial dummy-state cleanup).


## Stage 1.5.7 focused fix — Shard block + authoritative Hand Draw

### Shard Pool
- Three fixed visual Class slots are reserved at the left edge of each normal Shard Pool.
- Mana begins directly after that fixed Class block and remains contiguous; it is no longer anchored to the far-right edge when Class slots are empty.
- Mana spacing stays natural while it fits and compresses only when required by available width.
- Blind opponent-Shard selection uses a separate contiguous hidden layout and does not expose Class grouping.

### Hand Draw
- The Stage 1.4 Hand fan, hover handlers, and centering functions remain byte-equivalent to Stage 1.4 where not directly required for draw-slot masking.
- Draw Phase uses the current VS AI authority pattern: reserve Main Deck top card -> render an invisible destination slot -> animate card back -> commit the reserved draw -> reveal actual Hand card -> continue Mana Regen.
- The same external draw reservation is allowed even while the legacy renderer is suppressed, so Option B no longer has to infer the Draw Phase card after state has already advanced.
- Rank Up / other committed multi-draw events follow the current VS AI hidden-token principle: only new Hand slots are hidden in-place (layout is preserved), Rank transition finishes first, then draw cards reveal sequentially.
- Card motion remains at the faster New UX 360 ms speed.

### Scope
Only Shard Pool layout and Hand Draw presentation were changed for this build.


## Stage 1.5.8 UI polish
- Replaced the three-full-slot Class-Shard reservation with a compact Class stack; Mana starts directly after the real Class footprint. Blind opponent-Shard layout remains isolated.
- Rank transition plans now retain `fromId`; Option B renders the prior Hero art as a temporary physical stack layer until the new Rank card arrives.
- Added a visible Option B Card Review modal. Hero and Hand double-click use it instead of the hidden legacy-engine preview host.
- Hero single-click gameplay actions are separated from double-click review with a short single-click commit guard, preventing the first click of a double-click from selecting a gameplay target.
- Native card image dragging and selection are suppressed to eliminate Firefox/desktop blue drag ghosts.
- Card Played and Full History tiles stop propagation and open detail on the first click.


## Stage 1.5.9 New UX update — 2026-10-02

### Contextual Hero actions
- `draw_replacement_choice` is rendered in the source Hero box. `pending.abilityName` is the displayed positive action, and the existing `commitDrawReplacementChoice(true/false)` functions remain the only runtime commits.
- `optional_magical_surge` keeps the existing engine flow and displays the current Hero card's authoritative `class_ability.name` (`Mana Surge` / `Arcane Surge`) instead of `USE`.
- Hero action wrappers retain their signature cache, so unchanged buttons are not recreated by the polling renderer.
- Response options with `racial_ability` display the resolved Hero racial-trait name. Class/Hero ability availability sets `ob-class-ability-ready`; Racial Trait availability sets `ob-racial-trait-ready`. Button styling has no availability glow.

### Alden Draw counter
- The counter is present only when the current authoritative Hero card has a Class Ability action whose effect contains `draw_replacement_shuffle_redraw: true`.
- Counter value is read from `state.cardsDrawnThisTurn[side]`; no independent UI counter is maintained.

### Casting visual state
- Target lane highlighting is resolved from `state.pendingCastings[].target_side` and `locked_target_lane || target_lane`, so it follows the locked position rather than the current Hero occupant.
- Attachment source highlighting matches authoritative pending Casting records by card, side, attachment slot, and source Hero/lane identity.
- Casting visual state is presentation-only; no counter, cancellation, target, or release logic is changed.

### Card Review / Card Played
- Option B Card Review consumes `window.GL_CARD_PREVIEW_QA.html(cardId)`, the current engine readable-card renderer, with a local fallback to card art if the helper is unavailable.
- `Card Played` and `Full Card History` keep DOM nodes stable until the event signature changes. This removes the polling-render click race while preserving existing `getCardPlayedDetail` authority.

### Hand / Shard layout
- Both Hand fans calculate rotation/lift from the actual current rendered slot count; the player and opponent use mirrored transforms.
- Shard layout changes only `classToManaGap` from the Stage 1.5.8 positive gap to `-2`, producing a 2 px visual overlap between the final Class Shard footprint and first Mana Shard. Shard ordering, UID selection, and payment code are untouched.

### AI pacing
- Option B exposes `GL_OPTION_B_PRESENTATION.isBusy()`. The AI director includes it in `aiDirectorWaitForAnimations`.
- Settle timing is measured as continuous idle time: if engine or Option B animation becomes busy again, the settle clock resets. Draw keeps the existing 380 ms settle target after visible presentation has finished.
- This hook is used only by the AI director; player timing is unchanged.

### Stage 1.5.9 validation
- All 8 JavaScript files pass `node --check`.
- Static integration assertions pass for Alden Hero-box redraw/skip, Lucien named ability/skip, Hero glow categories, Alden Draw This Turn, both Hand fans, readable Card Review, stable history DOM, Shard `-2px` overlap, Option B AI-presentation busy hook, Casting target-lane glow, and Casting Attachment glow.
- Active runtime bundle changed only in the AI presentation-wait bridge; card rules, payment computation, target legality, Casting resolution, and card authority data are unchanged.


## Stage 1.5.10 correction pass — 2026-10-02

### Conditional glow lock
- `ob-class-ability-ready` is set only for Alden while `draw_replacement_choice` is open or Lucien while `optional_magical_surge` is open.
- `ob-racial-trait-ready` is set only for Aurex/Finnian when the current Player Response Window exposes their racial option, or Thrain while `racial_stoneblood` is open.
- Generic active abilities from `getHeroActions()` may still render their normal action buttons, but they do not set availability glow. This prevents passive/always-available Hero boxes such as Ancestral Focus / Human Ambition owners from glowing continuously.
- Casting remains independent: `ob-casting-target` follows the locked target position and `ob-casting-active` follows the live Casting attachment.

### Continuous Shard stack
- `renderPool()` still stable-sorts Class Shards before Mana Shards.
- `layoutManaPoolCards()` now computes one pitch from the full rendered Shard count and applies it to every Shard in DOM order. No Class-to-Mana gap variable or special Class step remains.
- Selection/payment authority, UID identity, blind opponent selection, and return order are unchanged.

### Alden information indicator
- The separate `.ob-draw-this-turn` badge is removed.
- `renderStatuses()` adds `Draw This Turn: X` to the existing Hero Information tooltip only when the current Hero card has the authoritative draw-replacement Class Ability marker.

### Response blocking repair
- `repairOrphanBlockingState()` is exposed through the local runtime intent bridge.
- Option B requests it only when the snapshot is objectively inconsistent: orphan `response_window` pending, ownerless live Response Window, or live Response Window missing its pending mirror.
- The repair does not clear any legitimate mandatory non-Response pending choice.

### Stage 1.5.10 validation
- All 8 packaged JavaScript files pass `node --check`.
- Static integration checks confirm the glow whitelist/timing, continuous Shard layout, Alden tooltip relocation, Response repair bridge, and Casting glow retention.


## Stage 1.5.11 parity integration — 2026-10-02

### Opening setup ownership
- Option B now separates match preparation, opening setup commit, and first-turn start through `prepareOptionBLocalMatch()`, `commitOptionBOpeningSetup()`, and `beginOptionBFirstTurn()`.
- Coin Flip is resolved before Opening Hand/Starting Shard presentation and determines the first side.
- Opening Hand cards and Starting Shards exist in the authoritative state before presentation but remain hidden in Option B until their individual animation reaches its destination.
- Presentation order is 6 paired Hand draws, then 3 paired Starting Shard draws. The New UX uses a faster 240 ms motion / 24 ms gap cadence than the source VS AI presentation.

### Lobby parity
- Existing VS AI formation mutation and rank-preview helpers are exposed to Option B rather than reimplementing deck logic.
- Player and AI can swap adjacent setup lanes, cycle Rank I/II/III previews, and inspect each package's three Hero ranks from the lobby.

### Terminal result
- Option B observes authoritative `gameOver`, `winner`, and `gameEndReason`.
- Result presentation includes winner/reason/round, Back to Lobby, and the VS AI 60-second automatic return.

### History / battlefield review
- Battle Log no longer truncates either runtime retention or rendering to 20 entries.
- Full Card History no longer truncates its local resolved-event cache to 80 entries, and the per-side engine played-event retention caps are removed for the local match.
- Double-click Card Review is intentionally battlefield-scoped. It is added to Attachments, legally revealed opponent Hand cards, and temporary combat cards; popup/inspect and sidebar surfaces keep their prior interactions.

### Legacy peek / identity label
- Legacy `!` uses pointer/focus enter/leave to swap only the visible battlefield image to the defeated Hero and restore the Legacy immediately on exit. It never opens an inspect popup.
- `PLAYER NAME` width/height is measured from `LOCAL AI · HAND` after geometry sync so both labels remain identical under UI scaling.


## Stage 1.5.12 corrections — 2026-10-02

1. Full VS AI lobby replaces the compact New UX lobby; top navigation shortcuts are omitted by request.
2. Opening Coin Flip is an opaque pre-battlefield screen.
3. Custom opening presentation owns all 6 Opening Hand + 3 Starting Shard motions. Opening-hand presentation events are marked handled and generic presentation is suppressed during this sequence. First-turn authority begins only after the final Shard settles.
4. Attachment review is delegated from the stable battlefield root using an identity/time two-click detector, surviving renderer node replacement.
5. AI/opponent Shard Deck Regen counter is bottom-right, opposite its deck-count badge.

## Stage 1.5.13 focused fixes

1. **Sidebar hover preview**
   - Sources inside the sidebar use a dedicated floating preview element attached to the sidebar and positioned to its left.
   - Preview size is 225×315 logical px, matching the existing battlefield hover preview.
   - Card Played / Full Card History single-click detail and Active Card behavior remain unchanged.

2. **Attachment double-click reliability**
   - Attachment DOM nodes are recreated during normal polling; therefore browser `dblclick`/`click` completion is not reliable in Firefox.
   - Review detection is delegated to the stable battlefield root on capture-phase `pointerdown`.
   - The gesture key is `side|lane|slot|card_id`, so a rerender between the first and second click does not reset the logical double-click.
   - Two primary-button presses within 650 ms open the existing Card Review; gameplay authority/state is untouched.


## Stage 1.5.14 focused fix — Scouting payment before EXP discard

1. `scouting_target_selection` now hands the chosen target directly to `commitPlayedCard`.
2. `commitPlayedCard` uses the existing `mana_shard_payment_choice` pre-commit gate; no EXP card is selected or moved before PAY.
3. After payment succeeds and the source card is committed, `applyImmediateEventItemEffects` auto-discards the first legal non-Ultimate EXP card from the chosen target Hero.
4. The Option B connector no longer has a dedicated `scouting_exp_selection` branch, removing the pre-payment line.
5. Compatibility `openScoutingExpChoice` validates the target then redirects to payment instead of opening an EXP picker.
6. No generic target/payment ordering was changed; the patch is scoped to `S1-EVT-003` Scouting.

## v6.80 UI patch — 2026-10-02
- Player Mana Pool mirrors Class Shards to the counter-side (right); opponent keeps Class Shards on the left. Class Shards render above Mana Shards while preserving the existing stack direction.
- Legacy/Discard/search/selection popup cards use one 96px thumbnail standard with centered names; popup width stays consistent and height follows content until the viewport scroll cap.
- Popup hover preview is 90% of the battlefield hover size, vertically centered beside the popup, and rendered above the modal layer.
- Game Result adds `CLOSE` so the frozen final battlefield can be inspected; `BACK TO LOBBY` and the existing auto-return behavior are unchanged.

### v6.80 AI behavior patch — 2026-10-02
1. Legacy activation: local AI now evaluates activated Legacy abilities during Deploy and Reform and resolves their existing legal cost/effect flow automatically.
2. Casting counter: manual AI Reposition receives highest priority when an imminent PLAYER Casting locks an AI Hero lane and an adjacent Legacy can legally swap into that lane.
3. Tornado conservation: at HP <= 40, AI filters Dodge responses (including Second Chance) against S1-MAG-007 before normal response scoring.
