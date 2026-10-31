/** Data resmi & independen untuk Beranda. Setiap angka wajib punya sumber dan tanggal. */
export interface Statistik {
  label: string
  nilai: string
  keterangan: string
  sumber: string
  tanggal: string
  url: string
  jenis?: 'resmi' | 'independen'
}

export const STAT_NASIONAL: Statistik[] = [
  {
    label: 'Penerima manfaat MBG',
    nilai: '57 juta',
    keterangan: 'dilayani 27.485 SPPG',
    sumber: 'Kementerian Keuangan (APBN KiTa)',
    tanggal: 'per 30 Sep 2026',
    url: 'https://katadata.co.id/finansial/makro/6ac87f14389ac/realisasi-anggaran-mbg-capai-rp153-2-triliun-jangkau-57-juta-penerima-manfaat',
  },
  {
    label: 'Realisasi anggaran MBG',
    nilai: 'Rp153,2 T',
    keterangan: 'tahun anggaran 2026',
    sumber: 'Kementerian Keuangan (APBN KiTa)',
    tanggal: 'per 30 Sep 2026',
    url: 'https://katadata.co.id/finansial/makro/6ac87f14389ac/realisasi-anggaran-mbg-capai-rp153-2-triliun-jangkau-57-juta-penerima-manfaat',
  },
  {
    label: 'Prevalensi stunting nasional',
    nilai: '19,8%',
    keterangan: 'turun dari 21,5% (2023)',
    sumber: 'SSGI 2024, Kemenkes RI',
    tanggal: 'rilis 26 Mei 2025',
    url: 'https://www.badankebijakan.kemkes.go.id/ssgi-2024-prevalensi-stunting-nasional-turun-menjadi-198/',
  },
]

export const STAT_KERACUNAN: Statistik[] = [
  {
    label: 'Versi resmi',
    nilai: '5.482 korban',
    keterangan: '71 kejadian, 62 SPPG, sejak 22 Jul 2026. >80% karena pelanggaran SOP',
    sumber: 'BGN, RDP Komisi IX DPR',
    tanggal: '3 Sep 2026',
    url: 'https://katadata.co.id/berita/nasional/6a9a5b8dc9d81/5482-korban-keracunan-mbg-sejak-akhir-juli-2026-bgn-soroti-pelanggaran-sop',
    jenis: 'resmi',
  },
  {
    label: 'Versi pemantau independen',
    nilai: '40.759 korban',
    keterangan: 'akumulasi sejak 2025',
    sumber: 'JPPI',
    tanggal: '2026',
    url: 'https://nu.or.id/nasional/jppi-korban-keracunan-mbg-capai-40-759-orang-sejak-2025-6MDir',
    jenis: 'independen',
  },
]

export const DAFTAR_SUMBER = [
  { nama: 'Perpres No. 115 Tahun 2025 tentang Tata Kelola Penyelenggaraan Program MBG', penerbit: 'Pemerintah RI', url: 'https://www.peraturan.go.id/files/perpres-no-115-tahun-2025.pdf' },
  { nama: 'Realisasi anggaran & penerima MBG (APBN KiTa)', penerbit: 'Kementerian Keuangan, via Katadata', url: STAT_NASIONAL[0].url },
  { nama: 'Data korban keracunan MBG sejak 22 Juli 2026', penerbit: 'Badan Gizi Nasional, via Katadata', url: STAT_KERACUNAN[0].url },
  { nama: 'Data korban keracunan MBG versi pemantau independen', penerbit: 'JPPI, via NU Online', url: STAT_KERACUNAN[1].url },
  { nama: 'Empat potensi maladministrasi program MBG', penerbit: 'Ombudsman RI', url: 'https://ombudsman.go.id/news/r/ombudsman-ri-temukan-empat-potensi-maladministrasi-dalam-program-makan-bergizi-gratis' },
  { nama: 'SSGI 2024: prevalensi stunting nasional 19,8%', penerbit: 'BKPK Kemenkes RI', url: STAT_NASIONAL[2].url },
  { nama: 'Aplikasi Reviu Menu MBG', penerbit: 'BGN, via Antara', url: 'https://jogja.antaranews.com/berita/830935/bgn-meluncurkan-aplikasi-reviu-menu-mbg-untuk-nilai-kualitas-mbg' },
]
