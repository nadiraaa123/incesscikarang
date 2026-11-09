import type { Sekolah, Wilayah } from './types'

/**
 * DATA ASLI — wilayah dengan kasus dugaan keracunan MBG terbesar 2026 (diurutkan dari korban terbanyak)
 * dan sekolah yang identitasnya diverifikasi di Data Referensi Kemendikdasmen (NPSN).
 *
 * PENTING: sekolah asli TIDAK diberi laporan, rating, atau keluhan karangan.
 * Data warga untuk sekolah asli mulai dari kosong dan hanya terisi dari laporan sungguhan.
 *
 * Menambah sekolah: buka https://referensi.data.kemendikdasmen.go.id, cari sekolahnya,
 * lalu salin NPSN, nama, alamat, dan kecamatan ke format di bawah. Jangan menebak NPSN.
 */
export const WILAYAH: Wilayah[] = [
  {
    id: 'grobogan',
    nama: 'Kab. Grobogan',
    provinsi: 'Jawa Tengah',
    kejadian: {
      korban: 803,
      ringkas: 'Dugaan keracunan dari SPPG Gubug Kwaron 1 (Kec. Gubug); korban dari sejumlah sekolah dan pondok pesantren, 115 orang dirawat.',
      tanggal: 'awal Januari 2026',
      sumber: 'Jawa Pos, 2 Sep 2026',
      url: 'https://www.jawapos.com/nasional/2609020368/5-kasus-dugaan-keracunan-mbg-terbesar-sepanjang-2026-paling-parah-makan-korban-hingga-809-orang',
    },
  },
  {
    id: 'kota-semarang',
    nama: 'Kota Semarang',
    provinsi: 'Jawa Tengah',
    kejadian: {
      korban: 707,
      ringkas: '693 siswa dan 14 guru diduga keracunan; BGN menghentikan sementara operasional SPPG terkait.',
      tanggal: '31 Juli 2026',
      sumber: 'BGN, via Katadata, 2 Agu 2026',
      url: 'https://katadata.co.id/berita/nasional/6a6ea9bc06854/bgn-suspend-sppg-di-semarang-usai-707-orang-diduga-keracunan-mbg',
    },
  },
  {
    id: 'sidoarjo',
    nama: 'Kab. Sidoarjo',
    provinsi: 'Jawa Timur',
    kejadian: {
      korban: 512,
      ringkas: 'Santri Ponpes Manbaul Hikam; makanan dari SPPG Talang Angin dikirim melewati batas waktu konsumsi.',
      tanggal: 'Agustus–September 2026',
      sumber: 'BGN di RDP Komisi IX DPR, via Katadata, 4 Sep 2026',
      url: 'https://katadata.co.id/berita/nasional/6a9a5b8dc9d81/5482-korban-keracunan-mbg-sejak-akhir-juli-2026-bgn-soroti-pelanggaran-sop',
    },
  },
  { id: 'uji', nama: 'Uji coba aplikasi (data contoh)', provinsi: '—', uji: true },
]

const ref = (npsn: string) => `https://referensi.data.kemdikbud.go.id/residu/satuanpendidikan/detail/${npsn}`
const asli = (s: Omit<Sekolah, 'asli' | 'siswa' | 'akunTerdaftar' | 'pelaporAktifSeed' | 'id' | 'sumberUrl'>): Sekolah => ({
  ...s,
  id: `npsn-${s.npsn}`,
  asli: true,
  sumberUrl: ref(s.npsn),
  siswa: 0,
  akunTerdaftar: 0,
  pelaporAktifSeed: 0,
})

export const SEKOLAH_ASLI: Sekolah[] = [
  // Kab. Grobogan — terverifikasi di Data Referensi Kemendikdasmen
  asli({ npsn: '20314596', nama: 'SD Negeri 2 Bugel', jenjang: 'SD', alamat: 'Jln. Patriot No 8, Bugel', kec: 'Godong', kab: 'Kab. Grobogan', wilayahId: 'grobogan' }),
  asli({ npsn: '20314428', nama: 'SD Negeri 2 Panimbo', jenjang: 'SD', alamat: 'Dk Brumbung RT 04 RW 01, Panimbo', kec: 'Kedungjati', kab: 'Kab. Grobogan', wilayahId: 'grobogan' }),
  asli({ npsn: '20313767', nama: 'SD Negeri 3 Genengsari', jenjang: 'SD', alamat: 'Dsn. Dalon RT 03 RW 04, Genengsari', kec: 'Toroh', kab: 'Kab. Grobogan', wilayahId: 'grobogan' }),
  asli({ npsn: '20313731', nama: 'SD Negeri 3 Kedungwungu', jenjang: 'SD', alamat: 'Ds. Kedungwungu', kec: 'Tegowanu', kab: 'Kab. Grobogan', wilayahId: 'grobogan' }),

  // Kota Semarang — terverifikasi
  asli({ npsn: '20364846', nama: 'MTsN 2 Kota Semarang', jenjang: 'MTs', alamat: 'Jl. Soekarno Hatta No. 285, Mlatiharjo', kec: 'Semarang Timur', kab: 'Kota Semarang', wilayahId: 'kota-semarang' }),

  // Kab. Sidoarjo — nama & NPSN dari Data Referensi Kemendikdasmen; alamat lengkap belum dicatat
  asli({ npsn: '20501522', nama: 'SD Negeri Sidokare 1', jenjang: 'SD', kec: 'Sidoarjo', kab: 'Kab. Sidoarjo', wilayahId: 'sidoarjo' }),
  asli({ npsn: '20501657', nama: 'SD Negeri Lemahputro 1', jenjang: 'SD', kec: 'Sidoarjo', kab: 'Kab. Sidoarjo', wilayahId: 'sidoarjo' }),
  asli({ npsn: '20501465', nama: 'SD Negeri Pucang 4', jenjang: 'SD', kec: 'Sidoarjo', kab: 'Kab. Sidoarjo', wilayahId: 'sidoarjo' }),
  asli({ npsn: '20502360', nama: 'SD Negeri Bluru Kidul 2', jenjang: 'SD', kec: 'Sidoarjo', kab: 'Kab. Sidoarjo', wilayahId: 'sidoarjo' }),
  asli({ npsn: '20502182', nama: 'SD Negeri Jati', jenjang: 'SD', kec: 'Sidoarjo', kab: 'Kab. Sidoarjo', wilayahId: 'sidoarjo' }),
]
