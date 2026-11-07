# Grandis Legacy — VS AI Season 0 | Keyword & Status Audit — Follow-up 07

**Date:** 2026-11-06  
**Immutable released baseline:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Cumulative staged code:** `keyword_audit/Grandis_Legacy_VS_AI_Season0/` (preserves all six prior staged corrections)  
**Authorities:** Player Rulebook v2.9, OSA Season 0 DEV45/current consumer export, designer rulings in `docs/TAKEOVER_NOTE.md`.  
**Scope this session:** Multi-target per-Hero Response, status-on-hit, one Legacy-replacement interruption, and AI setup-to-attack follow-up. **No engine/UI/data code changed; no new RC or app ZIP.**

## New results

| Focus | Assertions | Result | What was actually executed |
|---|---:|---|---|
| Multi-target / Response / Legacy | 66 | **66 PASS** | Engine in Chromium: `Glacial Spike (S0-MAG-014)` with Mirror Image (`S0-MAG-005`) on first target, then independent Hit+Freeze on later targets; a Legacy occupying RIGHT is excluded; `Poison Mist (S0-THF-011)` Dodged first target but Poison only on later connected targets; PLAYER-to-AI no-Response variants; `Holy Blast (S0-CLE-009)` first-target lethal Hit pauses for Legacy choice and resumes remaining Area targets. Actual physical Mana payment/discard was checked where applicable. |
| AI tactical continuation | 20 | **20 PASS** | `Blessing of Might (S0-CLE-004)` attaches to Warrior then AI follows with `Slash (S0-WAR-001)` from the buffed Hero for printed **30 + 20 = 50** damage. AI does not play the BUFF if there is no possible Physical follow-up. `Freeze Bomb (S0-ITM-020)` is followed by a same-turn Physical `Slash` against a Frozen target; the target's `Mirror Image` remains in Hand unused and 30 HP damage applies. In this particular real-AI continuation, the director **already completed** Battle/End before the isolated caller reentered: the test checks the completed action, not a fictitious second Attack. |
| CONDITION regression | 80 | **80 PASS** | Prior focused CONDITION/Freeze test rerun without code changes. |
| Nested REACTION regression | 109 | **109 PASS** | Prior focused reactive counter-chain test rerun without code changes. |
| JS syntax and browser errors | 2 modules | **PASS; 0 page errors** | `node --check` on both staged `app.bundle.js` and `app-runtime.js`, headless Chromium test runs. |

**Total:** 275/275 targeted assertions PASS (66 + 20 + 80 + 109). This is an assertion count, **not** 275 card identities or a full match. New audit exercises fewer than 40 distinct card identities, satisfying the designer's group-size limit.

### Confirmed bugs and code changes this session

**No new confirmed gameplay bugs. No code changes.** The six staged fixes from earlier follow-ups remain present but were not modified:
1. INVINCIBLE protects against existing opponent Poison tick damage while Status duration continues.
2. INVINCIBLE prevents newly applied opponent Status from non-Attack Item/Tactical effects.
3. MANA STEAL caps physical cards removed to the recipient's receiving capacity.
4. Soul Charged Shot no longer gets a redundant intrinsic RANGE exception; Marksman passive provides RANGE.
5. Escape Arrow enforces mandatory discard-from-Hand CONDITION on Response.
6. Pre-commit CONDITION choice modal exposes CANCEL without spending Mana or moving cards.

### Important invalid fixture pitfalls (not game defects)

- An initial synthetic test attempted to manually select/pay an **AI-side Response** while forcing `pvpHumanVsHuman=true` within a local client. This was not a valid human-vs-AI control path; the final multi-target assertions instead test *AI attacking PLAYER*, where PLAYER can actually pay its Response, plus *PLAYER attacking AI* with its normal AI-controlled no-Response flow. **Do not report the invalid test's missing AI payment as a gameplay bug.**
- An attempted `Wild Assault (S0-WAR-019)` test used a Hero record whose Ultimate-specific owner restrictions were not represented by the constructed fixture, so the engine correctly rejected it as **illegal source Hero**. This attempt was excluded; its effects are **not certified** by this follow-up.
- An early AI BUFF expectation assumed Slash base damage 20. Official `S0-WAR-001` prints **30**, so 30 + Blessing of Might 20 = 50. Corrected without game-code edit.
- An early Freeze Bomb follow-up fixture tried to call `chooseAIAction` after the live AI director had already spent the Slash and advanced phases. The resulting `SKIP` was not a failure to follow up: Slash was physically in AI Discard, the attacker Exhausted, and victim lost 30 HP. The final assertions inspect the real continuation instead of replaying a second Attack.

## Coverage limits and remaining work

This test used the **real staged engine in Chromium with constructed legal states and targeted execution**, not a complete natural lobby-to-game-over session. It does not establish all combinations of multi-target Response, counter-Response while a Legacy selection is open, or AI strategy quality under genuine deck/hand scarcity.

Still open before consolidated release:
- Real mouse-driven, naturally progressed game through **Win/Loss/Draw** (not Surrender), with AI planning and no stuck modal/phase.
- More multi-target Response combinations involving simultaneous/near-simultaneous defeats, redirect/NEGATE/REFLECT, and opposing Hero/Legacy replacement under ordinary match progress.
- BUFF+Status interactions with actual turn transitions, finite resources, multiple Attachments and class abilities, including AI decisions when plans become illegal mid-turn.
- Real hosted browser / Firefox coverage and responsive UI integration.
- Separate UI backlog: **Legacy-style enlarged card preview on hover** in Class Ability card-selection overlays; not implemented.

**Release policy unchanged:** Keep original RC24 as the most recent published archive. Do not package or rename RC25 yet. All code/data changes must stay in staged working tree until the integrated gates are met.

**Evidence inside staged app:** `docs/qa/keyword_audit_staged_2026-11-06/FOLLOWUP07_MULTI_QA.json`, `FOLLOWUP07_AI_QA.json`, and this report. Reproducible Playwright fixtures/runners live separately under `/mnt/data/keyword_audit/`.
