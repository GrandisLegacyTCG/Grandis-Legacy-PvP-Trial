# RC16 — Consolidated UI / Center Focus QA

**Build**: RC15 source → RC16 (2026-11-05). **Status**: release candidate. No OSA edits.

## Scope implemented
- Card Review single surface / unified art sizes, Hero/Racial/Legacy button +25% vs RC14, STATUS icon +25%, fixed amber response glow.
- Global single-plane 65% backdrop for every center-stage chooser; no bright Hand/Mana/footer stripe. Center selection is resize-aware and other dialog bodies are scroll-safe.
- Bard and Maestro replace selections directly without Hand UNDO. No engine-zone mutation until confirm.
- Battle P/M Attack/Defense use v6.91.9 stable Hero anchor instead of potentially rotated nested image.
- Burn/Poison two diagonally separated icons with Healing rise/fade timing, .15s stagger, no HP numerals.

## Chromium evidence
- 5 viewport cases for Maestro center choice: 820×580, 1024×650, 1280×800, 1600×900, 1920×1080; 8 face-up choice cards / action bar inside viewport, full-screen veil covers other surfaces. No browser page errors.
- Maestro selected [0,1] → select index 2 → [0,2]. Hand selection controls absent.
- Synthetic Response button golden glow / no animation; Hero horizontal overlap zero at 820, 1024, 1280, 1600.
- A long progression popup at 820×580 scrolls internally; not clipped at viewport bottom.
- Built-in gameplay regressions: Ultimate Tribute 30/30 PASS, target 13/13 PASS, S0 Class/Lineage PASS.
- `node --check` all modified JS PASS; ZIP integrity check `testzip()` PASS.

## Limitations and explicit QA TODO
- Engine anchor selection and VFX asset geometry statically checked against v6.91.9, not verified with a full hosted Firefox attack/defense recording.
- Card Review has shared sizing rules and no wrapper border; actual iframe art sizes for multiple types need normal hosted asset-loading visual QA.
- More complex non-center card selection/reaction flows require actual match UI checks; S0 full-match terminal Win/Loss/Draw still unverified.
- Chromium asset loading was restricted for test HTML; geometry tests cannot assert fidelity of externally linked card-art image pixels.
