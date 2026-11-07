# Grandis Legacy — VS AI Season 0 RC25 | Consolidated implementation QA

**Package:** `Grandis_Legacy_VS_AI_Season0_v1.0_RC25_2026-11-06.zip`  
**Working baseline:** RC24 plus all previously approved staged corrections; RC24 original untouched.  
**State:** RELEASE CANDIDATE, NOT FINAL. No OSA, Deck Builder, PvP or website changes.

## Approved changes delivered together

### Previously staged gameplay fixes
1. Opponent-origin Poison damage is suppressed while INVINCIBLE persists; remaining Poison counters still tick.
2. Opponent Item/Tactical/non-Attack attempts cannot apply new Status to INVINCIBLE Heroes; self-inflicted Status is not globally barred.
3. **MANA STEAL designer correction supersedes the symmetric-cap proposal:** remove up to X *opponent* physical Mana cards first, regardless of the actor's capacity. Then draw from the actor's own Mana Deck up to the number removed, subject to that Deck and the actor's 12-card Pool capacity. Example: own Pool 11 / opponent Pool 5 / STEAL 2 => opponent −2, own +1. Both sides; no change to MANA BURN.
4. Soul Charged Shot may acquire RANGE from Marksman/Grand Ranger passive Class Ability; card does not independently gain RANGE.
5. Escape Arrow must discard one other card from Hand as a Response CONDITION before DODGE resolves.
6. CONDITION card-selection modal exposes a CANCEL before commitment, with no Mana/card cost; no post-payment refund.
7. Last simultaneous Hero defeats in the same Attack/Defense exchange result in DRAW after full exchange resolution.

### Designer-authorized temporary S0 card override
- `S0-CLE-031 Grand Finale`: Bard Rank II 80 → **60**; Maestro Rank III 120 → **90**; replace card artwork with supplied designer WebP. The Mana, note-return CONDITION, INVINCIBLE, Draw, and Ultimate Tribute contracts remain unchanged. Runtime-only VS AI override; OSA DEV45 immutable. This application-specific override should be reviewed against the future official OSA release.

### Four UI fixes
1. **Class Ability Hand selection:** hover/focus candidate shows an enlarged, contextual Legacy-style card preview using the existing body-level preview portal; panel stays within the viewport and pointer events remain on selectable cards. No change to selection logic.
2. **Mana Pool layout:** calculate card spacing from actual local Pool width, observe Pool/field resize and window resize/orientation; preserve side-specific card order and selectable Shards. Covers dense pools under responsive/zoomed widths.
3. **Card Played:** committed Counter/REACTION responses carry explicit source-card/source-event association; no heuristic matching by adjacent phase/lane. In particular, Flashpowder Bomb against Health Potion is no longer displayed as responding to Singularity Reload. The affected item is marked NEGATED, and completed historical cards show RESOLVED.
4. **COUNTERED banner:** a short non-interactive center-screen banner driven by the actual committed `CARD_NEGATED` outcome, with correct card and side names; a counter that was itself negated must not falsely mark the original item as negated. Outcome remains inspectable under Card Played.

## Targeted checks executed against cumulative RC25 source
- Consolidated browser-engine reaction attribution / banner / MANA STEAL smoke: **9/9 PASS**, including AI Item → Player Flashpowder and original Skill + Item + Counter history mixed in one phase.
- Responsive Mana geometry: **20/20 PASS** (1/3/9/12 physical cards across 1600x900, 1250x740, 1024x680 @ 85% document zoom, 850x580 and 1100x650 @ 125% document zoom), both PLAYER and AI. Presentation-hidden animating cards were excluded from visual bounds but counted in physical Pool size.
- Legacy-style Class Ability preview mouse-hover: appears, is overlaid above center selection and remains inside a 1600x900 viewport; no JS errors. Mobile natural input not separately verified.
- Counter banner fixture: appeared with correct AI Flashpowder / Player Health Potion text, no JS errors.
- Designer-corrected MANA STEAL: **68/68 PASS**, no JS errors.
- Grand Finale local nerf/art/ability effects: **30/30 PASS**, no JS errors.
- Nested REACTION regression: **109/109 PASS**; Ultimate vs Response: **22/22 PASS**.
- Simultaneous-Defeat / complex defense targeted regression: **37/37 PASS**.
- `node --check` on edited JS modules: PASS; missing assets in targeted UI test: none observed in supplied relevant assets.

### Limitations / explicit user waivers
The designer waived (1) a full manual/natural Human-vs-AI browser match to terminal result, (2) exhaustive defensive chains in a natural full game, and (3) native Firefox verification. Record all three as **NOT VERIFIED / WAIVED**, not PASS. Targeted Chromium inline DOM browser tests are not equal to hosted browser testing, and responsive synthetic width tests cannot prove the reported external machine issue is resolved in every browser environment. Do not claim FINAL. No unsolicited gameplay/OSA changes.
