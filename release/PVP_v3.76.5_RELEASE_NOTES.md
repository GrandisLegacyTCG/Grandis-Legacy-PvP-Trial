# Grandis Legacy PvP v3.76.5 — Release Notes

## Scope
Battlefield presentation stabilization only. Lobby behavior from v3.76.4 is preserved. PvP v3.51 remains authoritative; VS AI v6.90.7 remains the visible gameplay presentation reference.

## Confirmed root causes fixed
- Native `#app` used `visibility:hidden`, but descendants can carry `.gl-image-ready{visibility:visible!important}`. The native root is now `display:none!important` whenever external presentation owns gameplay.
- Historical generic rules in `app.css` were leaking into the external v6 shell. In particular `.app` min-width/padding, `.hero-panel` min-height/padding, `.hand-card` sizes, `.zone` compact rules, `.phase-actions` grid rules, and `.racial-token` minimum height conflicted with the donor geometry. A last-loaded, `.ob-pvp-shell`-scoped isolation stylesheet now reasserts donor geometry.
- The donor responsive CSS variables existed but no runtime updated them in PvP. A CSS-pixel-only scaler now updates `--ui-scale`, logical dimensions, sidebar width and Hero base width on resize/orientation change. It never uses devicePixelRatio.
- Coin Flip now uses a fully opaque black readiness state: the v6 shell is kept `visibility:hidden` while it hydrates and the body is forced black. Only the authoritative Coin Flip modal remains visible. Opening Hand/Shard choreography becomes visible after the authoritative Coin Flip resolves and the presentation is ready.

## Preserved
- solved single-room Lobby from v3.76.4
- v3.51 network/gameplay/payment/privacy authority
- low-memory streaming static server
- no runtime Brotli/Gzip hot-path compression
- no `public/engine` or `public/card-art` duplicate trees
- Timer / Sound / Surrender / EXP canonical assets


## QA performed in this workspace
- JS syntax checks passed for server, network, presentation, app bundle, and responsive scaler.
- v3.76.5 static isolation checks passed (18 checks).
- Headless Chromium geometry checks passed at 1600x760, 1180x820, 1024x768, and 768x1024 virtual-landscape.
- Coin Flip browser fixture confirmed black body, hidden gameplay shell, visible Coin Flip modal, and hidden native `#app`.
- Public duplicate audit reported 0 duplicate groups; `public/engine` and `public/card-art` remain absent.
- Full local server memory smoke could not run in this workspace because the `ws` dependency is not installed and package installation is unavailable here; no runtime synchronous compression calls are present in source.
