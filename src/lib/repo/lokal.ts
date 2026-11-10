import type { JejakPengaduan, Pengaduan, Pengguna, Peran } from '../types'
import { getDB, mutate, sekolahById, simpanTerakhirGagal, sppgById } from '../db'
import { buatNomor, cariKemiripan, cekAksi, hitungStatistik, STATUS_AKTIF, TRANSISI, validasiLaporan } from '../pengaduan'
import type { DetailPengaduan, Repo } from './types'
import { labelPeran } from '../labels'

/**
 * Mode demo: data di localStorage browser. Pembatasan cakupan di sini meniru aturan RLS Supabase
 * agar alurnya sama, TETAPI bukan pengamanan sungguhan (semua data tetap ada di perangkat).
 * Pembatasan akses yang sebenarnya hanya berlaku di mode Supabase (lihat supabase/schema.sql).
 */

const PELAPOR: Peran[] = ['ortu', 'siswa', 'guru']
const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const sekarang = () => new Date().toISOString()

function bolehLihat(user: Pengguna, p: Pengaduan) {
  if (user.peran === 'petugas') return p.schoolId === user.schoolId
  if (user.peran === 'sppg') return !!p.sppgId && p.sppgId === user.sppgId
  if (user.peran === 'kesehatan') return p.keKesehatan && p.faskesId === user.faskesId
  return p.pelaporId === user.id
}

/** Data yang diserahkan ke mitra (SPPG/kesehatan) dipangkas: tanpa identitas pelapor. */
function untuk(user: Pengguna, p: Pengaduan): Pengaduan {
  if (user.peran === 'sppg' || user.peran === 'kesehatan') return { ...p, pelaporId: '', kemungkinanDuplikat: [] }
  if (PELAPOR.includes(user.peran)) return { ...p, kemungkinanDuplikat: [] }
  return p
}

function jejakTerlihat(user: Pengguna, j: JejakPengaduan) {
  if (PELAPOR.includes(user.peran)) return j.untukPelapor
  if (user.peran === 'sppg') return j.untukPelapor || j.aktorPeran !== 'kesehatan'
  return true
}

const tunda = <T,>(v: T) => Promise.resolve(v)

function catatJejak(d: ReturnType<typeof getDB>, j: Omit<JejakPengaduan, 'id' | 'waktu'>) {
  d.jejak.push({ ...j, id: uid('jj'), waktu: sekarang() })
}

const labelAktor = (u: Pengguna) => (u.peran === 'petugas' ? `Petugas ${sekolahById(getDB(), u.schoolId)?.nama ?? 'sekolah'}` : u.peran === 'sppg' ? sppgById(getDB(), u.sppgId)?.nama ?? 'Mitra SPPG' : u.peran === 'kesehatan' ? getDB().faskes.find((f) => f.id === u.faskesId)?.nama ?? 'Pihak kesehatan' : 'Pelapor')

export const repoLokal: Repo = {
  mode: 'lokal',

  daftar(user, cakupan) {
    const semua = getDB().pengaduan.filter((p) => bolehLihat(user, p))
    const pilih = cakupan === 'verifikasi' ? semua.filter((p) => p.status === 'menunggu_verifikasi') : semua
    return tunda(pilih.map((p) => untuk(user, p)).sort((a, b) => b.dibuat.localeCompare(a.dibuat)))
  },

  detail(user, id) {
    const d = getDB()
    const p = d.pengaduan.find((x) => x.id === id)
    if (!p || !bolehLihat(user, p)) return tunda(null)
    const petugas = d.pengguna.find((u) => u.id === p.petugasId)
    const hasil: DetailPengaduan = {
      p: untuk(user, p),
      jejak: d.jejak.filter((j) => j.pengaduanId === id && jejakTerlihat(user, j)).sort((a, b) => a.waktu.localeCompare(b.waktu)),
      sekolah: sekolahById(d, p.schoolId)?.nama,
      sppg: sppgById(d, p.sppgId)?.nama,
      faskes: d.faskes.find((f) => f.id === p.faskesId)?.nama,
      petugas: petugas ? (user.peran === 'petugas' ? petugas.nama : 'Petugas sekolah') : undefined,
      pelapor: user.peran === 'petugas' ? (() => { const u = d.pengguna.find((x) => x.id === p.pelaporId); return u ? `${u.nama} · ${labelPeran[u.peran]}${u.kelas ? ` · Kelas ${u.kelas}` : ''}` : 'Warga (akun contoh)' })() : undefined,
      mirip: user.peran === 'petugas'
        ? p.kemungkinanDuplikat.map((mid) => d.pengaduan.find((x) => x.id === mid)).filter((x): x is Pengaduan => !!x)
          .map((x) => ({ id: x.id, nomor: x.nomor, status: x.status, pelaporSama: x.pelaporId === p.pelaporId, deskripsi: x.deskripsi }))
        : [],
      fotoTampil: p.fotoUrl,
    }
    return tunda(hasil)
  },

  cekMiripSaya(user, isian) {
    const milik = getDB().pengaduan.filter((p) => p.pelaporId === user.id && p.status !== 'ditolak')
    const ids = cariKemiripan(milik, { ...isian, schoolId: user.schoolId!, pelaporId: user.id })
    return tunda(milik.filter((p) => ids.includes(p.id)))
  },

  async buat(user, isian, foto) {
    if (!PELAPOR.includes(user.peran) || !user.schoolId) return { ok: false, pesan: 'Hanya orang tua/wali, siswa, atau guru yang terdaftar di sekolah yang dapat membuat laporan.' }
    const galat = validasiLaporan(isian)
    if (Object.keys(galat).length) return { ok: false, pesan: 'Periksa kembali isian yang ditandai.', galat }
    let fotoUrl: string | undefined
    if (foto) fotoUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(foto) })
    let dibuat: Pengaduan | undefined
    {
      mutate((d) => {
        const waktu = new Date()
        const p: Pengaduan = {
          id: uid('pg'), nomor: buatNomor(d.pengaduan.length + 1, waktu), pelaporId: user.id, schoolId: user.schoolId!,
          kategori: isian.kategori!, deskripsi: isian.deskripsi.trim(), tanggalKejadian: isian.tanggalKejadian, fotoUrl,
          dibuat: waktu.toISOString(), diperbarui: waktu.toISOString(), status: 'menunggu_verifikasi', keKesehatan: false, kemungkinanDuplikat: [],
        }
        p.kemungkinanDuplikat = cariKemiripan(d.pengaduan, p)
        // tandai dua arah agar petugas melihat kaitan dari laporan mana pun
        p.kemungkinanDuplikat.forEach((mid) => { const q = d.pengaduan.find((x) => x.id === mid); if (q && !q.kemungkinanDuplikat.includes(p.id)) q.kemungkinanDuplikat.push(p.id) })
        d.pengaduan.push(p)
        catatJejak(d, { pengaduanId: p.id, aktorPeran: user.peran, aktorLabel: 'Pelapor', jenis: 'dibuat', ke: 'menunggu_verifikasi', untukPelapor: true })
        dibuat = p
      })
    }
    if (!dibuat) return { ok: false, pesan: 'Laporan gagal disimpan.' }
    if (simpanTerakhirGagal()) {
      const id = dibuat.id
      mutate((d) => { d.pengaduan = d.pengaduan.filter((p) => p.id !== id); d.jejak = d.jejak.filter((j) => j.pengaduanId !== id) })
      return { ok: false, pesan: 'Penyimpanan perangkat penuh, laporan belum tersimpan. Coba kirim tanpa foto atau reset data demo di halaman Tentang.' }
    }
    return { ok: true, data: dibuat }
  },

  aksi(user, id, aksi, isian = {}) {
    const p = getDB().pengaduan.find((x) => x.id === id)
    if (!p || !bolehLihat(user, p)) return tunda({ ok: false, pesan: 'Laporan tidak ditemukan atau di luar kewenanganmu.' })
    const salah = cekAksi(p, aksi, user.peran, isian)
    if (salah) return tunda({ ok: false, pesan: salah })
    const ke = TRANSISI[aksi].ke
    mutate((d) => {
      const q = d.pengaduan.find((x) => x.id === id)!
      const dari = q.status
      q.status = ke
      q.diperbarui = sekarang()
      if (aksi === 'verifikasi' || aksi === 'tolak') q.petugasId = user.id
      if (aksi === 'tolak') q.alasanTolak = isian.alasan!.trim()
      if (aksi === 'teruskan_sppg') q.sppgId = sekolahById(d, q.schoolId)?.sppgId
      if (aksi === 'teruskan_kesehatan') { q.keKesehatan = true; q.faskesId = sekolahById(d, q.schoolId)?.faskesId }
      if (aksi === 'selesaikan') q.hasil = isian.hasil!.trim()
      const catatan = aksi === 'tolak' ? isian.alasan!.trim() : aksi === 'selesaikan' ? isian.hasil!.trim() : isian.catatan?.trim() || undefined
      catatJejak(d, { pengaduanId: id, aktorPeran: user.peran, aktorLabel: labelAktor(user), jenis: 'status', dari, ke, catatan, untukPelapor: true })
    })
    return tunda({ ok: true, data: undefined })
  },

  setUrgensi(user, id, urgensi) {
    const p = getDB().pengaduan.find((x) => x.id === id)
    if (!p || !bolehLihat(user, p) || user.peran !== 'petugas') return tunda({ ok: false, pesan: 'Hanya petugas sekolah yang dapat menetapkan urgensi.' })
    if (!STATUS_AKTIF.includes(p.status)) return tunda({ ok: false, pesan: 'Urgensi ditetapkan setelah laporan terverifikasi dan sebelum selesai.' })
    if (p.urgensi === urgensi) return tunda({ ok: true, data: undefined })
    mutate((d) => {
      const q = d.pengaduan.find((x) => x.id === id)!
      q.urgensi = urgensi
      q.diperbarui = sekarang()
      catatJejak(d, { pengaduanId: id, aktorPeran: user.peran, aktorLabel: labelAktor(user), jenis: 'urgensi', urgensi, untukPelapor: false })
    })
    return tunda({ ok: true, data: undefined })
  },

  catatan(user, id, teks, untukPelapor) {
    const p = getDB().pengaduan.find((x) => x.id === id)
    if (!p || !bolehLihat(user, p) || !['petugas', 'sppg', 'kesehatan'].includes(user.peran)) return tunda({ ok: false, pesan: 'Tidak berwenang menambah catatan.' })
    if (!STATUS_AKTIF.includes(p.status)) return tunda({ ok: false, pesan: 'Catatan hanya untuk laporan yang sedang ditindaklanjuti.' })
    if (teks.trim().length < 10) return tunda({ ok: false, pesan: 'Catatan minimal 10 karakter.' })
    mutate((d) => {
      const q = d.pengaduan.find((x) => x.id === id)!
      q.diperbarui = sekarang()
      // tanggapan SPPG selalu terlihat pelapor; laporan asli tidak pernah diubah
      catatJejak(d, { pengaduanId: id, aktorPeran: user.peran, aktorLabel: labelAktor(user), jenis: user.peran === 'sppg' ? 'tanggapan' : 'catatan', catatan: teks.trim(), untukPelapor: user.peran === 'sppg' ? true : untukPelapor })
    })
    return tunda({ ok: true, data: undefined })
  },

  statistik(periode) {
    // hanya kolom yang dibutuhkan agregat yang dibaca
    return tunda(hitungStatistik(getDB().pengaduan.map(({ status, kategori, dibuat, demo }) => ({ status, kategori, dibuat, demo })), periode))
  },
}
