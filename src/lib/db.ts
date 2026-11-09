import { useSyncExternalStore } from 'react'
import type { DB, LaporanKondisi, Penilaian, Pengguna, Riwayat, Sekolah } from './types'
import { buatSeed, FASKES_DEMO, KESEHATAN_DEMO } from './seed'
import { buatSeedPengaduan } from './seed-pengaduan'
import { lastSchoolDay, monthKey, monthsBack, nowTime, schoolDaysBefore, today } from './date'

/**
 * Lapisan data. Saat ini memakai localStorage + data contoh agar aplikasi langsung berjalan tanpa backend.
 * Skema yang sama tersedia untuk Supabase di /supabase/schema.sql (tahap berikutnya).
 */
const KEY = 'rantang-terang-db-v2' // kunci tetap; versi skema ada di field `versi`
let state: DB = load()
const listeners = new Set<() => void>()

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DB
      if (parsed.versi === 3) return parsed
      if (parsed.versi === 2) return migrasiV3(parsed)
    }
  } catch { /* abaikan */ }
  return buatSeed()
}

/** v2 → v3: tambah laporan masalah, faskes, dan akun pihak kesehatan tanpa menghapus data demo lama. */
function migrasiV3(d: DB): DB {
  const { pengaduan, jejak } = buatSeedPengaduan()
  return {
    ...d,
    versi: 3,
    faskes: [FASKES_DEMO],
    pengaduan,
    jejak,
    pengguna: d.pengguna.some((p) => p.id === KESEHATAN_DEMO.id) ? d.pengguna : [...d.pengguna, KESEHATAN_DEMO],
    sekolah: d.sekolah.map((s) => (s.wilayahId === 'uji' && !s.faskesId ? { ...s, faskesId: FASKES_DEMO.id } : s)),
  }
}

let gagalSimpan = false
/** true bila penulisan terakhir ke localStorage gagal (penuh/terblokir): data hanya ada di memori. */
export const simpanTerakhirGagal = () => gagalSimpan
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); gagalSimpan = false } catch { gagalSimpan = true }
}

export function mutate(fn: (d: DB) => void) {
  const next = structuredClone(state)
  fn(next)
  state = next
  save()
  listeners.forEach((l) => l())
}

export function resetDemo() {
  state = buatSeed()
  save()
  listeners.forEach((l) => l())
}

export function useDB(): DB {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => state,
  )
}

export const getDB = () => state
const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/* ---------- Kueri ---------- */

export const hariOperasional = () => lastSchoolDay()

export const menuHariIni = (d: DB, sppgId: string | undefined, tanggal = hariOperasional()) =>
  sppgId ? d.menu.find((m) => m.sppgId === sppgId && m.tanggal === tanggal) : undefined

export const sekolahById = (d: DB, id?: string) => d.sekolah.find((s) => s.id === id)
export const wilayahById = (d: DB, id?: string) => d.wilayah.find((w) => w.id === id)
export const sppgById = (d: DB, id?: string) => d.sppg.find((s) => s.id === id)

/** Statistik bulan berjalan: data dasar (riwayat) + penilaian/keluhan baru dari pengguna. */
export function statBulanIni(d: DB, schoolId: string) {
  const bulan = monthKey(today())
  const base = d.riwayat.find((r) => r.schoolId === schoolId && r.bulan === bulan)
  const baru = d.penilaian.filter((p) => p.schoolId === schoolId && !p.demo && monthKey(p.tanggal) === bulan)
  const sebaran = [...(base?.sebaran ?? [0, 0, 0, 0, 0])] as Riwayat['sebaran']
  baru.forEach((p) => { sebaran[p.bintang - 1] += 1 })
  const total = sebaran.reduce((a, b) => a + b, 0)
  const baseTotal = (base?.sebaran ?? [0, 0, 0, 0, 0]).reduce((a, b) => a + b, 0)
  const sumBaru = baru.reduce((a, p) => a + p.bintang, 0)
  const rata = total ? ((base?.rataBintang ?? 0) * baseTotal + sumBaru) / total : 0
  const keluhanBaru = d.laporan.filter((l) => l.schoolId === schoolId && !l.demo && l.kondisi === 'keluhan' && monthKey(l.tanggal) === bulan).length
  const sebelumnya = d.riwayat.find((r) => r.schoolId === schoolId && r.bulan === monthsBack(2)[0])
  return {
    rata: +rata.toFixed(1),
    total,
    sebaran,
    keluhan: (base?.keluhan ?? 0) + keluhanBaru,
    selisih: sebelumnya ? +(rata - sebelumnya.rataBintang).toFixed(1) : 0,
    aspek: base?.aspek ?? { rasa: 0, porsi: 0, kesegaran: 0, variasi: 0 },
  }
}

export function tren(d: DB, schoolId: string) {
  return monthsBack(6).map((b) => {
    const r = d.riwayat.find((x) => x.schoolId === schoolId && x.bulan === b)
    return { bulan: b, rata: b === monthKey(today()) ? statBulanIni(d, schoolId).rata : r?.rataBintang ?? 0, keluhan: r?.keluhan ?? 0 }
  })
}

export function partisipasi(d: DB, s: Sekolah) {
  const bulan = monthKey(today())
  const pelaporBaru = new Set(
    [...d.laporan, ...d.penilaian]
      .filter((x) => x.schoolId === s.id && !x.demo && monthKey(x.tanggal) === bulan)
      .map((x) => x.userId),
  ).size
  const aktif = Math.min(s.akunTerdaftar, s.pelaporAktifSeed + pelaporBaru)
  const terdaftar = Math.max(s.akunTerdaftar, pelaporBaru)
  return { aktif: Math.min(terdaftar, s.pelaporAktifSeed + pelaporBaru), terdaftar, persen: terdaftar ? Math.round((Math.min(terdaftar, s.pelaporAktifSeed + pelaporBaru) / terdaftar) * 100) : 0 }
}

export const peringkatSekolah = (d: DB) =>
  [...d.sekolah].map((s) => ({ s, ...partisipasi(d, s) })).filter((x) => x.terdaftar > 0).sort((a, b) => b.persen - a.persen)

export interface Masukan {
  id: string
  schoolId: string
  tanggal: string
  jenis: 'penilaian' | 'keluhan'
  teks: string
  bintang?: number
  gejala?: string[]
  demo?: boolean
}

/** Masukan publik: agregat tanpa nama pelapor. */
export function daftarMasukan(d: DB, filter?: { schoolId?: string; sppgId?: string }) {
  const sekolahSppg = filter?.sppgId ? d.sekolah.filter((s) => s.sppgId === filter.sppgId).map((s) => s.id) : null
  const lolos = (schoolId: string) => (!filter?.schoolId || filter.schoolId === schoolId) && (!sekolahSppg || sekolahSppg.includes(schoolId))
  const dariNilai: Masukan[] = d.penilaian
    .filter((p) => p.catatan && lolos(p.schoolId))
    .map((p) => ({ id: p.id, schoolId: p.schoolId, tanggal: p.tanggal, jenis: 'penilaian', teks: p.catatan!, bintang: p.bintang, demo: p.demo }))
  const dariLaporan: Masukan[] = d.laporan
    .filter((l) => l.kondisi === 'keluhan' && l.catatan && lolos(l.schoolId))
    .map((l) => ({ id: l.id, schoolId: l.schoolId, tanggal: l.tanggal, jenis: 'keluhan', teks: l.catatan!, gejala: l.gejala, demo: l.demo }))
  return [...dariNilai, ...dariLaporan].sort((a, b) => b.tanggal.localeCompare(a.tanggal))
}

export const tanggapanUntuk = (d: DB, targetId: string) => d.tanggapan.find((t) => t.targetId === targetId)

/** Ambang peringatan: >=3 keluhan, >=2% siswa, dari >=2 kelas pada hari yang sama. */
export function cekAmbang(d: DB, schoolId: string, tanggal = hariOperasional()) {
  const s = sekolahById(d, schoolId)
  const keluhan = d.laporan.filter((l) => l.schoolId === schoolId && l.tanggal === tanggal && l.kondisi === 'keluhan')
  const anak = keluhan.reduce((a, l) => a + (l.jumlah ?? 1), 0)
  const kelas = new Set(keluhan.map((l) => l.kelas ?? '?')).size
  const persen = s ? (anak / s.siswa) * 100 : 0
  return { jumlah: keluhan.length, anak, kelas, persen: +persen.toFixed(1), terlampaui: keluhan.length >= 3 && persen >= 2 && kelas >= 2 }
}

/* ---------- Aksi ---------- */

export const sudahLaporHariIni = (d: DB, userId: string) => d.laporan.some((l) => l.userId === userId && l.tanggal === hariOperasional())
export const sudahNilaiHariIni = (d: DB, userId: string) => d.penilaian.some((p) => p.userId === userId && p.tanggal === hariOperasional())
export const fotoSiswaHariIni = (d: DB, userId: string) => d.foto.find((f) => f.userId === userId && f.jenis === 'siswa' && f.tanggal === hariOperasional())

export function kirimLaporan(user: Pengguna, data: Pick<LaporanKondisi, 'kondisi' | 'gejala' | 'jumlah' | 'catatan'>) {
  let hasil: { ok: boolean; pesan: string } = { ok: false, pesan: '' }
  mutate((d) => {
    if (sudahLaporHariIni(d, user.id)) { hasil = { ok: false, pesan: 'Kamu sudah melapor kondisi hari ini.' }; return }
    const id = uid('l')
    d.laporan.push({ id, userId: user.id, schoolId: user.schoolId!, kelas: user.kelas, tanggal: hariOperasional(), waktu: nowTime(), ...data })
    const amb = cekAmbang(d, user.schoolId!)
    if (amb.terlampaui && !d.peringatan.some((p) => p.schoolId === user.schoolId && p.tanggal === hariOperasional())) {
      d.peringatan.push({ id: uid('w'), schoolId: user.schoolId!, tanggal: hariOperasional(), status: 'menunggu' })
    }
    hasil = { ok: true, pesan: 'Laporan terkirim.' }
  })
  return hasil
}

export function kirimPenilaian(user: Pengguna, data: Pick<Penilaian, 'bintang' | 'aspek' | 'catatan'>) {
  let hasil = { ok: false, pesan: '' }
  mutate((d) => {
    if (sudahNilaiHariIni(d, user.id)) { hasil = { ok: false, pesan: 'Kamu sudah menilai menu hari ini.' }; return }
    const id = uid('r')
    d.penilaian.push({ id, userId: user.id, schoolId: user.schoolId!, tanggal: hariOperasional(), ...data })
    hasil = { ok: true, pesan: 'Penilaian terkirim.' }
  })
  return hasil
}

export function simpanFoto(user: Pengguna, jenis: 'penerimaan' | 'makan' | 'siswa', dataUrl: string) {
  mutate((d) => {
    d.foto = d.foto.filter((f) => !(f.schoolId === user.schoolId && f.tanggal === hariOperasional() && f.jenis === jenis && (jenis !== 'siswa' || f.userId === user.id)))
    d.foto.push({ id: uid('f'), schoolId: user.schoolId!, tanggal: hariOperasional(), jenis, userId: user.id, dataUrl })
  })
}

export function cocokkanMenu(user: Pengguna, cocok: 'sesuai' | 'tidak') {
  mutate((d) => {
    d.foto.filter((f) => f.schoolId === user.schoolId && f.tanggal === hariOperasional() && f.jenis !== 'siswa').forEach((f) => { f.cocok = cocok })
  })
}

export function tandaiDiperiksa(schoolId: string) {
  mutate((d) => {
    const p = d.peringatan.find((x) => x.schoolId === schoolId && x.tanggal === hariOperasional())
    if (p) p.status = 'diperiksa'
    else d.peringatan.push({ id: uid('w'), schoolId, tanggal: hariOperasional(), status: 'diperiksa' })
  })
}

export function beriTanggapan(sppgId: string, targetId: string, jenis: 'perbaiki' | 'tidak_sesuai', isi: string) {
  mutate((d) => {
    // laporan asli tidak diubah; tanggapan disimpan terpisah
    d.tanggapan = d.tanggapan.filter((t) => t.targetId !== targetId)
    d.tanggapan.push({ id: uid('t'), targetId, sppgId, jenis, isi, waktu: `${today()} ${nowTime()}` })
  })
}

export function simpanMenu(sppgId: string, items: { nama: string; kategori: string; porsi: string }[], gizi: { energi: number; protein: number; lemak: number; karbo: number }) {
  mutate((d) => {
    const t = hariOperasional()
    const m = d.menu.find((x) => x.sppgId === sppgId && x.tanggal === t)
    if (m) { m.items = items as never; m.gizi = gizi }
  })
}

export function buatRujukan(user: Pengguna, gejala: string[]) {
  const token = Math.random().toString(36).slice(2, 10)
  const now = new Date()
  const sampai = new Date(now.getTime() + 24 * 3600 * 1000)
  mutate((d) => {
    d.rujukan.push({ token, userId: user.id, schoolId: user.schoolId!, dibuat: now.toISOString(), berlakuHingga: sampai.toISOString(), gejala, dicabut: false })
  })
  return token
}

export function cabutRujukan(token: string) {
  mutate((d) => { const r = d.rujukan.find((x) => x.token === token); if (r) r.dicabut = true })
}

export function daftarPengguna(u: Omit<Pengguna, 'id'>) {
  let hasil: { ok: boolean; pesan: string; user?: Pengguna } = { ok: false, pesan: '' }
  mutate((d) => {
    if (d.pengguna.some((p) => p.username === u.username)) { hasil = { ok: false, pesan: 'Nomor ini sudah terdaftar. Silakan masuk.' }; return }
    const user = { ...u, id: uid('u') }
    d.pengguna.push(user)
    hasil = { ok: true, pesan: 'Akun dibuat.', user }
  })
  return hasil
}
