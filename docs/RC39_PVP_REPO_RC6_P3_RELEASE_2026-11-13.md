# PvP RC39 — Repo RC6 Part 3 QA / Release Notes

Date: 2026-11-13  
Build ID: `gl-s0-pvp-rc39-beta2-repo-rc6-p3-2026-11-13`

## Scope / Bug tracker

- **P3-001 Item arrows:** Show only the legal targeted Hero/zone; Protection Response Items target the protected Hero; do not reuse the pending opposing Attack arrow for a targetless Item.
- **P3-002 Card Played:** Restore committed `pvpActionEventsBySide` through a public-only viewer projection; include DEF, BLOCK, DODGE, REACTION/Counter, Item, Event, negations. Click opens exact event detail (fallback for detached contexts). Same-card duplicate entries retained, newest first.
- **P3-003 Damage:** Keep the calculated pre-Response Damage amount visible until the player responds (rather than displaying nonprinted damage). Publish post-Response HP changes/status deltas as `PVP_COMBAT_RESOLVED`; show real HP damage even if no printed damage (Arrow Barrage). Account for direct-resolution attacks without separate visible Response snapshot.
- **P3-004 Busy text:** Do not render transient 'Waiting for server' / action-in-flight notices as gameplay errors; real failures remain visible.
- **P3-005 Opponent discard:** After an accepted authoritative action, detect the opposing player's cards arriving in their Discard from Hand, Main Deck, Field EXP/Attachments; send `PVP_OPPONENT_DISCARD` only to the affected player, **not** the opponent or spectator. Unclassifiable intermediate movement is labeled Unknown rather than inventing a zone.
- **P3-006 Coin Flip:** Remove the duplicate instructional waiting phrase; retain the bottom status line.
- **P3-007 Audio / VFX:** Server-confirmed opponent plays generate card-flight motion and the standard card-play sound; committed Attack result generates physical/magical FX, HP number and Status.
- **P3-008 Timing:** PvP outcome notices held **+1000 ms** after receipt compared with the standard 2000ms notices, without extending server RTT.

## Preservation

- Server authoritative gameplay and exact privacy/redaction of hidden information.
- Networking RC6 Stage2 single WebSocket; no migration.
- Local Mana Payment and local blind Mana Selection remain draft-only until atomic server commit; owner-only cancel.
- Documented RC5 fix reproduced (see root README).

## Automated focused QA

- `npm run check:syntax` — Syntax checks for all shipping JS including new discard module.
- `npm run test:privacy` — Viewer privacy and public Counter/Racial metadata.
- `npm run test:p3` — Card Played/DEF privacy, opponent-only Discard x3, post-Response/AoA damage, direct-resolution damage, RC4/RC5 Mana selection both seats and Cancel checks, static UI hooks.
- ZIP integrity + precompressed asset regeneration.

Full regression and live two-browser (including Northflank) **not run**. Visual verification, audio playback policies, physical touch and full effects require user PvP trial.

## Recommended manual QA

1. Test both seats; play Item on an allied Hero and protection Item during enemy Attack. Arrow should target the protected Hero, not the enemy.
2. Play an Attack that is BLOCKED or DODGED; verify both cards appear under Card Played and can be clicked for their exact detail. Repeat with REACTION/Counter and an Item/Event.
3. Use Arrow Barrage in a matchup with response, including 0-damage/blocked. Verify post-response actual damage numbers and status/animation/sound.
4. Opponent uses Scouting and Calculated Plan; verify affected player sees the **specific** discarded card and origin zone, and the opponent/spectator never sees private identities.
5. Confirm no gameplay toast for 'Waiting for server' when clicking while a request is in flight. Genuine server errors must still show.
6. Coin Flip: only one waiting sentence under the winner name.
7. Confirm Countered, Negated, Blocked/Dodged, damage and discard banners persist 3 seconds after accepted server result.
8. Recheck Mana Burn/Steal blind selection, Cancel ownership and no blinking, including two seats and chained interactions.
