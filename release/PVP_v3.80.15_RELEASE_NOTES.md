# Grandis Legacy PvP v3.80.15 — 2026-10-13

Baseline: **v3.80.12 gameplay/input behavior**. This release re-applies only the intended v3.80.13 tablet/presentation fixes, retains the v3.80.14 server-owned build handshake, and corrects the Response Hand stacking regression. Mana Payment is unchanged.

## Fixes

- Response Hand/card actions now sit above the lifted attacker/target Hero grids during Response focus (`bottom-hud` 980, card actions 990 vs Hero grids 950), so visible Response PLAY buttons are clickable on desktop and tablet.
- Tablet/mobile still disables the desktop-only extended Hand hover pseudo-hitbox; desktop hover behavior remains unchanged.
- Tablet/mobile Lobby uses Battlefield's single 1600×747 adaptive stage without a nested Lobby scale.
- `WAITING FOR OPPONENT RESPONSE...` uses the centered persistent turn-banner presentation.
- Hero Racial/Class button group remains inset at 6px/6px and the accidental global availability glow/shadow stays removed.
- Low-latency authoritative battle feedback from v3.80.13 is retained.
- Client/server BUILD_ID remains server-owned through `/build-meta.js`, preventing the v3.80.13 build-ID drift failure.

## Preserved

- v3.80.12 attacker/current-target full-lane Response focus.
- Mana Payment final-UID handshake and VS AI v6.91.6 exact Shard replacement behavior.
- Seat mirroring/privacy, idle timeout rules, connection nameplates, and server authority.
