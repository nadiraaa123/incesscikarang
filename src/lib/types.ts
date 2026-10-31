export type Peran = 'ortu' | 'siswa' | 'guru' | 'petugas' | 'sppg'
export type Jenjang = 'PAUD' | 'SD' | 'SMP' | 'SMA' | 'SLB' | 'Pesantren'
export type Kategori = 'Makanan pokok' | 'Lauk pauk' | 'Sayur' | 'Buah' | 'Susu'

export interface Sekolah {
  id: string
  nama: string
  npsn: string
  jenjang: Jenjang
  kab: string
  kec: string
  sppgId: string
  siswa: number
  akunTerdaftar: number
  pelaporAktifSeed: number
  tertibCatat: boolean
}

export interface Sppg {
  id: string
  nama: string
  kab: string
  alamat: string
}

export interface MenuItem {
  nama: string
  kategori: Kategori
  porsi: string
}

export interface LangkahProses {
  langkah: string
  waktu: string
  sumber: 'SPPG' | 'Sekolah'
}

export interface Menu {
  id: string
  sppgId: string
  tanggal: string
  items: MenuItem[]
  gizi: { energi: number; protein: number; lemak: number; karbo: number }
  proses: LangkahProses[]
}

export interface Pengguna {
  id: string
  username: string
  pin: string
  nama: string
  peran: Peran
  schoolId?: string
  kelas?: string
  anak?: string
  waOrtu?: string
  sppgId?: string
  demo?: boolean
}

export interface Undangan {
  kode: string
  schoolId: string
  kelas?: string
  tipe: 'kelas' | 'staf'
}

export interface LaporanKondisi {
  id: string
  userId: string
  schoolId: string
  kelas?: string
  tanggal: string
  waktu: string
  kondisi: 'aman' | 'keluhan'
  gejala: string[]
  jumlah?: number
  catatan?: string
  demo?: boolean
}

export interface Penilaian {
  id: string
  userId: string
  schoolId: string
  tanggal: string
  bintang: number
  aspek: { rasa: number; porsi: number; kesegaran: number; variasi: number }
  catatan?: string
  demo?: boolean
}

export interface Tanggapan {
  id: string
  targetId: string
  sppgId: string
  jenis: 'perbaiki' | 'tidak_sesuai'
  isi: string
  waktu: string
}

export interface Foto {
  id: string
  schoolId: string
  tanggal: string
  jenis: 'penerimaan' | 'makan' | 'siswa'
  userId: string
  dataUrl: string
  cocok?: 'sesuai' | 'tidak'
}

export interface PoinLog {
  id: string
  userId: string
  kode: 'LAPOR_KONDISI' | 'PENILAIAN' | 'FOTO_SISWA' | 'CATAT_PETUGAS' | 'TIDAK_BENAR'
  poin: number
  ref?: string
  waktu: string
  ket: string
}

export interface Riwayat {
  schoolId: string
  bulan: string
  rataBintang: number
  keluhan: number
  sebaran: [number, number, number, number, number]
  aspek: { rasa: number; porsi: number; kesegaran: number; variasi: number }
}

export interface Peringatan {
  id: string
  schoolId: string
  tanggal: string
  status: 'menunggu' | 'diperiksa'
}

export interface Rujukan {
  token: string
  userId: string
  schoolId: string
  dibuat: string
  berlakuHingga: string
  gejala: string[]
  dicabut: boolean
}

export interface DB {
  versi: number
  sekolah: Sekolah[]
  sppg: Sppg[]
  menu: Menu[]
  pengguna: Pengguna[]
  undangan: Undangan[]
  laporan: LaporanKondisi[]
  penilaian: Penilaian[]
  tanggapan: Tanggapan[]
  foto: Foto[]
  poin: PoinLog[]
  riwayat: Riwayat[]
  peringatan: Peringatan[]
  rujukan: Rujukan[]
}
