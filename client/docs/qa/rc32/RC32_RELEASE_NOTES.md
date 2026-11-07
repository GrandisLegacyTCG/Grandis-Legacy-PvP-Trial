**RC32 minor update:** See `RC32_MINOR5_UPDATE_NOTES.md` for the later five-item approved change. Original RC32 release notes below are a historical record.

# Grandis Legacy VS AI Season 0 — v1.0 RC32

**Date:** 2026-11-07  
**Based on:** v1.0 RC31. Original RC31 remains intact.  
**Status:** **RELEASE CANDIDATE — NOT FINAL**.

## Approved changes integrated

1. **Hero EXP stack:** silver `100 EXP`, gold `200 EXP` new art; snug edge placement, bottom-aligned to Hero, Hero in front; no layout gap from extra art padding.
2. **Mana Regen / deck badges:** compact and distinct surfaces; REGEN text included, use existing font; player and AI; desktop-only +2px label/value, mobile retained.
3. **Deck counters:** desktop Main, Legacy, Mana Deck values enlarged from 11px to 13px; mobile retained; Discard counter unchanged.
4. **Phase indicator:** straight gold underline without the center diamond; no background glow/shadow.
5. **Notification:** COUNTERED! at 2000ms, RACIAL TRAIT! at 3000ms (original RC32 packaging; revised to 2000ms in subsequent RC32 minor update), preserving queued Player/AI events.
6. **AI Attack selection:** Rage Blast and Venom Sovereign prefer status-matching targets (Bleed and Poison); allow legal nonmatching cases when no better option or lethal.
7. **AI heal efficiency:** only spend Healing Card when at least 60% of its effective healing amount can be used; class/rank and known Healing modifiers considered; no Player card-legality change.
8. **Greater Health Potion:** target must be a damaged, non-Bleed, **Ready** Hero when Item explicitly Exhausts that Hero. Ordinary Health Potion otherwise unchanged.
9. **Poison Vial:** designer-approved updated printed text/art; trigger on attached Hero's **Skill Card** dealing actual Physical HP damage. Excludes Primal Strike/Racial Trait, non-Skill and Magical sources, and blocked-to-zero damage. Attached through owner's End Phase rather than consumed on first trigger. Existing AI follow-up eligibility adapted.
10. **Deflect vs PIERCING:** legal as Response; its BLOCK component does not apply, while REFLECT triggers on connected Hit independently. Separate BLOCK-only responses still disallowed.
11. **Taunt Glow:** bounded UI hardening for independent AI/Player self-Taunt, stale attachment slot metadata, and concurrent Taunt+Casting. **Original report's exact root cause not reproduced.**

**Previously released RC31 features maintained:** Match Result reopen replacing Surrender after Game Over, original favicon, and no auto-Lobby timeout.

## File scope

Modified application assets/code: `card-art/S0-ITM-011.webp`, `engine/assets/exp/Stack 100-200EXP.png`, `engine/shared-app/app.bundle.js`, `engine/shared-app/app.css`, `engine/shared-app/battlefield-authority.css`, `shared-app/app-runtime.js`, `shared-ui/battlefield-ui.css`. Release metadata: `README.md`, `docs/RELEASE_STATUS.md`, `docs/TAKEOVER_NOTE.md`, and new `docs/qa/rc32/*`, `docs/manifests/RC32_FILE_SHA256.csv`. App-specific `docs/LOCAL_DESIGNER_OVERRIDES_2026-11-07.md` records OSA divergence; do not silently backport into frozen authority exports.

## Focused QA and limitations

- **PASS** Node VM production engine with controlled state fixtures: **14/14**.
- **PASS** AI status-specific decision fixtures with actual production AI functions and dependency stubs: **13/13**.
- **PASS** AI healing decision fixtures with dependency stubs: **26/26**.
- **PASS** Chromium production app scripts with controlled imported snapshots: **9/9**.
- **Previously PASS (not rerun during packaging):** Stoneblood focused regression **10/10**, carried report.
- **PASS** JS syntax of engine bundle and UI runtime.
- **BLOCKED** full HTTP-hosted Chromium smoke in this environment (`net::ERR_BLOCKED_BY_ADMINISTRATOR` for localhost); see `RC32_HTTP_SMOKE.json`. The separate inlined-script Chromium tests above do not prove hosted asset loading.
- **NOT VERIFIED:** natural full Human-vs-AI match ending in Win/Loss/Draw; native Firefox; exact original missing Player Taunt glow screenshot-state reproduction; complete parity with future OSA that has not yet incorporated Poison Vial.

Prior isolated UI previews and tests are not proof of a full match. Do not promote this RC to FINAL without additional validation.
