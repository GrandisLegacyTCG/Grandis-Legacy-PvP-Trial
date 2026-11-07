# RC32 — Same-version Stun / Color Mana minor maintenance (2026-11-07)

**Baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC32_2026-11-07.zip` after Primal Strike + Burn maintenance. **Version remains v1.0 RC32.** No Rulebook, OSA, artwork or sound changes.

## Issue 1 — STUN action enforcement

**Authority:** Player Rulebook v2.9, Status and Healing, `Stun`: This Hero cannot use Skill or Event Cards, activate Racial Traits, BLOCK, DODGE, swap positions, or initiate other active effects.

**Finding before fix:** Active Skill-card sources and the `activated_heal` Class Ability already checked Stun. However, the shared active Racial Trait source did not; as a result, Stunned Primal Strike / Human Ambition / Ancestral Focus could still be offered. Reactive traits Dragon Scale, Second Chance, Stoneblood did not respect Stun. The Draw-phase active Class Abilities Quick Reload / Rapid Chamber also lacked a Stun gate.

**Correction (single runtime bundle):** Stunned Hero cannot activate active Racial Trait; Dragon Scale and Second Chance are removed from Response options and rechecked on resolution, including the Primal Strike Response path. Stoneblood cannot trigger when the source has Stun. Quick Reload / Rapid Chamber draw review cannot initiate when the source has Stun, and a pending redraw cannot execute if the source becomes Stunned; original drawn card remains in Hand. Existing Skill/Event/BLK/DODGE and activated-heal Stun guards retained. Passive effects and the mandatory Draw itself are not disabled merely because the Hero is Stunned.

## Issue 2 — 2-Mana matching Color Shard swap priority

**Finding before fix:** Clicking an unselected matching Color Mana valued **2** kept exact Mana total but the subset replacement deliberately preferred removing Regular Mana Shards instead of other selected Color Mana. This contradicted the requested priority.

**Correction:** For **manually selecting a matching 2-Mana Color Shard only**, find a same-value removal subset with **most other selected Color Shards first**, then number of removed cards for deterministic ties. Example: with selected Mage(1), Thief(1), Regular(1), Regular(1), clicking matching Warrior(2) removes Mage+Thief while leaving the two Regular Shards selected. If no Color removal gives a valid exact swap, fall back to other selected Shards. All other toggles retain existing Regular-first replacement behavior; payment must stay **exact**, never overpay or silently change cost. Shared helper covers Skill Mana Payment and paid Response.

## QA evidence

- Chromium browser JavaScript execution using **actual source plus test-only in-memory hooks**, real `buildInitialMatchState`, real Action/Response/Mana handlers: **23 / 23 focused PASS**, zero page JS errors. Test instrumentation is **not** included in production bundle.
- Read-only original baseline comparison: same scenarios **7 / 20 PASS** before additional Quick Reload probes; original failures reproduce both reported issues. Full results: `RC32_STUN_COLOR_MANA_FOCUSED_QA.json`.
- Ten historical broad self-tests compared using same isolated Chromium DOM on baseline and updated runtime: **5 PASS / 5 FAIL on both**. These five pre-existing failures concern stale/missing scenario setup or unrelated expectations; they were **not newly introduced by this patch**. They are not a full-match certification. Details in `RC32_STUN_COLOR_MANA_REGRESSION_QA.json`.
- Syntax `node --check`: PASS; ZIP member CRC and content compare: PASS. Full natural playable match, native Firefox and device audio playback: **NOT VERIFIED**.

## Scope and handover

- Runtime edited: `engine/shared-app/app.bundle.js` only.
- README / checklist / notes updated as documentation; new QA records added.
- No changes to OSA machine data, Rulebook v2.9, card stats, damage/AI damage math, artwork, sounds, or version identifier.
- Release: v1.0 RC32, same filename, replaced only after backup was preserved.
