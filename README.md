# Grandis Legacy PvP — v3.78.2

## Release identity

- PvP Version: **v3.78.2**
- Package Version: **3.78.2**
- Date: **2026-10-10**
- Architecture: **PvP v3.76.6 Lobby + VS AI v6.91.3 approved game client + PvP v3.51 multiplayer authority**

## v3.78.2 Coin Flip field-gating stabilization

v3.78.2 keeps the v3.78.1 Lobby and opening fixes, then removes the fragile PvP battlefield hide/unhide behavior during Coin Flip.

The PvP pre-game presentation contract is now:

1. Lobby closes/unmounts.
2. The approved v6.91.3 battlefield stays **mounted and rendered** underneath the Coin Flip stage.
3. Coin Flip uses a **fully opaque black fullscreen overlay** around the existing Coin Flip popup.
4. While Coin Flip/result is active, the battlefield is **inert** and has `pointer-events: none`; hover previews, clicks, focus and pointer interaction cannot leak through.
5. Only after local **Start Game** receives a valid authoritative opening setup is the gate released and the Coin Flip overlay removed.
6. Opening Hand → Starting Shards → presentation acknowledgement → mandatory Draw/Regen → Deploy remains the v3.78.1 authoritative opening sequence.

This directly fixes the field-disappearing regression caused by later authoritative snapshots re-applying `gl-lobby-hidden`, while avoiding a CSS-only visibility workaround.

No gameplay-rule redesign is part of v3.78.2. Lobby presentation remains based on PvP v3.76.6, gameplay presentation/timing remains VS AI v6.91.3, and multiplayer authority remains PvP v3.51.

## Architecture

Grandis Legacy PvP v3.78.2 is a stabilization of the clean three-donor integration:

- **Pre-match / Lobby presentation:** PvP v3.76.6
- **Gameplay presentation / timing / interaction:** VS AI v6.91.3
- **Server / network / multiplayer authority:** PvP v3.51

The v6 game client remains viewer-relative; the PvP adapter replaces local AI authority with remote authoritative multiplayer state. PvP v3.51 gameplay UI is not part of the visible game presentation.

See the release audit files under `release/` for donor parity, changed files, asset checks, and QA results.

---

# ⚠ Mandatory deployment guard — read before every new version

A browser page that says:

```text
no healthy upstream
```

means the reverse proxy cannot reach a healthy application process. **Do not treat this as a frontend/browser bug.** First prove that `node server.js` actually starts and `/health` becomes healthy in the same production package/container that will be deployed.

This repository contains a permanent checklist in:

**`DEPLOYMENT_GUARDRAILS.md`**

Every future PvP release must preserve and follow that file.

## Historical recurring causes to check first

1. **Dockerfile omitted a required runtime directory.**  
   In the first v3.78.0 package, `server.js` and the runtime-sync verifier required `authority/browser-runtime/*`, but the Dockerfile did not copy `authority/` into the production image. The process therefore crashed before listening on the port, which produces `no healthy upstream`.

2. **Runtime sync lock was generated before the final edits.**  
   The sync verifier runs before `server.listen(...)`. A stale hash intentionally stops boot.

3. **Manifests were generated before the final edits/package contents changed.**

4. **Production dependency install failed or `ws` is unavailable.**

5. **Health/port contract changed.**  
   The server must use `process.env.PORT`, bind to a reachable host (`0.0.0.0` in production), and expose `/health`.

6. **Blocking static compression/memory regression was reintroduced.**  
   Do not bring back per-request `brotliCompressSync()` / `gzipSync()` for large assets.

## Mandatory commands before packaging/deploy

After the **last** source/Dockerfile/package edit:

```bash
npm ci --omit=dev --ignore-scripts
npm run release:seal
npm run test:startup
```

What these protect against:

- `release:seal` regenerates runtime sync + frontend/repository manifests, verifies them, and checks that the Dockerfile contains every path required by the runtime sync lock.
- `test:startup` launches the **real** `server.js` and requires the **real** `/health` endpoint to return HTTP 200 with `ok: true`.

Do not ship a package as deployment-ready if `test:startup` was not actually executed successfully.

After creating the final ZIP, extract it into a **clean empty directory** and run the same commands again. This catches files that existed in the builder workspace but were omitted from the final package/deployment context.

## Northflank production contract

- Builder: `Dockerfile`
- Production dependency install: `npm ci --omit=dev --ignore-scripts`
- Start: `node server.js`
- Health path: `/health`
- Port: `process.env.PORT`
- Bind host: `0.0.0.0`

If deployment still shows `no healthy upstream`, inspect service logs and fix the **first fatal startup error**. Do not blindly increase memory/health timeout and do not disable runtime verification.

---

## Useful release commands

```bash
npm run test:v3782
npm run release:seal
npm run check:deployment
npm run test:startup
```

`npm run check:deployment` is a source/package topology check.  
`npm run test:startup` is the required live process + `/health` check and requires production dependencies to be installed.


## Lobby donor extraction guard — mandatory for future PvP rebuilds

The PvP v3.76.6 Lobby is **not** fully defined by `installStyles()` inside `pvp-network.js`. Some presentation dependencies live in the donor `public/css/app.css` and in donor font/assets. A previous v3.78.0 integration copied the base Lobby CSS but omitted inherited donor dependencies; this produced two visible regressions even though the image files themselves were present:

- `JOIN AS PLAYER` wrapped to two lines because the isolated Lobby lost the donor's 13px / Noto Sans typography context and inherited the v6 page's 16px default through `font: inherit`.
- the Player 2 Kick `exit.png` rendered as a large raw button because `.pvp-seat-kick` and `.pvp-seat-kick img` from the donor `app.css` were omitted.

When rebuilding or moving the Lobby, **do not assume copied markup + `installStyles()` is complete**. Audit all of the following before packaging:

1. all `pvp-v260-*`, `pvp-seat-*`, and `pvp-progression-*` selectors used by the Lobby against every donor stylesheet;
2. donor typography dependencies, including font family and inherited base font size;
3. every `url(...)` in isolated Lobby CSS after relocation;
4. every `assets/lobby/*` literal used by Lobby JS/HTML;
5. Lobby logo/background/swap/chevron/exit asset hashes against the donor;
6. Hero/card-art resolver output and canonical card manifest;
7. actual computed browser layout for text wrapping and icon dimensions.

Mandatory static guard:

```bash
npm run test:v378:lobby-assets
```

When browser execution is available, also run:

```bash
npm run test:v378:lobby-browser
```

The browser guard specifically verifies that `JOIN AS PLAYER` remains one line at the approved desktop/tablet fixture widths, the Kick button is 28×28 on desktop, and the Kick icon is 16×16. Do not replace these checks with visual assumptions.

---

# ⚠ Mandatory asset + pre-game integration guard

Every future PvP integration must verify **the URLs actually used by the production-loaded game graph**, not merely that an asset exists somewhere in the repository.

Historical failures in this line included correct image/audio files being packaged under one path while the active CSS/JS requested a different relative path. A large repository is not proof that presentation assets are wired correctly.

Before every release:

```bash
npm run test:v378:assets
npm run test:v378:opening
```

`test:v378:assets` must verify all of the following:

- every stylesheet and script loaded by `public/index.html` exists;
- every local `url(...)` in the loaded production stylesheets resolves from the **actual CSS location**;
- active PvP integration asset literals resolve;
- v6 gameplay media paths resolve to the packaged `engine/assets/...` files;
- dynamic Status, Shard, Counter, EXP, Coin, card-motion, deck-back and card-art paths resolve;
- the complete locked v6.91.3 `card-art`, `engine/assets`, and shared `assets` trees retain their donor fingerprints;
- the locked v3.76.6 Lobby assets retain their donor fingerprints.

Do not validate only filenames, and do not scan an unrelated/dormant bundle then assume it represents the active page. Start from `public/index.html`, identify the production-loaded graph, then validate its actual runtime URL conventions.

## Coin Flip / Opening boundary

PvP must never commit or present the first mandatory Draw/Regen while Coin Flip presentation is unfinished.

Required sequence:

```text
Coin Flip result
→ user presses Start Game
→ Opening Hand presentation
→ Starting Shards presentation
→ presentation-complete acknowledgement
→ authoritative mandatory Draw
→ authoritative Regen
→ Deploy
```

Permanent rules:

- `pvpOpeningStarted` and related gates must be explicitly declared; an undeclared presentation variable is a release blocker.
- server opening confirmation must hold the authoritative game at a genuine `Draw` state with `pvpTurnReady=true` after 6-card Opening Hands + 3 Starting Shards;
- no `MANDATORY_DRAW_PHASE` event may exist before the opening presentation completion acknowledgement;
- `pvp-host` must not auto-acknowledge Draw until `GL_PVP_OPENING_PRESENTATION_COMPLETE === true`;
- normal presentation-event processing must remain gated before local Start Game so `Card Sound.mp3` cannot be triggered by a future authoritative Draw event during Coin Flip;
- never fix this by adding fake presentation delays or a second PvP opening scheduler.

---


## Coin Flip battlefield gate — mandatory regression rule

PvP must **not** hide/unhide the v6 gameplay root as part of Coin Flip. The field may be mounted behind the Coin Flip UI, but the fullscreen Coin Flip layer must be fully opaque black and the gameplay root must remain inert until Start Game actually begins the authoritative opening presentation.

Required behavior during `coin-flip` and `coin-result`:

- `.app` remains rendered; do not add `gl-lobby-hidden` from `syncPvpPreGame()`;
- the root carries `gl-pvp-coin-gated`;
- `.app` is `inert`, `aria-hidden`, and `pointer-events:none`;
- battlefield/card hover previews are suppressed;
- no click/focus/hover can reach the field;
- the Coin Flip overlay is `background:#000` (no transparency);
- a later server snapshot must not re-hide the field;
- the gate is removed only when Start Game hands presentation ownership to the approved v6 opening flow (or on legitimate reconnect/adopt of an already-started match).

Mandatory guards:

```bash
npm run test:v3782:coin-gate
npm run test:v3782
```

The browser guard verifies that the field is still rendered behind the overlay, the overlay is opaque black, hover/click/focus do not leak through, and interaction becomes available only after the gate is released.

---

## Project workflow rule — bug reports and packaging

See **`PROJECT_WORKFLOW_RULES.md`**. Bug reports do not automatically authorize a new ZIP. Consolidate fixes in a candidate working tree, then ask for explicit user permission before packaging. Any future Takeover Note must carry this rule forward.
