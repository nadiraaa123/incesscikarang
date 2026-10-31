# Rantang Terang

**Dari dapur sampai piring, terbuka untuk semua.**

Rantang Terang adalah web app mobile-first untuk warga memantau Makan Bergizi Gratis (MBG) di sekolah: orang tua dan siswa melaporkan kondisi anak dan menilai menu, petugas sekolah mencatat makanan yang tiba, SPPG menanggapi masukan tanpa bisa menghapus laporan asli, dan publik melihat dasbor mutu tiap sekolah tanpa akun.

Karya tim **Incess Cikarang** untuk **Web In Action – Multimedia In Action 2026**.
Tema: *Designing Digital Futures – Powering Public Transparency* · Subtema: *Civic Reporting & Accountability* (didukung *Public Service Tracking*).

> Proyek independen, bukan layanan resmi pemerintah. Data sekolah, akun, laporan, dan foto pada versi ini adalah **contoh untuk demo**. Statistik nasional di Beranda memakai data resmi beserta sumber dan tanggalnya.

**Demo online:** _[isi link Vercel setelah deploy]_

---

## Tech stack

| Bagian | Teknologi |
|---|---|
| Frontend | React 19 + TypeScript, Vite |
| Routing | React Router |
| Styling | Tailwind CSS (desain mobile-first, font Plus Jakarta Sans) |
| Grafik | Recharts |
| Ikon | lucide-react |
| Data (First Draft) | localStorage + data contoh (`src/lib/seed.ts`), lapisan data di `src/lib/db.ts` |
| Data (tahap berikutnya) | Supabase (PostgreSQL, Auth, Storage) — skema & Row Level Security di `supabase/schema.sql` |
| Deploy | Vercel (`vercel.json` sudah menyiapkan rewrite untuk SPA) |

## Cara menjalankan

```bash
git clone https://github.com/nadiraaa123/incesscikarang.git
cd incesscikarang
npm install
npm run dev        # buka http://localhost:5173
```

Build produksi: `npm run build` lalu `npm run preview`.

Tidak perlu `.env` untuk versi ini. `.env.example` disiapkan untuk integrasi Supabase berikutnya.

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
  pages/        Home, Schools, SchoolDetail, About, Auth (Masuk/Daftar), AppHome (ortu/siswa/guru/petugas), Profile, Sppg, Rujukan
supabase/       schema.sql
docs/screenshots/  tangkapan layar mobile & desktop
```

## Sumber data

Perpres No. 115/2025; Kementerian Keuangan (APBN KiTa, per 30 Sep 2026); BGN di RDP Komisi IX DPR (3 Sep 2026); JPPI; Ombudsman RI; SSGI 2024 Kemenkes. Tautan lengkap ada di halaman *Tentang & Data* dan `src/lib/sources.ts`.
