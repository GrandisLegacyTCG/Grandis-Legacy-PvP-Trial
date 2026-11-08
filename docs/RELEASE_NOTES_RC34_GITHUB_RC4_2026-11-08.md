# Grandis Legacy PvP S0 RC34 — GitHub RC4 Release Notes

**Kode build:** `gl-s0-rc34-github-rc4-2026-11-08`

- Menurunkan jumlah WebSocket round-trip untuk Play Card dengan tepat satu Hero legal (PLAY+Hero selection server atomic). Tidak mengubah pilihan ketika beberapa Hero legal.
- Mempercepat pilihan dua Note Tune Up (S0-CLE-029): draft lokal, single server confirmation, validasi server ketat. Menampilkan alasan WHY? ketika tidak legal.
- Memindahkan opponent Mana Pool ke lapisan battlefield yang terlihat dan memberinya label; Mana musuh tetap face-down.
- Menghindari redraw battlefield tambahan sebelum network ACK; draft lokal tetap dirender.
- Mempertahankan fix RC1, RC2, RC3 termasuk Response, deadlock, controls touchscreen dan cleanup 60 detik.
- Tambahkan regression test integrated engine+adapter dan bukti layout desktop/mobile.

**QA:** npm check & engine 20/20; pengukuran latency nyata, dua-browser host, dan full match belum diverifikasi.

**Known issues tetap terbuka:** mobile lobby parity; Coin Flip/Back-of-Card opening presentasi; E2E mobile/touch dan lag riil hosting. **Bukan FINAL / PUBLIC READY.**
