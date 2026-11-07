# Grandis Legacy — VS AI Season 0 | Keyword & Status Audit — Follow-up 08

**Date:** 2026-11-06  
**Distribution baseline:** immutable `Grandis_Legacy_VS_AI_Season0_v1.0_RC24_2026-11-05.zip`  
**Work:** cumulative staged files under `/mnt/data/keyword_audit/Grandis_Legacy_VS_AI_Season0/`  
**Source authority:** official Season 0 Rulebook v2.9, DEV45 OSA, explicit designer rulings. No OSA changes.

## Finding: confirmed game-over error on simultaneous final-Hero defeat

**Severity: HIGH — confirmed on original RC24 as well as pre-fix staging.** A single-target connected Slash (`S0-WAR-001`) versus `Absolute Defense` (`S0-MAG-031`, Arcane Warrior Rank II), with each side having exactly one active Hero at 20 HP, results in both final Heroes going to 0 HP. RC24 incorrectly selects **AI wins** because `applyDefeatCheck()` calls `checkGameEnd()` as soon as the defender dies, before Absolute Defense REFLECT resolves. `checkGameEnd()` also tested PLAYER defeat before AI defeat without an explicit simultaneous-defeat branch. This violates Player Rulebook v2.9 page 3: simultaneous final-Hero defeat within the same Attack/Defense exchange is a Draw.

**Evidence:** `FOLLOWUP08_DEFENSE_RC24_BEFORE_QA.json` has **36/37** assertions passing, with the sole failure `SIMULTANEOUS_LAST_HERO_DEFEAT_ABSOLUTE_DEFENSE` (expected DRAW, actual AI). No source values or identities were altered.

**Scoped staged repair** in `engine/shared-app/app.bundle.js`:

1. During an active `incoming_attack` Response, defer last-Hero terminal adjudication until resolution/REFLECT and subsequent continuation finish; do not destroy the live Response frame while REFLECT remains to be processed.
2. Once all connected effects of the exchange are completed, check **both teams** for zero surviving active Heroes before single-sided defeat. Both at zero => `winner:'DRAW'`.
3. Correct the log for draw outcomes (no misleading `DRAW wins` string).

**After:** `FOLLOWUP08_DEFENSE_QA.json` **37/37 PASS**, 0 Chromium page errors. Includes a legitimate single-target Cover Up REDIRECT, Area Attack Deflect 20 REFLECT after full BLOCK, rejecting Cover Up and Brilliant Radiance as Area Attack responses, independent Area targets, conservation of 12 physical Mana per side, simultaneous 1v1 draw, ordinary single-sided last-Hero defeat (AI wins), reflected attacker-only last-Hero defeat (PLAYER wins), and full BLOCK preserving the game. There are no new release ZIPs.

## Additional unfinished-path audit performed

| Area | What was executed | Result / limitations |
|---|---|---|
| Multi-target defensive routing | Area Magical Glacial Spike, Gladiator Deflect against the LEFT connected Hit while CENTER and RIGHT continue, Cover Up/Brilliant Radiance unavailable against Area, targeted REDIRECT on single-target attack. | PASS in 37/37 suite after repair. Not every REDIRECT/NEGATE family and nested combination. |
| AI plans becoming illegal | Target changes to Legacy, planned attacker Stunned, insufficient physical Mana for Attack, planned attacker Defeated. Compared chosen action against real `getLegalActions()` and checked due-plan invalidation and 12-card Mana invariant. | `FOLLOWUP08_AI_CHANGE_QA.json`: **12/12 PASS**, no page errors. Synthetic legal test states, not full AI strategy-quality certification. |
| Full-turn engine-to-terminal integration | Actual 50-card starter decks, six-card Opening Hands, opening Shards and regular draw, real turn/AI attack/Response/Legacy/Hand-limit/End mechanics, PLAYER passes. Test harness only accelerates existing AI routine to immediate execution; it bypasses visual delays and explicitly advances the immediate AI after a Legacy gate when otherwise paused. | `FOLLOWUP08_FULLMATCH_QA.json`: **gameOver=true**, winner **AI**, round **21** in the retained run, with 2 Legacy selections, 19 Hand-limit cleanups, 1 passed Response, no invariant violations, no browser errors. **NOT** a normal mouse-driven/UI-to-terminal acceptance test. No Surrender used. |
| External Battlefield with real lobby and coin mouse clicks | Opened real Lobby, chose coin, clicked Start Game, NEXT PHASE and passed PLAYER Responses. Reached round 8 in the accelerated Chromium run including a real Legacy choice. | **INCOMPLETE**: no terminal screen reached; script hit test/execution budget. Presentation timer acceleration also means it does not prove ordinary-speed rendering. The timeline is in `FOLLOWUP08_FAST_UI_V2_LOG.txt` outside the app. |
| Hosted page / Firefox | Attempted `page.goto('http://gl-qa.local/index.html')` with Playwright routes; navigation returned `ERR_BLOCKED_BY_ADMINISTRATOR`. Only Chromium is installed; native Firefox not present. | **BLOCKED / NOT EXECUTED**, not PASS. Tests used inline-loaded original JS/DOM plus routed static assets. |

## Repeat focused regression after patch

- MELEE / RANGE / ALL OPPONENTS: **312/312 PASS**.
- PIERCING / SURE HIT / BLOCK / DODGE: **111/111 PASS**.
- Nested REACTION: **109/109 PASS**.
- CONDITION: **80/80 PASS**.
- BUFF / Status: **100/100 PASS**.
- Nonmodal CONDITION: **14/14 PASS**.
- AI plan invalidation: **12/12 PASS**.
- DEFENSE/last-Hero outcome: **37/37 PASS**.
- JavaScript `node --check` of the staged engine and external UI: PASS.

These are individual assertions in controlled Chromium tests, **not** full independent match certifications. Original earlier focused QA reports are retained in the staging package; one older AI-specific runner was not successfully completed in this session and is not represented as newly passing.

## Cumulative staged fix ledger (all **unreleased**)

1. INVINCIBLE prevents an existing opponent Poison tick from causing damage while durations continue.
2. INVINCIBLE prevents new opponent Status from non-Attack Item/Tactical effects.
3. MANA STEAL respects opponent physical Mana count and own receiving capacity.
4. Soul Charged Shot RANGE comes from Marksman/Grand Ranger passive, not an intrinsic card exception.
5. Escape Arrow enforces its discard-from-Hand CONDITION during Response.
6. Pre-commit CONDITION selection modal supports CANCEL with zero cost.
7. **New in Follow-up 08:** simultaneous final-Hero defeat in one Attack/Defense exchange correctly resolves DRAW.

## Release acceptance still open — don't mark FINAL

1. Complete *one* ordinary-speed **mouse-driven** Human-vs-AI match from Lobby to actual Win/Loss/Draw terminal overlay, without using Surrender or manual internal phase repairs; test AI after Legacy, plus Action/Response and animated HUD.
2. Verify full Firefox hosted integration (not available in this execution environment).
3. Broaden two- or three-target scenarios involving mixed REDIRECT, REFLECT, NEGATE, simultaneous defeats and Stoneblood in a natural match. Test all applicable Response variants, beyond current representative cases.
4. Test AI tactical planning in actual games over genuinely changing resources/Attachments/Status, including follow-up after a human Reaction and cases where attacks become unaffordable. The source-bound synthetic scenarios above are a partial check.
5. Inspect/implement separate approved backlog only when requested: Legacy-style enlarged hover preview in Class Ability card-selection overlays.

**Packaging policy:** No new RC/ZIP. RC24 remains the last distributable; all Follow-up 08 code is retained in the cumulative staged working tree only. Continue audits and include this record in `docs/TAKEOVER_NOTE.md` before a future consolidated release.
