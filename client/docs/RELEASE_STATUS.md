**Latest maintenance (same v1.0 RC32, 2026-11-07):** Exhausted EXP stack; history/log scrolling; raised selected card spacing; user-supplied Physical Attack/Defense MP3; Stoneblood P/M Defense feedback; Response PASS 30s flashing; Runeforged Burst 0-HP-damage explanation. **RC32 — NOT FINAL**. Historical change-by-change checklist: `qa/rc32/RC31_TO_RC32_COMPLETE_INVENTORY_2026-11-07.md`.

RC32 minor update 2026-11-07: Lobby divider removed, Mana Deck R2 six front art updated, EXP lower edge aligned in production CSS, actual Mana Regen badge fixed, Racial notification 2s. No new RC number; OSA and gameplay unchanged. Details/QA: docs/qa/rc32/RC32_MINOR5_UPDATE_NOTES.md and RC32_MINOR5_QA.json.

# Grandis Legacy VS AI Season 0 — Release Status

**Latest packaged release:** v1.0 RC32 — 2026-11-07  
**Status:** RELEASE CANDIDATE — NOT FINAL  
**Previous baseline:** v1.0 RC31 — 2026-11-07

RC32 includes the six approved UI groups, two AI decision improvements, three gameplay fixes, and bounded Taunt-glow hardening. RC31 Match Result and favicon behavior are preserved. The Poison Vial card-specific change was designer-approved after the frozen OSA snapshot: a local application override is documented, not applied to the official OSA exports.

**QA:** focused production engine 14/14 PASS, AI status 13/13 PASS, AI healing 26/26 PASS, Chromium production-script/snapshot 9/9 PASS, Stoneblood regression 10/10 PASS; JavaScript syntax PASS. Checks are scoped; **full natural match, native Firefox, and original reported Taunt-glow scenario remain NOT VERIFIED**. No claim of FINAL or universal parity.

Details: `qa/rc32/RC32_RELEASE_NOTES.md`, `qa/rc32/RC32_QA_SUMMARY.json`, and `TAKEOVER_NOTE.md`.


RC32 same-version update (2026-11-07): combined approved UI/card review/7 Thief artwork/Primal Strike Physical VFX-SFX improvements; RC32 release candidate, NOT FINAL. Detailed QA and existing Escape Arrow test limitation: `qa/rc32/RC32_SAME_VERSION_UPDATE_2026-11-07.md`.


RC32 same-version follow-up (2026-11-07): repaired stale Escape Arrow self-test **fixture**, not gameplay. Focused Unified Discard regression now **27/27 PASS**, prior 26/27 superseded. Full natural game and native Firefox NOT VERIFIED. See `qa/rc32/RC32_ESCAPE_ARROW_REGRESSION_CORRECTION_2026-11-07.md`.
