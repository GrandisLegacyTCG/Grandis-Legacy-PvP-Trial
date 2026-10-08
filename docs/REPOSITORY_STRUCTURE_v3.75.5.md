# Repository Structure — PvP v3.75.5

```text
Grandis_Legacy_PvP_v3.75.5_GitHub_Repository_2026-10-08/
├─ data/
├─ docs/
├─ public/
│  ├─ assets/
│  ├─ card-art/
│  ├─ css/
│  ├─ js/
│  │  ├─ active-starters.js
│  │  ├─ app.bundle.js                 # v6.90.7-derived browser/presentation runtime
│  │  ├─ pvp-animator.js
│  │  ├─ pvp-network.js
│  │  ├─ pvp-presentation-adapter.js
│  │  ├─ pvp-ui-runtime.js
│  │  ├─ runtime-authority.js
│  │  └─ static-data.js
│  ├─ shared-ui/
│  ├─ starter_deck_examples/
│  ├─ config.js
│  └─ index.html
├─ release/
├─ server/
│  ├─ gameplay-intent-router.mjs       # exact PvP v3.51 gameplay router
│  ├─ headless-runtime-compat.mjs
│  └─ runtime/
│     ├─ app.bundle.js                 # exact PvP v3.51 gameplay runtime
│     ├─ runtime-authority.js          # exact PvP v3.51 bridge
│     └─ static-data.js                # exact PvP v3.51 runtime data artifact
├─ tests/
├─ Dockerfile
├─ package.json
├─ server.js
└─ README.md
```

The browser tree keeps the familiar PvP v3.51-style naming/layout while the server has an explicit `server/runtime/` boundary so the proven v3.51 gameplay engine cannot be confused with the newer browser UI runtime.
