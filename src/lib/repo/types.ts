import type { JejakPengaduan, Pengaduan, Pengguna, Urgensi } from '../types'
import type { Aksi, IsianLaporan, Periode, StatistikPublik } from '../pengaduan'

export type Cakupan =
  | 'saya' // pelapor: laporan miliknya
  | 'verifikasi' // petugas: antrean Menunggu Verifikasi di sekolahnya
  | 'sekolah' // petugas: semua laporan sekolahnya
  | 'mitra' // SPPG / pihak kesehatan: laporan yang ditugaskan

export interface Mirip {
  id: string
  nomor: string
  status: Pengaduan['status']
  pelaporSama: boolean
  deskripsi: string
}

export interface DetailPengaduan {
  p: Pengaduan
  jejak: JejakPengaduan[]
  sekolah?: string
  sppg?: string
  faskes?: string
  petugas?: string
  /** Hanya terisi untuk petugas sekolah. SPPG & pihak kesehatan tidak menerima identitas pelapor. */
  pelapor?: string
  mirip: Mirip[]
  fotoTampil?: string
}

export type Hasil<T = undefined> = { ok: true; data: T } | { ok: false; pesan: string; galat?: Partial<Record<keyof IsianLaporan | 'foto', string>> }

export interface Repo {
  mode: 'lokal' | 'supabase'
  daftar(user: Pengguna, cakupan: Cakupan): Promise<Pengaduan[]>
  detail(user: Pengguna, id: string): Promise<DetailPengaduan | null>
  /** Laporan milik pengguna sendiri yang mirip (peringatan lunak sebelum kirim). */
  cekMiripSaya(user: Pengguna, isian: Required<IsianLaporan>): Promise<Pengaduan[]>
  buat(user: Pengguna, isian: IsianLaporan, foto?: Blob): Promise<Hasil<Pengaduan>>
  aksi(user: Pengguna, id: string, aksi: Aksi, isian?: { alasan?: string; hasil?: string; catatan?: string }): Promise<Hasil>
  setUrgensi(user: Pengguna, id: string, urgensi: Urgensi): Promise<Hasil>
  catatan(user: Pengguna, id: string, teks: string, untukPelapor: boolean): Promise<Hasil>
  /** Publik: hanya angka agregat, tidak pernah baris laporan. */
  statistik(periode: Periode): Promise<StatistikPublik>
}
