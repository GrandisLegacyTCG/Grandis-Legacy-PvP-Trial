# Grandis Legacy PvP Season 0 — RC39 Repo Candidate RC1

**Integration status:** RC39 latest donor checked, RC6 Stage 2 lobby networking preserved, all previous optimization batches retained.
**Authority:** server-owned headless RC39 rules. **Client:** local drafts only; final atomic commit.
**Target:** PvP Trial staging. **Not yet verified:** two real-device Northflank match / mobile Firefox.

See [final source delta and QA](docs/RC39_PVP_REPO_RC1_INTEGRATION_AUDIT.md).

**For PvP Trial:** upload the repository-root contents (not the ZIP wrapper), deploy with the included Node 22 Dockerfile, check `/health`, then test two players. The historical notes below document earlier batches; they are not the current build version.

# Grandis Legacy PvP S0 RC39 — Beta 2 Batch 5 (12 November 2026)

**Staging candidate — NOT production final.** Integrates VS AI RC39 Rank Up committed EXP animation, R3.7 Archer artwork (187/187 Main Deck parity), server-projected mana loss notices, and a corrected Player 2 presentation perspective. Retains RC6 Stage 2 lobby networking, RC5 Mana Payment, face-up opponent Mana Pool and Batch 1–4 optimization/gameplay. RC39 donor PvP adapter is available as an inactive reference; the working Batch 3 local draft remains active.

[Integration details and QA](docs/RC39_BETA2_BATCH5_RELEASE_QA_2026-11-12.md) · Build ID: `gl-s0-pvp-rc39-beta2-repo-rc1-2026-11-12` · GitHub/Northflank not modified.

---

# Grandis Legacy PvP S0 RC38 — Beta 2 Batch 4 (Source Sync, 12 Nov 2026)

Based on **Beta 2 Batch 3**, plus the **latest VS AI RC38 12 November automatic Mana Deck override**: 12 physical Shards are generated from the selected Hero progression base Classes (both Hybrid classes included) for both PvP seats. Imported v1.64 JSON Mana fields are ignored. RC6 single-socket lobby, RC5 atomic payment, Batches 1–3 optimizations, Face-up Opponent Mana Pool, PvP Coin Flip, and existing visuals remain. The Rank Up return-EXP and Fenrir review text now match the donor; the Build ID is unique for staging cache safety.

**Status: PvP Trial staging/QA.** Do not call this final without a real two-device match. GitHub and Northflank were not updated. See `docs/RC38_BETA2_BATCH4_SOURCE_SYNC_2026-11-12.md` for source boundaries, tests, and risks.

---

# Grandis Legacy PvP S0 RC38 — Beta 2 Batch 3 (Local Draft staging)

**Based on Beta 2 Batch 2**, including Lobby (Batch 1) and START / Battlefield prewarm (Batch 2). Six bounded multi-step choice types now use local selection and one server-authoritative commit, without changing RC6 Stage 2 lobby WebSocket or RC5 Mana. **Newer RC38 donor changes are reserved for Batch 4.**

See `docs/RC38_BETA2_BATCH3_LOCAL_DRAFT.md` for scope, security boundaries, QA, deployment warning, and next steps. This is **not a final deployment build**; build identifiers have deliberately not been changed yet.

---

# PvP RC38 Beta 2 — Batch 2: START MATCH / Battlefield Startup (staging, 2026-11-11)

Continues **Batch 1**; reduces START MATCH server JS compilation and optionally prewarms the **same embedded Battlefield** after READY, outside the click handler. Keeps **one RC6 Stage 2 lobby-owned WebSocket** and all RC38 rules/RC5 Mana/VS AI design. Includes opt-in startup timing instrumentation and dedicated multi-match isolation/regression tests. No additional gameplay HUD, no GitHub upload. This is a staging build; real two-device mobile/cold/warm timing remains unverified.

See `docs/RC38_BETA2_BATCH2_STARTUP_OPTIMIZATION.md` for details and QA.

---

# PvP RC38 Beta 2 — Batch 1: Lobby Optimization (staging, 2026-11-11)

This package is based on RC38 Beta 1 and includes **lobby-only** improvements: retained Card Review iframe and partial deck/hero render on player/room state changes. Gameplay, Stage 2 WebSocket, Mana RC5, RC38 Coin Flip and opponent face-up Mana remain unchanged. See `docs/RC38_BETA2_BATCH1_LOBBY_OPTIMIZATION.md` for QA, limitations and remaining batches.

---

# Grandis Legacy PvP Season 0 — RC38 Beta 1 (11 November 2026)

**STATUS: PvP TRIAL / staging build. NOT a certified two-device live release.**

## Authority and scope

- **Gameplay donor:** the supplied VS AI Season 0 RC38 (11 Nov 2026). `engine/js/static-data.js` and `engine/shared-app/active-starters.js` are byte-identical to the donor. The `app.bundle.js` uses the RC38 donor with narrowly documented PvP bridge/atomic Mana and mirrored-identity patches.
- **Rulebook:** v3.2 (10 Nov 2026). Five official designer R3.6 starter compositions from Deck Builder v1.64, dated 11 Nov 2026; all five supplied external JSON draft exports also opened and started in local headless tests.
- **Network retained:** PvP RC6 Stage 2 lobby-owned single WebSocket / same-origin embedded battlefield, reconnect, player role/ready/start, batch Response, viewer-safe board. RC5 local physical-Mana draft and atomic Mana Payment retained. No change to lobby architecture.
- **Visuals retained:** PvP Hotfix2 mobile landscape stage and `WAITING FOR OPPONENT RESPONSE...`; Hotfix3 full legal Hero lane click for Single Target and simultaneous post-Response Area Attack damage/Status presentation. Synced additional RC38 stylesheet rules; new Rank Up/Scouting choice controls use the PvP authoritative modal adapter, not a direct duplicate of VS AI's client-authoritative animations. No AI, no BGM; SFX retained.

## Coin Flip UI from screenshot

- On winner result, remove `Opening Coin Flip` header while retaining the visible WINNER label, YOU WON THE COIN FLIP, and coin artwork.
- **Winner** chooses `GO FIRST` or `GO SECOND`; loser waits. The server authorizes only the winner and derives the actual first seat; no duplicate button to start the game.
- Finish the coin animation on both screens before opening the battlefield. Local server tests cover both seats choosing FIRST and SECOND, and reject the losing player's unauthorized choice.

## Opponent Mana Pool — RC38

- The **opponent's Pool shows face-up Mana Shards** (Regular/Color class), while the opponent's Hand, unrevealed Legacy, and **Mana Deck remain private**.
- Effects involving the opponent's Mana choice use the existing **opaque face-down selection** even though the normal Pool view shows Mana faces. Physical UID and deck order are not sent to the opponent. Both player and spectator projections remain masked appropriately.

## RC38 interactions integrated

- RC38 gameplay engine/data, card definitions, 248 card artworks, R3.6 formation/compositions, attack and Response calculations, INVINCIBLE, Rank Up, Dual Arrow, and new Scouting/EXP selection intents.
- RC38 `trial_rankup_return_exp` and `scouting_exp_selection` are supported in the generic PvP choice modal; no local AI decisions are used.
- Restored essential seat-2 perspective swaps for physical Mana zones, composite Provoke/End keys and per-Hero flags, preventing duplicate Provoke or missed server End phase. Cleared RC38 stale auto-End flags after Provoke turn advance.

## QA (offline/local, not Northflank)

- `npm run check`: complete regression (engine, RC5 Mana, RC6 WebSocket, privacy, lobby, both seats, opening, Provoke, targeting, graphics smoke test).
- `npm run build:precompress`: regenerates Brotli/Gzip assets for all modified JS/CSS; Docker precompression runs during image build, not from stale sidecar files.
- Custom Deck smoke run: all 5 supplied Nov 11 JSONs successfully start the RC38 authority with correct Heroes/Hand/Mana.
- `GET /health` includes `S0-RC38-PVP-NET-RC6-STAGE2-BETA1` and reports selected transport (`ws` in production, `lite` in offline tests).
- Card art completeness vs RC38 donor: 248/248 files; static-data and active-starters hashes identical to donor.

## Still requires live QA

- Browser visual validation is not available in this environment: headless Chromium local website navigation is explicitly blocked by browser policy. Test the new winner/loser Coin Flip screens on desktop and portrait mobile.
- Test two real devices through the entire match, particularly P1/P2 Room, all attack/Response animations and Rank Up/Scouting flows, public Mana Pool / blind opponent Mana picker, reconnect under disconnection, and end of match.
- Cold `START MATCH` latency under Northflank's shared CPU allocation was not benchmarked. The expensive RC38 runtime still loads on initial battlefield entry; keep speed expectations conservative.

**Deployment:** Manual upload to **PvP Trial** only (do not replace PvP main), then `npm ci && npm run check && npm start` or the included Dockerfile. This ZIP was not uploaded to GitHub or deployed to Northflank.

---

## Historical PvP Release Notes

# Grandis Legacy PvP Season 0 — RC36.8 Mobile Orientation + Opponent Response Hotfix 2 (9 November 2026)

**STATUS: STAGING / MANUAL GITHUB UPLOAD ONLY.** Based on the previous RC36.8 Gameplay Sync package already tested in PvP Trial. No GitHub write or Northflank deploy performed by the assistant.

- **Mobile orientation parity:** on phones, the *entire active battlefield presentation* (not just `.app`) now uses the same 1600x747 logical landscape stage, including choice/Response popups, review iframe, hover previews, mana/payment selectors, attack direction, VFX, card movement, banners, and related overlays. When the phone is portrait, this shared canvas is CSS-rotated; when physically landscape, it is scaled without rotation. Existing lobby and Coin Flip presentation is unchanged; the physical device is **not forcibly orientation-locked** (browsers may disallow that).
- **Requested Response notification:** a small nonblocking `WAITING FOR OPPONENT RESPONSE...` notice appears only when a live player is awaiting the opponent-owned Response/Response payment. It hides on Response resolution, local-response turn, disconnect, setup/coin, and game-over. No new action button, gameplay HUD panel, gameplay rule, or network packet.
- **Compatibility:** RC36.8 gameplay source-selection fix, RC5 atomic physical Mana Payment, RC6 Stage 2 transport, seat masking, SFX, BGM removal, and desktop/lobby art preserved. Updated server build ID and fingerprinted asset URLs for a clean deploy/cache migration.
- **QA:** `npm run check` PASS, including targeted VM Response visibility and portrait/landscape mobile CSS test. A headless Chromium layout fixture at 390x844 portrait, 844x390 landscape, and 1440x900 desktop confirmed the game, dialog and VFX share the stage. This fixture is **not** a live two-player mobile match; real Android/iOS + Northflank testing remains required.

See `docs/RC36_8_MOBILE_ORIENTATION_RESPONSE_HOTFIX2_2026-11-09.md`.

---

# Grandis Legacy PvP Season 0 — Gameplay Sync from VS AI RC36 Internal Patch 6 (RC36.8; 9 November 2026)

**STATUS: STAGING / QA. No GitHub upload.** This package starts from **PvP RC36 Patch 4 UI Hotfix 1** and synchronizes only the latest donor's **functional Response source-selection correction**. Existing PvP lobby, battlefield, Coin Flip, mobile layout, audio, card art, network and Mana Payment are retained.

- **Defense source lane (behavior, not visual redesign):** when a legal team-wide Defense such as **Blessing of Divinity** is available, the player can select its legal Crusader/Paladin source by clicking empty/decorative space anywhere inside that Hero lane, even if the Hero is visually rotated because it is Exhausted. Only source lanes offered by the engine respond. This does **not** authorize an exhausted Hero to perform an illegal action.
- **Defense targeting unchanged:** team-wide Defense applies to **all allies**. **Holy Barrier** still requires choosing its legal source and then the attacked Hero to protect. Double-click Card Review, Tribute, attachment buttons and other controls remain independent.
- **No changes to actual rules:** a file-by-file comparison of donor RC36.6 (Internal Patch 4) and RC36.8 (Internal Patch 6) shows the gameplay engine, card data, AI policy and all other binaries are identical. Only donor `shared-app/app-runtime.js` (the click interaction), `shared-ui/battlefield-ui.css` (UI-only PLAY/EXP and lobby warning) and documentation differ. **Donor CSS is intentionally not imported.** Rank Up stays 300/700 EXP.
- **Networking preserved:** client/server authority, WebSocket protocol, RC5 atomic Mana Payment, RC6 Stage 2 Response transport, BGM-disabled/SFX-enabled configuration and build ID remain unchanged. The modified browser runtime has a new query string to avoid reuse of its previous immutable-cached script.
- **QA:** `npm run check` PASS, including the new production-handler VM cases for two Blessing source paths, two-stage Holy Barrier, legal-source constraints, interactive-child isolation and Tribute. Build/precompressed assets verified. Live two-device hosted gameplay is still not verified.

Details: `docs/RC36_PATCH6_GAMEPLAY_SYNC_2026-11-09.md`.

---

# Grandis Legacy PvP Season 0 - RC36 Patch 4 UI Hotfix 1 (9 November 2026)

**STATUS: STAGING / QA — manual GitHub upload; not yet validated on two real browsers.**

This is a targeted **VS AI RC36 Patch 4 UI parity recovery** on top of the existing PvP RC36 Patch 4 / Network RC6 Stage 2 source. No new gameplay HUD, actions, card design, music, or AI authority were added.

- **Hero Review:** lobby Hero clicks now use the same VS AI Deck Builder v1.58 read-only review, including HERO LINEAGES and rank selection. A 55-card Hero/Legacy catalog is read from the installed Season 0 static card definitions; regular battle assets are reused from `/battle/`.
- **Coin Flip:** removed the extra `RETURN TO LOBBY` button, restored single coin result visual and synced the latest approved Heads/Tails image assets. Mobile Coin Flip uses the VS AI landscape script.
- **Fatal empty battlefield:** removed a JavaScript boot exception caused by trying to attach `onchange` to the missing Music control. PvP retains SFX only, deliberately omits BGM.
- **Extra opponent Mana:** removed the new top-right opponent Mana badge/panel and restored the original VS AI pool position in the opponent field. PvP remains able to show face-down opponent Mana as required by game rules.
- **Mobile lobby:** reuses the exact same desktop two-column lobby DOM/geometry via a scaled landscape canvas, rotated for portrait phones instead of an alternative stacked design. No new lobby controls.
- **RFC6455 fallback:** corrected the existing lite WebSocket parsing edge case when a 16-bit payload length equals exactly 127 bytes. This was reproduced when a longer unique build ID pushed the normal deck-selection command across this boundary. Native `ws` production transport is unchanged.

**QA:** `npm run check` and `npm run test:rc36-ui-hotfix` pass locally; `npm run build:precompress` produces updated compressed static assets. Real two-device visual/network testing and Northflank deployment remain unverified. Source of truth is attached PvP RC36 Patch 4 and VS AI RC36 Patch 4; a separate newer PvP Patch 5 archive was not provided.

Full details: `docs/RC36_PATCH4_UI_HOTFIX1_2026-11-09.md`.

---

# Grandis Legacy PvP Season 0 — RC36 Patch 4 / Network RC6 Stage 2 Lightweight

**STATUS: STAGING BUILD — full source ready for manual GitHub upload and Northflank QA; not certified production/final.**

This release integrates the newest locally available **VS AI RC36 Internal Patch 4 (RC36.6)** gameplay engine and Season 0 card/runtime resources into the **PvP Network RC6 Stage 2** authoritative two-player architecture. It retains the user-validated **RC5 local Mana draft and atomic PAY**, batch Response selection/confirmation, one parent WebSocket between lobby and embedded battlefield, viewer-safe hidden zones, reconnect, and postmatch cleanup. **Rank-Up stays official 300/700 EXP, not the separate 200/500 TRIAL.**

### Release-specific changes

- RC36.6 engine/card definitions and assets + RC36 battlefield CSS, mobile appearance, hover preview scaling and compact EXP badge integrated with the existing secure PvP renderer. `public/battle/shared-app/app-runtime.js` intentionally remains PvP-specific; this is not a full donor renderer replacement.
- Ported RC5 atomic physical Mana/Response payment API into the RC36 engine and preserved all mirrored P1/P2 bookkeeping keys, preventing the seat-2 Provoke/End deadlock observed in initial integration.
- BGM files removed and gameplay BGM disabled; SFX retained (Card Sound, attack/defense/heal/dodge and coin).
- Removed intrusive floating `TOUCH ACTIONS` panel from gameplay; added rank-select Hero Card Review (image + class/race/HP/printed abilities) in PvP lobby, with mobile-friendly responsive CSS.
- **Local AI turns are never run in PvP**. Some donor AI planning helper functions remain in the minified/shared engine source because safely extracting them requires a separate dependency audit. No AI opponent is spawned or given decision authority.
- Event-driven PvP battlefield rendering remains; VS AI 120ms full redraw loop is conditioned out in PvP.
- Normal mode uses one WebSocket via same-origin embedded battlefield; standalone `/battle/` remains available for recovery.

### Verification

`npm run build:precompress` and `npm run check` **PASS** locally, including RC36-donor engine parity checks, mirrored seat Response/physical Mana, Provoke liveness, nested/atomic Response tests, lobby, catalog, privacy, replay/ACK, Postmatch, and S1-inspired bridge/network adapters. Transport inside these offline tests is the compatibility lite fallback; **Docker production requires locked native `ws@8.21.0` installed by `npm ci`.**

**Limitations:** Hosted two-device PvP end-to-end gameplay, true mobile pinch-zoom/card-preview visibility, all RC36 card-effect branches, iframe rendering on real mobile/tablets, and actual Northflank latency have NOT been validated. Treat as a staging candidate and test with two independent profiles before release. Source/QA fixes do not prove a lag-free hosted game.

Deployment: `npm ci && npm run build:precompress && npm run check && npm start`, or Docker using the included Dockerfile. Use the PvP Trial repository; **GitHub was not modified by the assistant.**

Details: `docs/RC36_PATCH4_PVP_INTEGRATION_QA_2026-11-09.md`.

---

## Historical release documentation (RC6 Stage 2 and earlier)

# Grandis Legacy PvP S0 - Network RC6 Stage 2 (9 November 2026)

**STATUS: STAGING / QA CANDIDATE ONLY. RC36 gameplay/UI is NOT integrated yet.**

Baseline: **Season 0 PvP RC34 RC5** gameplay and approved Mana Payment; **Season 1 PvP v3.80.17** transport/Response reference; **VS AI RC36.3** is reserved for the next donor integration.

### Stage 2 changes

1. **No extra WebSocket at START MATCH from the normal `/` lobby path**: the lightweight lobby owns the real WebSocket while a same-origin `/battle/?embedded=1` iframe runs RC34 coin, opening and gameplay. An explicit `postMessage` channel transfers viewer-safe snapshots and permitted intents. The parent checks both sender window and origin. If the embedded battlefield fails to become ready after 25 seconds, players can choose the standalone `/battle/` recovery route. Direct navigation to `/battle/` retains a standalone fallback connection.
2. **One authoritative transaction for Response selection + confirmation** (`responseSelectNoStuck` > `confirmSelectedResponse`), using the S1-approved two-step batch pattern. Server whitelist + ownership check, all-or-nothing canonical snapshot commit and a single revision. Existing RC5 Mana Payment is unchanged.
3. Reuse the RC6 Stage 1 `ws` transport, backpressure limit, viewer-safe snapshot cache, RTT/ACK/Response paint diagnostics, and prefetch after READY.
4. Removed unnecessary lobby-side early gameplay sound execution during active match; S0 battlefield plays presentation SFX.

### QA and limitations

- `npm run check` **PASS**: the inherited RC34/RC5 regression suite, server-side batch on both seats, wrong-pair rejection/rollback, in-process parent/child bridge contract, private snapshots, reconnect, and 60-second cleanup. The wire test confirms unauthorized batches cannot advance a match.
- `npm run build:precompress` **PASS** and modified JS compressed assets were byte-verified.
- **NOT yet verified in a live two-browser hosted match**: full iframe behavior on actual devices, Coin/Opening timing, nested Response, Northflank latency, native `ws` in Docker. The local browser is restricted from navigating to HTTP test pages. The local `lite` WebSocket fallback was tested; production Docker requires `ws` installed with `npm ci`.
- The test verifies a one-socket *design and control flow*, not a measured latency improvement on Northflank. The gameplay engine remains **RC34**; AI extraction, background-music removal, RC36.3 UI integration, mobile scaling and lobby Card Review are not in this stage.

### Usage

`npm ci && npm run build:precompress && npm run check && npm start`

Point two separate browser profiles to `/`. Do not deploy to GitHub Pages (it cannot run Node/WebSocket); use the PvP-Trial GitHub repo + one Northflank Docker instance, port 3000, `/health` for readiness. Never replace the S1 PvP repository. Manual push only; no GitHub upload was performed.

**See** `docs/NET_RC6_STAGE2_QA_2026-11-09.md` and `docs/GITHUB_DEPLOY_NET_RC6_STAGE2_2026-11-09.md`.

---

## Historical Stage 1 / RC5 notes (not the release identity)

# Grandis Legacy PvP S0 - Network RC6 Stage 1 (9 November 2026)

**STATUS: NETWORKING STAGING CANDIDATE, NOT FINAL / NOT YET RC36 GAMEPLAY.**

Source versions verified from local original ZIPs (details and SHA-256 in `docs/NET_RC6_SOURCE_VERSIONS_2026-11-09.json`):

- **VS AI Season 0:** `v1.0 RC36` with **internal RC36.3** patch, the selected FUTURE gameplay/UI donor.
- **PvP Season 0 active runtime in this stage:** `RC34 RC5` (retained so network changes can be isolated). The user-tested RC5 Mana Payment remains untouched.
- **PvP Season 1 networking reference:** `v3.80.17`, using native `ws`.

## What is changed in NET RC6 Stage 1

1. **Production WebSocket transport uses `ws@8.21.0`**, exact locked artifact from the S1 reference. The original lite transport remains available **only as an offline/dev fallback**; Docker explicitly requires native `ws`.
2. **One handshake snapshot per client.** The server sends one authoritative `forceImport` snapshot; battlefield no longer immediately requests an unnecessary duplicate `resync`.
3. **Avoid repeated JSON encode/decode** in the lite fallback, protect slow sockets from unbounded snapshot buffering, and cache **only viewer-safe boards per revision**; spectator data stays independently redacted.
4. **Measured connection RTT and Response-to-paint latency.** `?pvpPerf=1` exposes timing at the battlefield, including server ACK, board import, RTT, and visible Response.
5. **Versioned, immutable cached battlefield scripts + optional prefetch after READY**, so the expensive page transition can reuse cached JS more often without stale assets across build IDs.
6. Preserve existing **RC5 one-inflight-ACK action gate, local/atomic Mana Payment, Response compound choices, privacy validation, reconnect, deadlock recovery and postmatch cleanup**.

**Not changed yet:** RC34 gameplay engine/rules; RC36 UI; Local AI bundle separation; background music removal; touch-action dock; mobile/tablet layout; one-document S1-style lobby-to-game transition. They are explicitly deferred until the RC36 integration or a later stage. Existing PvP uses no Local AI decision-making on the server.

## Run locally

`npm ci && npm run build:precompress && npm run check && npm start`

`GET /health` should report `transport: "ws"` after npm ci. The offline test environment runs the built-in `lite` fallback because npm registry access is unavailable there; this is **not proof of native ws performance or Docker deployment**.

For GitHub/Northflank instructions: `docs/GITHUB_DEPLOY_NET_RC6_2026-11-09.md`. Full QA: `docs/NET_RC6_QA_2026-11-09.md`.

---

## Historical RC34 RC5 README (retained for traceability)

# Grandis Legacy PvP — Season 0 RC34 GitHub Release Candidate 5 (S1-style Mana Transport)

**Kode build:** `gl-s0-rc34-github-rc5-2026-11-09`  
**Tujuan repo:** `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` (**bukan** repo Season 1)  
**Status:** **siap sebagai source untuk push GitHub + deploy uji coba ke host Node/Docker**. Belum lulus QA pertandingan lengkap melalui dua browser di hosting publik; **bukan FINAL / production release**.

## Pembagian tugas

| Bagian | Asal / tanggung jawab |
|---|---|
| Lobby, seat, READY, START, spectator, reconnect | Alur PvP Season 1 v3.80.17 + layout PvP Season 0 yang telah disetujui; IMPORT DECK emas, kartu Hero proporsional, panel adaptif. |
| Rules, card data, gameplay & battlefield | Donor **VS AI Season 0 RC34**. Definisi kartu tetap identik dengan donor. Mode PvP tidak menjalankan pengambilan keputusan AI lokal. |
| Game state, coin, RNG, giliran, Mana PAY, Response | **Server** Node.js, satu authoritative RC34 engine dan dua viewer-safe perspective. |
| Artwork, animation, sound, optional BGM | **Browser**. BGM dapat dimatikan dan tidak dieksekusi engine server. |

## Optimasi dan perbaikan RC34 GitHub RC1 + stabilitas RC2/RC3/RC4

- Lobby tanpa engine Season 1 yang besar; Hero dan Formation Season 0 tetap penuh.
- Mana Shard dipilih lokal, lalu satu konfirmasi **PAY atomik** berisi UID fisik yang divalidasi server; Response juga memakai transaksi final serupa.
- Render battlefield berdasarkan perubahan state (bukan memanggil full render setiap 120 ms). Animasi opening memiliki jalur tersendiri dari Draw reguler.
- HTTP static memakai prebuilt Brotli/gzip, cache/ETag, streaming file; byte-range tersedia untuk MP3/WAV.
- Memulihkan musik **Tavern Quest.mp3** dan **8 ikon aksi Hero** dari donor RC34 yang hilang pada kandidat optimized sebelumnya.
- ID tindakan unik per dokumen setelah refresh untuk mencegah salah ACK; data event publik Counter/Racial dipertahankan sementara kartu pribadi tetap ditutup.
- Dockerfile Node 22 tanpa dependency runtime eksternal, health check, menjalankan user nonroot. GitHub Actions menjalankan regression, WebSocket QA, asset checks, dan Docker build.

**RC2 deadlock/liveness:** server auto Draw -> Deploy setelah wajib Draw/Regen selesai; Provoke End langsung lanjut setelah pilihan Mana; Coin Flip punya tombol batal dan timeout/reconnect recovery; Surrender tetap tersedia saat keputusan lawan; opening watchdog 12 detik; ACK dicocokkan per action ID; idle timeout hanya berlaku untuk pemilik keputusan aktif. Juga memperbaiki pemetaan bookkeeping Provoke/End saat Seat 2. Detail bukti dan batasan ada di `docs/RC34_RC2_DEADLOCK_FIXES_2026-11-08.md`.


**RC3 Response & mobile gameplay update:** memperbaiki `response_window` viewer-safe yang ditandai UNKNOWN agar PASS/Defense/Reaction dari pemilik Response tetap dikirim ke server; test baru menjalankan adapter browser produksi dengan snapshot asli untuk **kedua seat**. Semua penolakan client sekarang memberi feedback yang terlihat, serta latency ACK dan waktu engine dicatat pada `GL_S0_PVP_NETWORK.performanceSamples`. Tambahkan `?pvpPerf=1` pada URL `/battle/` untuk overlay diagnostik, hanya di browser. Durasi visual flight untuk PAY PvP dipangkas 520 ms menjadi 340 ms, tanpa mengubah cost/Mana/rules atau mode VS AI. **Aksi card yang membutuhkan keputusan source/target/Response tetap melalui server**; total lag hosting belum dibuktikan hilang.

**RC3 mobile battlefield:** action dock berada di luar kanvas yang diperkecil/dirotasi pada touch device. Tombol PLAY, TRIBUTE, PASS, CANCEL, NEXT PHASE, dan PAY/CONFIRM tersedia sesuai kondisi, berukuran tinggi 46 CSS px dan meneruskan event ke kontrol asli. Ini **bukan** perubahan desain lobby mobile; tampilan lobby portrait/landscape yang belum disetujui tetap menjadi pekerjaan tersendiri.

**RC3 post-match:** setelah game berstatus FINISHED, server menghapus match (tanpa menghapus deck dan formation seat) **60 detik** kemudian, tidak bergantung koneksi browser. Semua pemain menerima update `setup` dan kembali ke lobby, READY di-reset. Tombol floating RETURN TO LOBBY kanan atas dihapus, sementara popup Game Result memiliki countdown dan BACK TO LOBBY yang memanggil server. Label AI/LOCAL AI yang tersisa di battlefield PvP juga disesuaikan menjadi Opponent/nama pemain.

**RC4 Mana/Play latency, opponent pool & Tune Up:**
- `beginPlayFromHandFast` diselesaikan oleh server dalam **satu intent** untuk kartu yang hanya punya **satu Hero legal**: engine tetap menentukan legalitas, dan source pilihan otomatis dipakai hanya jika satu kandidat. Bila dua/tiga source legal, dialog Hero asli tetap dibuka. Hal ini menghapus satu round-trip Play → Choose Hero pada kasus yang memenuhi syarat.
- Dua Note dalam **Tune Up (S0-CLE-029)** dipilih sebagai draft lokal di browser dan ditegaskan sebagai satu transaksi `commitExactTuneUpChoice`. Server memverifikasi `commit_token`, kandidat legal, jumlah tepat 2 dan indeks unik; engine RC34 tetap memindahkan kartu sesuai aturan. Klik dua Note tidak lagi menghasilkan dua round-trip terpisah.
- Renderer tidak lagi melakukan redraw penuh **sebelum ACK** untuk setiap intent gameplay PvP, sehingga UI menunggu snapshot authoritative. Pembaruan draft Mana/Note lokal tetap terlihat langsung.
- **Opponent Mana Pool** dipindahkan keluar dari area Hero lawan yang tingginya terbatas, tetap **face-down** untuk melindungi identitas Shard, dan diberi label terlihat `OPPONENT MANA`.
- Kartu Tune Up yang belum legal menunjukkan tombol penjelas **WHY?**, misalnya Hero belum Rank II atau bukan fase Deploy. **Tidak ada perubahan syarat legality, biaya, atau efek kartu.**
- Tes engine RC34 asli & adapter browser baru dijalankan melalui `test:quickplay-tuneup`, plus QA layout opponent pool via Chromium `page.set_content` pada desktop/mobile. Detail: `docs/RC34_RC4_MANA_TUNEUP_POOL_FIXES_2026-11-08.md`.

**Tidak ada fitur kartu, status, artwork, atau aturan yang sengaja dipangkas.** Optimasi ini tidak membuktikan peningkatan FPS/latency pada hosting; itu harus diukur saat tes dua pemain.

## Jalankan di komputer sendiri

- **Runtime:** Node.js 22 direkomendasikan (Node >=18 didukung oleh script); tidak ada `npm install` untuk menjalankan server.
- **Test:** Node 22, Python 3 dengan `websocket-client==1.8.0` untuk tes WebSocket.

```bash
node server.js
# Buka http://localhost:3000/ pada dua browser/profil berbeda.
# Cek http://localhost:3000/health
```

Untuk verifikasi source dan file kompresi sebelum push:

```bash
npm run build:precompress
python3 -m pip install websocket-client==1.8.0
npm run check
```

## Cara upload/deploy

**Baca `docs/GITHUB_DEPLOY_RC34.md` sebelum upload.** Ekstrak ZIP lalu upload **semua isi folder proyek ke root repo**, termasuk folder tersembunyi `.github/workflows/`. **Jangan upload ZIP sebagai satu file di repo.** GitHub Pages adalah static hosting dan tidak menjalankan Node.js/WebSocket server; gunakan GitHub sebagai sumber code dan Northflank Combined Service (Dockerfile root, HTTP port 3000, satu instance) untuk tes multiplayer. Tidak ada push GitHub yang dilakukan oleh pembuat paket.

## Hasil QA saat pembuatan paket RC4

`npm run check` mencakup tes RC1/RC2/RC3 serta `test:quickplay-tuneup` (Bard/ Maesto/ adapter browser), `test:browser-response` (dua seat dengan snapshot nyata), `test:postmatch` (cleanup server otomatis), dan `test:touch-static`. Semua lolos pada pemeriksaan lokal terkontrol. **Ini belum menyatakan lobby mobile, opening visual, atau full browser match sudah PASS.**

`npm run check` lulus (pemeriksaan sintaks, lobby shell, lima starter Season 0, **20/20** regression engine RC34, Mana PAY + duplicate UID rejection, dua seat WebSocket/coin/first action, privasi spectator, HTTP Brotli/gzip/cache, delapan ikon dan 248 artwork, ID unik setelah reload, seat 2 Attack → PAY → Response PASS → damage). Ini **bukan** pengganti game lengkap melalui dua browser sungguhan.

**Masih perlu tes hosted:** seluruh alur opening, klik Mana UI kedua pemain dan warna Mana, response/reaction bertingkat, Rank Up/Legacy, reconnect, pengujian pertandingan panjang, UX mobile, HTTPS/WSS dan resource host. Browser automasi di lingkungan pembuatan tidak dapat navigasi ke halaman HTTP lokal karena kebijakan `ERR_BLOCKED_BY_ADMINISTRATOR`; QA visual sebelumnya menggunakan fixture DOM terkontrol saja. Docker daemon juga tidak tersedia pada mesin pembuatan, maka uji Docker image menunggu GitHub Actions setelah push.

**Batas arsitektur:** server hanya mengelola **satu room/match in-memory** dan **satu container instance**. Restart menghilangkan state match aktif; scale horizontal tanpa shared state **belum didukung**. Ini deploy **uji coba**, belum sistem public multiparty skala besar.

Dokumen tambahan: `docs/RC34_RC2_DEADLOCK_FIXES_2026-11-08.md`, `docs/GITHUB_DEPLOY_RC34.md`, `docs/QA_STATUS_2026-11-08.md`, screenshot layout di `docs/`; catatan RC32 lama disimpan di `docs/archive_rc32/` dan **tidak** menggambarkan RC34 terkini.

Catatan RC3: `docs/RC34_RC3_RESPONSE_POSTMATCH_FIXES_2026-11-08.md`.

Catatan RC4: `docs/RC34_RC4_MANA_TUNEUP_POOL_FIXES_2026-11-08.md`.

Release details: `docs/RELEASE_NOTES_RC34_GITHUB_RC4_2026-11-08.md`.


## RC5 — Mana Payment Transport, Session & UI Response (9 Nov 2026)

Replaces the RC4 Mana selection transport with **PvP Season 1-style local transaction boundaries** while retaining all Season 0 RC34 engine rules.

- New `public/battle/runtime/pvp-mana-draft.js` stores **physical Shard UIDs and optional Magical Surge** as browser-only draft; Color Mana values are read from the authoritative RC34 pending payment, never S1 rule values. Clicking Mana/Surge is zero RTT and avoids full battlefield re-render.
- PAY sends **one exact-UID intent immediately**. A visual PAY flight still plays asynchronously; gameplay no longer waits for a 340ms/430ms animation.
- Response requiring additional discard now combines chosen Hand candidate indices and physical Mana UIDs into **one server-authoritative atomic intent**; invalid/stale/duplicate selections are rejected without spending. 0-Mana Response also works.
- The invisible four-action client queue is removed. One action is in flight until its matching ACK; a second action gets visible feedback instead of becoming a stale queued command. UI sequences that formerly sent two requests immediately are now narrow server-verified composite actions (Response selection and required confirm, Bard Skip, status/purify, discard-then-draw-three).
- New `tests/rc34-rc5-mana-transport.mjs` exercises real client adapter for seat 1/seat 2 and a real RC34 engine Response with a mandatory additional Hand discard. It is included in `npm run check`.
- `?pvpPerf=1` can record the time from Play through visible Mana modal on the local browser; actual host latency remains unverified.

**Intentionally NOT changed by RC5:** lobby mobile design, Coin Flip/Back-of-Card opening presentation (known pending UX problems), gameplay card rules, all RC4 gameplay fixes. This is a *staging candidate*, not production-final. The source ZIP may be pushed manually to the private PvP-Trial repository; GitHub/Northflank were not changed by this build.

See `docs/RC34_RC5_MANA_TRANSPORT_FIXES_2026-11-09.md` for test evidence and migration details.
