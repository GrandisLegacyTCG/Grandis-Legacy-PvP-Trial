# Grandis Legacy PvP v3.50 — Final Staged Correction Release Notes

Date: 2026-09-28

PvP remains **v3.50**. This same-version correction completes the staged stability/gameplay pass while preserving server-authoritative gameplay and the approved Source Authority / Rulebook / VS AI reference stack.

## Final staged corrections

- Authoritative render continuity: Timer, Connection state, Hand presentation and valid transient UI survive unrelated server revisions without default-state flashes.
- Mobile Main Deck Draw: authoritative Draw reason is preserved so the 390×844 mobile path presents Main Deck → Hand visibly; desktop Draw behavior remains unchanged.
- Response lifecycle: committed Item/Event/Defend response families use generic nested counter routing; Flashpowder Bomb can counter a committed Flashpowder Bomb when legal; Intercept counter chains remain valid.
- Held Attack lifecycle: original Attack remains traceable through nested Response continuation and releases exactly once after terminal settlement.
- Battle feedback: authoritative Attack / Block / Dodge / Negate feedback reaches production VFX/SFX presentation; duplicate events do not replay; Sound OFF does not poison later same-family audio dedup.
- Custom PvP Main Deck legality: **50–60 cards inclusive**. Official Starter Deck definitions remain 60.
- Player identity presentation: deck names display at most 25 visible characters (22 + `...` when truncated); full names remain stored in metadata.
- Connection Bar: remains aligned beside identity information but outside the visual identity container, with stable non-flickering presentation across rerenders.

## Version locks

- PvP: **v3.50**
- Website target: **v1.39**
- VS AI: unchanged
- Tutorial: unchanged
- Source Authority: unchanged
- Player Rulebook: unchanged

See `PVP_v3.50_FINAL_STABILITY_CORRECTION_AUDIT_2026-09-28.md` for final validation details.
