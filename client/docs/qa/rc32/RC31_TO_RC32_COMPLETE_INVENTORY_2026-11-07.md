# Grandis Legacy VS AI Season 0 — RC31 → RC32 Complete Change Inventory

**Version:** v1.0 RC32 (same RC32 number; 7 November 2026).  **Status:** RELEASE CANDIDATE — NOT FINAL.  **Scope:** VS AI Season 0 only.  **OSA authority:** unchanged.

This checklist reconciles the original RC31 release notes, RC32 initial/minor/subsequent release notes and the currently requested post-RC32 corrections. `RELEASED` means included in the updated RC32 ZIP, **not** that every possible natural-match sequence has been played. `AUDITED/NO CHANGE` refers to investigations, not new features.

## 1. RC31 — already packaged (historical)

| ID | Feature / correction | Current RC32 status | Verify manually |
|---|---|---|---|
| 31-01 | On Game Over, Surrender becomes **Match Result**; result popup can be closed and reopened repeatedly, without a 60-second automatic Lobby redirect; **BACK TO LOBBY** remains explicit. | RELEASED (carried over) | Win/Loss/Draw, close/reopen, return to lobby |
| 31-02 | Restore original Grandis Legacy `favicon.png` in `index.html`, without duplicating the asset. | RELEASED (carried over) | Browser tab icon |

> Greater Health Potion Ready restriction was **not implemented in RC31**; it entered in RC32 (32-08 below). No need to reopen the historical gap.

## 2. RC32 initial package — gameplay, AI and UX

| ID | Feature / correction | Current RC32 status | Verify manually |
|---|---|---|---|
| 32-01 | New silver **100 EXP** and gold **200 EXP** art and edge-stack/Hero-above-EXP layout. | RELEASED | Each Rank, both artwork types, 1–4 cards |
| 32-02 | Compact Mana Regen/deck counter visuals and desktop +2px counter typography (later restyled in 32-17). | RELEASED / SUPERSEDED UI DETAILS | Compare 32-17 latest style |
| 32-03 | Phase indicator is a straight gold line with no diamond or shadow/glow. | RELEASED | Every phase transition |
| 32-04 | `COUNTERED!` notification 2 seconds; `RACIAL TRAIT!` originally 3 seconds, then changed to 2 seconds (32-16). | RELEASED (latest 2s/2s) | Player & AI activations |
| 32-05 | AI Rage Blast prioritizes Bleeding targets; Venom Sovereign prioritizes Poisoned targets when strategically/legal. | RELEASED | Target selection and legal alternatives |
| 32-06 | AI Healing items/skills used only when ≥60% of **effective** healing is usable; consider Class/Rank modifiers. | RELEASED | HP-loss thresholds for normal/greater heal |
| 32-07 | Item Exhaust requirement: **Greater Health Potion** cannot target an already Exhausted Hero when Item's effect requires Exhaust. | RELEASED | Ready vs Exhausted, Bleed, Full HP |
| 32-08 | **Poison Vial** revised local artwork/trigger: Hero Skill Card must deal actual Physical HP damage; Poison for 2 turns; excludes Racial Primal Strike; persists until owner's End Phase (not consumed on trigger). | RELEASED | Physical/Magical, Block/Dodge, rank, expiry |
| 32-09 | **Deflect** response is legal against PIERCING; BLOCK portion ignored for that attack while valid REFLECT still applies to connected Hit. | RELEASED | PIERCING+REFLECT and non-piercing BLOCK |
| 32-10 | Guarded Player/AI Taunt+Casting Hero glow hardening. | RELEASED; ORIGINAL SCREENSHOT STATE NOT REPRODUCED | Concurrent Taunt/Casting on both sides |

## 3. RC32 five-item maintenance update

| ID | Feature / correction | Current RC32 status | Verify manually |
|---|---|---|---|
| 32-11 | Remove Lobby divider between Hero deck panels and Start Match area. | RELEASED | Lobby desktop/mobile |
| 32-12 | Replace six Mana Deck faces `S0-MAN-001`–`006` with supplied **Mana Deck R2** artwork. | RELEASED | Each of six colors |
| 32-13 | Adjust READY EXP edge alignment against bottom edge of Hero art. Later unified with Exhausted in 32-22. | RELEASED (enhanced below) | Hero top/bottom |
| 32-14 | Actual Battlefield Regen badge and counter renderer corrected (not only mock/preview). Later simplified in 32-17. | RELEASED (enhanced below) | Both decks in battle |
| 32-15 | `RACIAL TRAIT!` notification now **2 seconds**, matching `COUNTERED!`. | RELEASED | Both sides |

## 4. RC32 next combined update and Escape Arrow QA correction

| ID | Feature / correction | Current RC32 status | Verify manually |
|---|---|---|---|
| 32-16 | EXP top/bottom artwork height **1px inset** each; each EXP exposed by **7px**; maintain Hero on top. | RELEASED | Rank I–III, 100/200, 4 EXP |
| 32-17 | Uniform **black/white** Main/Legacy/Mana deck-count badges. Mana Regen `+N` in **blue** badge, matching height/font, Player top-left and AI bottom-right (counter opposite corner). | RELEASED | PC/mobile/adaptive, both sides |
| 32-18 | **Unified Discard** selector (Bard-style centered choice) for Legacy costs, Escape Arrow/Response extra discard, Hand Limit and other discard choices; preserve Mana/payment/rollback. | RELEASED | Selected quantity, confirm/cancel, Escape Arrow |
| 32-19 | **Poison Vial Card Review** now aligns Class/Rank and Physical damage from the Hero's **Skill Card** with the new artwork. | RELEASED | Inspect popup and card artwork side by side |
| 32-20 | **Grand Finale Card Review** now presents Zol/Lun/Vae CONDITION, INVINCIBLE until start of next turn, Draw 3, Bard 60/Maestro 90, Ultimate restriction. | RELEASED | Inspect both class rows and shared effects |
| 32-21 | Update seven **Thief Hero artworks** `S0-THF-H001` to `H007` from user file. H008/H009 remain as before. | RELEASED | Review and in-game displays |
| 32-22 | **Primal Strike** Physical Attack VFX/SFX using normal P.Attack/P.Atk route when Response resolves; gameplay unchanged. | RELEASED | Player/AI, BLOCK/DODGE, Sound ON/OFF |
| 32-23 | Correct the **Escape Arrow regression self-test fixture**, which incorrectly faked scalar Mana rather than owned physical Mana Shards. Gameplay untouched; corrected focused test 27/27 PASS. | RELEASED (TEST ONLY) | Actual Response + extra discard + Mana |

## 5. Final RC32 same-number maintenance — user-reported bugs and pending items

| ID | Feature / correction | Current RC32 status | Verify manually |
|---|---|---|---|
| 32-24 | **EXP Stack on Exhausted Hero:** match Ready 1px top/bottom inset and 7px per card; rotate Hero and EXP stack as one package. | RELEASED (NEW) | Ready↔Exhausted across multiple Ranks |
| 32-25 | **Full Card History** vertical scrolling with visible sticky Close/header and all historical rows reachable. | RELEASED (NEW) | Long matches: top, middle and bottom |
| 32-26 | **Battle Log** independent scrolling; preserve reader's scroll position when log updates; only follow bottom when already at bottom. | RELEASED (NEW) | Log entries arriving while reading older lines |
| 32-27 | **Center selected-card spacing:** reserve 44px top room so raised selected cards do not overlap selection count/header; all center-choice variants and short viewport scroll. | RELEASED (NEW) | Legacy, Escape Arrow, Bard, Mana, Hand Limit |
| 32-28 | Replace `P.Atk.mp3` with exact new user file (applies to standard Physical Attack, including Primal Strike). | RELEASED (NEW) | Sound ON, Physical attack |
| 32-29 | Replace `P.Def.mp3` with exact new user file (used by Physical Defense and Stoneblood vs Physical). | RELEASED (NEW) | Sound ON, Physical Defense |
| 32-30 | **Stoneblood activation:** if caused by an incoming Physical/Magical Attack, play matching P.Defense/P.Def or M.Defense/M.Def on the saved Hero for Player and AI. Decline does not play Defense. Status-only defeat has no identifiable incoming Attack and therefore does not invent a Physical/Magical Defense effect. | RELEASED (NEW) | Physical, Magical, Player, AI, decline |
| 32-31 | **Response PASS** flashes **after 30 seconds** of the same player Response Window, resets on a new window, does not affect non-Response PASS/CANCEL/REPOSITION; honors reduced-motion setting. | RELEASED (NEW) | <30s, ≥30s, next Response |
| 32-32 | **Runeforged Burst:** Casting Resolved explicitly says its release damage is PENDING until Defense Response. After resolution, the **same Card Played history entry** shows Final HP damage plus a factual reason when 0 (INVINCIBLE/DODGE/NEGATE/BLOCK/reductions/invalid target). No change to 40/80/120 damage rules. | RELEASED (NEW) | Casting 1/2/3, Defense, 0 damage reasons |

## 6. Audits (no gameplay code change required)

| ID | Review | Conclusion / limit |
|---|---|---|
| A-01 | Healing sound on common single-target, item, AoE, attack+heal, Ability and Racial healing paths. | Previous source-path audit found the shared Heal.mp3 trigger after real HP gain; audio playback on real hardware NOT VERIFIED. **REVIVE is a separate mechanic** and does not automatically use Heal.mp3. This was not modified. |
| A-02 | Screenshot of Runeforged Burst Casting Time 2, showing 80 at release but seemingly no HP loss. | Controlled engine: 2 counters = 80 incoming damage; final HP outcome depends on the subsequent Response, INVINCIBLE, etc. Exact screenshot match reason NOT VERIFIED. Added transparent final-result reasons in 32-32 without changing damage rules. |
| A-03 | Reported Taunt glow discrepancy. | Bounded CSS/render protection is present, but original exact behavior could not be reproduced. NOT VERIFIED in a natural match. |

## 7. Focused revalidation for final RC32

- **EXP Exhausted + history/log scrolling:** 27/27 PASS, headless Chromium controlled DOM fixture.
- **Center selected-card spacing:** 30/30 PASS, controlled Chromium layouts across six viewport sizes.
- **Deck badge + Regen:** 15/15 PASS, controlled Chromium.
- **Unified Discard / actual Escape Arrow engine fixture:** 27/27 PASS, controlled Chromium (previous malformed QA corrected).
- **Runeforged controlled engine:** Casting 1/2/3 = 40/80/120, 2-counter AI no Response = 80, 2-counter INVINCIBLE = 0 with explicit reason; 5 tested cases PASS.
- **New Stoneblood feedback, Defense VFX nodes, PASS timer, 0-damage cause handling, audio byte equality:** 26/26 PASS, controlled Chromium/asset checks.
- **Total across these suites:** **130 targeted checks/scenarios PASS**. These are not 130 full matches. JavaScript syntax and package ZIP integrity independently checked.
- **Preserved:** all original 7 Thief and 6 Mana Deck art, Poison Vial & Grand Finale Review overrides, and existing Primal Strike routing, under the updated RC32 package.

## 8. Outstanding acceptance / things to check carefully

**NOT VERIFIED:** natural complete Human-vs-AI game from opening through genuine win/loss/draw; native Firefox; installed/hosted browser networking in this environment; hardware-audible Sound playback; full in-match hover, long scrolling with live assets, and full AI strategy coverage. Original Taunt screenshot scenario remains unreproduced. A passing isolated fixture cannot certify these scenarios.

**Suggested manual order:** (1) Exhausted EXP stack with 2–4 cards, (2) scrolled full Card History and Battle Log with 30+ entries, (3) Escape Arrow and Legacy center choice, (4) Runeforged Burst vs PASS, INVINCIBLE, DODGE, BLOCK/NEGATE, (5) Stoneblood vs both Attack types with sound ON, (6) PASS reminder at 30 seconds, (7) both Review popups, (8) six Mana and seven Thief art, (9) final Match Result reopen.

**Source boundary:** OSA Season 0 DEV45 files and all other game apps were not edited. Poison Vial, Grand Finale and local art remain app-specific designer-approved overrides not silently backported into frozen OSA source.


## 2026-11-07 follow-up — Primal Strike and Burn (RC32 same version)
- [x] Primal Strike deals +10 damage against a Burned Hero **only if** positive Physical damage remains after Defense.
- [x] Player Rulebook v2.9 complete PDF updated on page 14 and bundled in `docs/rulebook/`.
- [x] AI finisher recognizes Burned target at 30 HP (vs 20 HP without Burn).
- [ ] Full natural match, Firefox and real-device sound still NOT VERIFIED.


## RC32 Same-version minor maintenance — Stun & 2-Mana Color Shard (2026-11-07)

- [x] Stun blocks initiated Class/Racial actions, including Class Draw Review (Quick Reload/Rapid Chamber), active racial actions, Second Chance/Dragon Scale Responses and Stoneblood. Existing Skill/Defense Stun restrictions remain.
- [x] Selecting matching Color Mana valued 2 removes already-selected Color Mana first where an exact-value replacement exists, otherwise removes other Mana; normal toggles retain existing behavior. Shared by Skill and Response Mana payment.
- QA: 23/23 focused PASS in Chromium JS runtime, broad regression suite no change from prior baseline; full natural match and Firefox NOT VERIFIED.
- Version: remains v1.0 RC32; no OSA, Rulebook, card-art, SFX or other app changes.
