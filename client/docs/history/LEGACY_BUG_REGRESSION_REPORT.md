# Grandis Legacy — VS AI Season 0 RC4: inherited v6.91.9 bug regression

**Date:** 2026-11-04  
**Input:** Original VS AI v6.91.9 (Season 1), Season 0 RC3, OSA DEV45 Season 0 data.  
**Scope:** Target known old AI-stuck/mandatory-choice failures in the existing v6.91.9 implementation without redesigning the application. OSA, Deck Builder and PvP were not changed.

## 1. Reproduced old Stoneblood bug (original v6.91.9)

The original Season 1 engine's response continuation can pause the AI Battle Phase when a lethal Attack opens the defending human's Stoneblood choice. The pending object was assigned a legacy-specific `after_legacy_reposition` continuation; `resolveStonebloodChoice()` instead expects the Stoneblood continuation. The AI director therefore has no reliable way to resume after the player accepts Stoneblood.

An original-v6.91.9 Node VM reproduction: **6/8 checks pass; 2/8 fail**, including AI turn resume after Stoneblood ACCEPT and area-attack Stoneblood continuation. Evidence: `ORIGINAL_S1_STONEBLOOD_PROBE.json`. This reproduces the inherited problem rather than inferring it from the card description.

## 2. Fixes in S0 application

1. Response-window processing stores the correct `after_stoneblood_response` continuation for Stoneblood and preserves separate Legacy continuation for Legacy replacement.
2. Multi-target and Double Casting interruptions preserve the correct `after_stoneblood_multi_sequence` or `after_stoneblood_double_casting` path; subsequent pending Legacy selection retains the continuation.
3. Stoneblood ACCEPT and DECLINE paths resume the paused AI director/normal turn when no mandatory choice remains. Token spend, 30 HP and once-per-turn gating come from official S0 data.
4. Additional integration defect detected: OSA S0 Hero Component exports have printed `racial_ability` and `class_ability` fields but not the v6.91.9 structured `.action` object expected by several existing handlers. Added S0-printed-effect translation into established racial/class action interfaces, including Stoneblood. This does **not** copy Season 1 card data into S0.
5. Updated the existing passive-human engine match QA harness so a human Stoneblood mandatory choice is explicitly answered instead of being counted as an AI-stuck engine fault or silently ignored.

**Code changed:** `engine/shared-app/app.bundle.js`; existing Stage7 QA harness revised. The original VS AI and official OSA archives are unchanged. External application UI source was not redesigned.

## 3. Regression tests and observed outcomes

| Check | Evidence | Result |
|---|---|---|
| Baseline Stoneblood stuck reproduction | Original v6.91.9 against test cases | **Reproduced (2 failures)** |
| AI response → human Stoneblood ACCEPT → turn continues | `check-legacy-stoneblood-regression.cjs` | PASS |
| Stoneblood DECLINE → Legacy → turn continues | same | PASS |
| AI Stoneblood during lethal Poison at End | same | PASS |
| No tokens / decline does not loop | same | PASS |
| Area Attack interrupted by Stoneblood | same | PASS |
| Double Casting continuation survives Stoneblood | same | PASS |
| S0 Racial Trait and Class Ability handler binding | same | PASS |
| **10 focused source/engine regression scenarios** | `STONEBLOOD_REGRESSION_RESULTS.json` | **10/10 PASS** |
| **Chromium visible external application UI** | `qa-stoneblood-visible-ui.py`, screenshots and log | **PASS**, player clicked visible Stoneblood button, Hero 30 HP, one token consumed, pending cleared and AI advanced to Reform; no page exceptions or missing assets |
| Engine simulated matches through game-over | updated `stage7-match-simulation.cjs` | **5/5 terminal**, 0 recorded errors |
| Prior S0 Stage3–6, starter/art, side-by-side targeted tests | seven Node scripts | **All seven commands exit 0** |
| JS syntax | `node --check engine/shared-app/app.bundle.js` | PASS |

### Interpretation/limits

The Chromium Stoneblood regression uses an **injected test fixture** to put an otherwise launched, visible match into a known lethal-AI-Attack Response state. It then uses the **real visible Stoneblood UI button** and follows the live director. This is stronger than a pure engine unit test, but **does not prove a fully organic end-to-end Human-vs-AI match**. The 5 game-over cases use a passive-human engine harness rather than full browser UI interaction. Full ordinary browser match remains **UNVERIFIED**.

Original Season 1 historic self-test hooks (for example `GL_V6919_MANA_COMMIT_RESPONSE_CANCEL_QA_SELF_TEST`) assume 200-card S1 registries, S1 IDs and S1-specific card triggers. The raw Stage7 self-test probe includes failures based on those outdated fixtures and missing DOM nodes in the Node environment. **They are not automatically treated as real S0 gameplay defects**, nor rewritten to fabricate a PASS. See `LEGACY_SELFTEST_PROBE_LOG.txt` for traceability.

## 4. Re-run instructions

From ZIP root (Node required):

```bash
node runtime/season0-generated/check-legacy-stoneblood-regression.cjs
node runtime/season0-generated/stage7-match-simulation.cjs
node runtime/season0-generated/check-stage5-gameplay-targeted.cjs
node runtime/season0-generated/check-stage5-completion-targeted.cjs
node runtime/season0-generated/check-stage6-ai-bard-targeted.cjs
node runtime/season0-generated/check-side-by-side-fixes.cjs
node --check engine/shared-app/app.bundle.js
```

Chromium/Playwright regression (requires Python, Playwright and Chromium installed):

```bash
python runtime/season0-generated/qa-stoneblood-visible-ui.py
```

Note: the Chromium test mounts application files on a local virtual HTTPS origin and uses **test-only JS injection into the served bundle**. No test injection is included in distributed gameplay source.

**Release status:** RC4 targeted legacy bug regression PASS; **NOT** a final full-browser-playability certification.
