import { useSyncExternalStore } from 'react'
import type { DB, LaporanKondisi, Penilaian, PoinLog, Pengguna, Riwayat, Sekolah } from './types'
import { buatSeed } from './seed'
import { lastSchoolDay, monthKey, monthsBack, nowTime, schoolDaysBefore, today } from './date'

/**
 * Lapisan data. Saat ini memakai localStorage + data contoh agar aplikasi langsung berjalan tanpa backend.
 * Skema yang sama tersedia untuk Supabase di /supabase/schema.sql (tahap berikutnya).
 */
const KEY = 'rantang-terang-db-v1'
let state: DB = load()
const listeners = new Set<() => void>()

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DB
      if (parsed.versi === 1) return parsed
    }
  } catch { /* abaikan */ }
  return buatSeed()
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* penyimpanan penuh/terblokir */ }
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

export const menuHariIni = (d: DB, sppgId: string, tanggal = hariOperasional()) =>
  d.menu.find((m) => m.sppgId === sppgId && m.tanggal === tanggal)

export const sekolahById = (d: DB, id?: string) => d.sekolah.find((s) => s.id === id)
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
  return { aktif, terdaftar: s.akunTerdaftar, persen: Math.round((aktif / s.akunTerdaftar) * 100) }
}

export const peringkatSekolah = (d: DB) =>
  [...d.sekolah].map((s) => ({ s, ...partisipasi(d, s) })).sort((a, b) => b.persen - a.persen)

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

/* ---------- Gamifikasi ---------- */

export const LEVEL = [
  { nama: 'Pemula', min: 0 },
  { nama: 'Pemantau', min: 50 },
  { nama: 'Penjaga Piring', min: 200 },
  { nama: 'Penjaga Teladan', min: 500 },
]

export function profilPoin(d: DB, userId: string) {
  const log = d.poin.filter((p) => p.userId === userId).sort((a, b) => b.waktu.localeCompare(a.waktu))
  const total = log.reduce((a, p) => a + p.poin, 0)
  let idx = 0
  LEVEL.forEach((l, i) => { if (total >= l.min) idx = i })
  const next = LEVEL[idx + 1]
  return { log, total, level: LEVEL[idx].nama, next: next?.nama, kurang: next ? next.min - total : 0, progres: next ? (total - LEVEL[idx].min) / (next.min - LEVEL[idx].min) : 1 }
}

export function streak(d: DB, userId: string) {
  const hari = new Set(d.laporan.filter((l) => l.userId === userId).map((l) => l.tanggal))
  hari.forEach(() => {})
  const acuan = hariOperasional()
  let n = hari.has(acuan) ? 1 : 0
  for (const t of schoolDaysBefore(acuan, 30)) {
    if (hari.has(t)) n++
    else break
  }
  return n
}

export function badge(d: DB, user: Pengguna) {
  const nLapor = d.laporan.filter((l) => l.userId === user.id).length
  const nNilai = d.penilaian.filter((p) => p.userId === user.id).length + d.poin.filter((p) => p.userId === user.id && p.kode === 'PENILAIAN').length
  const s = sekolahById(d, user.schoolId)
  const st = streak(d, user.id)
  return [
    { kode: 'pertama', nama: 'Pelapor Pertama', ket: 'Kirim laporan pertamamu', terbuka: nLapor > 0, progres: nLapor > 0 ? 'Terbuka' : '0/1' },
    { kode: 'rutin', nama: 'Rutin 5 Hari', ket: 'Lapor 5 hari sekolah berturut-turut', terbuka: st >= 5, progres: `${Math.min(st, 5)}/5` },
    { kode: 'teliti', nama: 'Penilai Teliti', ket: 'Beri 20 penilaian menu', terbuka: nNilai >= 20, progres: `${Math.min(nNilai, 20)}/20` },
    { kode: 'tertib', nama: 'Sekolah Tertib Catat', ket: 'Petugas sekolahmu mencatat 20 hari lengkap', terbuka: !!s?.tertibCatat, progres: s?.tertibCatat ? 'Terbuka' : 'Terkunci' },
  ]
}

function beriPoin(d: DB, p: Omit<PoinLog, 'id' | 'waktu'>) {
  d.poin.push({ ...p, id: uid('p'), waktu: `${today()} ${nowTime()}` })
}

/* ---------- Aksi ---------- */

export const sudahLaporHariIni = (d: DB, userId: string) => d.laporan.some((l) => l.userId === userId && l.tanggal === hariOperasional())
export const sudahNilaiHariIni = (d: DB, userId: string) => d.penilaian.some((p) => p.userId === userId && p.tanggal === hariOperasional())
export const fotoSiswaHariIni = (d: DB, userId: string) => d.foto.find((f) => f.userId === userId && f.jenis === 'siswa' && f.tanggal === hariOperasional())

export function kirimLaporan(user: Pengguna, data: Pick<LaporanKondisi, 'kondisi' | 'gejala' | 'jumlah' | 'catatan'>) {
  let hasil: { ok: boolean; pesan: string; poin: number } = { ok: false, pesan: '', poin: 0 }
  mutate((d) => {
    if (sudahLaporHariIni(d, user.id)) { hasil = { ok: false, pesan: 'Kamu sudah melapor kondisi hari ini.', poin: 0 }; return }
    const id = uid('l')
    d.laporan.push({ id, userId: user.id, schoolId: user.schoolId!, kelas: user.kelas, tanggal: hariOperasional(), waktu: nowTime(), ...data })
    beriPoin(d, { userId: user.id, kode: 'LAPOR_KONDISI', poin: 10, ref: id, ket: 'Lapor kondisi harian' })
    const amb = cekAmbang(d, user.schoolId!)
    if (amb.terlampaui && !d.peringatan.some((p) => p.schoolId === user.schoolId && p.tanggal === hariOperasional())) {
      d.peringatan.push({ id: uid('w'), schoolId: user.schoolId!, tanggal: hariOperasional(), status: 'menunggu' })
    }
    hasil = { ok: true, pesan: 'Laporan terkirim.', poin: 10 }
  })
  return hasil
}

export function kirimPenilaian(user: Pengguna, data: Pick<Penilaian, 'bintang' | 'aspek' | 'catatan'>) {
  let hasil = { ok: false, pesan: '', poin: 0 }
  mutate((d) => {
    if (sudahNilaiHariIni(d, user.id)) { hasil = { ok: false, pesan: 'Kamu sudah menilai menu hari ini.', poin: 0 }; return }
    const id = uid('r')
    d.penilaian.push({ id, userId: user.id, schoolId: user.schoolId!, tanggal: hariOperasional(), ...data })
    beriPoin(d, { userId: user.id, kode: 'PENILAIAN', poin: 5, ref: id, ket: 'Penilaian menu' })
    hasil = { ok: true, pesan: 'Penilaian terkirim.', poin: 5 }
  })
  return hasil
}

export function simpanFoto(user: Pengguna, jenis: 'penerimaan' | 'makan' | 'siswa', dataUrl: string) {
  mutate((d) => {
    d.foto = d.foto.filter((f) => !(f.schoolId === user.schoolId && f.tanggal === hariOperasional() && f.jenis === jenis && (jenis !== 'siswa' || f.userId === user.id)))
    d.foto.push({ id: uid('f'), schoolId: user.schoolId!, tanggal: hariOperasional(), jenis, userId: user.id, dataUrl })
    if (jenis === 'siswa' && !d.poin.some((p) => p.userId === user.id && p.kode === 'FOTO_SISWA' && p.waktu.startsWith(today()))) {
      beriPoin(d, { userId: user.id, kode: 'FOTO_SISWA', poin: 5, ket: 'Foto sebelum makan' })
    }
  })
}

export function cocokkanMenu(user: Pengguna, cocok: 'sesuai' | 'tidak') {
  mutate((d) => {
    d.foto.filter((f) => f.schoolId === user.schoolId && f.tanggal === hariOperasional() && f.jenis !== 'siswa').forEach((f) => { f.cocok = cocok })
    if (!d.poin.some((p) => p.userId === user.id && p.kode === 'CATAT_PETUGAS' && p.waktu.startsWith(today()))) {
      beriPoin(d, { userId: user.id, kode: 'CATAT_PETUGAS', poin: 10, ket: 'Dua foto & cocokkan menu' })
    }
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
