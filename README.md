# Rantang Terang

**Dari dapur sampai piring, terbuka untuk semua.**

Rantang Terang adalah web app mobile-first untuk warga memantau Makan Bergizi Gratis (MBG) di sekolah: orang tua dan siswa melaporkan kondisi anak dan menilai menu, petugas sekolah mencatat makanan yang tiba, SPPG menanggapi masukan tanpa bisa menghapus laporan asli, dan publik melihat dasbor mutu tiap sekolah tanpa akun.

Karya tim **Incess Cikarang** untuk **Web In Action – Multimedia In Action 2026**.
Tema: *Designing Digital Futures – Powering Public Transparency* · Subtema: *Civic Reporting & Accountability* (didukung *Public Service Tracking*).

> Proyek independen, bukan layanan resmi pemerintah. Data sekolah, akun, laporan, dan foto pada versi ini adalah **contoh untuk demo**. Statistik nasional di Beranda memakai data resmi beserta sumber dan tanggalnya.

**Demo online:** _[(https://rantangterang.vercel.app/)]_

---

## Tech stack

| Bagian | Teknologi |
|---|---|
| Frontend | React 19 + TypeScript, Vite |
| Routing | React Router |
| Styling | Tailwind CSS (desain mobile-first, font Plus Jakarta Sans) |
| Grafik | Recharts |
| Ikon | lucide-react |
| Data — mode demo (default) | localStorage + data contoh (`src/lib/seed.ts`, `src/lib/seed-pengaduan.ts`) |
| Data — mode online | Supabase (PostgreSQL, Auth, Storage) — skema, RLS & fungsi server di `supabase/schema.sql`, aktif bila env `VITE_SUPABASE_*` diisi |
| Deploy | Vercel (`vercel.json` sudah menyiapkan rewrite untuk SPA) |

## Cara menjalankan

```bash
git clone https://github.com/nadiraaa123/incesscikarang.git
cd incesscikarang
npm install
npm run dev        # buka http://localhost:5173
```

Build produksi: `npm run build` lalu `npm run preview`.

Tanpa `.env`, aplikasi berjalan dalam **mode demo** (data contoh di browser). Lihat bagian *Supabase* di bawah untuk mode online.

### Akun demo (PIN semua: `123456`)

Di halaman **Masuk** tersedia tombol sekali ketuk untuk setiap akun.

| Peran | ID |
|---|---|
| Orang tua (SD) | `demo-ortu-sd` |
| Siswa (SMP) | `demo-siswa-smp` |
| Guru | `demo-guru` |
| Petugas sekolah SD | `PTG-SD-01` |
| Petugas sekolah SMP | `PTG-SMP-01` |
| Mitra SPPG | `SPPG-DEMO-01` |
| Pihak kesehatan (puskesmas) | `PKM-DEMO-01` |

Kode undangan untuk mencoba pendaftaran: `KLS-UJISD1-4A` (orang tua SD), `KLS-UJISMP1-8B` (siswa SMP), `STF-UJISD1` (guru/petugas).
Data tersimpan di browser; tombol **Reset data demo** ada di halaman *Tentang & Data*.

### Alur demo (±2 menit)

1. Beranda (tanpa login) → **Cari sekolah** → pilih wilayah (mis. Kab. Sidoarjo) → buka sekolah asli (data warga masih kosong) → pilih wilayah **Uji coba aplikasi** → buka **SD Uji Coba 1**.
2. Masuk sebagai **Orang tua SD** → kirim laporan sore "Ada keluhan: Sakit perut" + penilaian menu → poin bertambah di **Saya**.
3. Masuk sebagai **Mitra SPPG** → buka Kotak masukan → **Beri tanggapan**.
4. Kembali ke dasbor sekolah publik → tanggapan SPPG tampil di samping laporan asli.

## Progres saat ini (First Draft)

**Sudah berjalan**
- [x] Beranda publik: statistik nasional bersumber (resmi & independen berdampingan), cara kerja, masukan terbaru + tanggapan SPPG, peringkat partisipasi
- [x] Cari sekolah & dasbor sekolah publik: menu & gizi (diinput SPPG), perjalanan makanan, foto dari sekolah, bintang bulan ini + naik/turun, sebaran 1–5, nilai per aspek, tren 6 bulan, keluhan, partisipasi, masukan & tanggapan
- [x] Pendaftaran 3 langkah berbasis kode undangan (sekolah, jenjang, kelas, dan peran ditentukan kode) + masuk dengan nomor WhatsApp/ID + PIN (kunci 15 menit setelah 5 kali salah)
- [x] Orang tua: menu & perjalanan makanan, laporan kondisi sore (terpisah dari penilaian menu), banner arahan ke faskes, kartu rujukan 24 jam yang bisa dicabut
- [x] Siswa: foto sebelum makan (kamera) → laporan sebelum pulang (terkunci berurutan)
- [x] Guru: laporan kondisi + jumlah siswa terdampak, dihitung tanpa nama
- [x] Petugas sekolah: dua foto (diterima & saat makan), cocokkan menu, peringatan ambang keluhan (≥3 laporan, ≥2% siswa, ≥2 kelas) yang diperiksa dulu sebelum diteruskan
- [x] Mitra SPPG: input menu & gizi, kotak masukan, tanggapan "Benar, kami perbaiki" / "Info tidak sesuai" (laporan asli tidak bisa diubah)
- [x] Gamifikasi: poin (dari `poin_log`), 4 level, 4 badge, streak hari sekolah, peringkat partisipasi sekolah, riwayat poin termasuk penalti
- [x] Privasi: dasbor publik hanya agregat, foto dikompres & digambar ulang di perangkat (EXIF terbuang)

**Rencana berikutnya (3–10 November)**
- [ ] Migrasi ke Supabase (Auth, database, Storage foto) memakai `supabase/schema.sql`
- [ ] Tautan pantau orang tua untuk siswa SMP/SMA via WhatsApp
- [ ] Badge publik "Dapur Responsif" untuk SPPG
- [ ] Foto asli berlisensi bebas untuk hero (lihat `public/images/CREDITS.md`)
- [ ] Uji pengguna dengan orang tua, guru, dan siswa

## Revisi masukan mentor FDS WIA (November 2026)

### 1. Validasi & moderasi laporan
- **Buat laporan** (`/lapor/baru`): 5 kategori (kualitas, kebersihan, porsi, keterlambatan distribusi, kondisi penerima manfaat), deskripsi 20–1000 karakter, tanggal kejadian (tidak boleh masa depan), foto opsional lewat **Kamera** atau **Galeri** (dikompres ke maks. 1280 px, EXIF/lokasi dibuang).
- Pesan galat per kolom, fokus ke kolom pertama yang salah; laporan berhasil mendapat **nomor unik** `RT-YYMMDD-NNNN` dan status **Menunggu Verifikasi**.
- **Kemungkinan duplikat**: sekolah & kategori sama, tanggal kejadian ±1 hari, dan deskripsi mirip (trigram, ambang 0,3) atau pelapor sama. Hanya *penanda* bagi petugas — tidak pernah menolak/menghapus otomatis. Pelapor diberi peringatan lunak bila mirip laporannya sendiri.
- **Antrean verifikasi** petugas (`/petugas/verifikasi`, terlama dulu) → *Terverifikasi* atau *Ditolak* dengan alasan wajib (≥10 karakter) yang terlihat oleh pelapor.

### 2. Urgensi & eskalasi
- Urgensi **Normal / Sedang / Tinggi** dipilih petugas, terpisah dari status. Aplikasi tidak menentukan urgensi dan tidak memberi diagnosis.
- **Jalur eskalasi = urgensi Tinggi** (satu konstanta `URGENSI_ESKALASI` di `src/lib/pengaduan.ts` + fungsi SQL). *Perlu dikonfirmasi tim/dinas — lihat “Keputusan terbuka”.*
- Status: Menunggu Verifikasi → Terverifikasi → Diteruskan ke SPPG → Dalam Penanganan → Selesai; cabang *Ditolak* dan *Diteruskan ke Pihak Kesehatan Terkait* (hanya untuk jalur eskalasi).
- **Monitoring eskalasi** (`/petugas/eskalasi`): kasus aktif diurutkan urgensi lalu yang paling lama tidak diperbarui; penanggung jawab (petugas, SPPG, faskes), catatan tindak lanjut (bisa internal), dan riwayat append-only beserta waktunya.

### 3. Riwayat & monitoring
- Pelapor: `/laporan` dan `/laporan/:id` — nomor, kategori, status, progres, tanggapan SPPG, alasan penolakan, hasil penyelesaian. Catatan internal & urgensi tidak ditampilkan ke pelapor.
- SPPG (`/mitra/sppg`, tab *Laporan*) dan pihak kesehatan (`/mitra/kesehatan`) hanya melihat laporan yang diteruskan, **tanpa identitas pelapor**. Tanggapan SPPG disimpan sebagai entri riwayat; laporan asli tidak bisa diubah.

### 4. Transparansi publik (`/transparansi`)
Total masuk, terverifikasi, dalam penanganan, selesai, per kategori, tren 6 bulan, dan persentase penyelesaian (= Selesai ÷ Terverifikasi). Definisi tiap angka tertulis di halaman. Hanya agregat: di mode online, publik hanya bisa memanggil fungsi `statistik_publik()`; tabel laporan tidak bisa dibaca anon.

### 5. Responsif & performa
- Tata letak HP / tablet / desktop (navigasi bawah di HP, navigasi atas mulai 768 px, detail laporan dua kolom di desktop); tanpa scroll horizontal (diuji 360/768/1280 px).
- Code splitting per halaman: JS awal 770 KB → 332 KB (gzip 223 → 104 KB); recharts hanya di dasbor sekolah; logo header 187 KB → 12 KB.
- Indikator memuat, pesan berhasil/gagal, tombol ≥44 px, input 16 px (mencegah zoom otomatis iOS).

## Supabase (mode online)

1. Buat project Supabase → **SQL Editor** → jalankan `supabase/schema.sql`, lalu `supabase/seed.sql` (data master sekolah uji coba).
2. Pendaftaran memakai fungsi server `daftar_akun` (kode undangan + nomor WA + PIN), karena Supabase Auth menolak domain email sintetis `<nomor>@akun.rantangterang.id` pada `signUp`. Pengaturan *Confirm email* tidak perlu diubah.
3. Buat akun demo dari komputer admin: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/buat-akun-demo.mjs`. (Pada project `rantang-terang` ketujuh akun demo sudah dibuat.)
4. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di Vercel → redeploy.

Uji skema & RLS di PostgreSQL lokal (tanpa Supabase): `PGHOST=... PGPORT=... bash supabase/tests/jalankan.sh` — 13 kelompok uji (akses anon, validasi server, cakupan per peran, jejak append-only, privasi statistik, storage, pendaftaran).

> **Status:** project Supabase `rantang-terang` (region Singapura) sudah dibuat, `schema.sql` terpasang, dan 13 kelompok uji RLS dijalankan langsung di database Supabase (lulus, transaksi di-rollback). Frontend mode online diuji end-to-end terhadap Supabase sungguhan dan situs produksi dengan Playwright: 32/32 lulus, ditambah alur pendaftaran 4/4 (login, laporan + foto ke Storage, verifikasi/penolakan, urgensi, eskalasi, tanggapan SPPG, catatan internal, penyelesaian, statistik publik). Data uji sudah dibersihkan. Di mode demo, pembatasan per peran hanya ditiru di browser — bukan pengamanan sungguhan.

## Keputusan terbuka (perlu tim/mentor)
- Aturan urgensi resmi dan siapa pihak kesehatan per wilayah (saat ini: petugas memilih; Tinggi = eskalasi).
- Perlu tidaknya SLA/batas waktu tindak lanjut (sengaja **tidak** dibuat agar tidak mengarang aturan).
- PIN 6 digit sebagai kata sandi Supabase lemah untuk produksi; pertimbangkan OTP WhatsApp.
- `daftar_akun` bisa dipanggil tanpa login (wajib kode undangan valid) dan belum dibatasi laju; kode undangan sebaiknya dibuat acak dan bisa dicabut.
- Tujuh akun demo (PIN `123456`) aktif di situs live — hapus atau ganti PIN-nya sebelum dipakai warga sungguhan.
- Fitur lama (menu, penilaian, poin, foto petugas, rujukan) masih memakai data lokal/demo, juga di mode online.

## Data sekolah & wilayah

- **Wilayah asli** diurutkan dari korban dugaan keracunan MBG terbesar 2026 menurut pemberitaan resmi: Kab. Grobogan (803), Kota Semarang (707), Kab. Sidoarjo (512). Sumber tercantum di aplikasi.
- **Sekolah asli** (nama + NPSN) diambil dari Data Referensi Kemendikdasmen, di `src/lib/sekolah-asli.ts`. Sekolah asli **tidak** diberi laporan/rating karangan; datanya mulai kosong.
- **Sekolah uji coba** ("SD Uji Coba 1", dst.) fiktif dan berisi data contoh supaya alur bisa dicoba juri.
- Menambah sekolah: salin NPSN, nama, alamat, kecamatan dari https://referensi.data.kemendikdasmen.go.id ke `sekolah-asli.ts`. Jangan menebak NPSN.

## Struktur folder

```
src/
  components/   ui.tsx (komponen dasar), mbg.tsx (menu, perjalanan, masukan), forms.tsx (laporan & penilaian)
  lib/          db.ts (data & aturan bisnis), seed.ts (data contoh), sekolah-asli.ts (wilayah & sekolah asli), auth.ts, sources.ts (sumber statistik), date.ts, types.ts
  lib/pengaduan.ts  aturan laporan: kategori, status, transisi per peran, validasi, kemiripan, statistik
  lib/repo/     antarmuka data laporan: lokal.ts (demo) & supabase.ts (online)
  pages/        Home, Schools, SchoolDetail, About, Auth, AppHome, Profile, Sppg, Rujukan,
                BuatLaporan, DetailLaporan, DaftarLaporan (riwayat/verifikasi/eskalasi/kesehatan), Transparansi
supabase/       schema.sql, seed.sql, tests/ (uji RLS & alur)
scripts/        buat-akun-demo.mjs (admin, butuh service role key)
docs/screenshots/  tangkapan layar mobile & desktop
```

## Sumber data

Perpres No. 115/2025; Kementerian Keuangan (APBN KiTa, per 30 Sep 2026); BGN di RDP Komisi IX DPR (3 Sep 2026); JPPI; Ombudsman RI; SSGI 2024 Kemenkes. Tautan lengkap ada di halaman *Tentang & Data* dan `src/lib/sources.ts`.
