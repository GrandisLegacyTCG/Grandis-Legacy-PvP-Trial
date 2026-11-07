# VS AI Season 0 — MAG 5/6 Approved Fix QA

**Date:** 2026-11-05  
**Baseline:** RC13 staged working copy with ARC, WAR, THF, CLE approved fixes already applied.  
**Permission:** Designer explicitly said `benerin semua` after read-only MAG audit. No version bump or ZIP package authorized until all six stages.  
**Source authority:** OSA Season 0 DEV45 printed card text; no OSA or other application changes.

## Seven MAG bug groups corrected

| Bug | Card | Application correction |
|---|---|---|
| MAG-01 | Meditation `S0-MAG-006` | After committed use, move up to 2 **physical** Mana Shards Mana Deck → Mana Pool through existing 12-card invariant-preserving draw. |
| MAG-02 | Tornado `S0-MAG-008` | Elementalist/Elemental Lord: automatic separate 40 Magical damage when original Attack is **DODGED**. Mage Rank I unchanged; NOT on Negate; no additional Response Window. |
| MAG-03 | Ice Block `S0-MAG-011` | Offer actual Defense INVINCIBLE response; upon legal paid commit attach until next owner Draw, self-inflict Freeze(2) (owner's class passive does not increase self Freeze). |
| MAG-04 | Fire Wall `S0-MAG-012` | Preserve Physical BLOCK 70 and apply Burn(2) to attacking Hero; source Elementalist's passive adds +1 (Burn 3). |
| MAG-05 | Mana Void `S0-MAG-025` | Evaluate SURE HIT against actual Class/Rank source row instead of union-level keyword; Spell Blade Rank II allows DODGE, Arcane Duelist Rank III denies DODGE. |
| MAG-06 | Invincible Stance `S0-MAG-030` | Offer real INVINCIBLE Defense Response for Arcane Warrior/Arcane Vanguard and persist card in Attachment Slot until next owner Draw. |
| MAG-07 | Invincible Stance `S0-MAG-030` | Read printed Rank II `MANA COST +1` surcharge: Arcane Warrior pays 5, Arcane Vanguard pays 4. |

**Related correctness checks:** MAG-030 INVINCIBLE prevents opponent-sourced active Poison tick while Attachment is present, with Poison duration continuing; resolved follow-up damage now honors INVINCIBLE including MAG-011/MAG-030 instead of bypassing it. Existing Magic Defense Response and attachment expiration mechanisms retained.

## Verification

- **20 / 20** focused synthetic engine checks PASS, PLAYER/AI paths (AI checks use the actual AI automated payment path). They cover physical Mana conservation, Tornado three ranks, Meditation, defensive response payments, Block/Status, Mana Void source rows and Rank II/III Invincible Stance costs.
- **2 / 2** Attachment lifespan checks PASS: INVINCIBLE prevents active Poison ticks, Poison counter decreases normally, Attachment expires at the *next owner Draw*, enters Discard once.
- Built-in S0 tests: **6,975 Class/Lineage**, **13 / 13 Target Selection**, **30 / 30 Ultimate Tribute** PASS.
- `node --check` PASS; **0 Chromium page errors** recorded in QA runs.

See `MAG_FIX_QA.json` and local stage-5 runners under `/mnt/data/audit_work/mag_stage5_*` (not included in the runtime root).

## Limits / next work

- These are focused engine/browser-injected checks, **not** a complete normal Human vs AI match through UI or a full Mage 42/42 end-to-end gameplay PASS.
- Preserve accepted current Casting UX (owner End increment), despite official Rulebook v2.9 wording (owner Draw increment); request a direct decision before modifying this behavior. Runeforged Burst interruption at counter zero is still review-only.
- Stage **6/6 EVT/ITM** is next: read-only audit, report results, wait for approval before code fixes. After completing approved repairs from all six stages, run consolidated regressions and then consider one version bump/release.
- Do not reapply ARC/WAR/THF/CLE patches over this cumulatively updated working copy. Official S0 card data and OSA untouched.
