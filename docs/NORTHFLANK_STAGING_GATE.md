# Grandis Legacy PvP S0 — Northflank staging gate

**Baseline:** VS AI Season 0 RC32 (game engine/assets); PvP S0 RC32 playtest staging (WebSocket/room/viewer protection). This is a **predeployment worktree**, not a published Northflank release. No Season 1 gameplay card effects were imported. Grand Finale and Poison Vial remain RC32-authoritative.

## Staging-only deployment recipe

1. Create a **separate GitHub repository** or dedicated isolated staging branch with the contents of this worktree at repository root (`Dockerfile`, `server.js`, `server/`, `client/`, `package.json`). Do not overwrite the Season 1 site or existing VS AI release. The GitHub Actions `staging-qa.yml` file is included; a green workflow is needed but not sufficient for release.
2. In Northflank create a **combined service** connected to that repository, build type **Dockerfile**, build context **repository root**, Dockerfile path `/Dockerfile`. Use **one instance / replica**, not a scale-out pool: gameplay rooms and seat tokens currently live only in one Node process.
3. Set runtime `HOST=0.0.0.0`, `PORT=3000`, optionally `PVP_MAX_ROOMS=32`, `PVP_RECONNECT_MS=300000`. Configure **public HTTP port 3000**. Northflank adds TLS at ingress; the site should be opened using its generated HTTPS address, which connects to `wss://<same-domain>/ws`.
4. For a **single-origin staging** deployment, leave `PVP_ALLOWED_ORIGINS` empty to enforce the WebSocket same-host check. For a **separate GitHub Pages frontend**, set exact comma-separated page origins in `PVP_ALLOWED_ORIGINS` and pass `?ws=wss://<northflank-domain>/ws` on the page URL. **Split-origin mode remains unverified.**
5. Northflank HTTP healthcheck: `GET /health` on the service's HTTP port. Expected JSON `ok: true` and a build string containing `s0-rc32-pvp`. No persisted rooms: process restart discards matches and reconnect tokens.

## Remote smoke without asking a player to install/run locally

Once staging is deployed, an operator with Node 22 can run from the repo checkout:

```sh
PVP_PUBLIC_URL=https://<northflank-generated-domain> npm run test:hosted
```

This requires an actual deployed URL. It creates a random disposable room, checks **HTTPS + WSS**, enters two seats, selects decks, readies, flips coin, tests secret-hand/mana masking, wrong-seat rejection, authoritative phase advance, reconnect, and surrender. It **does not** establish ordinary 3-Hero victory, browser rendering, or mobile readiness.

## Essential final browser acceptance (real live Northflank)

On **two separate devices/browser profiles**, join the same code, select **different Season 0 starters**, Ready, flip coin, then verify both sides show the same Round/Phase/HP; neither can see the opponent Hand nor physical Color Mana identity. Test a real Attack with Response, mana costs, manual Reposition, Tribute, Rank Up, Healing, Status and Casting; verify Poison Vial and Grand Finale against RC32 data; defeat all three opposing Heroes by combat, and confirm the same winner on both browsers. Reconnect each player once with their own token, test custom Deck Builder v1.62 exported JSON, use image/audio controls. Record actual browsers/devices and results.

## Known limits — do not conceal

- Docker image build and Northflank cloud integration **NOT VERIFIED in this worktree** until CI/cloud runs (Docker executable unavailable locally).
- Northflank **not deployed**, direct public HTTPS/WSS **not tested**.
- Real two-browser native gameplay, 3-Hero combat victory, extensive special-card/Status/Casting parity and mobile UI **NOT VERIFIED**.
- Do not run >1 replica, enable public match discovery, or promise room persistence. This is a single-process staging prototype.
- Existing gameplay engine and artwork are not rewritten or replaced by this preflight preparation.

References (Northflank official documentation): [Configure ports](https://northflank.com/docs/v1/application/network/configure-ports), [Build with a Dockerfile](https://northflank.com/docs/v1/application/build/build-with-a-dockerfile), [Build and deploy your code](https://northflank.com/docs/v1/application/getting-started/build-and-deploy-your-code).
