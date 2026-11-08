# Grandis Legacy PvP S0 RC34 — GitHub RC4: Mana Payment / Opponent Pool / Tune Up

**Tanggal:** 2026-11-08. **Basis:** GitHub RC3. **Status:** staging candidate; GitHub tidak disentuh, full host E2E belum lolos.

## Laporan pengguna dan perubahan

| ID | Gejala | Perubahan yang dilakukan | Batas verifikasi |
| --- | --- | --- | --- |
| BUG-09 | Modal Mana Payment lambat muncul setelah PLAY | Server mengeksekusi PLAY dan otomatis memilih source Hero **hanya apabila persis satu legal Hero**. Browser tidak lagi me-render seluruh board sebelum ACK. Tidak menyingkat animasi/Response atau menghilangkan validasi. | Perjalanan jaringan berkurang dalam satu-source scenario; RTT asli Northflank belum diukur. |
| BUG-10 | Mana Pool lawan tidak terlihat | Container opponent Mana di-root battlefield, berada di lapisan yang selalu terlihat, dengan label `OPPONENT MANA`; kartu tetap face-down dan jumlah publik. | Chromium fixture 4 viewport PASS; real-host landscape/portrait perlu dicek. |
| BUG-11 | Tune Up tak bisa dimainkan | Cegah tiap pilihan Note memerlukan request; memilih dua Note lokal dan commit atomik satu action. Tambah `WHY?` untuk kartu yang secara aturan tidak legal agar alasan terlihat. | Real engine Bard II/Maestro III dan adapter browser PASS; full game hosted belum dibuktikan. |

## Kontrak engine/authority yang dipertahankan

1. `beginPlayFromHandFast` menjalankan **engine `beginPlayFromHand` asli**, lalu membaca `pending.source_selection` dari engine yang sama. Hanya bila `legal_sources` tepat satu dan kedua sisi source/decision PLAYER dalam perspektif lokal pemain, engine `chooseHeroFromBoard` dipanggil dalam transaksi sama. Ini bukan client yang mengarang hero; lebih dari satu kandidat tetap dipilih pemain.
2. Untuk **Seat 2**, engine headless menjalankan mirror perspektif sehingga keputusan lokal harus dibaca melalui `getCanonicalSnapshot(1)` (read-only), sedangkan state canonical yang disimpan tetap `getCanonicalSnapshot(seat)`. Uji RC4 mencakup alur legal Tune Up pada perspektif terbalik Seat 2.
3. Ketika `pending` benar-benar `card_search_choice` dari `S0-CLE-029`, zone deck, multi-select, pemilik PLAYER, request `commitExactTuneUpChoice` mensyaratkan `commit_token`, persis dua indeks legal dan unik, serta nol pilihan server terdahulu. Lalu engine `selectCardSearchChoice` dipanggil dua kali dan `handleChoiceConfirm` sekali. Jika ada error, snapshot authoritative tidak dipromosikan ke state canonical.
4. Pemilihan NOTE lokal hanya draft UI, tidak mengubah server. Disimpan dalam state snapshot disposable client; action final tetap dinilai server. Saat ACK gagal/reconnect, snapshot authoritative menggantikan draft.
5. Rule Tune Up tetap **Deploy Phase, Bard Rank II / Maestro Rank III via Lineage, biaya 2 Mana**. Kartu membutuhkan Hero Ready; tidak ada pengecualian untuk fase/rank/cost.
6. Identitas Mana lawan tidak dipublikasikan. Opponent display menunjukkan back-of-card dan jumlah, bukan warna/UID.

## QA baru

```sh
node tests/rc34-rc4-quickplay-tuneup.mjs
python3 tests/qa-opponent-mana-browser.py   # optional, memerlukan Playwright Python + Chromium
npm run build:precompress
npm run check
```

Tes baru memasukkan engine aktual RC34 dari `public/battle/engine/...` ke VM lalu melakukan legal PLAY, Mana PAY, efek Tune Up dan validasi privasi. Test adapter menjalankan `public/battle/runtime/pvp-network.js` yang sungguh akan dilayani browser dengan snapshot viewer-safe. Pengujian visual menggunakan HTML dan CSS battlefield asli serta *fixture* empat back mana, bukan koneksi multiplayer sungguhan.

Artefak visual: `docs/QA_RC34_RC4_Opponent_Mana_1440x900.png`, `...1280x600.png`, `...844x390.png`, `...390x844.png`.

## Risiko tersisa

- Tanpa trace production (`/battle/?pvpPerf=1`) belum bisa mengukur apakah server, network, atau render browser yang paling banyak menambah delay. Optimalisasi ini mengurangi satu request bila hanya satu Hero legal dan dua request saat Tune Up, tetapi **tidak menjamin modal Mana selalu instant** untuk semua card.
- Belum uji pada host Northflank dengan dua browser fisik/HP; masih wajib uji klik PLAY, bukanya Mana, pembayaran, Response lawan, Tune Up Bard II/Maestro III, dan opponent Mana landscape/portrait.
- Laporan visual sebelumnya: lobby mobile belum final dan transisi Coin Flip/Back-of-Card belum selesai; update RC4 tidak mengklaim memperbaikinya.
- Definisi kartu, engine RC34, BGM dan artwork tidak dipangkas; rollback lewat kembali ke RC3 dapat dilakukan dengan ZIP terpisah.
