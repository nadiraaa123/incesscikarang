# Paket Produksi Video Pitching — Rantang Terang

Final Submission Babak Penyisihan **Web In Action (WIA) 2026** · Tim **Incess Cikarang** · President University
Target durasi: **4:50** (maks. panitia 5:00) · 1920×1080 · 30 fps · Bahasa Indonesia

> **Status keluaran.** Draf video **tanpa narasi dan tanpa musik** (`RantangTerang_draft_tanpa_narasi.mp4`, 4:50) sudah dirakit dari rekaman layar aplikasi yang sungguh berjalan, kartu profil tim, dan subtitle Bahasa Indonesia yang ditanam di video. Narasi belum ada karena tidak tersedia text-to-speech, dan suara anggota tim sendiri lebih tepat untuk pitching. Musik berlisensi juga belum ada. Keduanya perlu ditambahkan tim (lihat §8).

---

## 1. Konsep kreatif

**“Satu laporan, dari HP orang tua sampai selesai.”**
Video mengikuti **satu laporan nyata yang dibuat di aplikasi** (nomor **RT-261110-0027**, kategori *Porsi makanan*, sekolah fiktif *SD Uji Coba 1*). Laporan ini berpindah dari orang tua ke petugas sekolah, Mitra SPPG, lalu kembali ke orang tua. Dua cabang, yaitu penolakan dan eskalasi, ditampilkan dengan **laporan contoh yang berbeda** agar alur utama tidak membingungkan.

Urutan yang dipertahankan: **Perkenalan tim → Introduction → Demo → Sorotan fitur → Rencana pengembangan.**

Bahasa visual:
- Palet hijau daun `#1F5E3B`, krem `#FAF7F0`, kuning kunyit `#D99A1E`; font Plus Jakarta Sans.
- Rekaman layar menjadi bukti utama. Kartu teks hanya dipakai untuk pembuka, rangkuman, dan penutup.
- Pita bawah tetap (y ≥ 940 px) memuat subtitle, label peran, dan label jenis rekaman, sehingga **tidak pernah menutupi tombol atau status**.
- Label peran di setiap pergantian akun: ORANG TUA · PETUGAS SEKOLAH · MITRA SPPG · PUBLIK (TANPA LOGIN).
- Label kejujuran di setiap klip demo: *“Rekaman layar aktual · ukuran layar HP disimulasikan di browser · Data demo”* atau *“… tampilan desktop · Data demo”*.

## 2. Storyboard

Kolom: **TC** = timecode · **Peran** · **Visual / aksi pengguna** · **Respons sistem** · **Narasi (ringkas, lengkap di §3)** · **Teks layar** · **Transisi** · **Aset**

| TC | Peran | Visual / aksi pengguna | Respons sistem | Narasi | Teks layar | Transisi | Aset |
|---|---|---|---|---|---|---|---|
| 00:00–00:05 | — | Logo, “Incess Cikarang”, “President University” | — | “Kami adalah Incess Cikarang…” | Web In Action 2026 · Final Submission | Fade-up masuk | `s1-tim`, logo |
| 00:05–00:11 | — | Kartu profil 01: foto Helen, nama, role | — | “…Helen Stephanis Simarmata sebagai Business Analyst,” | Helen Stephanis Simarmata · Business Analyst | Fade-up, keluar ke atas | foto berkacamata |
| 00:11–00:17 | — | Kartu profil 02: foto Dian | — | “Dian Theresia Girsang sebagai Project Manager,” | Dian Theresia Girsang · Project Manager | sama | foto tanpa kacamata & tanpa kerudung |
| 00:17–00:23 | — | Kartu profil 03: foto Nadira | — | “dan Nadira Khumaira Putri sebagai Frontend & Backend.” | Nadira Khumaira Putri · Frontend & Backend | sama | foto berkerudung |
| 00:23–00:30 | — | Tiga profil berjajar | — | “Bersama, kami membangun Rantang Terang…” | Nama + role ketiganya | Fade-up | ketiga foto |
| 00:30–00:37 | — | Logo + nama produk + definisi | — | Definisi: aplikasi web mobile-first, MBG | Aplikasi web mobile-first… MBG | Crossfade | `s2-intro` |
| 00:37–00:47 | — | 4 kartu kebutuhan muncul bergantian | — | Kebutuhan orang tua, saluran laporan, tindak lanjut, publik | Empat kebutuhan pengguna | Muncul bertahap | — |
| 00:47–00:55 | — | Diagram alur 5 langkah | — | Menyebut SPPG = Satuan Pelayanan Pemenuhan Gizi | Informasi → Laporan → Verifikasi → SPPG → Publik | Fade-up | — |
| 00:55–01:00 | — | Pesan utama + tema/subtema | — | “Setiap laporan tercatat…” | Tema & subtema proposal | — | — |
| 01:00–01:04 | ORANG TUA | Halaman Masuk → ketuk akun demo *Orang tua SD* | Masuk ke beranda “Halo, Raka” | “Kita ikuti laporan Raka…” | Masuk lewat HP · SD Uji Coba 1 (fiktif) | Potong langsung | klip A |
| 01:04–01:14 | ORANG TUA | Gulir ke Menu hari ini & Perjalanan makanan | Menu, gizi, langkah dapur → piring | Menu & perjalanan makanan | Menu, gizi & perjalanan makanan | Gulir halus | klip A |
| 01:14–01:20 | ORANG TUA | Ketuk **Buat laporan** → ketuk **Kirim laporan** saat kosong | Pesan galat “Pilih salah satu kategori laporan.” | Validasi kolom wajib | Validasi kolom wajib | — | klip A |
| 01:20–01:32 | ORANG TUA | Pilih *Porsi makanan*, ketik deskripsi, tanggal hari ini, ketuk **Galeri** | Penghitung karakter; “Foto siap dikirim” | Isi laporan; foto opsional, gambar contoh | Kategori, deskripsi, tanggal, foto | — | klip A, `bukti-contoh.jpg` |
| 01:32–01:41 | ORANG TUA | Ketuk **Kirim** → **Tetap kirim laporan baru** | Peringatan “Kamu sudah pernah mengirim laporan serupa” | Peringatan bantu, bukan penolakan | Kemungkinan duplikat | — | klip A |
| 01:41–01:45 | ORANG TUA | — | **RT-261110-0027 · Menunggu Verifikasi** | Nomor & status | Nomor laporan unik | — | klip A |
| 01:45–02:04 | PETUGAS SEKOLAH | Antrean verifikasi → buka RT-261110-0027 → **Terverifikasi** → urgensi **Normal** → **Teruskan ke SPPG** | Toast status; riwayat bertambah | Pemeriksaan, verifikasi, urgensi, teruskan | (label peran) | Potong; dipercepat 1,4× | klip B |
| 02:04–02:10 | ORANG TUA | Buka laporan lain berstatus **Ditolak** | Kotak *Alasan penolakan* terlihat pelapor | Cabang penolakan | Cabang · laporan berbeda · Ditolak + alasan | Potong; 1,4× | klip E2 |
| 02:10–02:27 | MITRA SPPG | Dasbor SPPG → buka laporan → **Tandai Dalam Penanganan** → tulis tanggapan → **Simpan** | Status Dalam Penanganan; tanggapan masuk riwayat, laporan asli tetap | Tanggapan tidak mengubah laporan asli | (label peran) | Potong; 1,56× | klip C |
| 02:27–02:38 | PETUGAS SEKOLAH | **Tandai Selesai** + hasil penyelesaian | Status Selesai | Petugas menutup laporan | (label peran) | Potong; 1,64× | klip C2 |
| 02:38–02:52 | PETUGAS SEKOLAH | Monitoring Eskalasi → kasus *Kondisi penerima manfaat* urgensi **Tinggi** | Penanggung jawab (Petugas, SPPG, Puskesmas Uji Coba), riwayat, status **Diteruskan ke Pihak Kesehatan Terkait** | Kasus terpisah; tidak memberi diagnosis | (label peran) | Potong | klip D |
| 02:52–03:10 | ORANG TUA | Riwayat → RT-261110-0027 → gulir | Hasil penyelesaian, tanggapan SPPG, timeline | Pelapor memantau | Hasil penyelesaian · Tanggapan SPPG & timeline | Potong | klip E |
| 03:10–03:35 | PUBLIK | /transparansi tanpa login (90 hari) | 21 masuk · 16 terverifikasi · 6 dalam penanganan · 10 selesai · 63% | Angka, kategori, grafik, definisi | (label peran) | Potong; diperlambat 0,64× | klip F |
| 03:35–04:08 | — | 6 kartu fitur dengan potongan layar demo | — | Rangkuman manfaat | Fitur 01–06 + manfaat | Fade-up bergantian 5,5 dtk | `s3-fitur` |
| 04:08–04:15 | — | Montage desktop/tablet/HP | — | Responsif | Responsif di HP, tablet, dan desktop | Fade-up | tangkapan 390/820/1440 px |
| 04:15–04:39 | — | 3 kartu rencana | — | Tiga rencana (dinyatakan sebagai rencana) | Rencana pengembangan; “belum tersedia…” | Muncul bertahap | `s4-rencana` |
| 04:39–04:50 | — | Logo + pesan penutup | — | Pesan penutup + terima kasih | Rantang Terang — setiap laporan… | Fade | logo |

## 3. Naskah voice-over

Lihat **`naskah-vo.txt`** (v2: 55 baris, 358 kata, gaya storytelling, ≤ 5 suku kata/detik). Subtitle `subtitle-id.srt` dan subtitle di video memakai teks dan waktu yang sama. Kolom *Narasi* di storyboard di atas merangkum isi v1; teks yang berlaku adalah `naskah-vo.txt`. Audio dan lisensi musik: lihat `AUDIO-DAN-LISENSI.md`.

## 4. Komposisi profil tim

Pemetaan foto mengikuti **ciri penampilan** dari pemilik, bukan urutan lampiran. Pada lampiran, foto ke-2 adalah foto berkerudung dan foto ke-3 adalah foto tanpa kacamata dan tanpa kerudung:

| Urutan tampil | Foto (ciri) | Nama | Role | Crop (object-position) |
|---|---|---|---|---|
| 01 | Berkacamata, tanpa kerudung | Helen Stephanis Simarmata | Business Analyst | 55% 50% |
| 02 | Tanpa kacamata, tanpa kerudung | Dian Theresia Girsang | Project Manager | 50% 40% |
| 03 | Berkerudung | Nadira Khumaira Putri | Frontend & Backend | 48% 50% |

- **Kartu tunggal (00:05–00:23):** kartu putih 1440×680 px di tengah; foto persegi 560×560 px berbingkai hijau muda di kiri; di kanan ada label “0X · Anggota tim” (kunyit), nama 76 px ExtraBold dalam dua baris, dan role dalam pil hijau. Masuk dengan fade + naik 28 px (0,8 s), keluar dengan fade ke atas.
- **Komposisi bertiga (00:23–00:30):** tiga kartu 520 px berjajar; foto 440×440 px; nama 36 px; role dalam pil.
- Crop persegi memakai tinggi penuh foto, sehingga wajah utuh dan tidak terpotong. Foto tidak diedit; kacamata, kerudung, dan pakaian tetap asli.
- Keterangan ciri **tidak** muncul di video.

## 5. Daftar rekaman layar & aset (urutan video)

Semua rekaman berasal dari **build lokal repositori ini dalam mode demo** (data contoh di browser, tanpa server). Tidak ada laporan atau notifikasi yang terkirim ke sekolah, SPPG, atau fasilitas kesehatan nyata.

| # | Klip | Peran / tampilan | Isi | Jenis |
|---|---|---|---|---|
| A | `A-ortu-lapor` 46 s | Orang tua · 390×844 @2× (simulasi HP) | Masuk → beranda → menu & perjalanan → validasi → isi laporan → duplikat → terkirim | **Rekaman aktual** |
| B | `B-petugas-verifikasi` 30 s | Petugas · 1280×720 @1,5× | Antrean → verifikasi → urgensi Normal → teruskan ke SPPG | **Rekaman aktual** |
| E2 | `E2-ortu-ditolak` 9 s | Orang tua · HP | Laporan contoh berstatus Ditolak + alasan | **Rekaman aktual dari data contoh bawaan** (penolakannya tidak dilakukan langsung di rekaman) |
| C | `C-sppg-tanggapan` 30 s | Mitra SPPG · desktop | Dalam Penanganan + tanggapan | **Rekaman aktual** |
| C2 | `C2-petugas-selesai` 21 s | Petugas · desktop | Tandai Selesai + hasil | **Rekaman aktual** |
| D | `D-eskalasi` 14 s | Petugas · desktop | Monitoring Eskalasi, kasus urgensi Tinggi | **Rekaman aktual dari data contoh bawaan** |
| E | `E-ortu-pantau` 20 s | Orang tua · HP | Riwayat → detail → hasil → tanggapan → timeline | **Rekaman aktual** |
| F | `F-publik` 16 s | Publik · desktop | Dashboard transparansi | **Rekaman aktual** |
| — | `r-hp/r-tab/r-desk.png` | 390 / 820 / 1440 px | Dasbor sekolah publik | Tangkapan layar aktual |
| — | `s1`–`s4` | — | Kartu tim, intro, fitur, rencana | **Ilustrasi/grafis** (bukan fitur aplikasi) |
| — | `bukti-contoh.jpg` | — | Gambar baki bertuliskan “GAMBAR CONTOH · DATA DEMO” | Ilustrasi |

Tidak ada adegan **“Simulasi alur”**: semua langkah demo benar-benar dijalankan di aplikasi. Yang perlu diketahui juri: cabang penolakan dan eskalasi memakai laporan contoh bawaan, bukan laporan yang ditolak atau dieskalasi di depan kamera.

Cara merekam ulang ada di `produksi/`. Jalankan `npm run build && npx vite preview --port 4173`, salin foto tim ke `produksi/scenes/img/{1,2,3}.webp` beserta `logo.png`, lalu jalankan `node clipA.cjs`, `node clipB.cjs`, `node clipC.cjs C|C2|D|E|E2|F`, `node rec-scenes.cjs`, dan `python3 compose.py seg burn`. Nomor laporan dan angka dasbor bergantung pada tanggal perekaman; jika direkam ulang, perbarui `vo.json` dan `steps.json`.

## 6. YouTube

**Judul**
`Rantang Terang — Pantau Laporan MBG dari Kirim sampai Selesai | Incess Cikarang · WIA 2026`

**Deskripsi**
```
Rantang Terang adalah aplikasi web mobile-first untuk mendukung pemantauan layanan Makan Bergizi Gratis (MBG). Orang tua dapat melihat informasi makanan dan mengirim laporan terstruktur. Petugas sekolah memverifikasi laporan, SPPG (Satuan Pelayanan Pemenuhan Gizi) menindaklanjuti, dan publik melihat perkembangan melalui dashboard berdata agregat.

Setiap laporan tercatat, ditindaklanjuti, dan dapat dipantau.

Karya tim Incess Cikarang (President University) untuk Final Submission Babak Penyisihan Web In Action 2026.
Tema: Designing Digital Futures – Powering Public Transparency
Subtema: Civic Reporting & Accountability, didukung Public Service Tracking

👩‍💻 Tim
• Helen Stephanis Simarmata — Business Analyst
• Dian Theresia Girsang — Project Manager
• Nadira Khumaira Putri — Frontend & Backend

✨ Fitur utama
• Informasi makanan: menu, kandungan gizi, dan perjalanan makanan
• Laporan terstruktur: 5 kategori, deskripsi, tanggal kejadian, foto bukti opsional, nomor laporan unik
• Penanda kemungkinan duplikat sebagai bantuan pemeriksaan (bukan penolakan otomatis)
• Verifikasi petugas: Terverifikasi atau Ditolak dengan alasan yang terlihat oleh pelapor
• Urgensi Normal/Sedang/Tinggi dan Monitoring Eskalasi dengan penanggung jawab serta riwayat status
• Tanggapan SPPG yang tidak mengubah laporan asli
• Riwayat laporan untuk pelapor: status, tanggapan, hasil penyelesaian
• Dashboard transparansi publik tanpa login, hanya data agregat
• Tampilan responsif untuk HP, tablet, dan desktop

🛣️ Rencana pengembangan
1. Uji coba bersama sekolah dan pengguna
2. Penjajakan integrasi dengan layanan resmi yang relevan melalui kerja sama
3. Perluasan akses: bahasa daerah dan mode hemat kuota

⏱️ Bagian video
00:00 Perkenalan tim
00:30 Apa itu Rantang Terang?
01:00 Demo: orang tua membuat laporan
01:45 Demo: verifikasi petugas
02:10 Demo: tindak lanjut SPPG & eskalasi
02:52 Demo: pelapor memantau hasil
03:10 Demo: dashboard publik
03:35 Sorotan fitur
04:15 Rencana pengembangan

🔗 Tautan
Aplikasi: [ISI TAUTAN APLIKASI]
Repositori: [ISI TAUTAN REPOSITORI]

Catatan: Rantang Terang adalah proyek independen, bukan layanan resmi pemerintah. Sekolah, akun, laporan, dan gambar dalam video adalah data demo fiktif. Aplikasi membantu pencatatan dan tindak lanjut laporan; aplikasi tidak memberikan diagnosis medis.

#WebInAction2026 #MIA2026 #RantangTerang #MBG #TransparansiPublik
```

## 7. Pemeriksaan akhir

| Butir | Status | Catatan |
|---|---|---|
| Durasi ≤ 5:00 | ✅ 4:50,00 (diukur dengan ffprobe) | Narasi wajib tetap di dalam timecode; jangan menambah intro atau outro. |
| Urutan wajib | ✅ | Tim → intro → demo → fitur → rencana |
| Nama & role (guidebook) | ✅ | Ejaan **Simarmata** dipakai di kartu, naskah, dan deskripsi. Proposal masih menulis “Simamarta”. |
| Pemetaan foto | ✅ berdasarkan ciri | **Perlu dicek tim**: urutan lampiran berbeda dari tabel (lihat §4). |
| Demo fitur utama | ✅ | Lapor → verifikasi → SPPG → selesai → riwayat → publik, plus cabang tolak & eskalasi |
| Rencana pengembangan | ✅ | Dinyatakan sebagai rencana; tidak ada klaim kemitraan |
| Deskripsi YouTube | ✅ draf | Isi dua placeholder tautan, atur **Publik**, unggah `subtitle-id.srt` |
| Privasi | ✅ | Sekolah fiktif, akun demo, gambar bukti bertanda contoh. Dashboard hanya agregat. SPPG melihat laporan tanpa identitas pelapor. Tidak ada foto anak. |
| Klaim | ✅ | Tidak ada statistik nasional, skor performa, atau klaim diagnosis/integrasi resmi |
| Konsistensi angka | ✅ | Nomor RT-261110-0027 dipakai di semua adegan. Dasbor 90 hari: 21 / 16 / 6 / 10 / 63% (6 + 10 = 16; persentase = selesai ÷ terverifikasi). |
| Musik | ✅ | Komposisi orisinal, crossfade, ducking (lihat `AUDIO-DAN-LISENSI.md`) |
| Narasi | ❌ belum | Naskah v2 dan pipeline mixing siap; suara belum ada |

## 8. Yang masih harus dikerjakan tim

1. **Rekam narasi** per bagian dari `naskah-vo.txt` (ideal: tiap anggota membawakan bagiannya sendiri), lalu tempatkan sesuai timecode di editor (CapCut, DaVinci Resolve, atau Premiere).
2. Tambahkan **musik berlisensi** (misalnya YouTube Audio Library) di −20 sampai −25 dB di bawah narasi, dengan ducking saat narasi.
3. Jika subtitle diunggah sebagai caption YouTube, pertimbangkan render versi tanpa subtitle tertanam agar teks tidak tampil dua kali.
4. Pastikan versi **situs yang di-deploy** sama dengan build yang direkam. Juri akan membuka tautan aplikasi.
