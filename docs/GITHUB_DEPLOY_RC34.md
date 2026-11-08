# Cara deploy Grandis Legacy PvP Season 0 RC34 (GitHub RC1)

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
git switch -c s0-rc34-github-rc1
# Hapus file tracked versi RC32 pada branch staging (direkam oleh Git).
git rm -r -- .
# Salin SELURUH ISI folder hasil ekstraksi RC34 ke folder ini,
# termasuk .github/ dan file dotfiles, tetapi JANGAN copy folder .git lain.
git add -A
git commit -m "PvP S0 RC34 GitHub RC1 optimized staging"
git push -u origin s0-rc34-github-rc1
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

Di Northflank, buat **Combined Service** dari repo `GrandisLegacyTCG/Grandis-Legacy-PvP-Trial` dan branch staging `s0-rc34-github-rc1`.

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

1. Buka `https://<subdomain-host>/health` dan pastikan `ok:true`, `buildId=gl-s0-rc34-github-rc1-2026-11-08`, serta `authoritySources` terisi.
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
