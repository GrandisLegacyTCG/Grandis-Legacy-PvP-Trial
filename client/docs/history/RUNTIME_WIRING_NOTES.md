# v6.91.9 Mana commitment + cancelable Response payment

- `commitPlayedCard()` now commits the exact main-card Shard payment before `openReactiveCancelWindow()` for Event/Item reactive priority. The resumed action carries `_mana_payment_committed` metadata so `resolveReactiveCancelWindow()` / PASS continuation skip any second spend. Already committed Mana is retained when the incoming card is canceled.
- `validateCost()` skips only the affordability re-check when a resumed action already carries committed Mana; normal legality/source/target validation still runs.
- `response_payment_choice` is now explicitly pre-commit (`committed: false`, `commit_stage: pre_commit_payment`). `cancelResponsePaymentChoice()` restores the stored incoming Response Window, clears the selected Response/payment pending state, and spends nothing.
- The visible payment surface shows `CANCEL` for Response Mana payment as well as `PAY`. Response-payment cancellation calls the engine transition directly; it does not restore a full local match snapshot.
- `finalizeResponsePayment()` remains the PAY commitment boundary: exact Mana and mandatory additional discard costs are paid once, then the Response becomes committed and nested counter-response logic may open.
- Regression hook: `GL_V6919_MANA_COMMIT_RESPONSE_CANCEL_QA_SELF_TEST()` verifies early payment authority, no double-spend/refund, stale-Mana exploit prevention, cancelable pre-commit Response payment, committed PAY, nested Intercept continuation, and additional Response discard-cost CANCEL/PAY behavior.
- No PvP early-SFX/deferred-target-VFX path is imported. Scope is gameplay payment/commit state only.

# v6.91.8 Response Hero ability visibility fix

- During `.battlefield.gl-focus-response`, `.gl-hero-actions` is raised to `z-index: 960`, above the global Response dimmer at 900 and above the currently focused attacker/target layer at 950.
- `.gl-hero-action` is forced to `opacity: 1` and `filter: none` only while Response focus is active, so legal Racial/Class Response buttons remain readable even when their owning Hero box stays dimmed.
- Default `.gl-hero-action` background/border styling is unchanged. No new glow is added.
- No JavaScript, gameplay, AI, response legality, targeting, or card-rule logic is changed.

# v6.91.7 Hero action offset micro-adjustment

- `.gl-hero-actions` is moved from `right: 4px; top: 4px` to `right: 6px; top: 6px`.
- No other runtime, gameplay, AI, Mana-payment, targeting, phase, or card-rule behavior is changed.

# v6.91.6 Mana priority + Legacy indicator alignment

- Supersedes the earlier standalone v6.91.6 attempt; this release is rebuilt from v6.91.5 and combines both requested corrections.
- Exact payment auto-adjustment now minimizes Class Shard use first. Normal Mana Shards are selected/used whenever they can satisfy the exact replacement; Class Shards are considered only when an exact Mana-only replacement does not exist. Equal-Class-use ties prefer more normal Mana Shards, then stable Shard Pool order.
- The Legacy under-Hero peek `!` is anchored at the same upper-left position as Hero information/status micro-UI (`left: 6px; top: 6px`) so it no longer overlaps the Legacy Ability/effect area on the upper-right.
- Existing v6.91.5 insufficient-Mana PLAY and underpayment-prevention behavior is unchanged.
- No unrelated gameplay, AI, targeting, phase, combat, or card-rule changes.

# v6.91.5 Mana usability update

- Hand rendering now distinguishes an otherwise-playable card blocked only by Mana from cards blocked by other legality reasons. The Mana-only case keeps a gray disabled `PLAY` button.
- The disabled Mana-only `PLAY` action uses a small hover label above the button: `Not enough Mana`. It is an inline CSS hover surface, not an info popup/modal.
- Exact Shard payment is now invariant during manual selection. Deselecting a selected Shard searches currently-unselected Shards for an equal Mana-value replacement. If none exists, the original selection is retained.
- Selecting an unselected Shard performs an exact-value swap against already-selected Shards so the payment never enters an underpaid/overpaid intermediate state.
- The shared selection helper is used by both normal Mana Payment and Response Mana Payment.
- Baseline: v6.91.4. No unrelated gameplay/AI/rules changes.

# v6.91.4 legacy authored-battlefield cleanup

- The root battlefield markup is now a neutral runtime shell only. No sample match state or sample card art is authored into `index.html`.
- `.app.gl-lobby-hidden` is also defined in the root inline stylesheet so the retired battlefield cannot flash even if the shared stylesheet is delayed.
- The 19 root `assets/cards/` images were demo-only duplicates and are removed; production runtime art remains `card-art/<card_id>.webp`.
- `engine/index-original.html` had no runtime references and is removed from distribution.
- No gameplay/AI/rules authority changes.

# v6.91.3 root-cause wiring note

- EXP presentation logic/geometry stays on the approved v6.90.9 physical Hero + EXP package; only the stylesheet-relative EXP sprite URL was corrected after the stylesheet move.
- The lobby background URL was corrected for the same moved-stylesheet reason.
- Loaded shared-engine local asset literals were audited as document-relative URLs; five legacy status-icon references and the legacy lobby-logo reference are corrected from `assets/...` to `engine/assets/...`, with the matching QA expectation updated.
- Renderer suppression is no longer treated as permission to skip staged PLAYER Draw presentation when the external Battlefield UI advertises both Main Deck and Shard reservation presentation.
- Main Deck and Shard draws both keep reserve → animate → commit ordering; PLAYER remains in Draw until Shard Regen presentation completes, then the existing auto-advance moves to Deploy.
- The temporary PLAYER phase-indicator snap workaround from v6.91.2 is removed.
- AI pacing, gameplay rules, payment, Coin Flip, and card effects are unchanged by this correction.
- Mobile/tablet continue to use the same desktop stage scaled uniformly; portrait rotates that same stage. No separate device gameplay UI is introduced.

# v6.91.0 architecture note

The approved v6.90.9 gameplay/presentation behavior is unchanged. Production entrypoints are now `shared-ui/battlefield-ui.css` and `shared-app/app-runtime.js`. Authority access is routed through `runtime/adapters/authority-adapter.js`; VS AI activates `local-ai-adapter.js`, while `pvp-adapter.js` is an inactive future integration slot.

# v6.90.8 Coin Flip parity patch — 2026-10-10

Scope is intentionally limited to the visible Opening Coin Flip surface in the Battlefield UI / VS AI shell. The modal proportions, choice layout, flip stage, winner/result presentation, and Start Game button are aligned with PvP v3.51. No gameplay, battlefield, lobby, opening choreography, AI, payment, phase, or card-effect code was changed. The existing VS AI opaque pre-battlefield Coin Flip backdrop is retained.

---

# v6.90.7 popup / Shard resolution wiring — 2026-10-04

- Candidate-zone routing is the UI authority for popup preview behavior. Main Deck candidates use the v6.88 body-level floating preview outside the popup; Legacy Deck and Discard candidates use contextual outside-edge preview. Caller/effect type does not select the preview system.
- Main Deck popup geometry stays at the existing seven 96px card columns; no dedicated preview column exists inside `.choice-body`.
- `animateCenterChoiceIntoDeck()` is the selected-Shard resolution path for both own Mana payment and opponent Shard selection. It keeps the clone opaque through deck arrival and fades only after arrival. Unselected cards still use the existing return-to-Pool spread path.

# v6.86 rebuild wiring note — 2026-10-03

- Base: v6.85 rollback, then re-apply only the approved v6.86 UI fixes.
- Battlefield Hero lane/box geometry remains on the v6.85 110% layout baseline through `--hero-layout-w` / `--hero-layout-h`. The visible Hero card uses separate 120% `--hero-w` / `--hero-h`.
- Tribute flight is decorative/non-blocking and never raises `GL_GAME_PRESENTATION.isBusy`, preventing the visual from becoming a gameplay gate.
- Chain Mail uses Active Card → defending Hero arrow semantics.
- Hero hover preview uses a Hero-only 110% size class at a z-index above HP overlays.

# Grandis Legacy — VS AI v6.85 — Runtime Wiring Notes

Updated through VS AI v6.85 on 2026-10-03. The v6.85 batch fixes AI Scouting target metadata and strengthens PLAY/PAY and contextual Response focus feedback.

## Architecture lock
- Original Battlefield UI DOM/CSS remains the battlefield/layout base.
- Existing VS AI runtime remains the gameplay/rules authority.
- `shared-app/app-runtime.js` is the adapter/interaction layer; it must not reconstruct Battlefield UI geometry.
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
The legacy runtime previously used render suppression as a headless flag and auto-passed PLAYER Response Windows. External-human-UI ownership is now separated from legacy-render suppression, so Battlefield UI can hide the old renderer while still owning the player's real Response decisions.

## Attack / targeting visual
- Uses the existing VS AI attack-direction visual language: thin gold path, Blade marker, high layer that may pass over the phase tracker.
- The line persists for the full target Response Window instead of disappearing after a short animation.
- Redirect updates the same line to the new target.
- Multi/Area Attack resolves one target at a time through the runtime's existing sequence: target line -> response -> result -> next target.
- Targeted card visualization follows the New UX Fix 8 anchoring rules documented below; duplicate target copies are not used.
- Runtime `legal_targets` is the targeting authority.
- Logical lane binding follows the old VS AI order on both sides: LEFT / CENTER / RIGHT = visual slot 0 / 1 / 2. Battlefield UI's old mirrored lane labels are hidden.

## Temporary played cards
- Event/Item action cards may appear once on a Hero anchor. Hero Skill cards remain in Active Card and use line/arrow targeting without a smaller battlefield duplicate.
- Multiple cards from the same source stack downward with a small offset so earlier cards remain visible.
- They are temporary combat/action visuals, not Attachments.
- Cleanup to Discard/other destination happens after the relevant chain fully resolves.
- No-source actions with a Hero target anchor their card on that target; actions with neither Hero source nor Hero target use Active Card only.

## Active Card / Card Played sidebar
- Active Card follows the current/top action and then retains the last resolved action until phase change.
- Active Card card art uses the full internal width authored by Battlefield UI.
- Card Played only receives resolved actions, not the currently active chain.
- Card Played reserves the original Battlefield UI 3 x 2 geometry, so two rows remain available.

## Hero area / Exhaust / EXP
- Hero-card dimensions stay Battlefield UI dimensions.
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
- The card + action button behave as one hover interaction unit, including the Battlefield UI hover leave delay, so moving to the button does not flicker the card.
- Original Battlefield UI fan geometry is kept for 1-7 cards.
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
- Uses the locked Battlefield UI geometry.
- Current phase receives the authored gold active state.
- Contextual button changes (`REPOSITION` / `CANCEL` / `PASS`) do not move phase labels.

## Allowed popups
Off-field/pile choices intentionally remain popups and use the proven VS AI choice-panel structure rather than the oversized custom Battlefield UI modal. Examples:
- Main Deck search/selection
- Legacy defeat / Legacy Deck choice
- hidden pile card choices
- Crystal Ball reorder

Direct battlefield/Hand choices remain popup-free.

## AI pacing
- Existing VS AI AI-director sequencing remains enabled; renderer suppression does not switch AI to an immediate-result path.
- Area/Multi Attack uses the existing serial target sequence rather than resolving all affected Heroes at once.

## Validation performed
- `shared-app/app-runtime.js` JavaScript syntax check passed.
- Static integration assertions verify the locked Battlefield UI base, old VS AI lane order, response ownership split, Event/Item response gate, common target line + arrow marker, physical Hero/EXP package, Shard overflow/count layering, persistent Hand actions, 8-card fan, 2-row Card Played reserve, full-width Active Card, hidden lane labels, and existing Swap asset.
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
- Battlefield UI now copies the established VS AI v6.48 HP behavior.
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
- `shared-app/app-runtime.js`: `node --check` PASS.
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
- Fixed the Battlefield UI null-selection bug where `selected_index: null` was coerced to index `0`, making the first Legacy look pre-selected.
- A newly opened Choose Legacy popup now starts with no Legacy selected and `Enter Legacy Mode` disabled.
- The player must click `Select` on a Legacy card first. Only then is `Enter Legacy Mode` enabled and allowed to commit the mandatory Legacy replacement.
- This preserves the existing Legacy popup and runtime authority/commit path; only the Battlefield UI selection-state interpretation was corrected.

### UXFix10 validation
- `shared-app/app-runtime.js`: `node --check` PASS.
- Selection helper assertions: `null`/`undefined` -> no selection; numeric `0` -> first Legacy selected.
- Response discard predicate assertions: `required_discard_count = 0` -> no Hand DISCARD mode; values above `0` -> discard mode enabled.



## UXFix15 — collected UI batch #1–#5 — 2026-10-01

### 1. Phase tracker height
- Reduced the Battlefield UI phase tracker to 32px with tighter vertical padding.
- Context action buttons inside the tracker were reduced proportionally so the tracker clears the Deck / Discard / Legacy count badges without changing its horizontal layout.

### 2. Choose Legacy: one-click selection / direct reselection
- The Legacy modal keeps its DOM nodes stable while the choice state is unchanged, instead of rebuilding the card buttons during the short polling render loop.
- One click now registers `Select` immediately.
- With multiple candidates, clicking another Legacy moves `Selected` directly to that candidate; no separate deselect step is required.
- `Enter Legacy Mode` remains disabled until an explicit Legacy selection exists.

### 3. Legacy Mode has no Hero HP UI
- Battlefield UI now suppresses/removes the HP overlay entirely while a slot is in `legacy_mode`.
- Legacy cards never show an HP bar or `0/0`, matching the VS AI rule/presentation that Legacy is not a Hero and has no HP.

### 4. Contextual action buttons register on one click
- SWAP buttons are now preserved across polling renders when the legal swap descriptor set has not changed; only their geometry is recalculated.
- Hero contextual action nodes are likewise preserved while their action signature is unchanged.
- This covers SWAP, activated Class Ability, Racial Trait, Legacy Ability, and response Hero-action buttons that use the same Battlefield UI action area.
- The change prevents a pointer press from landing on a button that is replaced before the matching click event is delivered.

### 5. Played/response card visualization follows Hero identity after Reposition
- Runtime response options now retain `source_card_id` for the Hero that actually used the response/ability.
- Battlefield UI resolves that Hero identity back to its current battlefield lane on every render.
- A response such as Deflect therefore remains visually attached to the Hero that used it even if that Hero Repositioned earlier; cached/original lane data is only a fallback.
- The same source-identity remap is applied to retained combat cards and target-line context.

### UXFix15 validation
- Browser harness: phase tracker computed height = 32px.
- Legacy Mode browser assertion: Legacy slot class active and `.gl-hp-overlay` absent.
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
- Battlefield UI no longer coerces `selected_index: null` into card index 0.
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
- Inspection uses the established Battlefield UI / VS AI choice-overlay shell rather than adding a new popup family.
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
- Battlefield UI no longer auto-starts a match immediately on boot.
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
- External Battlefield UI presentation is permitted to use the current battle audio and card-motion audio while the legacy battlefield renderer remains suppressed.
- Runtime media paths are wired to the packaged `engine/assets/audio/...` files.

### #13 Animation / presentation parity layer
The old battlefield renderer remains suppressed. Instead, compatible current VS AI presentation behavior is surfaced through the Battlefield UI DOM:
- Turn-change banner.
- Main Deck -> Hand draw motion for new authoritative draw events after initial presentation priming.
- Shard Deck -> Shard Pool motion when a new Shard enters the pool.
- Legacy Deck -> battlefield transition cue for Legacy entry and Hero Rank image transitions.
- Reposition destination feedback flash.
- Current VS AI battle feedback VFX/SFX for Physical/Magical attacks, block/defense, dodge, damage pulse, and healing.
- Battlefield UI Hero physical stacks are exposed as `.hero-card-anchor` targets so the current battle-feedback runtime resolves the correct live Hero geometry.
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
  - injected authoritative draw event creates one temporary `.gl-flying-card` Deck -> Hand motion and cleans it up after completion;
  - Shard pool gain creates one temporary Shard Deck -> pool motion;
  - battle-feedback harness resolves an Battlefield UI `.hero-card-anchor`, creates current VS AI Physical Attack VFX using `engine/assets/battle/P.Attack.png`, applies the damage pulse, then cleans up the VFX.
- Static media-path check PASS for all Stage 1 Counter, card-motion audio, battle VFX, and battle SFX assets.
- Baseline engine self-check comparison: the pre-existing `testGameplayFoundationFixes`, `testV69SourcePendingAudit`, `testRoundAdvanceAfterEnd`, and `testUnbrokenStandClassRows` results are identical to UXFix23; no new regression was introduced by Stage 1. `testPlaytestManaRules`, `testDefeatCastingCleanupRevive`, and `testCandidate6ResponseOwnerFlow` remain PASS / expected.


## New UX Stage 1.1 hotfix — Scouting direction + sequential Draw — 2026-10-01

### Scouting target direction
- `scouting_exp_selection` now explicitly provides its already-locked source Hero and target Hero to the Battlefield UI connector renderer.
- AI Scouting can finish its EXP selection before an Battlefield UI paint occurs. When Scouting is still the latest resolved action / Active Card in the current phase, the renderer therefore falls back to the authoritative played-event source/target snapshot and keeps the line + arrow visible.
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
- Battlefield UI previously expanded `multi_sequence.affected_lanes` and drew every queued connector simultaneously.
- When an active Attack has `multi_sequence`, Battlefield UI now uses only the authoritative current `target_lane` for its line + arrow.
- The next target receives its connector only after the previous Hero's Response frame resolves and the runtime advances the sequence.

### Class Shard visibility
- Visible Shard Pools are presentation-sorted as `Class Shards -> Mana Shards` while preserving original order inside each group.
- Class Shards receive a higher render layer than overlapping Mana Shards and a small 7 px visual lift.
- Selected Shards still use the existing payment selection lift and remain the highest layer.
- This does not mutate `playerManaPoolCards` / `aiManaPoolCards`; all gameplay/payment selection continues to address authoritative Shard UIDs.
- `opponent_mana_selection` is explicitly excluded from visual sorting so its shuffled face-down candidate order remains hidden-information safe.

### Clickable Card Played audit
- Recent `Card Played` tiles and `Full Card History` tiles are now real buttons.
- The engine exposes an Battlefield UI read-only `getCardPlayedDetail(side,eventId)` adapter.
- The adapter reuses the current VS AI combined Card Played grouping and `v94EventDetailHtml`, including linked chain/response detail.
- Clicking a response event that belongs to a combined chain resolves back to the same authoritative combined action group when available.
- The Battlefield UI detail overlay is presentation-only and does not mutate runtime state.

### Stage 1.2 validation
- All packaged JavaScript files pass `node --check`.
- Static QA confirms multi-target `multi_sequence` connector rendering uses only current `target_lane`.
- Static QA confirms Class Shard visual grouping/layering is UID-based and blind opponent Shard ordering is untouched.
- Static QA confirms recent and full-history Card Played tiles call the current VS AI detail adapter.

## Stage 1.3 notes
- Input isolation: Battlefield UI Hero/ability handlers stop bubbling into the suppressed legacy UI event layer after state changes.
- Presentation reveal queue: newly drawn Hand cards and newly gained Shards are temporarily deferred/hidden and revealed one at a time after their own motion finishes.
- Legacy transition detection checks whether the same visual Legacy identity was already on the battlefield before playing an entry animation.
- Inspect hover is local to modal context and does not reuse the battlefield hover container.


## Stage 1.4 hotfix — 2026-10-01

### Attachment counter parity
- Attachment counter lookup now follows the current VS AI authority chain: attached record -> pending Casting record -> active Attachment record -> source-linked status fallback.
- String-only Hero attachment slots therefore still show a counter when the authoritative counter lives in `pendingCastings` or `activeAttachments`.

### Rank Up presentation sequencing
- In external-human-UI mode, the engine skips its own Rank-Up Legacy-to-field and EXP-to-Discard motions so Battlefield UI does not render duplicate/conflicting Rank animations.
- Battlefield UI detects the actual Rank transition, derives the EXP cards moved to Discard from the state delta, hides the final Rank card/HP until arrival, animates EXP to Discard, then the new Rank card from Legacy Deck, and only then begins sequential Rank reward Draws.
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
- Hand Draw sequencing is protected from the 120 ms Battlefield UI polling renderer so old Hand cards remain visible while only incoming cards animate/reveal one at a time. Opening Hand events remain non-animated; live Draw Phase and Rank Up reward Draws use the same sequence.
- Legacy engine attack-direction SVG is disabled while Battlefield UI owns the battlefield connector layer; this removes stale/pre-payment arrows and prevents duplicate arrows after PAY.
- `computeManaPayment` now chooses generic Mana Shards from the right edge first (LIFO visual order). Battlefield UI's selected-Shard highlighting mirrors this order for normal and Response payment.
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

A reproduction harness that forcibly rebuilt the Hand every 120 ms matched the video cadence. The wrapper itself was moving because `.hand-card { transition: .14s ease; }` re-ran its fan transform whenever DOM nodes were recreated. Stage 1.5.4 disables transitions on the outer Hand wrapper, retains explicit hover state across rerenders, and keeps lift animation isolated to `.gl-hand-visual`.

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
- The same external draw reservation is allowed even while the legacy renderer is suppressed, so Battlefield UI no longer has to infer the Draw Phase card after state has already advanced.
- Rank Up / other committed multi-draw events follow the current VS AI hidden-token principle: only new Hand slots are hidden in-place (layout is preserved), Rank transition finishes first, then draw cards reveal sequentially.
- Card motion remains at the faster New UX 360 ms speed.

### Scope
Only Shard Pool layout and Hand Draw presentation were changed for this build.


## Stage 1.5.8 UI polish
- Replaced the three-full-slot Class-Shard reservation with a compact Class stack; Mana starts directly after the real Class footprint. Blind opponent-Shard layout remains isolated.
- Rank transition plans now retain `fromId`; Battlefield UI renders the prior Hero art as a temporary physical stack layer until the new Rank card arrives.
- Added a visible Battlefield UI Card Review modal. Hero and Hand double-click use it instead of the hidden legacy-engine preview host.
- Hero single-click gameplay actions are separated from double-click review with a short single-click commit guard, preventing the first click of a double-click from selecting a gameplay target.
- Native card image dragging and selection are suppressed to eliminate Firefox/desktop blue drag ghosts.
- Card Played and Full History tiles stop propagation and open detail on the first click.


## Stage 1.5.9 New UX update — 2026-10-02

### Contextual Hero actions
- `draw_replacement_choice` is rendered in the source Hero box. `pending.abilityName` is the displayed positive action, and the existing `commitDrawReplacementChoice(true/false)` functions remain the only runtime commits.
- `optional_magical_surge` keeps the existing engine flow and displays the current Hero card's authoritative `class_ability.name` (`Mana Surge` / `Arcane Surge`) instead of `USE`.
- Hero action wrappers retain their signature cache, so unchanged buttons are not recreated by the polling renderer.
- Response options with `racial_ability` display the resolved Hero racial-trait name. Class/Hero ability availability sets `gl-class-ability-ready`; Racial Trait availability sets `gl-racial-trait-ready`. Button styling has no availability glow.

### Alden Draw counter
- The counter is present only when the current authoritative Hero card has a Class Ability action whose effect contains `draw_replacement_shuffle_redraw: true`.
- Counter value is read from `state.cardsDrawnThisTurn[side]`; no independent UI counter is maintained.

### Casting visual state
- Target lane highlighting is resolved from `state.pendingCastings[].target_side` and `locked_target_lane || target_lane`, so it follows the locked position rather than the current Hero occupant.
- Attachment source highlighting matches authoritative pending Casting records by card, side, attachment slot, and source Hero/lane identity.
- Casting visual state is presentation-only; no counter, cancellation, target, or release logic is changed.

### Card Review / Card Played
- Battlefield UI Card Review consumes `window.GL_CARD_PREVIEW_QA.html(cardId)`, the current engine readable-card renderer, with a local fallback to card art if the helper is unavailable.
- `Card Played` and `Full Card History` keep DOM nodes stable until the event signature changes. This removes the polling-render click race while preserving existing `getCardPlayedDetail` authority.

### Hand / Shard layout
- Both Hand fans calculate rotation/lift from the actual current rendered slot count; the player and opponent use mirrored transforms.
- Shard layout changes only `classToManaGap` from the Stage 1.5.8 positive gap to `-2`, producing a 2 px visual overlap between the final Class Shard footprint and first Mana Shard. Shard ordering, UID selection, and payment code are untouched.

### AI pacing
- Battlefield UI exposes `GL_GAME_PRESENTATION.isBusy()`. The AI director includes it in `aiDirectorWaitForAnimations`.
- Settle timing is measured as continuous idle time: if engine or Battlefield UI animation becomes busy again, the settle clock resets. Draw keeps the existing 380 ms settle target after visible presentation has finished.
- This hook is used only by the AI director; player timing is unchanged.

### Stage 1.5.9 validation
- All 8 JavaScript files pass `node --check`.
- Static integration assertions pass for Alden Hero-box redraw/skip, Lucien named ability/skip, Hero glow categories, Alden Draw This Turn, both Hand fans, readable Card Review, stable history DOM, Shard `-2px` overlap, Battlefield UI AI-presentation busy hook, Casting target-lane glow, and Casting Attachment glow.
- Active runtime bundle changed only in the AI presentation-wait bridge; card rules, payment computation, target legality, Casting resolution, and card authority data are unchanged.


## Stage 1.5.10 correction pass — 2026-10-02

### Conditional glow lock
- `gl-class-ability-ready` is set only for Alden while `draw_replacement_choice` is open or Lucien while `optional_magical_surge` is open.
- `gl-racial-trait-ready` is set only for Aurex/Finnian when the current Player Response Window exposes their racial option, or Thrain while `racial_stoneblood` is open.
- Generic active abilities from `getHeroActions()` may still render their normal action buttons, but they do not set availability glow. This prevents passive/always-available Hero boxes such as Ancestral Focus / Human Ambition owners from glowing continuously.
- Casting remains independent: `gl-casting-target` follows the locked target position and `gl-casting-active` follows the live Casting attachment.

### Continuous Shard stack
- `renderPool()` still stable-sorts Class Shards before Mana Shards.
- `layoutManaPoolCards()` now computes one pitch from the full rendered Shard count and applies it to every Shard in DOM order. No Class-to-Mana gap variable or special Class step remains.
- Selection/payment authority, UID identity, blind opponent selection, and return order are unchanged.

### Alden information indicator
- The separate `.gl-draw-this-turn` badge is removed.
- `renderStatuses()` adds `Draw This Turn: X` to the existing Hero Information tooltip only when the current Hero card has the authoritative draw-replacement Class Ability marker.

### Response blocking repair
- `repairOrphanBlockingState()` is exposed through the local runtime intent bridge.
- Battlefield UI requests it only when the snapshot is objectively inconsistent: orphan `response_window` pending, ownerless live Response Window, or live Response Window missing its pending mirror.
- The repair does not clear any legitimate mandatory non-Response pending choice.

### Stage 1.5.10 validation
- All 8 packaged JavaScript files pass `node --check`.
- Static integration checks confirm the glow whitelist/timing, continuous Shard layout, Alden tooltip relocation, Response repair bridge, and Casting glow retention.


## Stage 1.5.11 parity integration — 2026-10-02

### Opening setup ownership
- Battlefield UI now separates match preparation, opening setup commit, and first-turn start through `prepareLocalMatch()`, `commitOpeningSetup()`, and `beginFirstTurn()`.
- Coin Flip is resolved before Opening Hand/Starting Shard presentation and determines the first side.
- Opening Hand cards and Starting Shards exist in the authoritative state before presentation but remain hidden in Battlefield UI until their individual animation reaches its destination.
- Presentation order is 6 paired Hand draws, then 3 paired Starting Shard draws. The New UX uses a faster 240 ms motion / 24 ms gap cadence than the source VS AI presentation.

### Lobby parity
- Existing VS AI formation mutation and rank-preview helpers are exposed to Battlefield UI rather than reimplementing deck logic.
- Player and AI can swap adjacent setup lanes, cycle Rank I/II/III previews, and inspect each package's three Hero ranks from the lobby.

### Terminal result
- Battlefield UI observes authoritative `gameOver`, `winner`, and `gameEndReason`.
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
4. The Battlefield UI connector no longer has a dedicated `scouting_exp_selection` branch, removing the pre-payment line.
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


## v6.81 battlefield readability + interaction-attention batch — 2026-10-03

### Card geometry
- Hero: 110% of the original v6.80 Hero baseline.
- Standard: unchanged at 65% of the original v6.80 Hero baseline.
- Hand: 90% of the original v6.80 Hero baseline, with non-overlapping spacing.
- Battlefield hover preview: 281×394 logical px (125% of the previous 225×315 footprint).
- Hand preview anchors to the PLAYER container; Hero preview chooses left/right based on available space; Player Shard preview anchors above the Shard Pool with lifted-Shard clearance.

### Counters / labels / timer
- Main Deck and Discard count badges are 12px white text on borderless semi-transparent rectangular backgrounds.
- Mana Regen counters are enlarged to match the stronger resource-count language.
- Written Main Deck, Shard Deck, Legacy Deck, and Discard Pile battlefield labels are hidden on both sides.
- Match timer (`MM:SS`) occupies the bottom sidebar row before Sound and freezes when the result is shown.

### Phase attention
- Active phase is gold and receives a text-width underline plus a diamond whose X coordinate is mathematically the underline/text midpoint.
- Underline, diamond, and subtle tint transition to the new phase on every phase change; the new label receives one short highlight only.

### Item/Event source-direction presentation
- Item/Event direction connectors use Active Card as the visual source.
- Target Hero effects point Active Card → Hero. Zone effects point Active Card → Main Deck / Discard Pile / Shard Pool as applicable.
- Scouting now presents Active Card → chosen opponent Hero instead of source Hero → target Hero.
- No connector is invented for an Item/Event with no concrete destination.

### Interaction focus
- Payment state places a 12% visual dim over the non-payment battlefield while Player Shard Pool and PAY remain above the dimmer.
- Player Response state places the same subtle dim while Hand and PASS remain above it.
- PAY/PASS receive a short one-shot scale/brightness attention animation when their focus state begins.
- Existing CANCEL placement/behavior is intentionally unchanged in this batch.


## v6.82 battlefield review-fix batch — 2026-10-03
- Hand card scale reduced from 90% to 80% of the v6.80 Hero baseline; Hero sizing unchanged.
- Shard Deck and Legacy Deck count badges now use the same 12px white translucent rectangular language as Main Deck and Discard.
- Active-phase underline/diamond are placed below the label; horizontal center remains derived from the live label bounding box.
- Item/Event connector source remains Active Card. Response-window metadata is now checked directly before generic chain resolution, and fast resolved Item/Event connectors receive a short 900ms hold.
- Payment/Response attention uses a 65% global black dim. Response exempts Hand + PASS. Payment exempts Shard Pool + PAY + CANCEL. PAY is green.
- Scrollable selection popup uses seven 96px columns and keeps hover preview on the right when the viewport can fit it.
- Unified hover preview reduced from 125% to 115% of v6.80 baseline (259×362). Hand preview is offset slightly right.
- Selected Shard lift is explicitly overflow-visible and raised above pool counters/neighboring resources without changing pool layout height.


## v6.83 battlefield review-polish batch — 2026-10-03
- Hand card scale is 75% of the v6.80 Hero baseline. Both player/opponent Hand rows use a small 5px edge-only overlap; the first card remains unshifted.
- Shard Pool `.mana-pool > .count` uses the same compact 12px white / semi-transparent / borderless rectangle as the other resource counters.
- Phase underline is 2px high and its runtime Y anchor is `labelBottom + 6px`; diamond Y is centered around that thinner line.
- PAY stays green and receives a dark two-layer `text-shadow` so the white PAY label remains legible during the 65% payment focus state.
- Unified hover preview is 248×347 logical px (110% of v6.80 baseline). Player Hand preview is positioned 20px farther right than v6.82.


## v6.84 hover/action polish batch — 2026-10-03
- PAY remains green; its label is bold black with a thin white outer stroke to improve legibility through the payment focus state.
- Unified hover preview returns to 115% of the v6.80 baseline: 259×362 logical px. Player Hand preview is shifted 30px farther right than v6.83.
- Hero hover preview is no longer side-selected beside the hovered Hero. It shares the Hand preview's right-side X anchor and uses viewport center for its Y midpoint.
- No gameplay, card data, AI logic, engine authority, counters, phase marker, focus-state opacity, or popup-selection behavior is changed by this batch.

## v6.85 response-clarity fix — 2026-10-03
- AI Scouting action generation now preserves its explicit opponent Hero target lane before the Response Window opens, so Active Card arrow routing and the resolved EXP discard share one target.
- PAY uses the same green/white action language as PLAY with a slightly larger label; both buttons receive a thin gold border.
- Response focus still uses the approved 65% dimmer, but now lifts Active Card, the acting/source Hero when present, and the actual Hero/zone target above the dimmer together with Hand and PASS.



## v6.88 wiring notes — 2026-10-03
- `.hero-lane` height is now `2 × --zone-h + --rail-gap`, keeping deck-rail and Hero-box bottoms aligned at every responsive scale.
- `.gl-hero-physical-stack` is anchored at 50%/50% with a translate(-50%,-50%) transform; Ready/Exhaust preserve that center anchor.
- A capture-phase `dblclick` blocker is bound only to `.field-row` surfaces. It prevents field Card Review popups without affecting Hand/sidebar review or single-click gameplay.


## v6.87 wiring notes — 2026-10-03
- `gl-sidebar-hover-preview` is appended to `document.body` and positioned with viewport coordinates; z-index 26000 keeps it above lane HP/status overlays.
- `opponent_mana_selection` is recognized as an external-human interaction focus state. A one-candidate blind selection auto-commits; multi-candidate selection highlights the opponent Mana Pool.
- Battlefield review gestures are disabled for Hero/Attachment/combat-card surfaces to remove double-click/two-click field review.
- Hero lane geometry uses the v6.85 layout scale but trims vertical padding independently of the 120% Hero visual size.


## v6.89 wiring notes — 2026-10-03
- `gl-center-choice-stage` is a body-level visual decision layer with no panel/background. The existing `.gl-focus-dimmer` remains the sole 65% backdrop.
- Center-choice modes are keyed from authoritative pending states: `mana_shard_payment_choice`, `opponent_mana_selection`, `opponent_hand_choice`, and `magic_scope_reveal`. Source battlefield cards are visually hidden (layout preserved) while center clones are active.
- Payment selection is still authoritative in the engine: Mana Shards fill the remaining cost automatically; the UI only toggles Class Shard UIDs. If generic Mana is insufficient, `openManaShardPaymentChoice()` seeds the minimum automatic Class fallback before rendering.
- Blind opponent selections do not auto-commit at one candidate anymore. They stay explicit in center so the player sees face-down choice -> confirm -> reveal -> destination motion.
- Hero/Legacy battlefield hover uses v6.83 contextual side selection again. Inspect/search preview routing is source-aware: Main Deck = fixed preview; Discard/Legacy/non-Main = contextual preview.
- Battlefield double-click Card Review is restored for Hero/Legacy and combat cards; Attachment review again uses delegated stable double-press detection because Attachment DOM nodes are recreated by polling.


## v6.90 wiring notes — 2026-10-03

- `mana_shard_payment_choice` now carries `selected_shard_uids` as the exact player-edited payment set. `selected_class_uids` remains populated for compatibility, but commit/spend uses the exact Shard set when present.
- `computeExactManaPayment()` / `spendExactManaPayment()` validate and spend that exact set; legacy automatic/AI/Response paths continue using `computeManaPayment()` unless an exact set is explicitly supplied.
- `getManaPlan()` exposes the exact selected plan to Battlefield UI so `MANA x / x` and PAY readiness update on every Mana or Class Shard toggle.
- Center PAY ordering uses the same Class-vs-Mana display ordering as the visible Shard Pool. Blind opponent Shard selection remains the sole path allowed to destroy positional memory.
- `resetCenterChoiceVisualState()` removes stale `is-fading`, busy state, and residual Web Animations between repeated center-choice sessions.
- Return motion resolves unspent Shards to their individual hidden pool-card rectangles, producing a spread/fan-back animation rather than a single-point collapse.
- Background preview binders refuse to open when `body.gl-center-choice-active` is set unless the hovered card itself belongs to `.gl-center-choice-stage`.


## v6.90.1 wiring notes — 2026-10-04

- `computeExactManaPayment()` now treats legality as `selected value === cost`, not `>= cost`. `recommendedExactManaShardUids()` seeds an exact Mana-first recommendation when one exists.
- `manaSelectionAfterToggle()` is the shared FIFO selector for normal and Response payments: a newly selected Shard stays selected while oldest selections are removed from the front until the total is not over cost; manual unselect never auto-refills.
- `response_payment_choice` now carries `selected_shard_uids` and `shard_choices`, uses exact spend/commit, and is routed by Battlefield UI into the same `gl-center-mode-pay` center layer when `mana_cost > 0`. Additional Hand-discard costs remain authoritative in the same pending state.
- `getManaPlan()` exposes exact plans for both `mana_shard_payment_choice` and paid `response_payment_choice`.
- During centered opponent Shard choice, `renderPool()` keeps the real Pool in canonical sorted order. The shuffled blind mapping is rendered only by center clones.
- `startOpponentManaSelection()` bypasses blind choice when the target Pool has no Class Shard. `queueDirectOpponentShardReturnPresentation()` captures the source Pool rect before mutation and animates the selected generic Shard(s) directly to Shard Deck.
- `flyToHeroOrientation()` is used by Tribute and Rank Up. It derives the live Hero Exhaust state and rotates the moving card to -90° while preserving center-to-center targeting.
- Defense Item connector locking derives the target from `findAttackContextInWindow()` and persists that original defending Hero across nested Response/payment states until the combat chain closes.


## v6.90.2 corrective rebuild wiring — 2026-10-04

Base: v6.90.1. The prior v6.90.2 artifact is superseded.

1. `flyToHeroOrientation()` now animates `left/top/width/height/rotation` to the destination visual box. Exhausted targets rotate the **moving card** to landscape; both `queueBattlefieldTributeMotion()` and Rank-Up `bringRank()` reuse this helper.
2. Modal preview mode is derived from the **candidate source zone** (`choice_zone` first). `legacy_card_choice` with `choice_zone=deck_search` therefore uses fixed Main-Deck preview; discard/legacy-deck choices remain contextual.
3. Opponent blind-Shard center choice no longer mutates the real opponent pool. Player-pool width synchronization is player-only; CSS leaves opponent Shard cards visible/laid out; `animateCenterChoiceEntrance()` starts each center clone from its real opponent-pool card slot.


## v6.90.3 battlefield corrective wiring — 2026-10-04

- `candidateSourceZone()` is the single preview-routing authority for choice popups. The effect/caller type does not choose the preview mode.
- Main Deck candidate zones (`deck`, `deck_search`, `deck_top`, `main`, `main_deck`) use a fixed right-side preview; Legacy Deck and Discard remain contextual.
- `modalSig` includes candidate-zone identity so a popup is rebuilt when the candidate source zone changes.
- Opponent Shard Pool normal width sync is restored. Center blind choice uses overlay clones from the pool container center and does not hide/reflow the original pool.
- Shard Pool display preserves canonical pool order; draw append order is therefore visible at the rightmost/end position.
- Relentless Leveling `source_exp` target accepts clicks on the full locked Hero panel while preserving Hero-card double-click review.


## v6.90.4 corrective wiring — 2026-10-04

- `runTributeLikeHeroAction()` is the single UI path for normal `tribute_target` and Relentless `card_search_choice(resolve_to=source_exp)`. Both Hero-card and Hero-panel clicks call the same motion helper before committing the authoritative action.
- `queueBattlefieldSourceExpMotion()` resolves the selected Relentless Hand candidate and reuses `flyToHeroOrientation()`, preserving the already-approved Exhausted/landscape arrival behavior.
- `animateCenterChoiceEntrance()` now resolves each PAY/opponent-Shard center clone back to its real Pool card by UID and animates from that card rect. Opponent Pool geometry is not used as the moving element.
- `syncPlayerManaPoolToHeroLeft()` freezes opponent Pool width while `opponent-shard` center choice is active, preventing center-choice layout work from resizing the real source Pool.
- `startOpponentManaSelection()` opens a blind choice only when `required_count < pool.length` **and** at least one Class Shard exists. Otherwise it auto-resolves and uses direct reverse-Draw presentation from the correct side-specific Shard Pool to Shard Deck.



## v6.90.5 root-cause fix — 2026-10-04
- Root cause: `.battlefield.gl-focus-blind-mana .opponent-mana-pool` set `position:relative`, overriding the battlefield base `.mana-pool{position:absolute}`. This physically moved the real opponent pool into grid flow at the upper-left.
- Because center-choice entrance reads the live source card rectangles, all later origin patches were measuring an already-relocated pool.
- Fix: remove the positioning override entirely. The real opponent pool remains absolute/right-anchored; only center overlay clones move.
- Suppress the old pool-local prompt while the center choice overlay is active.


## v6.90.7 — Main Deck candidate preview root fix — 2026-10-04
- Preview behavior is routed by candidate/source zone.
- Main Deck candidate lists use `.gl-choice-main-deck-preview` with a dedicated `.gl-choice-fixed-preview-slot` inside the popup.
- Fixed preview hover updates that slot via `bindFixedChoicePreview()`; it does not use the body-level floating preview.
- Legacy Deck and Discard candidates remain contextual.
