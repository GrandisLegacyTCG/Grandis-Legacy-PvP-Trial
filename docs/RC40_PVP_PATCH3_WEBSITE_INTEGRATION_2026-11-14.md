# Grandis Legacy PvP RC40 — Patch 3

Scope: GitHub Website RC40 navigation parity, DB v1.66 Card Review presentation data and local/website hosting preparation. PvP engine/authority, mana selection, and RC6 single WebSocket are unchanged.

- First party links: https://grandislegacytcg.web.id/ and https://grandislegacytcg.web.id/deck-builder/.
- Production site location desired: https://grandislegacytcg.web.id/pvp/. The existing Website repository links to it but does NOT currently host PvP; GitHub Pages cannot run a Node WebSocket server.
- Server FULL build retains local images; no new third-party image DNS or requests.
- An optional GitHub Pages `/pvp/` frontend addon is prepared separately (see website integration handoff). It can use the already-existing Website same-origin `/card-art/` assets; the backend remains separately hosted.
- RC40 DB166 review data loads inside the self-hosted frontend. Gameplay uses canonical RC40 engine and server-projected information as before.
- The exact backend URL must be validated before publication, and cross-origin WSS tested from the custom domain.
- Do not auto-push this project to GitHub or auto-deploy to Northflank.
