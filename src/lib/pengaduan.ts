import type { KategoriLaporan, Pengaduan, Peran, StatusLaporan, Urgensi } from './types'
import { monthKey, monthsBack, toISODate, today } from './date'

/**
 * Aturan alur laporan masalah. Dipakai mode lokal (demo) dan dicerminkan di
 * supabase/schema.sql (fungsi ubah_status_laporan) agar perilakunya sama.
 */

export const KATEGORI: { key: KategoriLaporan; label: string; ket: string }[] = [
  { key: 'kualitas', label: 'Kualitas makanan', ket: 'Rasa, bau, tekstur, atau kesegaran tidak wajar' },
  { key: 'kebersihan', label: 'Kebersihan', ket: 'Wadah, alat makan, atau makanan tampak kotor' },
  { key: 'porsi', label: 'Porsi makanan', ket: 'Porsi kurang atau tidak sesuai menu' },
  { key: 'keterlambatan', label: 'Keterlambatan distribusi', ket: 'Makanan datang terlambat atau tidak datang' },
  { key: 'kondisi', label: 'Kondisi penerima manfaat', ket: 'Anak mengalami keluhan setelah makan' },
]
export const labelKategori = (k: KategoriLaporan) => KATEGORI.find((x) => x.key === k)?.label ?? k

export const LABEL_STATUS: Record<StatusLaporan, string> = {
  menunggu_verifikasi: 'Menunggu Verifikasi',
  terverifikasi: 'Terverifikasi',
  ditolak: 'Ditolak',
  diteruskan_sppg: 'Diteruskan ke SPPG',
  diteruskan_kesehatan: 'Diteruskan ke Pihak Kesehatan Terkait',
  dalam_penanganan: 'Dalam Penanganan',
  selesai: 'Selesai',
}

/** Alur utama untuk progress bar. Ditolak & pihak kesehatan adalah cabang, bukan tahap wajib. */
export const ALUR_UTAMA: StatusLaporan[] = ['menunggu_verifikasi', 'terverifikasi', 'diteruskan_sppg', 'dalam_penanganan', 'selesai']

export const LABEL_URGENSI: Record<Urgensi, string> = { normal: 'Normal', sedang: 'Sedang', tinggi: 'Tinggi' }
export const URUTAN_URGENSI: Record<Urgensi, number> = { tinggi: 0, sedang: 1, normal: 2 }

/**
 * Urgensi yang masuk jalur eskalasi. Tingkat urgensi DIPILIH PETUGAS, aplikasi tidak menentukannya
 * dan tidak memberi diagnosis. Bila tim/dinas menetapkan aturan lain, ubah di satu tempat ini
 * (dan di fungsi SQL yang sama).
 */
export const URGENSI_ESKALASI: Urgensi[] = ['tinggi']
export const masukEskalasi = (p: Pick<Pengaduan, 'urgensi' | 'keKesehatan'>) => (!!p.urgensi && URGENSI_ESKALASI.includes(p.urgensi)) || p.keKesehatan

export const STATUS_AKTIF: StatusLaporan[] = ['terverifikasi', 'diteruskan_sppg', 'diteruskan_kesehatan', 'dalam_penanganan']

/* ---------- Transisi status ---------- */

export type Aksi = 'verifikasi' | 'tolak' | 'teruskan_sppg' | 'teruskan_kesehatan' | 'mulai_tangani' | 'selesaikan'

export const TRANSISI: Record<Aksi, { dari: StatusLaporan[]; ke: StatusLaporan; peran: Peran[] }> = {
  verifikasi: { dari: ['menunggu_verifikasi'], ke: 'terverifikasi', peran: ['petugas'] },
  tolak: { dari: ['menunggu_verifikasi'], ke: 'ditolak', peran: ['petugas'] },
  teruskan_sppg: { dari: ['terverifikasi'], ke: 'diteruskan_sppg', peran: ['petugas'] },
  teruskan_kesehatan: { dari: ['diteruskan_sppg', 'dalam_penanganan'], ke: 'diteruskan_kesehatan', peran: ['petugas'] },
  mulai_tangani: { dari: ['diteruskan_sppg', 'diteruskan_kesehatan'], ke: 'dalam_penanganan', peran: ['petugas', 'sppg', 'kesehatan'] },
  selesaikan: { dari: ['dalam_penanganan'], ke: 'selesai', peran: ['petugas'] },
}

/** Mengembalikan pesan galat bila aksi tidak boleh, atau null bila boleh. */
export function cekAksi(p: Pengaduan, aksi: Aksi, peran: Peran, isian: { alasan?: string; hasil?: string } = {}): string | null {
  const t = TRANSISI[aksi]
  if (!t.peran.includes(peran)) return 'Peranmu tidak berwenang melakukan tindakan ini.'
  if (!t.dari.includes(p.status)) return `Tindakan tidak tersedia untuk status "${LABEL_STATUS[p.status]}".`
  if (aksi === 'tolak' && (isian.alasan ?? '').trim().length < 10) return 'Alasan penolakan wajib diisi (minimal 10 karakter).'
  if (aksi === 'teruskan_sppg' && !p.urgensi) return 'Tetapkan tingkat urgensi sebelum meneruskan ke SPPG.'
  if (aksi === 'teruskan_kesehatan' && !(p.urgensi && URGENSI_ESKALASI.includes(p.urgensi))) return 'Penerusan ke pihak kesehatan hanya untuk laporan di jalur eskalasi (urgensi Tinggi).'
  if (aksi === 'selesaikan' && (isian.hasil ?? '').trim().length < 10) return 'Tuliskan hasil penyelesaian (minimal 10 karakter).'
  return null
}

export const aksiTersedia = (p: Pengaduan, peran: Peran) =>
  (Object.keys(TRANSISI) as Aksi[]).filter((a) => TRANSISI[a].peran.includes(peran) && TRANSISI[a].dari.includes(p.status))

/* ---------- Validasi formulir ---------- */

export interface IsianLaporan {
  kategori?: KategoriLaporan
  deskripsi: string
  tanggalKejadian: string
}
export const DESKRIPSI_MIN = 20
export const DESKRIPSI_MAKS = 1000
export const FOTO_MAKS_MB = 10

export function validasiLaporan(x: IsianLaporan, hariIni = today()): Partial<Record<keyof IsianLaporan, string>> {
  const e: Partial<Record<keyof IsianLaporan, string>> = {}
  if (!x.kategori) e.kategori = 'Pilih salah satu kategori laporan.'
  const des = x.deskripsi.trim()
  if (!des) e.deskripsi = 'Deskripsi wajib diisi.'
  else if (des.length < DESKRIPSI_MIN) e.deskripsi = `Deskripsi terlalu singkat. Tulis minimal ${DESKRIPSI_MIN} karakter (sekarang ${des.length}).`
  else if (des.length > DESKRIPSI_MAKS) e.deskripsi = `Deskripsi maksimal ${DESKRIPSI_MAKS} karakter.`
  if (!x.tanggalKejadian) e.tanggalKejadian = 'Tanggal kejadian wajib diisi.'
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(x.tanggalKejadian)) e.tanggalKejadian = 'Format tanggal tidak dikenali.'
  else if (x.tanggalKejadian > hariIni) e.tanggalKejadian = 'Tanggal kejadian tidak boleh di masa depan.'
  return e
}

export function validasiFoto(f: File): string | null {
  if (!f.type.startsWith('image/')) return 'File harus berupa gambar (JPG/PNG/HEIC).'
  if (f.size > FOTO_MAKS_MB * 1024 * 1024) return `Ukuran foto maksimal ${FOTO_MAKS_MB} MB.`
  return null
}

/* ---------- Kemiripan (penanda kemungkinan duplikat) ---------- */

/** Trigram ala pg_trgm agar hasil mode lokal mendekati similarity() di Postgres. */
function trigram(s: string) {
  const set = new Set<string>()
  s.toLowerCase().replace(/[^a-z0-9À-ɏ]+/g, ' ').trim().split(/\s+/).filter(Boolean).forEach((w) => {
    const p = `  ${w} `
    for (let i = 0; i < p.length - 2; i++) set.add(p.slice(i, i + 3))
  })
  return set
}
export function kemiripan(a: string, b: string) {
  const A = trigram(a)
  const B = trigram(b)
  if (!A.size || !B.size) return 0
  let sama = 0
  A.forEach((t) => { if (B.has(t)) sama++ })
  return sama / (A.size + B.size - sama)
}
export const AMBANG_MIRIP = 0.3

const selisihHari = (a: string, b: string) => Math.abs(new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime()) / 86400000

/**
 * Laporan yang mungkin membahas kejadian yang sama: sekolah & kategori sama, tanggal kejadian
 * berselisih ≤1 hari, dan deskripsi mirip ATAU dari pelapor yang sama.
 * Laporan dari orang berbeda yang mirip justru bisa menguatkan, jadi hanya ditandai, tidak ditolak.
 */
export function cariKemiripan(semua: Pengaduan[], x: Pick<Pengaduan, 'schoolId' | 'kategori' | 'tanggalKejadian' | 'deskripsi' | 'pelaporId'>, kecuali?: string) {
  return semua
    .filter((p) => p.id !== kecuali && p.schoolId === x.schoolId && p.kategori === x.kategori && selisihHari(p.tanggalKejadian, x.tanggalKejadian) <= 1)
    .filter((p) => p.pelaporId === x.pelaporId || kemiripan(p.deskripsi, x.deskripsi) >= AMBANG_MIRIP)
    .map((p) => p.id)
}

/* ---------- Statistik publik (hanya agregat) ---------- */

export type Periode = '30' | '90' | 'semua'
export const LABEL_PERIODE: Record<Periode, string> = { '30': '30 hari terakhir', '90': '90 hari terakhir', semua: 'Semua waktu' }

export interface StatistikPublik {
  periode: Periode
  masuk: number
  menunggu: number
  ditolak: number
  terverifikasi: number
  dalamPenanganan: number
  selesai: number
  persenSelesai: number | null
  perKategori: { kategori: KategoriLaporan; total: number; selesai: number }[]
  perBulan: { bulan: string; masuk: number; selesai: number }[]
  adaContoh: boolean
}

export const mulaiPeriode = (periode: Periode, hariIni = today()) => {
  if (periode === 'semua') return '0000-00-00'
  const d = new Date(hariIni + 'T00:00:00')
  d.setDate(d.getDate() - (+periode - 1))
  return toISODate(d)
}

/** Definisi metrik dijelaskan di halaman Transparansi dan identik dengan fungsi SQL statistik_publik(). */
/** Tanggal lokal (WIB di perangkat pengguna) dari timestamp ISO. */
export const tanggalLokal = (iso: string) => toISODate(new Date(iso))

export function hitungStatistik(semua: Pick<Pengaduan, 'status' | 'kategori' | 'dibuat' | 'demo'>[], periode: Periode, hariIni = today()): StatistikPublik {
  const mulai = mulaiPeriode(periode, hariIni)
  const list = semua.filter((p) => tanggalLokal(p.dibuat) >= mulai)
  const lolos = (s: StatusLaporan) => s !== 'menunggu_verifikasi' && s !== 'ditolak'
  const terverifikasi = list.filter((p) => lolos(p.status)).length
  const selesai = list.filter((p) => p.status === 'selesai').length
  const bulan = monthsBack(6)
  return {
    periode,
    masuk: list.length,
    menunggu: list.filter((p) => p.status === 'menunggu_verifikasi').length,
    ditolak: list.filter((p) => p.status === 'ditolak').length,
    terverifikasi,
    dalamPenanganan: list.filter((p) => STATUS_AKTIF.includes(p.status)).length,
    selesai,
    persenSelesai: terverifikasi ? Math.round((selesai / terverifikasi) * 100) : null,
    perKategori: KATEGORI.map(({ key }) => ({
      kategori: key,
      total: list.filter((p) => p.kategori === key).length,
      selesai: list.filter((p) => p.kategori === key && p.status === 'selesai').length,
    })),
    // grafik selalu 6 bulan terakhir (tidak ikut filter periode) agar tren bisa dibandingkan
    perBulan: bulan.map((b) => ({
      bulan: b,
      masuk: semua.filter((p) => monthKey(tanggalLokal(p.dibuat)) === b).length,
      selesai: semua.filter((p) => monthKey(tanggalLokal(p.dibuat)) === b && p.status === 'selesai').length,
    })),
    adaContoh: list.some((p) => p.demo),
  }
}

export const buatNomor = (urut: number, waktu = new Date()) => {
  const yy = String(waktu.getFullYear()).slice(2)
  const mm = String(waktu.getMonth() + 1).padStart(2, '0')
  const dd = String(waktu.getDate()).padStart(2, '0')
  return `RT-${yy}${mm}${dd}-${String(urut).padStart(4, '0')}`
}
