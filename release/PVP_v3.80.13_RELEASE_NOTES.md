# Grandis Legacy PvP v3.80.13 — 2026-10-12

Scope: focused UI/touch/presentation follow-up on the v6.91.6-native v3.80.x line. Mana Payment is unchanged.

## Fixes

- Tablet/mobile Lobby shares Battlefield's 1600×747 adaptive stage and no longer applies a second nested Lobby scale.
- `WAITING FOR OPPONENT RESPONSE...` is centered using the same visual family as the turn banner and remains visible for the authoritative wait state.
- Tablet/mobile Response buttons are no longer blocked by the desktop Hand hover-expansion pseudo-hitbox. Desktop hover behavior is unchanged.
- Hero Racial/Class button group moves from `top/right: 4px` to `6px`.
- Removed the PvP-only global availability glow/shadow; legal Response buttons still rise above Response dimming via the existing focus-layer logic.
- Low-latency PvP battle presentation path: new authoritative battle SFX plays from preloaded audio immediately on snapshot receipt, VFX starts through an immediate donor presentation hook before full board import/rerender, and the later normal presentation pass suppresses the duplicate event.

## Preserved

- Mana Payment final-UID handshake and v6.91.6 exact replacement behavior.
- Response focus attacker/current-target full-lane lighting.
- Idle timeout rules (Lobby 60s -> Spectator, started match 180s -> surrender).
- Connection nameplates, seat mirroring, privacy projection, and server authority.
