# Grandis Legacy — RC32 final requested same-version update (2026-11-07)

**Baseline:** RC32 package SHA256 `d9a229802574ef3910f85dacf4502ae799efe42fb9f9acf460870c4e83ac2ac7` (backed up unchanged). **Version:** v1.0 RC32. **Status:** RELEASE CANDIDATE, NOT FINAL.

## New changes relative to preceding RC32 ZIP

- `shared-ui/battlefield-ui.css`: Exhausted EXP matches Ready; full Card History + Battle Log scroll; selected Center Choice headroom; Response PASS delayed attention CSS.
- `shared-app/app-runtime.js`: keep reading position when history log updates; 30s response-only PASS reminder with per-window reset.
- `engine/shared-app/app.bundle.js`: Stoneblood (Player/AI) separate Physical/Magical Defense VFX+audio when an incoming Attack caused defeat; Runeforged Burst Casting Resolved marks pre-Response damage as pending; final 0 HP damage reason in Card Played result (NEGATE/DODGE/INVINCIBLE/BLOCK and reductions), without modifying casting damage or Response legality.
- `engine/assets/audio/battle/P.Atk.mp3` and `P.Def.mp3`: exact copies of supplied user MP3 files.
- No changes to OSA, card effect definitions, Class/Rank restrictions, AI decision logic, underlying casting damage calculation, or other app products.

## QA performed

| Test | Method | Result |
|---|---|---|
| EXP exhausted, history & log scrolling | Production CSS/JS in controlled Chromium fixture | **27/27 PASS** |
| All center-choice raised selection spacing | Controlled Chromium, desktop/mobile/short screens | **30/30 PASS** |
| Deck counts / Regen | Production CSS/JS controlled Chromium fixture | **15/15 PASS** |
| Legacy / Escape Arrow / mandatory discard | Actual engine+UI with controlled Chromium fixture | **27/27 PASS** |
| Runeforged Burst casting damage and 0-damage reason | Actual engine in controlled Chromium fixture | **5/5 PASS** (1=40, 2=80, 3=120, two-counter AI response and INVINCIBLE=0 with reason) |
| Stoneblood P/M defense feedback, UI timed PASS, audio assets | Actual engine/runtime/DOM functions controlled Chromium + byte hashes | **26/26 PASS** |
| Syntax checks | Node --check on engine and runtime | **PASS** |
| Package structure + CRC | ZIP testzip / entry count and hash comparison | **PASS** (see package QA JSON) |

**Not verified:** complete naturally played match, native Firefox, hosted URL in restricted environment and audible device playback. Status is RC32 RELEASE CANDIDATE; not FINAL.

**Full historical checklist:** `RC31_TO_RC32_COMPLETE_INVENTORY_2026-11-07.md`.
