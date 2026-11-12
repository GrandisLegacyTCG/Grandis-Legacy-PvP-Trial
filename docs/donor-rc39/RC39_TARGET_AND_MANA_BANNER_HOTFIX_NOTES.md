# RC39 Intermediate Target + Mana Loss Banner Hotfix

Date: 12 November 2026. Base: RC39 Revised PvP Donor Adapter.

## Mana banner: source issue and correction

The prior UI generated a standalone localized Mana toast from the engine. The existing COUNTERED! presentation queue did not subscribe to the loss event. This meant **Holy Resurgence did not display the agreed centered English notification**.

The engine now emits an immutable `MANA_LOSS_RESOLVED` presentation event after payment/removal resolves. The runtime consumes it once through the same presentation queue/CSS animation as `COUNTERED!`. The notification is emitted only for the Player who actually lost Mana. PAY MANA is unchanged. Examples:

- `You used Holy Resurgence.` / `Spent 1 Regular Mana Shard.`
- `Opponent used Mana Burn.` / `Removed 1 Regular Mana Shard and 1 Blue Mana Shard.`

The card/ability resolver is not bypassed; it still handles all legal Mana changes. The banner consumes the committed result only. The previous inline and root obsolete Mana toast CSS has been archived under `REMOVED_LEGACY_MANA_TOAST_2026-11-12.txt`.

## Intermediate target strategy

The strategic value is a bounded bonus on **already-legal** single-target Attack candidates. It uses public opponent Hero data only; no guess about the opposing Hand/Defense cards.

- If any Hero is injured, focus on lower remaining HP (also before Regen 4).
- If every Hero is full, Regen >=4 favors smaller Max HP. Tie at same current HP prefers smaller Max HP even if the larger one has already been damaged.
- Cleric base/lineage is a high-priority healer/support threat.
- Warrior/Red above 60% loses target score only if another non-Warrior is legally targetable by that same Attack. No penalty at <=60% HP, on a projected KO, or when no alternate legal non-Warrior target exists.
- CENTER has a small fallback bonus, not a hard-coded override.

This does not change Rules/legality, any Rank Up implementation, Beginner AI, other PvP integration files, or card/art assets.

## Checks / limitations

- Target strategy VM 12/12; Mana event + queue 13/13; Mana/Beginner 20/20; Tribute 38/38; Healing/Import 37/37 (one old test assumption updated); PvP adapter 17/17.
- 25/25 seeded starter simulations completed with zero recorded errors.
- Browser interactive QA was not executed in this environment due a managed Chromium URL-block policy. Automated event-to-banner unit coverage is not visual Firefox acceptance.
