# Grandis Legacy PvP v3.77.0

Architecture reset requested 2026-10-10.

- Lobby UI: PvP v3.76.6 only.
- Gameplay/Coin Flip presentation: locked VS AI v6.90.9.
- Network/server authority: PvP v3.51.
- PvP v3.51 UI is not loaded.
- PvP v3.76.6 gameplay presentation is not loaded.
- Visible v6.90.9 gameplay actions route to the v3.51 authoritative server through `GL_PVP_NETWORK.sendIntent`.
- Viewer-safe authoritative snapshots are imported through the presentation adapter and rendered by v6.90.9.
