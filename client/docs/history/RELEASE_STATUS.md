# VS AI Season 0 v1.0 — RC3 side-by-side review (2026-11-04)

**Status: RELEASE CANDIDATE — NOT production-certified.**

Source: original VS AI v6.91.9 application engine/UI, official OSA Season 0 DEV45 data + DEV44 pinned consumer exports. Side-by-side source inspection and checksum inventory are in `SIDE_BY_SIDE_AUDIT_2026-11-04.md` and `SIDE_BY_SIDE_V6919_TO_S0_FILE_DIFF.csv`.

Two contained compatibility improvements were made in the active app bundle: recognize S0 Hero-ID-shaped package lineage during import normalization, and remove the obsolete S1-only stale-art special-case applied to S0 Aim Shot. All S0 game/AI changes from RC2 are retained; OSA, Deck Builder, PvP are unchanged.

Targeted source and executable engine regressions PASS, including 5 normal Node-VM terminal matches (passive human). A **complete normal Human-vs-AI match through real interactive Chromium browser UI has NOT been demonstrated**; hosted/GitHub Pages and device mobile battlefield QA are also open. Do not claim FULLY PLAYABLE/FINAL.

To reproduce the 2 specific fixes: `node runtime/season0-generated/check-side-by-side-fixes.cjs`. Additional testing details are in `SIDE_BY_SIDE_QA_RESULT.json`.

### RC4 — 2026-11-04 (supersedes RC3 for inherited-bug regression)
Confirmed and fixed original v6.91.9 Stoneblood AI-turn continuation freeze plus S0 printed ability-to-handler bridge gap. 10 targeted Stoneblood/Racial/Class checks PASS, visible Chromium Stoneblood choice click advances AI to Reform without JS errors, 5 engine matches finish with 0 recorded errors. See `LEGACY_BUG_REGRESSION_REPORT.md`. **Full naturally played Chromium Human-vs-AI terminal match remains UNVERIFIED; package is release candidate.**
