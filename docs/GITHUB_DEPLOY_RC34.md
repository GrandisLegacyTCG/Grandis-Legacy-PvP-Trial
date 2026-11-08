# Cara deploy Grandis Legacy PvP Season 0 RC34 (GitHub RC5)

## 0. Tujuan dan batasan

**Target repo uji coba yang diperiksa read-only:** `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` (branch utama `main`). Repo `Grandis-Legacy-PvP` adalah Season 1; **jangan menimpa repo tersebut**. Source RC34 di paket ini telah disiapkan untuk **push manual oleh pemilik repo**. Belum ada commit/push atau deployment Northflank yang dilakukan oleh pembuat paket.

GitHub menyimpan source dan menjalankan **GitHub Actions QA**; **GitHub Pages tidak bisa menjalankan backend Node.js/WebSocket**. Untuk bermain melalui internet, diperlukan host Node/Docker. Cara paling sederhana adalah satu **Northflank Combined Service** yang menyajikan frontend HTTP dan endpoint WebSocket `/ws` pada satu origin.

## 1. Ekstrak ZIP, cek struktur repo

**PENTING:** kirim ISI ZIP, bukan file ZIP. File yang wajib terlihat di root:

```text
.github/workflows/qa.yml
Dockerfile
.dockerignore
.gitignore
package.json
server.js
server/
public/
public/index.html
public/battle/index.html
tests/
scripts/
docs/
README.md
```

Untuk hasil paling aman, lakukan push ke branch staging baru di **PvP-Trial**, lalu arahkan host uji coba ke branch ini; jangan langsung mengganti server Season 1 / situs resmi.

Contoh untuk pengguna Git (di luar mesin pembuat paket):

```bash
git clone https://github.com/GrandisLegacyTCG/Grandis-Legacy-PvP-Trial.git
cd Grandis-Legacy-PvP-Trial
git switch -c s0-rc34-github-rc5
# Hapus file tracked versi RC32 pada branch staging (direkam oleh Git).
git rm -r -- .
# Salin SELURUH ISI folder hasil ekstraksi RC34 ke folder ini,
# termasuk .github/ dan file dotfiles, tetapi JANGAN copy folder .git lain.
git add -A
git commit -m "PvP S0 RC34 GitHub RC5 mana-and-tuneup staging"
git push -u origin s0-rc34-github-rc5
```

Jika memakai GitHub web upload, pertahankan hierarki direktori dan semua berkas. Untuk ratusan artwork lebih baik gunakan Git CLI/GitHub Desktop. GitHub upload web saja kurang cocok untuk struktur proyek besar. Jangan tanpa sengaja menghapus folder `.github` karena workflow otomatis bergantung padanya.

## 2. Pastikan GitHub Actions lulus

Masuk ke repo **PvP-Trial → Actions**. Workflow `Grandis Legacy PvP S0 RC34 - source and network QA` secara otomatis:

1. Menyiapkan Node 22 dan Python 3.12.
2. Menjalankan `npm run build:precompress`.
3. Menjalankan `npm run check` (rule engine RC34, WebSocket, Mana, privacy, assets, HTTP).
4. Menjalankan `docker build`.

**Hentikan promosi** jika ada job merah; periksa log. Uji Docker image belum dapat dieksekusi di mesin pembuat paket sehingga hanya runner GitHub/host Docker yang dapat mengonfirmasinya.

## 3. Host node/websocket di Northflank

Di Northflank, buat **Combined Service** dari repo `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` dan branch staging `s0-rc34-github-rc5`.

- **Build type:** Dockerfile, path root `/Dockerfile`, build context root.
- **Port:** **3000 / HTTP / Public**. Endpoint WebSocket `/ws` melewati origin/port yang sama; browser memakai `wss://` di HTTPS.
- **Environment:** `PORT=3000`, `HOST=0.0.0.0` (default Dockerfile sudah mengatur keduanya).
- **Replicas/instances:** **1**, jangan autoscale horizontal; room tidak memakai Redis/database bersama.
- **Health:** HTTP GET `/health` pada port 3000; Dockerfile juga memiliki HEALTHCHECK.
- **Runtime:** `node server.js`, tanpa database dan tanpa `npm install` runtime.
- **CI/CD:** boleh diaktifkan untuk branch staging setelah workflow GitHub QA hijau.

Catatan: saat layanan restart, state match/hubungan pemain hilang. Gunakan lingkungan tes dulu, bukan link publik utama.

Sumber panduan resmi: `https://northflank.com/docs/v1/application/getting-started/build-and-deploy-your-code` dan `https://northflank.com/docs/v1/application/network/configure-ports`.

## 4. Smoke test setelah deploy

**Prioritas RC3 (wajib dua browser / salah satu perangkat mobile):**

- Uji **kedua arah**: Seat 1 Attack -> Seat 2 PASS atau Defense; Seat 2 Attack -> Seat 1 PASS atau Defense. Tombol tidak boleh tampak aktif namun diblokir dengan `Opponent decision pending.`. Server harus menerima tindakan yang legal.
- Jalankan satu Play Card dari Hand dan cek waktu action melalui URL `/battle/?pvpPerf=1` bila lambat. Overlay menampilkan **ACK** (waktu total request/response) dan **engine** (waktu pemrosesan di server) dalam milidetik. Simpan screenshot/perkiraan waktu jika masih terasa lambat.
- Pada smartphone, pastikan dock tombol 46 CSS px di luar kanvas yang diskalakan dapat melakukan PLAY/PASS/PAY, bukan sekadar terlihat. Coba rotate ke landscape, Return dan Surrender serta pastikan tidak ada double-PAY.
- Setelah selesai pertandingan, pastikan Game Result memiliki countdown dan **BACK TO LOBBY** mengembalikan kedua klien lewat server; tanpa aksi manual kedua klien harus kembali ke lobby sekitar **60 detik setelah match selesai** (sweeper server dapat menambah beberapa detik). READY menjadi false dan Deck/Formation dipertahankan.
- Pastikan tidak ada tombol floating RETURN TO LOBBY kanan atas atau label LOCAL AI.

**Masih OPEN, bukan bagian fix RC3:** lobby *mobile* belum disetujui, dan visual Coin Flip / Back-of-Card / Hero Reveal belum dipastikan sesuai donor VS AI. Jangan menyatakan ketiganya beres hanya karena tes RC3 lulus.


1. Buka `https://<subdomain-host>/health` dan pastikan `ok:true`, `buildId=gl-s0-rc34-github-rc5-2026-11-09`, serta `authoritySources` terisi.
2. Buka `https://<subdomain-host>/` di **dua browser/profil independen**. Pastikan lobby PvP yang disetujui: artwork penuh, Import Deck emas di samping pilih deck, panel responsif.
3. Pastikan dua pemain memiliki seat berbeda, memilih Starter, READY, lalu seat 1 START.
4. Coin Flip konsisten di dua layar. Battlefield menampilkan tiga Hero sebelum enam pasang Opening Hand dan tiga Mana opening; Draw normal baru mengikuti aturan gilirannya.
5. Uji dari **seat 1 dan seat 2**: Attack / Skill → pilih Mana lokal → PAY → Response lawan → damage/state sesuai.
6. Uji Defense/REACTION/Rank Up/Status/Legacy, termasuk Poison+Stoneblood, menghabiskan Hand, dan cancel/resume.
7. Buka tab spectator dan pastikan Hand/Draw/Mana rahasia **tidak bocor**. Uji reconnect dengan refresh dan pastikan tidak ada intent yang dianggap sudah pernah dijalankan.
8. Uji kondisi pemain menunggu lawan lebih dari 3 menit dengan tab tetap aktif serta paket mobile/landscape. Periksa browser Console/Network dan log host untuk ERROR/REJECTED.
9. Uji satu pertandingan sampai Game Over; uji Restart layanan hanya setelah pertandingan, karena state match masih in-memory.

Jika opening, Mana PAY, Response, status/rule, atau identitas private gagal, jangan nyatakan FINAL. Simpan screenshot, Console, log runtime, posisi seat, kartu, fase, dan reproduksinya untuk patch selanjutnya.

## 5. Hal yang sudah diverifikasi VS belum

**PASS lokal:** source syntax, lima starter, RC34 20/20 rule regression, WebSocket real dua seat, spectator masking, Mana atomik termasuk seat 2 + Response, HTTP gzip/br/ETag/Range, aset visual/audio, intent ID refresh-safe.

**Belum diverifikasi:** full match nyata dengan dua browser HTTP/HTTPS; klik UI Mana lengkap; performa hosting, puncak concurrent users; GitHub Actions Docker build; Northflank live WSS.

Source disiapkan untuk **deployment percobaan**, bukan pernyataan bahwa game pasti bebas bug atau siap public release.

## Warisan RC2: skenario deadlock wajib dites di hosting

1. Selesai Coin Flip tanpa reload; sengaja tutup salah satu tab selama Coin Flip lalu pastikan room kembali ke lobby setelah grace, tidak memerlukan restart host. Uji RETURN TO LOBBY saat Coin Flip.
2. Pemenang Coin Flip kedua arah: Mandatory Draw + Mana Regen selesai dan **Deploy aktif** tanpa klik NEXT saat Draw. Ulangi setelah beberapa kali End Turn.
3. Saat Provoke aktif, pilih Mana yang diminta pada End dan pastikan End **langsung** diteruskan, tidak ada Mana Burn dua kali.
4. Uji Surrender saat lawan sedang Response, sedang memilih Mana, dan saat animasi opening.
5. Simulasikan koneksi melambat, reload, hilang/terlambatnya ACK tanpa membuka antrean aksi ganda.
6. Pastikan pemain yang menunggu giliran tidak tiba-tiba kalah karena idle; uji putus koneksi saat giliran sendiri untuk melihat reconnect grace.

Status QA berikut belum terpenuhi tanpa tes di host: **full-match dua browser dan mobile UX**. Dilarang memberi label FINAL sebelum lulus. Lihat `docs/RC34_RC2_DEADLOCK_FIXES_2026-11-08.md` dan `docs/RC34_RC3_RESPONSE_POSTMATCH_FIXES_2026-11-08.md` serta `docs/RC34_RC4_MANA_TUNEUP_POOL_FIXES_2026-11-08.md`.

## RC5 Mana Transport Staging (9 November 2026)

- Mana draft, Surge dan biaya tambahan discard Response dipilih di browser tanpa gameplay WebSocket per klik. Tekan PAY mengirim satu transaksi final ke server RC34 untuk divalidasi.
- Animasi Mana berjalan *setelah* pengiriman, bukan menghalangi konfirmasi PAY.
- Antrean sampai 4 gameplay intent dihapus; aksi baru saat ACK sebelumnya belum selesai ditolak dengan pesan terlihat.
- `npm run test:mana-transport` memeriksa adapter browser kedua seat, validasi UID/Surge, serta transaksi Response tambahan pada engine RC34 asli.
- Untuk diagnostik lama buka `/battle/?pvpPerf=1`; `lastManaOpenPaintMs` membantu mengamati jeda PLAY hingga modal pembayaran muncul.
- **Harus diuji setelah deploy:** kedua pemain dalam dua browser/HP, Mana matching Color, Magical Surge, kartu Response dengan biaya tambahan, serta performa latency sebenarnya.
- RC5 tetap staging, jangan sebut FINAL sebelum tes gameplay hosted selesai.
