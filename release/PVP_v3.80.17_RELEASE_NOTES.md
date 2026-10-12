# Grandis Legacy PvP v3.80.17 — Release Notes

Date: 2026-10-13

## Tablet/mobile battle VFX target correction

This patch only changes battle VFX coordinate handling while `gl-adaptive-stage` is active.

Tablet/mobile scales and may rotate the entire 1600×747 body. `getBoundingClientRect()` returns viewport-space coordinates, but battle VFX nodes are inserted inside that transformed body. Using the viewport rect directly therefore applied the stage transform twice and could place P.Atk / M.Atk / Defense / Dodge / Heal effects on the source Hero or outside the intended target.

The new `battleHeroVfxRect()` path:

1. reads the existing target Hero viewport rect;
2. returns it unchanged on desktop;
3. only on `gl-adaptive-stage`, inverts the body transform;
4. maps all four rect corners back into logical 1600×747 stage coordinates;
5. uses that logical rect for battle VFX placement.

## Intentionally unchanged

- Desktop battle geometry and presentation path.
- Gameplay rules and authority.
- Network transport / seat mirroring / privacy / reconnect.
- Mana Payment and v6.91.6 selection behavior.
- Event/Response commitment fixes from v3.80.16.
- Battle SFX timing and post-authoritative-render VFX timing.
