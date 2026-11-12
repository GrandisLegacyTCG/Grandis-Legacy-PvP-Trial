# Grandis Legacy PvP Season 0 RC39 — Repo RC3 Gameplay UI Parity Audit

**Tanggal audit:** 12 November 2026  
**Baseline:** PvP RC39 Repo RC2 Combat & UI Hotfix  
**Referensi:** VS AI Season 0 RC39 12 November 2026 (donor source dan aktif UI CSS)  
**Build target:** `gl-s0-pvp-rc39-beta2-repo-rc3-2026-11-12`  
**Status:** Repo RC3 candidate untuk manual PvP Trial deployment; **belum diverifikasi pada dua browser/perangkat nyata**.

## Ringkasan keputusan

Audit menemukan ketertinggalan UI/visual yang benar-benar ada di RC2. Karenanya, **RC2 tidak dipertahankan tanpa perubahan**. RC3 menyamakan bagian UI gameplay yang relevan dengan VS AI RC39, dengan adaptasi khusus bagi server-authoritative PvP. Tidak ada perubahan rule, kartu, gameplay authority, lobby, atau WebSocket.

| Gameplay UI | Audit RC2 vs VS AI RC39 | Perubahan RC3 / hasil |
|---|---|---|
| EXP Hero (angka EXP) | RC2 hanya label; VS AI memungkinkan klik angka EXP dan menampilkan kartu EXP publik | **Diperbaiki.** EXP Inspector untuk Hero kedua sisi, Card Review dan hover, lock saat Hand dibesarkan; ditutup dan dibersihkan dengan benar pada match baru. |
| Holy Rejuvenation / Saint Purify | RC2 memilih Status lewat klik ikon yang tersebar di Hero; VS AI memakai foreground center-choice dengan ikon Status dan konfirmasi | **Diperbaiki.** Centered `HOLY REJUVENATION — REMOVE STATUS`, pilihan ikon `Bleed/Burn/Freeze/Poison/Stun` yang tersedia, `REMOVE SELECTED STATUS`; pilihan ditentukan server. |
| Rank Up: Return EXP animation | RC2 terbang per kartu ke posisi umum Hand; VS AI mengelompokkan Return EXP secara atomik menuju slot Hand hasil transaksi | **Diperbaiki.** Implementasi batch visual 440ms dengan target Hand berdasarkan `hand_index` dari event `TRIAL_EXP_RETURNED_TO_HAND`, hide/reveal slot per batch, menangani rerender dan hidden tab. Untuk PvP sumber flight tetap Hero/arena setelah ACK, bukan mutasi instan dari popup sebelum konfirmasi. |
| Coin Flip heading | RC2 masih menyimpan heading historis di markup overlay | **Diperbaiki.** Overlay Coin Flip tanpa heading `Opening Coin Flip`, sebagaimana donor; hasil dan pilihan urutan tetap diotorisasi server. |
| Tune Up | RC2 punya tombol `WHY?` tambahan yang tidak ada pada tampilan donor | **Disamakan.** Tombol tambahan dihapus. |
| Popup Rank Up & Scouting | Sudah di tengah Battlefield pada RC2 (bukan popup `TRIAL` generik lama) | Dipertahankan, kartu diklik lokal lalu satu commit. |
| Skill Hero Selection | RC2 selalu meminta klik Hero meski hanya satu legal | Dipertahankan, sesuai gameplay UI VS AI. |
| Area Attack, damage, status icons | RC2 menahan efek sampai seluruh Response diselesaikan | Dipertahankan, karena state combat dari server baru dipresentasikan sesudah resolusi final. |
| Opening Hand | RC2 5 kartu masing-masing, lima pasangan animasi | Dipertahankan: donor masih memiliki animasi 6 pasangan (historis), **jangan salin** karena Rulebook v3.2 = 5 per pemain. |
| Main Deck R3.7 | RC2 187/187 artwork sesuai donor | Tidak perlu berubah. |
| Mana Loss, Countered, Response | RC2 memakai notifikasi dan efek yang disesuaikan dengan event jaringan | Dipertahankan; hasil final datang dari server. |
| Hero HP/EXP/status/attachment, card review, center-choice CSS | Seluruh CSS dasar donor sudah ada pada RC2 | Tidak menimpa CSS bersama; RC3 mengambil markup & binding fungsi yang tertinggal. |
| Favicon | RC2 sudah mencantumkan favicon | Dipertahankan. |

### Perbedaan yang **sengaja** tetap ada

Perbedaan berikut bukan UI regression dan **tidak boleh** ditimpa langsung dengan VS AI, karena PvP membutuhkan multiplayer:

1. Lobby/READY, room dan reconnect dari S1-derived **RC6 Stage 2**; hanya **satu WebSocket** untuk Lobby + Battlefield.
2. Label pemain lawan `OPPONENT`/nama asli alih-alih `LOCAL AI`, tidak ada pemilihan AI difficulty/AI director.
3. BGM sengaja dinonaktifkan pada PvP sesuai kesepakatan sebelumnya.
4. Mana Payment RC5 dan multi-choice Batch 3 tetap **local draft -> satu server commit** (tidak melakukan mutasi gameplay lokal seperti VS AI).
5. Hand/Deck lawan dan pilihan Mana blind tetap tertutup; hanya EXP Hero publik dan data event resmi yang boleh tampil.
6. Server mengatur Coin Flip dan turn order; tidak boleh memakai RNG atau pilihan first player versi lokal VS AI.
7. Mobile landscape, respons penantian lawan, pemulihan disconnect, dan event combat authoritative menggunakan glue PvP sendiri.
8. Rank Up VFX harus menunggu ACK dan `RANK_UP_COMMITTED`; animasi return EXP mengikuti indeks Hand yang disahkan server. Gerak asal tidak selalu identik frame demi frame dengan mode VS AI yang melakukan local engine commit sinkron.

## Batas audit source

- Aktif CSS: **2070 dari 2076 baris referensi** terdapat sebagai blok yang sama dalam shared stylesheet; sisa perbedaan berupa kelas Coin Flip PvP, banner Mana PvP, dan aturan mobile/overlay yang ditambahkan khusus PvP. Tidak diperlukan penggantian total stylesheet.
- Card metadata dan artwork: `static-data.js` identik dengan donor; 187/187 Main Deck art sudah diuji pada suite RC39; file artwork Hero/Legacy tidak diubah.
- Engine gameplay: `public/battle/engine/shared-app/app.bundle.js` RC3 **byte-identical** dengan RC2 (hash SHA-256 sama). Perbedaan dengan donor engine dipertahankan untuk RC5 authority dan seat 2.
- `server/viewer-safe.mjs`, `server/combat-presentation.mjs`, `server/headless-rc32.mjs`, `public/pvp/pvp-host.js`, `public/battle/runtime/pvp-network.js`, dan `public/battle/runtime/pvp-mana-draft.js` seluruhnya **byte-identical** dengan RC2, dikunci SHA-256 pada test RC3.
- `server.js` berubah hanya pada metadata build/release untuk cache bust; tidak ada migrasi transport.

## Test dan integritas

- **`npm run check`: PASS, exit code 0**. Menjalankan full existing engine, gameplay, privacy, WebSocket gate, lobby, startup, Response, Rank Up, Area, Mana, local draft dan seluruh regresi RC39.
- **`npm run test:rc39-rc3`: PASS**. Verifikasi EXP Inspector, mapping Purify ke panel tengah bagi decision owner, tombol/status/overlay, slot tujuan Return EXP, reset/visibility guard, 5+5 Opening, Coin Flip tanpa heading, public EXP di dua sisi tetapi opponent Hand/Deck tetap tersembunyi, dan source hash invariants.
- **`npm run test:rc39-rc2`: PASS**, mencakup Area Attack, post-Response visual, Hero Selection, 5+5 Opening, favicon, engine real terhadap dua perspektif dan masked projection.
- **`npm run test:rc39-batch5`: PASS**, termasuk Rank Up committed transaction, 187 artwork, Mana Loss privacy.
- **`npm run test:net-stage2-socket`, `test:net-stage2-response`, `test:local-draft-batch3`, dan `test:local-draft-real-batch3`: PASS** dalam suite penuh.
- **`node scripts/precompress-static.mjs`: PASS**, seluruh 82 textual static assets tersinkron ulang ke `.br`/`.gz`. Docker juga tetap membangun ulang precompression saat image build.

## Pemeriksaan manual setelah deployment (masih dibutuhkan)

QA otomatis membuktikan integrasi kode dan sifat authority; **tidak bisa memastikan pixel-perfect, timing frame, atau kelancaran dua perangkat**. Pada PvP Trial, prioritaskan:

1. Klik badge EXP pada Hero sendiri dan lawan saat 100/200/300+ EXP, termasuk hover setiap kartu EXP dan tutup inspector.
2. Holy Rejuvenation dengan beberapa Status pada satu Hero, pilih lalu confirm; uji Player 1 & Player 2.
3. Rank Up II (2 EXP) dan Rank Up III (3 EXP) dari Tribute terakhir; periksa Return EXP terbang serentak, kartu tidak flicker/duplikat, Hero baru baru muncul sesudah pilihan.
4. Poison Mist / Area Attack ke tiga Hero, dengan Response berbeda per target dan Response bertingkat; damage + ikon Status baru tampil seusai seluruh Response.
5. Opening 5+5, Coin Flip, satu Hero legal untuk Skill, inspect di mobile landscape, reconnect tengah pilihan.
6. Refresh browser setelah deploy untuk memastikan `gl-s0-pvp-rc39-beta2-repo-rc3-2026-11-12` bukan file `.br`/`.gz` cache lama.

**Rekomendasi:** Gunakan **RC3**, bukan RC2, untuk pengujian PvP Trial berikutnya, karena audit menemukan tiga ketertinggalan fungsional pada UI plus dua mismatch minor. Ini tetap candidate dan belum production-certified. **GitHub maupun Northflank tidak disentuh.**
