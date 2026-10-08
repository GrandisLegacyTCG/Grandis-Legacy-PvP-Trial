# PvP v3.46 — Failed Deployment Runtime Sync Evidence (Historical)

PvP v3.46 is retained as a failed intermediate release and is **not** the implementation authority for v3.47.

Observed Northflank startup failure:

- Runtime sync startup gate failed.
- Mismatched tracked entries: `package.json`, `public/index.html`, `public/js/pvp-network.js`, `server.js`.
- Process exited and the container restarted.

v3.47 therefore rebuilds from the known-good v3.45 repository, ports only the approved Rank-selector visual component from v3.46, and regenerates Runtime Sync authority from the final resulting bytes.
