# GRANDIS LEGACY — VS AI SEASON 0
# DEV NOTES 01–20 — DEVELOPMENT DECISIONS & HANDOFF

**Checkpoint:** v1.0 RC21 · **Tanggal:** 2026-11-05 · **Status:** RELEASE CANDIDATE (belum FINAL)

## Cara membaca dokumen

Dokumen ini mengumpulkan **20 pokok keputusan/pengerjaan development** dari catatan pembangunan VS AI Season 0 sebelumnya sampai RC20, ditambah keputusan UI terakhir yang dipasang di RC21. **Penting:** arsip sumber yang tersedia memakai penanda *STAGE*, *RC3–RC20*, serta **OSA DEV45**; tidak tersedia rangkaian log terverifikasi dengan nama *VS AI DEV1, DEV2, …, DEV20* sebagai build yang masing-masing terpisah. Karena itu **DEV-01 … DEV-20 di bawah adalah indeks topik rekap**, **BUKAN klaim bahwa perbaikan tersebut terjadi tepat pada build historis berangka DEV yang sama**. Kronologi aktual dan QA untuk tiap perubahan ada di `docs/TAKEOVER_NOTE.md` dan `docs/qa/`.

**Authority**: OSA Season 0 DEV45 untuk data kartu, Player Rulebook v2.9 dan Machine Rules yang berlaku untuk aturan, VS AI v6.91.9 sebagai baseline engine/UI; tidak menimpa canonical OSA atau Deck Builder. Keputusan desainer eksplisit pada kasus ambigu dicatat di sini untuk mencegah salah tafsir berulang.

---

## DEV-01 — Arsitektur dan sumber data resmi (STAGE 3–9)
- VS AI S0 memakai satu kode game yang diturunkan dari VS AI S1 v6.91.9, bukan aplikasi OSA opsional.
- Sumber statistik/teks/subtype/Artwork/Rank/Hero Lineage/Starter S0 adalah **OSA S0 DEV45**. Tidak boleh menebak angka S0 dari kartu bernama sama di Season 1.
- Deck Builder v1.58 adalah **referensi UI Review/import**, bukan authority untuk mengubah angka kartu.
- File otoritas `engine/js/static-data.js` dan adapter runtime merupakan consumer hasil integrasi; sumber OSA dan proyek lain tetap read-only.

## DEV-02 — Katalog card, art dan Starter Deck (STAGE 3–9)
- Inventory utama: **155 Skill, 20 Item, 12 Event, 45 Hero, 10 Legacy = 242 kartu non-Mana**; 6 wajah Mana di luar daftar itu. Jumlah 248 bila wajah Mana ikut dihitung.
- Lima S0 starter, pola Main Deck 50, Mana Deck 12 dan formasi tiga Hero/Legacy direkonsiliasi ke metadata S0. Jangan mencampur count kartu fisik dengan kartu baru hanya karena gambar tersedia.
- File manifest, audit ID silang dan `docs/qa/RC8_ALL_242_CARD_RUNTIME_INVENTORY.csv` tersedia untuk penelusuran.

## DEV-03 — Deck Import dan struktur deck (RC12–RC15)
- Impor JSON dari **Deck Builder v1.58**, bentuk `deck` bersarang dan bentuk ekspor flat ditangani oleh VS AI.
- Hero rank progression lengkap dan validasi Rank/Class/Lineage dipertahankan; import bukan bypass untuk syarat deck.
- Jangan mengubah JSON kartu canonical atau menambahkan duplikasi Hero hanya agar import lolos.

## DEV-04 — Mana, Draw, Resource dan biaya (RC3–RC15)
- Resource tampak untuk pemain: **Mana Shard**, berwarna Warrior merah, Mage biru, Archer hijau, Cleric putih, Thief kuning. Nama internal legacy `kind:'CLASS'`/`class_name` **boleh tetap** untuk kompatibilitas engine.
- Mana Pool/player-hand animasi hanya representasi kartu yang benar-benar ada; biaya dan reservation tidak boleh dieksekusi dua kali.
- Skill CONDITION harus dapat dipenuhi **sebelum PLAY/PAY**. Bayar Mana dan biaya tambahan sebagai satu komit yang sah; cancel tidak boleh mengonsumsi resource.

## DEV-05 — Class/Rank/Lineage dan Hero-to-Legacy (RC3–RC14)
- Skill hanya legal jika mengikuti Class, lineage, Rank serta owner restriction yang benar, termasuk kelas campuran.
- Hero menjadi Legacy melalui prosedur defeat yang sah; HP overlay dan efek Hero biasa tidak ditampilkan sebagai `0/0` di Legacy Mode.
- Regresi targeted lineage **6.975 kasus** dan target selection 13/13 dicatat, tetapi itu bukan bukti semua pertarungan manual bebas bug.

## DEV-06 — Penetapan UI Skill / Card Review (RC13, RC15–RC20)
- Kartu Skill, Hero, Item, Event, Legacy menggunakan **renderer Review Deck Builder v1.58**, dengan data kartu tetap dari OSA S0.
- Satu popup review berisi art kiri, metadata kanan, effect row dan rule; tidak boleh ada dua container / modal tumpuk.
- **Background panel detail gelap adalah desain yang memang dipertahankan.** Yang harus hilang adalah **frame abu-abu ekstra, border, strip kosong bawah, dan gray canvas pada sudut**. RC20 memperbaiki iframe internal `color-scheme:light`, `body::before`, border dan tinggi terukur—**jangan kembalikan pengaturan iframe `color-scheme:dark`**.
- Popup mengikuti viewport dengan lebar maksimal **1120 px**; iframe harus mampu bergulir jika konten melebihi tinggi layar. Perubahan besar pada parent `body`/overlay dilarang tanpa regression viewport.
- RC21: **Review Hero di Lobby langsung memakai tata letak Deck Builder + footer HERO LINEAGES Rank I/II/III**. Pemilih tiga art besar di modal terpisah tidak lagi dibuka. Footer hanya untuk entry dari Lobby, bukan semua Card Review Battlefield.

## DEV-07 — Class Ability Bard dan Maestro (RC12, RC15–RC16)
- Bard: `Prolonged Symphony`; Maestro: `Orchestral Crescendo`. Pemilihan discard/draw Hand menggunakan **center-stage tanpa kotak tambahan** + fokus gelap menyeluruh.
- Hand card mana yang akan di-Discard dapat dipilih/dibatalkan sesuai mekanik Bard. Aksi tombol UI `DISCARD & DRAW` / `SKIP` mengikuti kondisi engine, bukan shortcut menukar kartu lain.
- Discard **Zol** merah, **Lun** biru, **Vae** kuning dan efek return ke Main Deck harus mengikuti CONDITION dan shuffle sesuai teks/rules.

## DEV-08 — Arbalest dan Grand Arbalest (RC21)
- Arbalest Rank II `Quick Reload` dan Grand Arbalest Rank III `Rapid Chamber`: gunakan **foreground centered card + layar 65% gelap** seperti gaya Bard/Maestro, **bukan mekaniknya**.
- **HANYA satu kartu yang baru di-draw** tampil di tengah; **tidak seluruh Hand**. Kartu itu fixed, **tidak boleh selectable/deselectable**; hanya `KEEP CARD` atau `SHUFFLE & REDRAW`.
- Shuffle/redraw, Draw Phase continuation, `Draw This Turn`, pembatasan sekali pakai/turn dan efek pasif Rapid Chamber ditangani engine asli—jangan buat mekanik ganda di UI.
- Ketika keputusan center-stage aktif, sembunyikan tombol keputusan lama Hero (`SKIP`/`REDRAW`) agar tidak muncul pilihan duplikat.

## DEV-09 — Casting, lock target dan animasi (RC9–RC12, RC20)
- Saat mulai Casting tampil **counter 0**. Penambahan counter pada owner's End Phase, pemeriksaan release pada Battle Phase sesuai aturan/keputusan khusus tiap Skill.
- Casting mengunci **posisi target**, bukan otomatis mengikuti identitas Hero yang swap.
- Ketika dua+ Casting aktif, visual per Casting: pertama **ungu**, kedua **toska**, ketiga **oranye**. Warna Attachment sumber dan area target konsisten, tidak mengubah damage/timer/target game.
- Runeforged Burst dan Double Casting punya timing khusus; jangan melakukan refactor global tanpa menguji card-specific behavior.

## DEV-10 — Enam negative Status, durasi dan cleanse (audit ARC, THF, CLE)
- Status dasar negatif: **Bleed, Burn, Freeze, Poison, Sleep, Stun**. Aplikasi status bertambah dengan batas **maksimal enam counter** sesuai helper S0; jangan campur durasi status dengan timer Attachment.
- **Sleep** termasuk status yang dapat dibersihkan dengan Purify/Elixir/Saint, tetapi masih memiliki pembatasan gameplay selama berlangsung.
- **Purify** (`S0-CLE-003`) mewajibkan target negatif yang legal dan pemilihan status sesuai aturan sebelum Mana dibayar; jangan asal menghapus buff/status positif.
- Tampilan negative Status menghitung mundur; *timed non-Casting Attachment* menampilkan elapsed count-up sejak 0, dengan aturan Casting terpisah.

## DEV-11 — Poison Vial: RULE FINAL, jangan keliru lagi (RC19)
- Card ID **`S0-ITM-011` Poison Vial**. Kalimat resmi: “That Hero's Physical Attack card will inflict Poison for 2 turns.”
- **`Physical Attack` pada kalimat tersebut adalah CARD SUBTYPE**, **bukan `Physical damage`**. HANYA **Skill Card subtype `Physical Attack`** eligible.
- `Area Attack` yang menghasilkan Physical damage **TIDAK eligible**. Magical Attack, Casting Attack, dan Attack subtype lain juga tidak eligible, sekalipun angka damage bertipe Physical.
- Perbaikan aplikasi RC19 menggunakan subtype (cek `attackLabelQualifies`) setelah desainer secara eksplisit membatalkan asumsi sebelumnya bahwa Physical Area boleh combo.
- **Pintu interpretasi yang masih terbuka**: apakah Poison butuh HP target benar-benar berkurang (`primaryHpDamage > 0`)? Handler saat ini menggunakan gate itu; teks kartu tidak eksplisit, belum ada keputusan final yang mengizinkan mengubah gate. **Jangan diam-diam ganti.**

## DEV-12 — Physical/Magical Attack, Area, dan Keyword (audit ARC/WAR/MAG)
- Card Subtype (`Physical Attack`, `Area Attack`, `Magical Attack`, `Casting Attack`, dll.) berbeda dari **Damage Type** (`Physical`/`Magical`). Klasifikasi subtype menentukan keyword combo seperti Poison Vial.
- Keyword melee/range/piercing, SURE HIT, block/dodge/negate, damage reduction dan effects harus merujuk ke target legal aktual.
- Area Attack menyentuh beberapa lane sesuai properti kartu, tetapi tidak otomatis berubah subtype menjadi Physical Attack ketika damage-nya physical.
- Contoh yang diperiksa: Deflect/Runic Guard, Primal Strike, Aura Infusion Bolt, damage type 96 Skill Attack; audit terfokus, bukan semua efek battle playtested.

## DEV-13 — Racial Traits dan kemampuan class khusus (RC3–RC16)
- Stoneblood, Primal Strike, Ancestral Focus, Human Ambition, Hero ability dan Racial Token tetap mengikuti text/phase masing-masing.
- Mana yang diberikan Traits, EXP/rank bonus, dan ability AI harus terhubung ke Hero sumber yang benar; bukan nama visual semata.
- Tooltip `!`, class/racial/legacy buttons dan label `Draw This Turn` khusus Arbalest harus diperbarui berdasarkan state sah, tanpa membuat action tersedia di phase yang salah.

## DEV-14 — Mandatory vs optional Swap (RC17)
- Source-based audit menemukan **`Shield Charge S0-WAR-030`** terlewat, serta `Charge Attack S0-WAR-015` dan `Heroic Charge S0-WAR-025` memberi tombol `Do Not Swap` padahal text memerintah `Swap`.
- Warrior tiga Attack di atas **wajib Swap** jika koneksi Hit dan partner posisi legal; DODGE dan Freeze/Stun/legal-target bisa mencegah bila sah.
- Thief yang tertulis `You may swap` tetap **optional**. Soul Blast Shot forced swap ketika connected Hit tidak boleh Skip.
- Pertukaran membawa Hero identity/status/Attachment dan memperhatikan slot Hero/Legacy; jangan memaksa Swap di luar syarat kartunya.

## DEV-15 — Combat Response, Defense Skill dan Protection Item (RC15, RC19)
- **Attack arrow:** Hero penyerang → Hero target.
- **Defense Skill / Protection Item arrow:** **Card Played → Hero yang dilindungi**; bukan menuju attacker. Berlaku Player maupun AI, Response berantai.
- Protection Item Chain Mail harus satu arah, tidak menggandakan visual kartu pada target dan attacker.
- Block, Dodge, Negate, Shield Charge, Reflection dan sumber Response diselesaikan engine, tidak boleh berubah hanya akibat UI arrow.

## DEV-16 — Event dan Utility Item arrow: mapping desainer (RC20)
- Event: `Begin Anew` **tanpa panah** karena Hand + Main Deck; `Market Bargain` → Main Deck sendiri; `Forged Alliance` → Racial Token sendiri; `Déjà Vu` → Discard Pile sendiri.
- Utility Item: `Magic Scope` → Hand lawan; `Crystal Ball` + `Magic Compass` → Main Deck sendiri.
- **Kartu lainnya yang sudah memiliki panah dipertahankan.** Jangan menciptakan panah global baru untuk Coordination Attack / Defensive Formation atau target fiktif Flashpowder Bomb hanya karena nama efek.
- Utility hanya membutuhkan panah bila ada target yang dapat diidentifikasi. Consumable Item diarahkan ke Hero pengguna/penerima; Buff diarahkan ke Hero yang benar-benar diberi Buff.

## DEV-17 — Ultimate Tribute & EXP (RC9–RC19)
- 15 Ultimate S0, masing-masing milik lineage pemilik; biaya Tribute **menggunakan Color Mana Shard cocok**, bukan angka printed Mana Skill biasa; menghasilkan **200 EXP**, bukan 100.
- Wrong Hero, wrong color dan missing shard harus ditolak sebelum komit. Targeting dan Rank Up terikat receiver Hero yang benar.
- Ada 30/30 regression Ultimate yang lulus pada fixture PLAYER/AI; tetap perlukan uji UI normal untuk final.

## DEV-18 — Layout Battlefield, scaling, Skill button & HP (RC15–RC21)
- Responsive Battlefield memakai scaling `app` dan viewport overlays sebagai BODY children. **Jangan** memindahkan semua overlay ke `documentElement`: percobaan RC17 menyebabkan regresi dialog; RC18 mengembalikannya.
- Card Review bagian luar dibatasi viewport; Mana AI disusun dari kanan ke kiri dengan tumpukan **kartu paling kiri di depan**.
- Button Hero/Skill dengan label panjang: **font label** diperkecil dalam hitbox tombol yang dikunci, jangan kecilkan art/kartu lain atau tumbuhkan tombol sampai menabrak Hero.
- HP Hero **tetap berada di luar physical Hero package** supaya tidak ikut ter-rotate saat Exhaust. Saat Response, Hero target harus mempunyai stacking priority terhadap Hero attacker dan HP bar target berada di atas kartu foreground lokal. RC21 memperkuat *target lane z-index*; perlu uji Firefox target/exhaust/adjacent.

## DEV-19 — Motion, feedback visual, focus modal (RC11–RC20)
- Animasi Hand/Deck/Discard/Mana Pool harus mengikuti kejadian authoritative dan tidak menduplikasi Draw atau Return.
- Poison end-phase upward, Burn on connected attack, Freeze hint before Dodge, Sleep reminders serta refleksi/INVINCIBLE VFX adalah feedback, bukan status damage ekstra.
- Bard/Maestro, Mana payment, opponent hand/shard, Magic Scope memakai center-stage dengan background dimmer viewport penuh, tanpa garis seam dari transform.
- Target arrow Event/Item + Casting colors visual-only; jangan mengedit rules hanya karena perbaikan animasi.

## DEV-20 — QA, release gate dan aturan update (RC3–RC21)
- **Source-based fix ≠ bukti semua playthrough PASS.** QA yang lulus mencakup Swap 40, Target 13, Ultimate 30, lineage 6.975, tetapi itu fixture/engine checks.
- RC21 sudah memverifikasi 3-card Hero Lineages, switching rank, one-card Quick Reload center-stage (nonselectable) dan beberapa suite engine melalui Chromium inline harness. **Tidak ada full match native Firefox hingga Game Over yang tervalidasi.**
- **Known pre-existing issues:** Brilliant Radiance vs Double Casting test failure dari RC19/RC20; beberapa historical self-tests memakai asumsi S1 lama. Jangan mengaku fixed tanpa reproduksi/approval.
- Rule implementasi: daftar issue dulu kecuali ada approval eksplisit; catat root cause, file yang diubah, QA/limit; tiap rilis ZIP satu root folder dan `docs/` lengkap. RC21 adalah Release Candidate, bukan FINAL.

---

## Keputusan FIXED / JANGAN DIUBAH TANPA PERSETUJUAN

| Kontrak | Keputusan final saat ini |
|---|---|
| Poison Vial | **SubType Skill `Physical Attack` saja; bukan semua Physical damage** |
| Physical Area Attack | Subtype `Area Attack` → Poison Vial **tidak boleh** |
| Attack arrow | Attacker Hero → target Hero |
| Defense arrow | Card Played → Hero yang dilindungi |
| Consumable Item | Card Played → Hero pengguna/penerima |
| Buff | Card Played → Hero penerima Buff |
| Begin Anew | Tidak ada panah |
| Event/Utility arrows | Ikuti daftar spesifik DEV-16; jangan ganti yang sudah ada |
| Casting 2+ | Ungu/toska/oranye, target posisi dan sumber sama warna |
| Bard/Maestro selection | Card Hand dapat dipilih sesuai mekanik discard/draw |
| Quick Reload/Rapid Chamber | **Hanya drawn card**, **nonselectable**, Keep/Shuffle-Redraw |
| Lobby Hero Review | Deck Builder v1.58 + HERO LINEAGES footer (3 ranks) |
| Card Review gray | **Extra gray frame wajib tidak ada**, bagian panel detail gelap tetap |
| Skill button panjang | Font menyesuaikan dalam tombol berukuran tetap |
| HP bar response | Tetap visible di atas card saat target focus |
| Warrior Swap mandatory | Charge Attack, Heroic Charge, Shield Charge setelah legal Hit |
| Thief optional Swap | Tetap optional jika card text menyatakan boleh |
| Status | Negative count-down, non-Casting timed Attachment elapsed count-up |
| Source authority | OSA S0 DEV45; tidak menyalin angka dari Season 1 |

## OPEN — memerlukan keputusan/QA terpisah

1. **Poison Vial Hit vs actual HP reduction**: apakah Poison berlaku pada connected hit dengan damage final 0? Jangan ubah tanpa ruling.
2. **Brilliant Radiance vs Double Casting**: pengujian foundation lama gagal di RC19–RC20; terpisah dari perbaikan UI RC21.
3. **Full Firefox gameplay run to Game Over** beserta targeted/exhausted HP bar z-index, nested Response, AI casting, item/event arrows.
4. **OSA artwork/text discrepancy** terkait nilai Health Potion/Greater Health Potion dan timing beberapa Casting/Runeforged yang pernah ditemukan; tidak boleh diperbaiki dengan asumsi.

**Dokumen dasar audit:** `docs/TAKEOVER_NOTE.md`, `docs/qa/rc14/RC14_QA.md`, `docs/qa/rc15/RC15_UI_QA.md`, `docs/qa/rc16/RC16_UI_QA.md`, `docs/qa/rc17/RC17_SWAP_AND_VIEWPORT_QA.md`, `docs/qa/rc19/RC19_QA.md`, `docs/qa/rc20/RC20_UI_QA.md`, `docs/qa/rc21/RC21_QA.md`. Lihat file masing-masing untuk rincian keterbatasan, bukan mengandalkan ringkasan ini sebagai full playable certification.
