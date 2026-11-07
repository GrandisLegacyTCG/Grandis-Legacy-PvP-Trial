# PvP Season 0 RC32 — lobby port directly from PvP Season 1 v3.80.17

**Baseline:** `Grandis_Legacy_PvP_S0_RC32_Season1_Lobby_GitHub_Ready_2026-11-07.zip` / extracted prior worktree; VS AI Season 0 RC32 gameplay. **Donor actually inspected:** `Grandis_Legacy_PvP_v3.80.17_2026-10-13.zip`. **Date:** 2026-11-07. **Scope:** replace ONLY the previously approximated v3.51 lobby with the actual v3.80.17 lobby, while retaining S0 RC32 battlefield and S0 server authority.

## Verifiable source mapping

| Original v3.80.17 file | New S0 PvP file | Adaptation |
| --- | --- | --- |
| `public/lobby/pvp-lobby-v3.76.6.css` | `client/lobby/pvp-lobby-v3.76.6.css` | **Bit-for-bit identical** (SHA-256 `7175fb9ddf54f7d173d05e5a3d569fd4391d0e378c81f559f5c7c8bdbae138eb`) |
| `public/assets/lobby/` five files | `client/assets/lobby/` | All 5 **bit-for-bit identical** |
| `public/engine/assets/fonts/noto-sans/` two WOFF2 fonts | Same path under `client` | Both **bit-for-bit identical** |
| `public/pvp/pvp-host.js` `ensureLobby`, `renderLobby`, `formationHtml`, `openProgression` | `client/runtime/pvp-network.js` lobby section | S1 v3.80.17 DOM structure and CSS classes, S0 card art/data and room events |
| None | `client/runtime/s0-lobby-v38017-adapter.css` | Explicit S0-only controls and stage scaling differences |
| v3.80.17 lobby script refs from `index.html` | `client/index.html` | Uses exact donor stylesheet plus S0 adapter; gameplay references remain RC32 |

No `v3.51` CSS is loaded/shipped in this update. S0 cards, rules, game engine, client battlefield, node server, and privacy masking remain from RC32; **no Season 1 cards or gameplay engine were imported**.

### Protocol differences requiring adaptation

1. S0 requires a manually entered **Room Code**; the S1 v3.80.17 lobby auto-connects via a different protocol. The S0 lobby therefore has a ROOM CODE field, JOIN ROOM, and COPY INVITE LINK that are absent from the exact donor template.
2. S1 has SPECTATE. The S0 server only authorizes two players, so **SPECTATE is NOT implemented** and its place is taken by JOIN ROOM, rather than offering a nonfunctional button.
3. S1 auto-submits deck selection/formation on server connection. S0 now auto-submits on the corresponding actions as well; READY becomes enabled only when the S0 server confirms it received a valid deck.
4. S0 requires Player 2 to choose the opening coin once Player 1 starts; this mechanism remains server-authoritative. Finished room reset by Player 1 is preserved.
5. Touch S1 v3.80.17 transforms the body. RC32 S0 instead transforms only `.app`. The S0-specific adapter maps the RC32 stage transform onto the lobby page, keeping donor CSS byte-identical.

## QA performed

| Test | Result | Notes |
| --- | --- | --- |
| Direct source hash/asset verification | PASS | Eight exact donor files incl. CSS, fonts, logo, background and swap |
| `npm run check` | PASS | RC32 authority, card rules, two-seat privacy, deck validation, WebSocket/complete deck-out regression |
| `npm run test:ui:lobby` | PASS | Two panels, exact S1 CSS, S0 heroes, Rank I/II, formation swap, narrow viewport scaling |
| `npm run test:ui:lobby-network` | PASS | Two Chromium renderer instances through a **test-only** WebSocket relay to real S0 Node server: JOIN, auto-submit decks, swap formation, READY, coin, RC32 battlefield & real phase button |
| Native two-browser HTTP+WSS against Northflank | NOT VERIFIED | Operator must deploy/update staging then test |
| Combat victory, all card interactions, full end-to-end mobile | NOT VERIFIED | Not part of this lobby-only patch |

**No Northflank deployment performed.** The old RC32 and Season 1 archives remain unmodified. This is a GitHub-uploadable **staging** build; not an assertion of production-ready complete gameplay.

## How to validate on Northflank

Deploy this new ZIP's *extracted root contents* into the existing separate **PvP Season 0** GitHub repository and redeploy its Northflank service. Hard refresh, verify the new MATCH PANEL and S1 v3.80.17 styling. Open two separate browsers/devices, use the same room code, select two S0 decks, ensure READY becomes enabled after JOIN, then Ready both. Player 1 starts; Player 2 chooses coin. Verify both enter RC32 battlefield; complete a real Attack and Response. Do not upload Season 1 files to the S0 server or overwrite the Season 1 production service.
