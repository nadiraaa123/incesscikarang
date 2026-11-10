import type { JejakPengaduan, KategoriLaporan, Pengaduan, Peran, StatusLaporan, Urgensi } from './types'
import { buatNomor } from './pengaduan'
import { lastSchoolDay, schoolDaysBefore } from './date'

/**
 * CONTOH laporan masalah untuk demo alur validasi → verifikasi → eskalasi → selesai.
 * Semua bertanda demo: true dan hanya untuk sekolah "Uji Coba" (fiktif).
 */

interface Spesifikasi {
  pelaporId: string
  schoolId: string
  kategori: KategoriLaporan
  deskripsi: string
  hariLalu: number
  status: StatusLaporan
  urgensi?: Urgensi
  keKesehatan?: boolean
  alasanTolak?: string
  hasil?: string
  tanggapan?: string
}

const SPPG_SEKOLAH: Record<string, string> = { 'uji-sd-1': 'SPPG-DEMO-01', 'uji-sd-2': 'SPPG-DEMO-01', 'uji-sd-3': 'SPPG-DEMO-01', 'uji-smp-1': 'SPPG-DEMO-02' }
const PETUGAS: Record<string, [string, string]> = { 'uji-sd-1': ['u-petugas-sd', 'Petugas SD Uji Coba 1'], 'uji-smp-1': ['u-petugas-smp', 'Petugas SMP Uji Coba 1'] }

const DATA: Spesifikasi[] = [
  // akun demo orang tua: satu per status penting
  { pelaporId: 'u-ortu', schoolId: 'uji-sd-1', kategori: 'porsi', deskripsi: 'Porsi nasi di ompreng kelas 4A terlihat jauh lebih sedikit dari biasanya, lauk ayam hanya potongan kecil.', hariLalu: 0, status: 'menunggu_verifikasi' },
  { pelaporId: 'u-ortu', schoolId: 'uji-sd-1', kategori: 'kebersihan', deskripsi: 'Sendok di ompreng masih ada sisa makanan kering dari hari sebelumnya, tolong dicek pencuciannya.', hariLalu: 12, status: 'selesai', urgensi: 'sedang', tanggapan: 'Terima kasih. Kami menemukan mesin cuci ompreng bermasalah pada shift pagi. Sudah diperbaiki dan ditambah pemeriksaan visual sebelum pengemasan.', hasil: 'SPPG memperbaiki mesin cuci dan menambah pemeriksaan visual. Petugas sekolah mengecek 3 hari berikutnya, alat makan bersih.' },
  { pelaporId: 'u-ortu', schoolId: 'uji-sd-1', kategori: 'kualitas', deskripsi: 'Anak bilang makanannya tidak enak.', hariLalu: 20, status: 'ditolak', alasanTolak: 'Informasi belum cukup untuk ditindaklanjuti (tidak ada keterangan menu/bagian yang bermasalah). Silakan kirim ulang dengan detail menu dan apa yang dirasakan.' },
  { pelaporId: 'u-ortu', schoolId: 'uji-sd-1', kategori: 'keterlambatan', deskripsi: 'Makanan baru tiba pukul 11.40, siswa kelas 4 sudah menunggu lebih dari satu jam dari jadwal makan.', hariLalu: 3, status: 'dalam_penanganan', urgensi: 'normal', tanggapan: 'Armada kami terkendala perbaikan jalan. Rute pengiriman diubah mulai minggu ini, perkiraan tiba 09.45.' },
  // antrean petugas SD: dua laporan mirip (penanda kemungkinan duplikat)
  { pelaporId: 'warga-2', schoolId: 'uji-sd-1', kategori: 'kualitas', deskripsi: 'Lauk ayam kecap terasa asam dan berbau tidak sedap saat dibuka di kelas 5B.', hariLalu: 0, status: 'menunggu_verifikasi' },
  { pelaporId: 'warga-3', schoolId: 'uji-sd-1', kategori: 'kualitas', deskripsi: 'Ayam kecap hari ini berbau asam dan rasanya tidak sedap, anak kelas 5B tidak menghabiskan.', hariLalu: 0, status: 'menunggu_verifikasi' },
  { pelaporId: 'warga-9', schoolId: 'uji-sd-1', kategori: 'kondisi', deskripsi: 'Tiga anak di kelas 4A mengeluh mual dan pusing sekitar satu jam setelah makan siang. Sudah dibawa ke UKS.', hariLalu: 1, status: 'diteruskan_kesehatan', urgensi: 'tinggi', keKesehatan: true },
  { pelaporId: 'warga-10', schoolId: 'uji-sd-1', kategori: 'porsi', deskripsi: 'Buah tidak dibagikan sama sekali untuk kelas 6, padahal tertulis di menu ada jeruk.', hariLalu: 2, status: 'terverifikasi', urgensi: 'normal' },
  { pelaporId: 'warga-11', schoolId: 'uji-sd-1', kategori: 'kebersihan', deskripsi: 'Ada rambut di dalam nasi pada salah satu ompreng kelas 3B, sudah difoto oleh wali kelas.', hariLalu: 4, status: 'diteruskan_sppg', urgensi: 'sedang' },
  // SMP
  { pelaporId: 'warga-4', schoolId: 'uji-smp-1', kategori: 'kualitas', deskripsi: 'Lauk ikan tongkol sudah agak bau saat dibuka pukul 12, beberapa siswa kelas 8B tidak memakannya.', hariLalu: 1, status: 'diteruskan_sppg', urgensi: 'sedang' },
  { pelaporId: 'warga-12', schoolId: 'uji-smp-1', kategori: 'kondisi', deskripsi: 'Dua siswa kelas 9A muntah setelah makan siang, orang tua sudah menjemput dan membawa ke puskesmas.', hariLalu: 6, status: 'selesai', urgensi: 'tinggi', keKesehatan: true, tanggapan: 'Sampel makanan hari itu sudah kami serahkan ke puskesmas. Distribusi lauk dari pemasok yang sama dihentikan sementara.', hasil: 'Puskesmas menerima sampel; siswa sudah pulih. SPPG mengganti pemasok lauk. Kasus ditutup setelah pemantauan 5 hari tanpa keluhan baru.' },
]

// riwayat 6 bulan untuk grafik (sekolah uji lain), semuanya selesai/ditolak/dalam proses
const LAMA: [KategoriLaporan, number, StatusLaporan, string][] = [
  ['porsi', 150, 'selesai', 'uji-sd-2'], ['keterlambatan', 140, 'selesai', 'uji-sd-3'], ['kualitas', 128, 'ditolak', 'uji-sd-2'],
  ['kebersihan', 118, 'selesai', 'uji-smp-1'], ['porsi', 104, 'selesai', 'uji-sd-3'], ['keterlambatan', 96, 'selesai', 'uji-sd-2'],
  ['kualitas', 88, 'selesai', 'uji-smp-1'], ['kondisi', 80, 'selesai', 'uji-sd-3'], ['porsi', 66, 'selesai', 'uji-sd-2'],
  ['kebersihan', 58, 'ditolak', 'uji-sd-3'], ['keterlambatan', 50, 'selesai', 'uji-smp-1'], ['kualitas', 41, 'selesai', 'uji-sd-2'],
  ['porsi', 33, 'selesai', 'uji-sd-3'], ['keterlambatan', 25, 'dalam_penanganan', 'uji-sd-2'], ['kualitas', 18, 'selesai', 'uji-smp-1'],
]
const TEKS_LAMA: Record<KategoriLaporan, string> = {
  kualitas: 'Sayur terasa basi dan berlendir saat dibagikan ke siswa.',
  kebersihan: 'Ompreng masih berminyak dan ada noda bekas makanan.',
  porsi: 'Lauk tidak sesuai porsi yang tertulis di menu hari itu.',
  keterlambatan: 'Makanan datang terlambat lebih dari 45 menit dari jadwal.',
  kondisi: 'Beberapa siswa mengeluh sakit perut setelah makan siang.',
}

function waktuMundur(hari: number, jam: number, menit = 0) {
  const d = new Date()
  d.setDate(d.getDate() - hari)
  d.setHours(jam, menit, 0, 0)
  return d
}

export function buatSeedPengaduan(): { pengaduan: Pengaduan[]; jejak: JejakPengaduan[] } {
  const hariIni = lastSchoolDay()
  const offset = Math.round((new Date().getTime() - new Date(hariIni + 'T12:00:00').getTime()) / 86400000)
  const pengaduan: Pengaduan[] = []
  const jejak: JejakPengaduan[] = []
  const spek: Spesifikasi[] = [
    ...LAMA.map(([kategori, hariLalu, status, schoolId], i) => ({
      pelaporId: `warga-l${i}`, schoolId, kategori, hariLalu, status,
      deskripsi: TEKS_LAMA[kategori], urgensi: status === 'ditolak' ? undefined : (kategori === 'kondisi' ? 'tinggi' : 'normal') as Urgensi,
      alasanTolak: status === 'ditolak' ? 'Tidak dapat dikonfirmasi: petugas tidak menemukan kejadian pada tanggal tersebut.' : undefined,
      hasil: status === 'selesai' ? 'Sudah ditindaklanjuti SPPG dan dicek ulang petugas sekolah.' : undefined,
    })),
    ...DATA,
  ]
  spek.sort((a, b) => b.hariLalu - a.hariLalu)

  spek.forEach((s, i) => {
    const hari = s.hariLalu + (s.hariLalu < 30 ? offset : 0)
    const kandidat = waktuMundur(hari, 14, 10 + (i % 40))
    const batas = new Date(Date.now() - (spek.length - i) * 7 * 60000)
    const dibuat = kandidat > batas ? batas : kandidat
    const tanggalKejadian = s.hariLalu === 0 ? hariIni : s.hariLalu < 30 ? schoolDaysBefore(hariIni, s.hariLalu)[s.hariLalu - 1] : dibuat.toISOString().slice(0, 10)
    const id = `pg-${i + 1}`
    const sppgId = SPPG_SEKOLAH[s.schoolId]
    const [petugasId, petugasLabel] = PETUGAS[s.schoolId] ?? ['u-petugas-lain', 'Petugas sekolah']
    let t = dibuat.getTime()
    const langkah = (menit: number) => new Date((t += menit * 60000)).toISOString()
    const catat = (j: Omit<JejakPengaduan, 'id' | 'pengaduanId' | 'waktu'>, menit: number) =>
      jejak.push({ ...j, id: `jj-${jejak.length + 1}`, pengaduanId: id, waktu: langkah(menit) })
    const status = (aktorPeran: Peran, aktorLabel: string, dari: StatusLaporan, ke: StatusLaporan, catatan?: string, menit = 90) =>
      catat({ aktorPeran, aktorLabel, jenis: 'status', dari, ke, catatan, untukPelapor: true }, menit)

    catat({ aktorPeran: 'ortu', aktorLabel: 'Pelapor', jenis: 'dibuat', ke: 'menunggu_verifikasi', untukPelapor: true }, 0)
    const urut = indeksAlur(s.status)
    if (s.status === 'ditolak') status('petugas', petugasLabel, 'menunggu_verifikasi', 'ditolak', s.alasanTolak)
    if (urut >= 1) status('petugas', petugasLabel, 'menunggu_verifikasi', 'terverifikasi')
    if (urut >= 1 && s.urgensi) catat({ aktorPeran: 'petugas', aktorLabel: petugasLabel, jenis: 'urgensi', urgensi: s.urgensi, untukPelapor: false }, 5)
    if (urut >= 2) status('petugas', petugasLabel, 'terverifikasi', 'diteruskan_sppg', undefined, 10)
    if (s.keKesehatan) {
      status('petugas', petugasLabel, 'diteruskan_sppg', 'diteruskan_kesehatan', 'Diteruskan sesuai prosedur karena menyangkut kondisi penerima manfaat.', 15)
      catat({ aktorPeran: 'kesehatan', aktorLabel: 'Puskesmas Uji Coba', jenis: 'catatan', catatan: 'Tim puskesmas mengunjungi sekolah dan mengambil sampel makanan.', untukPelapor: false }, 120)
    }
    if (urut >= 3) status(s.keKesehatan ? 'kesehatan' : 'sppg', s.keKesehatan ? 'Puskesmas Uji Coba' : 'Mitra SPPG', s.keKesehatan ? 'diteruskan_kesehatan' : 'diteruskan_sppg', 'dalam_penanganan', undefined, 60)
    if (s.tanggapan) catat({ aktorPeran: 'sppg', aktorLabel: 'Mitra SPPG', jenis: 'tanggapan', catatan: s.tanggapan, untukPelapor: true }, 200)
    if (urut >= 4) status('petugas', petugasLabel, 'dalam_penanganan', 'selesai', s.hasil, 60 * 24)

    pengaduan.push({
      id, nomor: buatNomor(i + 1, dibuat), pelaporId: s.pelaporId, schoolId: s.schoolId, kategori: s.kategori,
      deskripsi: s.deskripsi, tanggalKejadian, dibuat: dibuat.toISOString(), diperbarui: new Date(t).toISOString(),
      status: s.status, urgensi: urut >= 1 ? s.urgensi : undefined, alasanTolak: s.alasanTolak, hasil: s.status === 'selesai' ? s.hasil : undefined,
      petugasId: s.status !== 'menunggu_verifikasi' ? petugasId : undefined,
      sppgId: urut >= 2 ? sppgId : undefined,
      faskesId: s.keKesehatan ? 'PKM-DEMO-01' : undefined,
      keKesehatan: !!s.keKesehatan, kemungkinanDuplikat: [], demo: true,
    })
  })
  // tandai pasangan laporan mirip di antrean
  const mirip = pengaduan.filter((p) => p.status === 'menunggu_verifikasi' && p.kategori === 'kualitas' && p.schoolId === 'uji-sd-1')
  mirip.forEach((p) => { p.kemungkinanDuplikat = mirip.filter((q) => q.id !== p.id).map((q) => q.id) })
  return { pengaduan, jejak }
}

// posisi pada alur utama; cabang "diteruskan ke pihak kesehatan" setara tahap diteruskan
const ALUR: StatusLaporan[] = ['menunggu_verifikasi', 'terverifikasi', 'diteruskan_sppg', 'dalam_penanganan', 'selesai']
function indeksAlur(s: StatusLaporan) { return s === 'diteruskan_kesehatan' ? 2 : ALUR.indexOf(s) }
