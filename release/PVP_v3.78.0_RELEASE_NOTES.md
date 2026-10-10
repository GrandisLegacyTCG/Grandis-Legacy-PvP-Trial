# Grandis Legacy PvP v3.78.0 — Clean Three-Donor Integration

## Locked architecture
- Pre-match / Lobby presentation: **Grandis Legacy PvP v3.76.6**.
- Game client / gameplay presentation / timing / interaction: **Grandis Legacy VS AI v6.91.3**.
- Multiplayer network / server / authoritative gameplay: **Grandis Legacy PvP v3.51**.

This release is rebuilt from the locked donors. PvP v3.77.x is not used as the architectural base.

## Integration work only
- Added isolated `#pvpSetupOverlay` Lobby host using the v3.76.6 Lobby markup/CSS/assets.
- Installed the approved v6.91.3 game client and omitted the local-AI adapter in PvP mode.
- Added a thin PvP authority adapter that maps viewer-relative identity/state and routes all mutations to the v3.51 server.
- Mapped server-authoritative Coin Flip state into the existing v6.91.3 Coin Flip presentation.
- Mapped authoritative opening data/events into the existing v6.91.3 opening pipeline.
- Activated the existing v3.51 `pvpTurnReady` / `acknowledgePvpTurnStart` authority handshake so Draw Phase genuinely exists before authoritative Draw + Regen commits. This is an integration timing seam, not a new phase tracker or local gameplay mutation.

## Donor parity
- Lobby base markup: exact v3.76.6 donor hash match.
- Lobby CSS: exact after normalizing two CSS-relative `../assets/lobby/` path relocations; three required v3.76.6 `app.css` dependency rules were carried for swap-image sizing / seat positioning.
- Lobby assets: 5/5 copied lobby assets hash-identical to v3.76.6.
- VS AI v6.91.3 copied game tree: 290 files byte-identical; only `shared-app/app-runtime.js` and `runtime/adapters/pvp-adapter.js` differ for unavoidable PvP authority/identity seams. No donor game files are missing.
- Critical v6.91.3 battlefield CSS, UI renderer, static data, runtime authority, active starters, shared game engine bundle, and authority-adapter registry are byte-identical.
- v3.51 intent router, headless compatibility module, runtime card/effect data, private static data, and private runtime authority are byte-identical.
- Private v3.51 `app.bundle.js` differs only for the authoritative Draw handoff described above.

## Asset audit
- Broken CSS local URLs: **0**.
- Broken HTML local refs: **0**.
- Broken loaded-script asset refs: **0**.
- 29 SHA-256 duplicate groups remain (5,855,152 duplicated bytes). They are retained where the approved v6.91.3 donor uses distinct canonical paths (`assets/`, `card-art/`, `engine/assets/`) or where the exact v3.76.6 Lobby asset path must coexist. No speculative asset cleanup was done because donor correctness takes priority.

## Authority QA
PASS:
- intent router / invalid intent / wrong owner / stale revision / duplicate action / spectator rejection
- headless match boot + authoritative opening
- Attack / Tactical / Item / Event / targeting
- Mana / Shard payment
- Response
- Tribute / EXP / Rank Up / Ultimate Tribute
- Reposition
- Status / Attachment / Casting
- private search/reveal behavior
- defeat / cleanup / terminal state
- genuine authoritative Draw handoff (`Draw` -> server acknowledgement -> Draw+Regen -> `Deploy`)

## Browser QA
**UNVERIFIED for required real two-client end-to-end browser acceptance.** The build environment has Chromium available, but the production Node server cannot be started here because the external `ws` dependency is not installed and package installation is unavailable in this sandbox. Static/authority tests are not reported as browser PASS.

## Mobile / tablet
The approved v6.91.3 shared battlefield CSS/DOM strategy is preserved. No PvP-only touch overlay, mobile battlefield, alternate phase tracker, or tablet-specific gameplay control was added. Physical-device PASS is not claimed.

## Performance / server behavior
- No `brotliCompressSync()` or `gzipSync()` was introduced.
- No per-request compression cache was added.
- `node_modules` is excluded from the release package.

See also:
- `release/PVP_v3.78.0_DONOR_PARITY.json`
- `release/V378_ASSET_AUDIT.json`
- `release/V378_DUPLICATE_ASSET_AUDIT.json`
- `release/V378_CODE_HYGIENE.json`
- `release/PVP_v3.78.0_QA_REPORT.json`
