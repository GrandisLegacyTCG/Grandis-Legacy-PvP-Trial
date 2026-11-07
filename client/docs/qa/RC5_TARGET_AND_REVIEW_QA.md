# RC5 — Card Target & Review Fixes, targeted QA (2026-11-04)

## Source and scope

Compared the supplied RC4 VS AI Season 0 application with OSA DEV45 current card data, original VS AI v6.91.9 mechanics, and Deck Builder v1.58 Card Review. Official gameplay database is not modified.

### Fixed

1. **Normal Events require an active acting/source Hero.** Event cards such as Relentless Leveling, Scouting and Dazed now invoke the same source-Hero picker/legality path as skills, before target selection and Mana PAY. REACTION Events remain in their dedicated Response window.
2. **Relentless Leveling:** source Hero is EXP recipient, then selected non-Ultimate Skill becomes EXP; immediate Rank Up occurs upon reaching threshold. No normal Tribute quota consumed.
3. **Health Potion / Greater Health Potion:** single damaged Hero target picker. The verified official S0 front prints +30/+50; handled by S0-specific app adapter because OSA current DEV44 consumer text omits those numeric amounts. Already-Exhausted Hero **can** receive Greater Health Potion, which leaves recipient Exhausted after healing, consistent with printed S0 text; the former no-Exhaust target gate was wrong.
4. **Elixir:** choose an allied active Hero with a negative status; cleanse via existing status handler.
5. **Phoenix Feather:** choose a defeated Hero/Legacy slot; revive at 10 HP via existing legacy-revive path.
6. **Dazed / Freeze Bomb:** target an opponent active Hero, apply printed Stun/Freeze for 1 turn using the same status application handler.
7. **AI parity:** non-REACTION Events list legal source Hero, and targeted Item actions list legal target Hero through the shared action validator.
8. **Card Review UI:** ported Deck Builder v1.58 CSS/design and keyword clarity scripts into an isolated read-only review overlay, backed entirely by S0 runtime data, no S1 values. Hero review has no rank/lineage selector in the footer. Battlefield, Mana, response and animation UI unchanged.
9. **ZIP packaging:** single parent folder; documentation/history/manifests moved out of the runnable application root. App script URLs and runtime relative paths preserved.

### QA evidence

- `docs/qa/evidence/target-review/TARGET_SELECTION_QA.json`: 13/13 deterministic in-engine tests PASS, exercised with Chromium using real source/target selectors, actual physical Mana PAY, card search, EXP, status, healing, revive and AI legality.
- `docs/qa/evidence/target-review/VISIBLE_REVIEW_QA.json`: 3/3 tested Skill, Event, Hero review frames render with real artwork, DB style, no JS errors, no missing assets, no Hero footer.
- `docs/qa/evidence/target-review/ITEM_EVENT_TARGET_MATRIX.json`: all 12 Events and 20 Items reviewed: source Hero is required for non-REACTION Events; response-only cards keep Response flow; utility-global Items have no fake Hero target; Hero-targeted Items use their legal target selectors.
- JavaScript syntax for changed JS: PASS.

### Not claimed / outstanding

- **Full normal Human-vs-AI browser match still not completed** in RC5; this is not a certified playable release.
- Some inherited broader regression hooks still fail in both original RC4 and the updated source, e.g. `GL_PVP_V220_GAMEPLAY_UI_QA_SELF_TEST` at *Magical Block response*, `GL_LOCAL_AI_V634_ACTIVE_STRATEGY_QA_SELF_TEST` at *Mana Surge overkill*, and `GL_V6919_MANA_COMMIT_RESPONSE_CANCEL_QA_SELF_TEST` at *Intercept original Response Window*. They are not treated as PASS or silently fixed in this targeted patch.
- **OSA source discrepancy:** official S0 card fronts for `S0-ITM-001`/`S0-ITM-002` visibly print +30 and +50 HEAL, while current DEV44 consumer `card_text` says only `HEAL one of your Heroes` (no amount). The app's S0-only adapter uses the numbers visible on the SHA-verified active artwork. **OSA itself was not edited**, because DEV45 pointers/hashes are pinned; changing gameplay/canonical source would require a controlled source release and explicit design verification, not a silent modification.
- Evidence is targeted regression, not exhaustive all-card interactions.
