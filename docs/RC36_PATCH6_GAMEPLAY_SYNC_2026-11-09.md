# RC36.8 / Internal Patch 6 -> PvP RC36 Gameplay-Only Sync (2026-11-09)

## Sources
- Existing PvP base: `Grandis_Legacy_PvP_S0_RC36_Patch4_UI_Hotfix1_2026-11-09.zip`.
- Donor earlier: `Grandis_Legacy_VS_AI_Season0_v1.0_RC36_Patch_4_2026-11-09.zip`, whose README identifies internal RC36.6.
- Donor latest: `Grandis_Legacy_VS_AI_Season0_v1.0_RC36_Internal_Patch_6_2026-11-09.zip`, whose README identifies internal RC36.8.

## Actual donor comparison
`diff -qr` across the entire extracted donor trees showed the only changed production files between RC36.6 and RC36.8 were:
- `shared-app/app-runtime.js`: expands the clickable legal Response source area from Hero card to its enclosing lane. Allows clicking an exhausted source's highlighted lane when attacked directly; uses already legal Response options. This is a gameplay-interaction fix, not a rules edit.
- `shared-ui/battlefield-ui.css`: PLAY button stacking above EXP and VS AI lobby warning positioning; visual CSS changes only. **Not ported.**
- `README.md` and added `docs/qa/rc36/rc36_7`, `rc36_8`: documentation/tests only.

**No authoritative gameplay rules changed.** The donor `engine/js/runtime-authority.js` is byte-for-byte identical to the PvP RC36 Patch 4 donor engine (SHA-256 `74700775e8e91e5baa056a1a12a974658a12efa5a39e5113e31aaa892ad31344`). The PvP `app.bundle.js` has required pre-existing server/RC5 payment adaptations, so it is deliberately preserved rather than overwritten with the VS AI bundle.

## Patch contents
1. Updated **only** the Response panel click routing in `public/battle/shared-app/app-runtime.js`, adapting the RC36.8 donor block to the PvP-specific renderer.
2. Changed **only the cache-busting query** on that one script in `public/battle/index.html`, so browsers do not continue loading the old handler.
3. Added `tests/rc36-patch6-defense-source.mjs` and the package test command. README and this QA document updated.
4. Regenerated `.br` and `.gz` compression siblings for the modified textual assets. No new UI/art/music/audio/engine assets were imported.

## Behavior acceptance
- An engine-legal exhausted Paladin/Crusader source is clickable on its entire lane on both **self-attacked** and **ally-attacked** cases; Blessing protects all allies and has no second target.
- Holy Barrier still selects **legal source -> attacked Hero**, not another allied Hero.
- Invalid source lane or spectator/opponent side does not become clickable.
- Clicks on Hero art, existing buttons, attachment cards and interactive controls retain their original handlers. Tribute lane clicks remain functional.
- No changes to engine legality, per-card cost, status mechanics, EXP rules or UI geometry.

## Verification / limitations
- `npm run check`: PASS (including server/transport/privacy/regression flows and added targeted behavior tests).
- `npm run build:precompress`: PASS.
- Changed-file allowlist checked against previous PvP Hotfix1, with CSS/engine/network files byte-identical.
- This uses a controlled JavaScript/VM test for the actual production Response handler. Real two-browser, mobile, and Northflank-hosted functional/visual testing remains outstanding. No GitHub operations were performed.
