# Grandis Legacy — VS AI Season 0 RC27 | Hover Preview Flicker Fix

**Release:** v1.0 RC27 — 2026-11-06  
**Baseline:** RC26 unchanged archive  
**Scope:** ONE user-approved bug fix — Class Ability card-choice hover preview flicker.  
**Release status:** RELEASE CANDIDATE, NOT FINAL.

## Symptom / confirmed cause

In Firefox user recording `Grandis Legacy — VS AI Season 0 — Mozilla Firefox 2026-11-06 04-30-18.mp4`, the Prolonged Symphony/Bard card-choice hover preview appears at the correct left/right side, but disappears repeatedly while the pointer remains over a card.

RC26 reproducer showed `renderAllowedModal(s)` executed at the **120 ms** UI render cadence. For `s0_bard_draw_choice`, the generic modal had no active matching pending type and incorrectly called `hideModalHoverPreview()` on the **shared** preview that belongs to `renderCenterChoiceStage` / `bindClassChoiceHoverPreview`. Even a stationary pointer would lose the preview.

## Narrow correction

**One runtime implementation file:** `shared-app/app-runtime.js`, function `renderAllowedModal`.

The generic renderer now skips its shared-preview cleanup *only* while a still-connected center-choice card owns the preview and the pending choice is `s0_bard_draw_choice`. All other pending states use the previous modal cleanup. Leaving/blur of the center card, and changing/exiting the center choice, still perform their existing cleanup. The established left/right preview placement, card sizing, player choice logic, Mana, effects, OSA consumer data, AI, animations and other app modules are unchanged.

**Release metadata / QA-only files:** `README.md`, `docs/TAKEOVER_NOTE.md`, `docs/qa/rc27/RC27_RELEASE_NOTES.md`, `docs/qa/rc27/HOVER_FLICKER_QA.json`.

## Controlled Chromium QA

- Unmodified RC26 regression baseline: card hover **CLOSES** after 2,150 ms idle, with **19 hide calls** under 120 ms polling (reproduced failure).
- RC27: **21/21 PASS** across 1600×848, 1024×650 and 820×580:
  - Hover remains open for 2,150 ms with pointer *stationary* despite 120 ms polling (zero generic renderer hide calls).
  - Moving from card A to card C updates the preview without disrupting the selection stage.
  - Pointer leave removes the preview; focus displays it; blur removes it.
  - An unrelated pending/modal transition still clears the preview.
  - Chromium JavaScript page exceptions: 0 in this targeted fixture.
- `node --check shared-app/app-runtime.js`: PASS.
- ZIP structural/CRC and byte-for-byte unchanged non-scoped files: verified when packaged.

### Proof boundaries

The tests use **original RC26/RC27 functions in a controlled Chromium DOM fixture**, not an entire natural browser match. The recorded Firefox problem provided the real-world symptom, but RC27 has **not yet been manually retested in Firefox**. Full Human-vs-AI match, exhaustive natural defense combos, and Firefox native playthrough remain **NOT VERIFIED** by designer waiver; do not label them PASS.

## Next

User acceptance: retest stationary hover in Firefox during Prolonged Symphony and other Bard/Maestro card choices; confirm card-change and pointer exit behavior. If issue recurs, capture the exact current pending state, hover owner DOM connectivity, and the caller of preview dismissal; do not apply unrelated gameplay changes.

**Authority:** OSA Season 0 DEV45 remains read-only. Previous RC26 functionality and fixes preserved.
