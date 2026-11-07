# Grandis Legacy VS AI Season 0 — v1.0 RC30

**Release date:** 2026-11-06  
**Baseline:** Official RC29 with approved post-RC29 staging fixes.  
**Status:** **RELEASE CANDIDATE — NOT FINAL.** OSA Season 0 DEV45 is untouched.

## Changes approved by the designer

1. **Surge Mana payment display and settlement** — When a 4-Mana Magical Attack activates Mana Surge or Arcane Surge, the center-stage payment count shows **`MANA 5 / 5 (+1 Mana Surge)`** or **`MANA 5 / 5 (+1 Arcane Surge)`**. The fifth *physical Mana card* is specifically selected/glowing and is the one the engine actually spends. Toggle OFF restores the normal 4/4. The mandatory extra Mana counts as **one physical card** regardless of Class Mana base value. Keeps CANCEL precommit semantics. No “Surge Shard” payment label.
2. **Surge hover tooltip uses the existing game palette** — Replaces the OS/browser native white `title` tooltip with the **same existing dark navy, golden-border, warm text portal tooltip** used by Hero-side Class/Racial/Legacy buttons. Both enabled and disabled buttons show explanatory hover and keyboard-focus text; disabled non-Magical attacks explain why Surge is unavailable. The wrapper owns hover to support Firefox disabled-button pointer-event differences (Firefox itself remains unverified). No ability damage or cost changes.

## Scope and changed files relative to official RC29

- `engine/shared-app/app.bundle.js`: reserve, commit and correctly spend extra selected Mana.
- `shared-app/app-runtime.js`: 5/5 payment UI/highlight/animation, Mana-only Surge terminology, reusable gold-on-dark tooltip binding and keyboard support.
- `docs/TAKEOVER_NOTE.md`, `README.md`, `docs/RELEASE_STATUS.md`, and new `docs/qa/rc30/*`: release notes/QA.

The existing `shared-ui/battlefield-ui.css` tooltip palette from RC29 is **reused unchanged**, as are the official card definitions, other game scripts, art and OSA authority. All earlier RC29 fixes are retained.

## QA

| Suite | Result | Method |
|---|---:|---|
| Extra Mana payment / damage / CANCEL / Class Mana | **22/22 PASS** | Controlled Chromium state and actual engine commit |
| Previous Stoneblood / Surge regressions | **16/16 PASS** | Controlled Chromium fixture |
| Styled Surge tooltip: hover, disabled reason, repeat renderer, focus, 820px layout | **19/19 PASS** | Chromium DOM and pointer |
| JavaScript syntax checks | **PASS** | Node.js `--check` |
| JS page errors in targeted tests | **0** | Chromium |

The three suites have overlapping subject matter; their totals are **test assertions**, not a claim of comprehensive coverage. Tests were updated to inspect the new accessible tooltip because the previous regression harness expected a removed native `title` attribute. These were harness changes, not additional gameplay code changes.

**NOT VERIFIED:** Native Firefox, a complete natural human–AI match, and complex naturally occurring Defense interactions. Do not claim FINAL.

See `RC30_QA_SUMMARY.json` and `docs/TAKEOVER_NOTE.md`.
