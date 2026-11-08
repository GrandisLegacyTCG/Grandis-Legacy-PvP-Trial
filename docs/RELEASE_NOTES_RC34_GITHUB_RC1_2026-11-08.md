# Grandis Legacy PvP S0 RC34 — GitHub RC1 release notes

**Dibuat:** 8 November 2026  
**Target:** repo GitHub `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial`, deployment staging Northflank Combined Service  
**Status:** source + Docker deployment candidate; **belum** FINAL sampai pengujian multiplayer nyata di hosting.

## Perbedaan dari RC34 Optimized Candidate sebelumnya

1. **Reload-safe client action IDs:** nonce unik per dokumen browser untuk runtime-intent, channel intent lobby, dan surrender. Menghindari ledger mengenali aksi baru sebagai replay setelah refresh.
2. **Public event fidelity:** sanitasi presentation events mempertahankan field publik untuk `CARD_NEGATED` dan `RACIAL_TOKEN_USED` tanpa menampilkan kartu privat lawan.
3. **Aset donor yang dipulihkan:** background music `Tavern Quest.mp3` dan 8 ikon Hero/Support yang tidak ada di kandidat sebelumnya kini kembali dari donor RC34.
4. **Server response / hosting:** hash engine pada `/health` di-cache saat boot; balasan HEAD/GET, graceful shutdown, streaming MP3/WAV byte range.
5. **Battlefield copy:** turn label melaporkan `OPPONENT TURN` untuk PvP (bukan `AI TURN`).
6. **Validasi baru:** RC34 seat 2 Mana PAY + seat 1 Response PASS, privacy event, asset inventory, unique intent IDs, WebSocket reconnect+aksi berikutnya, HTTP Range, CI workflow RC34.
7. **Deployment:** Docker image Node22 nonroot, explicit runtime-only copy, `/health` healthcheck, workflow GitHub Actions plus Docker build, instruksi deployment yang tidak menggantikan PvP Season 1.

## Yang tidak diubah

- Definisi statis kartu Season 0 RC34 (`engine/js/static-data.js`) tetap sesuai donor.
- Game rules, balancing kartu, mana costs, keyword semantics dan efek hero tidak sengaja dipangkas.
- Lobby PvP UI yang telah disetujui (Import emas, responsif) tetap dipertahankan.
- BGM tetap opsional dan diproses browser, bukan server battle.
- Repositori GitHub asli dan VS AI RC34 asli tidak dimodifikasi; file ini berada di salinan terpisah.

## Test run

`npm run build:precompress` menyiapkan 71 berkas terkompresi; `npm run check` PASS, termasuk **20/20 regression RC34** serta scenario seat 2, privacy, reconnect, dan HTTP. Browser dual-seat real-host dan Docker image build belum dijalankan di mesin lokal. Perinciannya di `docs/QA_STATUS_2026-11-08.md`.
