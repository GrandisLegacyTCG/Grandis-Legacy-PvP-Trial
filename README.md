# Grandis Legacy PvP — Season 0 RC34 GitHub Release Candidate 3 (Response Fix + 60s Post-Match Cleanup)

**Kode build:** `gl-s0-rc34-github-rc3-2026-11-08`  
**Tujuan repo:** `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` (**bukan** repo Season 1)  
**Status:** **siap sebagai source untuk push GitHub + deploy uji coba ke host Node/Docker**. Belum lulus QA pertandingan lengkap melalui dua browser di hosting publik; **bukan FINAL / production release**.

## Pembagian tugas

| Bagian | Asal / tanggung jawab |
|---|---|
| Lobby, seat, READY, START, spectator, reconnect | Alur PvP Season 1 v3.80.17 + layout PvP Season 0 yang telah disetujui; IMPORT DECK emas, kartu Hero proporsional, panel adaptif. |
| Rules, card data, gameplay & battlefield | Donor **VS AI Season 0 RC34**. Definisi kartu tetap identik dengan donor. Mode PvP tidak menjalankan pengambilan keputusan AI lokal. |
| Game state, coin, RNG, giliran, Mana PAY, Response | **Server** Node.js, satu authoritative RC34 engine dan dua viewer-safe perspective. |
| Artwork, animation, sound, optional BGM | **Browser**. BGM dapat dimatikan dan tidak dieksekusi engine server. |

## Optimasi dan perbaikan RC34 GitHub RC1 + stabilitas RC2/RC3

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

## Hasil QA saat pembuatan paket RC3

`npm run check` mencakup tes RC1/RC2 serta `test:browser-response` (dua seat dengan snapshot nyata), `test:postmatch` (cleanup server otomatis), dan `test:touch-static`. Semua lolos pada pemeriksaan lokal terkontrol. **Ini belum menyatakan lobby mobile, opening visual, atau full browser match sudah PASS.**

`npm run check` lulus (pemeriksaan sintaks, lobby shell, lima starter Season 0, **20/20** regression engine RC34, Mana PAY + duplicate UID rejection, dua seat WebSocket/coin/first action, privasi spectator, HTTP Brotli/gzip/cache, delapan ikon dan 248 artwork, ID unik setelah reload, seat 2 Attack → PAY → Response PASS → damage). Ini **bukan** pengganti game lengkap melalui dua browser sungguhan.

**Masih perlu tes hosted:** seluruh alur opening, klik Mana UI kedua pemain dan warna Mana, response/reaction bertingkat, Rank Up/Legacy, reconnect, pengujian pertandingan panjang, UX mobile, HTTPS/WSS dan resource host. Browser automasi di lingkungan pembuatan tidak dapat navigasi ke halaman HTTP lokal karena kebijakan `ERR_BLOCKED_BY_ADMINISTRATOR`; QA visual sebelumnya menggunakan fixture DOM terkontrol saja. Docker daemon juga tidak tersedia pada mesin pembuatan, maka uji Docker image menunggu GitHub Actions setelah push.

**Batas arsitektur:** server hanya mengelola **satu room/match in-memory** dan **satu container instance**. Restart menghilangkan state match aktif; scale horizontal tanpa shared state **belum didukung**. Ini deploy **uji coba**, belum sistem public multiparty skala besar.

Dokumen tambahan: `docs/RC34_RC2_DEADLOCK_FIXES_2026-11-08.md`, `docs/GITHUB_DEPLOY_RC34.md`, `docs/QA_STATUS_2026-11-08.md`, screenshot layout di `docs/`; catatan RC32 lama disimpan di `docs/archive_rc32/` dan **tidak** menggambarkan RC34 terkini.

Catatan RC3: `docs/RC34_RC3_RESPONSE_POSTMATCH_FIXES_2026-11-08.md`.

Release details: `docs/RELEASE_NOTES_RC34_GITHUB_RC3_2026-11-08.md`.
