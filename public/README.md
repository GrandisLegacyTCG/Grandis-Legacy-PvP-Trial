> **PvP v3.71 note (2026-10-03):** This file is retained as donor/runtime history from the VS AI branch. The active application release is **Grandis Legacy PvP v3.71**; see the repository-root `README.md` and `BUILD_NOTES.md` for current PvP behavior.

# Grandis Legacy — VS AI v6.80

Release date: 2026-10-02.

This is the promoted release of `Grandis_Legacy_VS_AI_Option_B_RuntimeWired_v6_Stage1.5.14_2026-10-02`. Promotion to **VS AI v6.80** changes release identity/versioning only; gameplay, rules, UX behavior, and the Stage 1.5.14 Scouting correction are preserved as-is.

Working hierarchy:
- Option B RuntimeWired = active working source.
- VS AI v6.48 = gameplay/runtime implementation base.
- Source Authority v1.9.5 = rules/data authority, except the previously approved non-Skill payment override: players may manually spend Class Shards on Event/non-Skill payments at 1 Mana each while Mana Shards remain the default/recommended payment.
- V43 standalone is not an active runtime source unless explicitly requested as a UI reference.

Open `index.html` in a modern desktop browser.

## New UX Stage 1

Implemented the requested Stage 1 parity items:

1. Multi-card discard selection stays visibly lifted after selection; `DISCARD` changes to `CANCEL` and can be toggled back before the required selection finishes.
2. Player and opponent Discard Piles can be inspected directly from the battlefield.
3. The player's own Legacy Deck can be inspected directly from the battlefield.
4. A Legacy slot exposes a `!` control to inspect the defeated Hero underneath that Legacy.
5. VS AI Lobby / Deck Setup is restored before a match: choose Player and AI starter decks, import a custom JSON deck with runtime validation, then start the match. Coin Flip is intentionally not part of Stage 1; Start Match currently enters with PLAYER first.
6. The existing Sound button is wired to the current VS AI sound system and setting.
7. Presentation parity layer restored where it fits the New UX: turn banner, draw motion, Shard gain motion, Rank/Legacy field transition, Reposition feedback, and current VS AI battle VFX/SFX.
8. Mana Regen counter is shown at the upper-left of each Shard Deck using the existing Counter icon assets; the normal deck count remains at the upper-right.

Intentionally deferred for later discussion: Game Result / terminal defeat presentation, Opening Coin Flip, Casting pair highlight, Scouting EXP manual picker, Tutorial integration, full click-to-open card preview, and dedicated mobile UX.

See `RUNTIME_WIRING_NOTES.md` for implementation and validation details.


## Stage 1.1 hotfix

Before Stage 2, two presentation issues were corrected:

1. **Scouting target direction** — Scouting now keeps a source-to-target line/arrow visible during its EXP-choice step, and AI Scouting also preserves the chosen Hero direction after its instant EXP resolution while Scouting remains the latest Active Card in the phase.
2. **Sequential draw presentation** — multiple Main Deck draw animations now run one-by-one, matching current VS AI cadence instead of overlapping. Shard gain animation begins after the Main Deck draw sequence and also runs one-by-one.

No Stage 2 items are included in this hotfix.

## Stage 1.2 hotfix

Before Stage 2, three battlefield presentation/inspection fixes were added:

1. **Area / multi-target response direction is serial** — while an Area or multi-target Attack is resolving, the connector now points only to the Hero whose Response window is currently active. The queued future targets are not drawn at the same time.
2. **Class Shard visibility** — visible Class Shards are grouped at the left side of the Shard Pool, lifted slightly, and rendered above overlapping Mana Shards. This is visual sorting only; the authoritative Shard Pool order and payment UIDs are unchanged. Blind opponent-Shard selection keeps its shuffled face-down order.
3. **Card Played detail** — cards in the six-card `Card Played` panel and `Full Card History` are clickable. The detail view uses the current VS AI Card Played audit content (Action, Target, Effect Row, modifiers/damage resolution when present, Chain / Responses, Result, and Reason).

No Stage 2 items are included in this hotfix.

## Stage 1.3 UX Fix Batch (2026-10-01)
This build applies the ten approved pre-Stage-2 fixes on top of Stage 1.2:
- Class Shards stay grouped on the left, Mana Shards on the right; no permanent Class Shard lift. Only selected payment Shards lift.
- Draw and Shard-gain presentation is sequential: animate one, reveal it, then animate the next. New cards/shards target their current right-side insertion position while retaining the faster New UX motion speed.
- Inspect/review views are visually clean and do not inherit battlefield selected/blocked treatment.
- Card Played remains one-click detail. Hero cards and Hand cards support double-click Card Preview without turning the review gesture into a gameplay selection.
- Empty Discard Piles show no card back.
- Popup/inspect hover uses its own contextual floating preview instead of the battlefield hover space.
- Source-to-target connectors are decision-window scoped; the resolved Scouting fallback is transient instead of sticking on the field.
- Battlefield stays hidden until runtime geometry is synchronized after Start Match, preventing the initial authored-layout flash.
- Hero board clicks and Hero action buttons stop event propagation so one click cannot both choose a source/ability and auto-pick an allied target. Allied healing requires the explicit second target click.
- Legacy entry animation only plays when that Legacy actually enters the battlefield; Reposition of an already-fielded Legacy does not replay the Legacy Deck entry animation.


## Stage 1.4 hotfix — attachment / Rank Up / Shard Pool / connector timing

This hotfix applies only the four approved bug reports after Stage 1.3:

1. **Attachment counters** — Option B now resolves attachment counters from the Hero attachment record, pending Casting authority, and active Attachment runtime record, matching the current VS AI counter authority instead of relying only on inline attachment-object fields.
2. **Rank Up presentation sequencing** — while Option B owns the external UI, the legacy renderer no longer starts a duplicate Rank-Up Legacy-to-field / EXP-to-Discard animation. Option B now sequences EXP discard -> new Rank card arrival -> Rank reward Draws, hides the final Hero/HP state until the Rank card arrives, and starts each card-motion sound with its matching visual step. Draw reward motion keeps the faster New UX speed.
3. **Shard Pool deterministic spacing** — Class Shards remain grouped on the left and Mana Shards on the right. Spacing is recalculated from the actual final Mana Pool width after geometry sync, resize, Shard reveal, and rerender so an identical Shard state cannot randomly collapse into a tight stack.
4. **Connector timing** — source-to-target arrows are suppressed during the acting player's pre-commit Mana selection. The connector begins once payment is committed and the opponent owns the unresolved Response/decision window; Response-payment windows still retain the incoming attack connector.

No Stage 2 features are included in this hotfix.


## Stage 1.5 hotfix — Hand Draw / connector cleanup / Mana LIFO / Execute / initial dummy cleanup

This hotfix applies only the five approved fixes after Stage 1.4:

1. **Hand Draw presentation** — non-opening Draw events are now eligible from the first live battlefield render. During a Draw sequence the existing Hand DOM is held stable; incoming cards stay deferred, then animate -> reveal -> reflow one-by-one. Rank Up reward Draws use the same held-Hand sequence instead of allowing polling rerenders to replace the Hand mid-animation.
2. **Pre-payment connector cleanup** — Option B is now the sole connector renderer. The legacy VS AI `glPendingAttackDirectionLayer` is suppressed/removed so its pre-payment direction cannot remain underneath the correct post-payment arrow.
3. **Mana payment LIFO** — automatic generic Mana selection now consumes the right-most/newest Mana Shards first. Option B payment highlighting follows the same right-to-left selection, including Response payment, preventing visual holes such as `[Class] [ ] [ ] [Mana]`.
4. **Execute response legality** — Execute's non-damage defeat window keeps only Negate/Cancel-family responses. Ordinary Block, Dodge, immunity/damage prevention, and Dragon Scale are not offered. Dragon Scale now also respects `cannot_block` generally.
5. **Initial authored dummy battlefield removed from live presentation** — the app is hidden from first paint while Lobby/runtime initialize, authored sample Hand/Hero/sidebar state is cleared before the Lobby is shown, and only runtime state is exposed after Start Match geometry synchronization.

No Stage 2 features are included in this hotfix.


## Stage 1.5.1 hotfix
- Fixed fatal player-Hand hover oscillation by keeping each Hand wrapper stationary and lifting only its card visual/action buttons.


## Stage 1.5.2 Firefox Hand Hover Hotfix
- Replaced CSS-hover-owned Hand lift with a pointerenter/pointerleave `.is-hovered` state.
- The `.hand-card` wrapper never moves; only the printed card art lifts.
- Removed the oversized pseudo-element hover catcher and stopped moving action buttons during hover.
- Hover index persists across the 120 ms renderer refresh so a harmless hand rebuild cannot pulse the card.

## Stage 1.5.3 Hand hover fix
Player Hand hover now keeps the outer fan hitbox stationary and moves the card artwork and contextual action buttons together inside a single visual group. This removes Firefox hover oscillation without detaching PLAY/TRIBUTE/DISCARD controls from the card.


## Stage 1.5.4 hotfix — Hand hover stability

Video review and a forced 120 ms rerender harness identified the remaining Firefox card dance: the outer `.hand-card` still inherited the authored generic transition, so every recreated Hand node animated its fan transform again. The outer fan/hitbox is now transitionless, the hovered hand index is retained through harmless rerenders, and only the inner card + action-button visual lifts.

### Stage 1.5.5 hotfix
Firefox player-Hand hover: removed the remaining whole-Hand left/right jitter by making Hand centering deterministic and stopping periodic cumulative alignment corrections.

## Stage 1.5.6 — Hand rollback
Player Hand rendering, fan geometry, hover behavior, action-button placement, Hand centering, and Hand draw presentation were restored to the known-good Stage 1.4 implementation. Stage 1.5 non-Hand fixes remain intact.


## Stage 1.5.7 — two-part focused fix

Only the two requested areas were changed on top of Stage 1.5.6:

1. **Shard Pool block layout** — the pool now reserves three fixed Class-Shard positions on the left. Existing Class Shards occupy those positions; missing Class Shards leave reserved empty space. Mana Shards form one contiguous block immediately after the three Class positions and grow to the right, only compressing when the available width requires it. Blind opponent-Shard selection is excluded from this grouping so hidden-information ordering remains untouched.
2. **Hand Draw presentation copied from current VS AI sequencing** — Stage 1.4 Hand fan/hover behavior remains intact. Mandatory Draw Phase now uses the VS AI reserve -> animate -> commit lifecycle through an external-UI presentation hook, including the first live Draw Phase after Start Match. Rank Up / committed multi-draw presentation uses the VS AI hidden-slot principle: existing Hand cards remain visible, only incoming slots are hidden, each card flies to its real Hand position, then reveals before the next draw proceeds. New UX card-motion speed is retained.

No Hand-hover redesign was introduced in this build.


## Stage 1.5.8 — UI polish batch

Five requested UI fixes were applied on top of Stage 1.5.7:

1. **Shard Pool layout** — Class Shards are a compact overlapping group at the far left. Mana Shards begin immediately after the actual Class group with only a small gap, then grow to the right and compress only when space requires it. Payment/gameplay order is unchanged.
2. **Rank Up continuity** — the previous Hero card remains visibly stacked in the battlefield slot while EXP resolves and the next Rank card travels from the Legacy Deck. The old Rank is removed only when the incoming Rank reaches the Hero slot, so the Hero no longer disappears mid-transition.
3. **Hero / Hand Card Review** — double-clicking a battlefield Hero or a card in Hand opens a visible read-only Card Review modal in Option B. Gameplay single-click selection is kept separate from Hero double-click review.
4. **No native blue card block** — native image drag/selection ghosts are disabled across battlefield cards, Hand, Shards, attachments, inspect surfaces, and history surfaces. Gameplay states continue to use Option B borders/positioning rather than browser blue overlays.
5. **Card Played / Full History inspection** — Card Played and Full Card History tiles use an explicit single-click handler to open Card Played detail immediately.

The approved Stage 1.4 Hand fan/hover behavior and Stage 1.5.7 draw sequencing were not redesigned in this build.


## Stage 1.5.9 — New UX update (2026-10-02)

This build applies the approved post-Stage-1.5.8 UX batch without changing card rules or payment authority:

1. **Alden Draw replacement moved to the Hero box** — the old Main Deck `KEEP / REDRAW` controls are removed. Arbalest uses `QUICK RELOAD | SKIP`; Grand Arbalest uses `RAPID CHAMBER | SKIP`. The ability-name button calls the existing redraw commit, while `SKIP` calls the existing keep commit. The Hero-action nodes remain stable across the 120 ms UI poll so one click registers.
2. **Lucien optional Class Ability naming** — the existing Magical Surge decision/payment flow is unchanged, but generic `USE` is replaced by `MANA SURGE` or `ARCANE SURGE`, paired with the existing `SKIP`.
3. **Contextual Hero-box state glow** — Class/Hero ability availability uses cyan/blue; Racial Trait availability uses gold/orange. The action buttons themselves do not glow. Response Racial Traits show the trait name instead of the Hero name/generic use label.
4. **Alden `Draw This Turn` counter** — shown only while Alden is Arbalest / Grand Arbalest and sourced directly from the authoritative `cardsDrawnThisTurn` state. Archer Rank I has no counter.
5. **Hand fan edge cleanup** — player and opponent fan geometry is now calculated from the actual visible Hand size, preventing short-Hand edge cards from inheriting positions intended for a larger fan.
6. **Readable Card Review** — Hero/Hand double-click now uses the engine's canonical readable-card preview HTML (art plus Hero/Class/Racial/Class Ability/Rank or Skill/Item/Event/Legacy details) inside the visible Option B review modal.
7. **Card Played / Full History single-click stability** — history nodes are rebuilt only when the actual history signature changes, preventing polling from replacing a pressed tile before its click event completes.
8. **Shard Pool spacing** — gameplay/payment logic is untouched. Class Shards remain compact on the left and Mana starts with a fixed **-2 px overlap** against the real Class-group footprint so both read as one continuous stack.
9. **AI pacing after visual presentation** — the AI director now also waits for Option B's external card-motion presentation and requires a continuous settle window before proceeding. The Draw-phase call retains its existing 380 ms settle target; player actions receive no artificial delay.
10. **Casting visual indicator** — active Casting locks add a violet glow to the target **position box** (not the Hero card), so the cue remains on the locked lane through Reposition. The matching Casting card in the caster's Attachment Slot also receives a violet outer glow. Both clear with the authoritative pending Casting state.

Stoneblood keeps its decline path as `STONEBLOOD | SKIP`; Dragon Scale / Second Chance use the normal Response PASS path, so no duplicate SKIP control is added there.


## Stage 1.5.10 — correction pass (2026-10-02)

This build corrects the four follow-up issues reported after Stage 1.5.9:

1. **Conditional glow scope tightened** — Hero-box availability glow is no longer inferred from generic `getHeroActions()` availability. It is limited to the five approved contextual Heroes and only while the relevant conditional choice is actually open: Alden (Quick Reload / Rapid Chamber), Lucien (Mana Surge / Arcane Surge), Aurex (Dragon Scale), Finnian (Second Chance), and Thrain (Stoneblood). Other active ability buttons remain usable but never light the Hero box. Buttons themselves remain neutral/no-glow.
2. **Shard Pool is one continuous stack** — Class Shards are still sorted to the far left, but Class and Mana now use one shared pitch/overlap calculation. There is no special Class-group spacing, gap, or separator. A newly gained Mana Shard lands at the right end; a newly gained Class Shard sorts into the left side without creating a group break. Payment/gameplay logic is unchanged.
3. **Alden Draw This Turn moved into Hero information** — the permanent `Draw This Turn: X` badge is removed. For Arbalest / Grand Arbalest, the existing Hero-information `!` is present and its hover tooltip includes `Draw This Turn: X`. Archer Rank I still has no Draw This Turn entry.
4. **Battle/Response orphan-state recovery** — the runtime now repairs only objectively inconsistent Response state: a stale `pending.type === response_window` with no authoritative `responseWindow`, or a live Response Window missing its owner/pending mirror. Real mandatory choices are never force-cleared. This prevents a stale hidden Response marker from keeping `NEXT PHASE` blocked after the Response has already ended.

Casting target-position glow and Casting Attachment glow from Stage 1.5.9 are retained unchanged and remain separate from the five-Hero conditional glow list.

### Stage 1.5.10 validation
- All 8 JavaScript files included in this package pass `node --check`.
- Static integration assertions pass for the five-Hero conditional glow whitelist/timing, continuous Class-first Shard stack, Alden Hero-information Draw This Turn tooltip, conservative orphan Response recovery, and retained Casting target/Attachment glow.


## Stage 1.5.11 — VS AI parity integration + battlefield review scope (2026-10-02)

This build integrates the approved VS AI features while preserving the Stage 1.5.10 battlefield/gameplay behavior:

1. **Opening Coin Flip** — the VS AI Heads/Tails flow is restored before the match. The result determines the authoritative first player.
2. **Opening presentation** — after the coin result and `START GAME`, Opening Hands and Starting Shards are committed by the runtime but begin visually hidden. The battlefield then presents 6 paired Main Deck draws followed by 3 paired Shard draws before the first normal Draw Phase starts. This uses the VS AI sequence at a deliberately faster New UX cadence (240 ms card motion + 24 ms inter-step gap).
3. **Game Result** — winner, reason, round/phase, `BACK TO LOBBY`, and the VS AI one-minute automatic lobby return are restored.
4. **Lobby formation/progression** — Player and AI formation swap controls, Rank I/II/III preview, and Rank I→II→III Hero Progression are restored from the current VS AI setup flow.
5. **Full Battle Log** — both the runtime 20-entry log retention cap and the Option B 20-entry render slice are removed; the panel retains and renders the full current-match log.
6. **Full Card History** — the Option B 80-event UI cache cap and the engine 120-event-per-side played-history retention caps are removed; Full Card History retains the complete played-card history for the current match. The six-card recent panel stays six cards.
7. **Player identity sizing** — `PLAYER NAME` is synchronized to the exact rendered width/height and visual treatment of `LOCAL AI · HAND`.
8. **Legacy `!` peek** — the control is now hover/focus only: while held, the Legacy card image in that battlefield slot temporarily shows the defeated Hero; leaving the `!` restores the Legacy. No popup is opened and no game state changes.
9. **Battlefield double-click review scope** — Card Review is available on face-up cards physically on the battlefield (Heroes/Legacy, Attachments, Player Hand, legally revealed opponent Hand, and temporary combat cards). Discard piles, decks, Shards, inspect-popup cards, and sidebar cards keep their existing interactions and do not gain battlefield double-click review.

Explicitly unchanged in Stage 1.5.11: Scouting EXP auto-resolution, Tutorial integration, dedicated mobile/tablet UX, Stage 1.5.10 five-Hero conditional glow rules, Casting glow, continuous Class-first Shard stack, Alden Draw This Turn tooltip, payment authority, and the sidebar Card Played/Active Card interaction model. Scouting sequencing is intentionally revised in Stage 1.5.14 below.


## Stage 1.5.12 — Lobby replacement + presentation stability (2026-10-02)

- Replaced the compact Option B deck setup with the full-width VS AI lobby composition; the three top navigation buttons are intentionally omitted.
- Coin Flip now owns an opaque pre-battlefield screen so no battlefield UI is visible behind it.
- Opening Hand / Starting Shard presentation is strictly serialized and faster than VS AI; opening draw events are quarantined from the generic mid-match presentation renderer, and the first turn begins only after a short settle.
- Attachment Card Review now uses a stable delegated two-click detector so polling/re-render cannot eat the first click.
- Opponent Shard Deck Mana Regen indicator moved to the bottom-right, opposite the deck-count badge.

## Stage 1.5.13 — Sidebar preview + attachment review reliability (2026-10-02)

- Sidebar card hover no longer hijacks the battlefield/shared preview pane. Card Played, Active Card, and Full Card History now use a VS-AI-style floating preview immediately to the left of the sidebar, at the same 225×315 logical size as the battlefield preview. Existing single-click Card Played/History detail behavior is unchanged.
- Attachment Card Review no longer relies on browser `dblclick`/completed click events on attachment nodes that are recreated by the 120 ms renderer. A stable battlefield-level `pointerdown` gesture tracks the logical attachment identity (side/lane/slot/card) across rerenders, so exactly two normal left clicks within the double-click window open Card Review reliably in Firefox/Chrome.


## Stage 1.5.14 — Scouting commit-order correction (2026-10-02)

- Scouting no longer enters a pre-payment `scouting_exp_selection` step in the New UX flow.
- New order: choose source Hero → choose opponent Hero with legal non-Ultimate EXP → normal Mana Shard payment → PAY/commit → automatically discard the first eligible non-Ultimate EXP card from that chosen Hero → finish resolution.
- The opponent EXP stack is not modified before payment commits. Canceling or failing payment leaves the target EXP untouched.
- The old EXP picker popup is not opened by the New UX Scouting route. A compatibility entry point also redirects to the normal Mana payment gate instead of opening that picker.
- Option B no longer draws the special Scouting connector during an EXP-choice state. Existing pre-commit target/payment states remain connector-free; only the committed/resolved Scouting presentation may show the source-to-target connector.
- This sequencing change is isolated to Scouting (`S1-EVT-003`). Other targeted cards keep their existing target/payment/resolution order.

## UI Update — 2026-10-02
This v6.80 UI-only patch keeps gameplay/rules/payment logic intact while updating Mana Pool Class Shard presentation, modal card-grid sizing and hover preview placement, and Game Result inspection behavior.

## AI behavior update — 2026-10-02
- AI can activate legal Legacy Abilities during Deploy/Reform using existing Legacy cost/effect resolvers.
- AI prioritizes legal Hero ↔ Legacy manual Reposition when an imminent enemy Casting locks that Hero position, placing Legacy into the locked position.
- Against Tornado (S1-MAG-007), AI Heroes at 40 HP or lower will not spend a Dodge card or Second Chance Racial Token. Other Defense options remain governed by existing AI logic.
- No card rules, payment authority, or UI layout were changed by this update.
