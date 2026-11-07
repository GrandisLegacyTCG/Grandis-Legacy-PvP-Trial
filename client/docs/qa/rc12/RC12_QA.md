# RC12 — Bard/Maestro inline Class Ability + Return ghost visibility

## Scope

Source baseline: RC11. All changes are confined to VS AI Season 0; OSA DEV45, Deck Builder and PvP are untouched. Browser check: Chromium with locally injected original application scripts/DOM because local navigation is sandbox-blocked; this is not a complete live match.

## Fixed

1. **Bard/Maestro Draw-phase Class Ability:** no class-ability selection popup. The matching Hero gets `Prolonged Symphony` / `Orchestral Crescendo` plus `SKIP` in the existing Hero action position. Clicking the ability enters selection mode; the player's Hand displays `DISCARD`/`UNDO`. The Hero buttons change to `CONFIRM` and `CANCEL`. Confirm only becomes enabled after at least one selection. Cancel clears tentative selection and restores the initial ability/skip buttons WITHOUT changing cards or consuming the ability. Skip consumes the ability without effects.
2. **Maestro up to 2:** a single selected card may be confirmed; two selected cards also commit and draw two. Bard selection is capped at one. No card is discarded before Confirm.
3. **65% focus spotlight:** selecting the ability uses the existing UI focus dimmer, with ability buttons and Hand bright and remaining field dark; focus fully clears on Cancel, Confirm, Skip. Other modals remain unchanged.
4. **Visible Discard → Main Deck returns:** RC10's old queue targeted the original hidden engine UI; the active Battlefield UI suppresses that renderer. RC12 additionally emits a committed, rollback-safe `CARD_RETURNED_TO_DECK` presentation event from the engine and consumes it in the visible Battlefield UI. One translucent, card-back-only animation is played per physically returned card, sequentially from the applicable Discard Pile to its Main Deck. Return flights precede same-action Draw animation. This covers normal and Response S0 CONDITION, and the existing Replenish/Legacy Return call sites.

## Targeted Chromium QA

- Initial Maestro `Orchestral Crescendo + SKIP`: PASS. Click ability: `CONFIRM + CANCEL`, one `DISCARD` above each Hand card, disabled Confirm before choosing, 65% focus active, 0 Bard popups: PASS.
- Maestro one-card Confirm: 1 physical Discard + 1 Draw, proceeds to Deploy: PASS. Maestro two-card Confirm: 2 physical Discard + 2 Draw: PASS.
- Cancel after selection: Hand unchanged, ability not used, initial buttons return, focus clears: PASS.
- Bard max 1, Skip leaves Discard unchanged: PASS.
- Physical AI Crimson Crescendo Return: 2 Zol moved Discard → Main Deck, corresponding committed event count 2, two sequential actual ghost animation DOM nodes appeared then cleared; no JS errors: PASS, independently isolated from other in-flight visual fixture.
- Existing source regression: S0 Lineage 6,975 cases PASS; S0 Target 13/13 PASS. `node --check` source PASS.

## Limits / carry-over

Not tested in a normal click-through Human-vs-AI game ending in Win/Loss/Draw. Browser QA injects scripts without loading remote artwork/assets; appearance is tested via DOM/CSS and real button clicks, not a full live deployment. Independent RETURN QA tests AI committing Crimson Crescendo; player-side response flows and all 242 cards remain to be validated in normal games. RC11 validator/Double Casting user experience also needs full game verification.

Artifacts: `RC12_UI_CHROMIUM_QA.json`, `RC12_RETURN_CHROMIUM_QA.json`.
