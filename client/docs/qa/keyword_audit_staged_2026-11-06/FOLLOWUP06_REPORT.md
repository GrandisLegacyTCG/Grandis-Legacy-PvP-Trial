# Grandis Legacy — VS AI Season 0 | Keyword/Status Audit — Follow-up 06

**Audit date:** 2026-11-06  
**Unmodified distributable baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Cumulative work tree:** `keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Authorities:** Season 0 OSA DEV45 consumer records, Player Rulebook v2.9, designer rulings recorded in takeover.  
**Version/release:** **NO NEW RC, NO ZIP, NO CHANGES TO OFFICIAL OSA.**

## Confirmed bug — main Class/Skill CONDITION popup had no visible CANCEL

**Observed in RC24's actual external battlefield UI source** (`shared-app/app-runtime.js`): The foreground `.gl-vsai-choice-overlay` template contained only `CONFIRM`; the underlying original v6.91.9 engine's `choiceOverlay` / `cancelActionButton` was suppressed or covered by the newer UI. The engine already supported canceling an uncommitted CONDITION, but normal users of this modal had **no visible CANCEL control**. Direct Chromium reproduction for Crimson Crescendo and God's Blessing demonstrated the issue in the external UI.

**Fix, only in staging:** `shared-app/app-runtime.js` now includes a `CANCEL` button in the same choice footer, shown **only** for `card_search_choice` when `resolve_to` is `s0_condition_precommit`, `gods_blessing_precommit` or `s0_response_condition_precommit`. Clicking it calls the existing `cancelPendingAction` via the bridge; no new cost or gameplay resolver is introduced. Other mandatory/post-commit choices cannot be canceled by this new button. There is **no engine gameplay change in this session**.

**Rollback demonstration:** For the normal Bard/Cleric pre-commit cases, clicking actual `CANCEL` leaves Mana Pool, Hand, Discard and Main Deck unchanged. For Swift Movement Response, `CANCEL` restores the original Response Window with Lun still in Discard and no Mana paid. The user can reselect a legal Response.

## 13 CONDITION card identities — additional verification

The source-backed thirteen identities are: Escape Arrow, Midnight Lullaby, Swift Movement, Crimson Crescendo, Resonance Burst, God's Blessing, Blessing of Accuracy, Blooming Harmony, Grand Finale, Last Resort, Spectral Grappling Hook, Permafrost, X Cross Slash.

| Coverage | Identities | Method/result |
|---|---:|---|
| Mouse-driven precommit select → CONFIRM → separate PAY, with physical zone comparison and CANCEL rollback | **7** | Midnight Lullaby, Crimson Crescendo, Resonance Burst, Blessing of Accuracy, Blooming Harmony, Grand Finale, God's Blessing: **42/42 assertions PASS** at 1440×820. Actual Playwright DOM button clicks in the running external battlefield UI after source-backed legal-state setup. Each test checked no physical cost before committing, then payment decreases physical Mana Pool. |
| Same UI mouse paths on narrow screen | **2 overlapping** | Crimson Crescendo, God's Blessing: **12/12 assertions PASS** at 390×844; no exceptions. |
| Mouse-driven Response payment | **3** | Swift Movement: choose Lun with actual modal button → PAY, physically remove Lun and spend 2 Mana; separate CANCEL restores Response. Escape Arrow and Spectral Grappling Hook: visible Hand DISCARD action commits mandatory second card and Response (both zero-Mana in printed setup). All **3 response sequences completed** without JavaScript errors. |
| CONDITION cards without card-selection popup | **3** | X Cross Slash: requires both named Hand cards, physically discards both, pays 3 Mana. Permafrost: denies without Freeze, accepts with Freeze, pays 6 Mana. Last Resort: denies with three active allied Heroes, accepts with exactly one, pays 2 Mana. **14/14 engine-level assertions PASS.** These were **not** mouse-driven complete opening-to-resolution games. |

**Coverage interpretation:** All 13 identities now have at least one direct check. **That does not mean all 13 have been completed through mouse-driven, naturally progressed matches**; the last three use controlled engine gameplay state and the others use constructed legal states to reach their relevant UI decision. Conditional triggers, AI choices, nested Responses, and all rank permutations are not collectively proven by this table.

### Regression checks after the staged UI fix

- Existing CONDITION/Freeze/card PAY regression: **80/80 PASS**.
- Existing four-depth nested REACTION regression: **109/109 PASS**.
- Existing Ultimate/REACTION regression: **22/22 PASS**.
- `node --check` on staged `shared-app/app-runtime.js` and `engine/shared-app/app.bundle.js`: **PASS**.
- Chromium errors in the new mouse/UI/nonmodal cases: **0**.

Raw evidence: `FOLLOWUP06_UI_QA.json`, `FOLLOWUP06_MOBILE_UI_QA.json`, `FOLLOWUP06_RESPONSE_UI_QA.json`, `FOLLOWUP06_RESPONSE_COMMIT_QA.json`, `FOLLOWUP06_NONMODAL_QA.json` under `docs/qa/keyword_audit_staged_2026-11-06/`. Reproducible playwright JS injection and runner scripts are **outside** the app folder under `/mnt/data/keyword_audit/`; the unmodified RC24 source is retained in its archive.

## Cumulative staging changes (six groups; no new distributable)

1. Existing opponent Poison tick respects INVINCIBLE.
2. Opponent new Status from non-Attack Item/Tactical respects INVINCIBLE.
3. MANA STEAL honors the receiver's physical Mana Deck/Pool capacity.
4. Soul Charged Shot no longer receives a redundant intrinsic RANGE exception; Marksman lineage passive supplies RANGE.
5. Escape Arrow now pays its mandatory Hand-discard CONDITION to use DODGE.
6. **New in follow-up 06:** CONDITION-selection popup exposes the engine's precommit CANCEL functionality to the external UI.

## Still open — do not claim all gameplay FINAL

- Natural Human-vs-AI browser playthrough through the **Win/Loss/Draw** result screen without Surrender, testing ordinary phase and AI progression, remains **unverified**.
- True live mouse-driven X Cross Slash, Permafrost and Last Resort from Hand through source/target selection; broader combinations of the other ten CONDITION cards in ordinary played matches.
- Interactions across multiple BUFF Attachments, Status stacking and cleanse during actual turns, AI attack/payment decisions, multiple affected targets' response chains, Hero/Legacy transitions.
- **Firefox and real-hosted integration** have not been tested in this session.
- **UI backlog (not implemented):** Legacy-style enlarged card hover for Class Ability card-selection overlays.

**Release policy:** Do not package RC25 until the designer's full staged keyword/status audit and integrated acceptance work have finished. Existing RC24 original ZIP remains unchanged.
