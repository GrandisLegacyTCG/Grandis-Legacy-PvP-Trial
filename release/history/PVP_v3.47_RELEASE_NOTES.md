# Grandis Legacy PvP v3.47 — Release Notes

- **Implementation baseline:** PvP v3.45.
- **Failed intermediate reference:** PvP v3.46, used only for the approved Rank-selector visual correction.
- **Gameplay/network architecture:** preserved from v3.45.
- **Northflank Docker server-directory fix:** preserved from v3.45.
- **Room 1 / Room 2 endpoints:** unchanged.
- **Rank selector:** Deck Builder v1.31 Style 1 visual component, compact and centered below the full Hero formation; Rank I–III remains local preview only.
- **Runtime Sync:** v2.63 authority regenerated only after all final tracked source/build metadata was complete.
- **Canonical cards:** 200.
- **Website mirror target:** Website v1.36 `/pvp/`.

After deployment, verify both Northflank services remain running without `Runtime sync startup gate failed`, then verify `/health`, WSS `/ws`, and Lobby connection flow.
