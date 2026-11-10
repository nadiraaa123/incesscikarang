import { useSyncExternalStore } from 'react'
import { daftarPengguna, getDB, useDB } from './db'
import { emailAkun, klien, modeOnline, pesanGalat } from './supabase'
import type { Pengguna, Peran } from './types'

/**
 * Sesi pengguna.
 *  - Mode demo (tanpa env Supabase): akun contoh di browser, PIN dicek lokal.
 *  - Mode online: Supabase Auth (email sintetis dari nomor/ID + PIN sebagai kata sandi), profil & peran dari tabel `profil`.
 * PIN salah 5 kali -> dikunci 15 menit di perangkat ini (Supabase juga punya rate limit sendiri).
 */
const SESI = 'rantang-terang-sesi'
const KUNCI = 'rantang-terang-kunci'
const listeners = new Set<() => void>()
const beri = () => listeners.forEach((l) => l())
const langgan = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb) }

const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { /* abaikan */ }
}

let sesiId: string | null = modeOnline ? null : read(SESI)
let profilOnline: Pengguna | undefined
let siap = !modeOnline

async function muatProfilOnline(userId?: string) {
  if (!userId) { profilOnline = undefined; return }
  const sb = await klien()
  const { data } = await sb.from('profil').select('*').eq('user_id', userId).maybeSingle()
  const { data: u } = await sb.auth.getUser()
  profilOnline = data ? {
    id: data.user_id, username: (u.user?.email ?? '').split('@')[0], pin: '', nama: data.nama_tampil, peran: data.peran as Peran,
    schoolId: data.sekolah_id ?? undefined, kelas: data.kelas ?? undefined, sppgId: data.sppg_id ?? undefined, faskesId: data.faskes_id ?? undefined,
  } : undefined
}

if (modeOnline) {
  klien().then(async (sb) => {
    const { data } = await sb.auth.getSession()
    await muatProfilOnline(data.session?.user.id).catch(() => undefined)
    siap = true
    beri()
    sb.auth.onAuthStateChange((_e, session) => {
      // jangan await di dalam callback (anjuran supabase-js)
      setTimeout(() => { muatProfilOnline(session?.user.id).catch(() => undefined).finally(beri) }, 0)
    })
  }).catch(() => { siap = true; beri() })
}

/** false selama sesi online dipulihkan (cegah lompat ke halaman Masuk saat memuat ulang). */
export const useSesiSiap = () => useSyncExternalStore(langgan, () => siap)

export function useSesi(): Pengguna | undefined {
  const id = useSyncExternalStore(langgan, () => (modeOnline ? profilOnline : sesiId))
  const d = useDB()
  if (modeOnline) return id as Pengguna | undefined
  return d.pengguna.find((p) => p.id === id)
}

function setSesi(id: string | null) {
  sesiId = id
  write(SESI, id)
  beri()
}

type Kunci = Record<string, { gagal: number; sampai?: number }>
const bacaKunci = (): Kunci => { try { return JSON.parse(read(KUNCI) ?? '{}') } catch { return {} } }

export type HasilMasuk = { ok: boolean; pesan: string; user?: Pengguna }

export async function masuk(username: string, pin: string): Promise<HasilMasuk> {
  const u = username.trim()
  const kunci = bacaKunci()
  const k = kunci[u]
  if (k?.sampai && k.sampai > Date.now()) {
    const menit = Math.ceil((k.sampai - Date.now()) / 60000)
    return { ok: false, pesan: `Terlalu banyak percobaan. Coba lagi dalam ${menit} menit.` }
  }
  const gagalMasuk = () => {
    const gagal = (k?.gagal ?? 0) + 1
    kunci[u] = gagal >= 5 ? { gagal: 0, sampai: Date.now() + 15 * 60000 } : { gagal }
    write(KUNCI, JSON.stringify(kunci))
    // pesan sengaja tidak menyebut bagian mana yang salah
    return { ok: false, pesan: gagal >= 5 ? 'Terlalu banyak percobaan. Akun dikunci 15 menit.' : 'Nomor/ID atau PIN tidak sesuai.' }
  }
  const berhasil = (user: Pengguna) => { delete kunci[u]; write(KUNCI, JSON.stringify(kunci)); return { ok: true, pesan: '', user } }

  if (modeOnline) {
    try {
      const sb = await klien()
      const { data, error } = await sb.auth.signInWithPassword({ email: emailAkun(u), password: pin })
      if (error) return /invalid/i.test(error.message) ? gagalMasuk() : { ok: false, pesan: pesanGalat(error) }
      await muatProfilOnline(data.user.id)
      beri()
      if (!profilOnline) return { ok: false, pesan: 'Akun ditemukan tetapi profil/peran belum dibuat. Hubungi admin sekolah.' }
      return berhasil(profilOnline)
    } catch (e) {
      return { ok: false, pesan: pesanGalat(e) }
    }
  }
  const user = getDB().pengguna.find((p) => p.username.toLowerCase() === u.toLowerCase())
  if (!user || user.pin !== pin) return gagalMasuk()
  setSesi(user.id)
  return berhasil(user)
}

/** Tombol akun demo. Mode online: masuk dengan akun demo yang dibuat scripts/buat-akun-demo.mjs. */
export async function masukSebagai(user: Pengguna): Promise<HasilMasuk> {
  if (modeOnline) return masuk(user.username, '123456')
  setSesi(user.id)
  return { ok: true, pesan: '', user }
}

export async function keluar() {
  if (modeOnline) { const sb = await klien(); await sb.auth.signOut(); profilOnline = undefined; beri(); return }
  setSesi(null)
}

export async function daftar(u: Omit<Pengguna, 'id'>, kode: string): Promise<HasilMasuk> {
  if (modeOnline) {
    try {
      const sb = await klien()
      const { error } = await sb.auth.signUp({ email: emailAkun(u.username), password: u.pin })
      if (error) return { ok: false, pesan: /registered/i.test(error.message) ? 'Nomor ini sudah terdaftar. Silakan masuk.' : pesanGalat(error) }
      const { error: e2 } = await sb.rpc('daftar_dengan_undangan', { p_kode: kode, p_nama: u.nama, p_peran: u.peran })
      if (e2) return { ok: false, pesan: pesanGalat(e2) }
      const { data } = await sb.auth.getUser()
      await muatProfilOnline(data.user?.id)
      beri()
      return profilOnline ? { ok: true, pesan: '', user: profilOnline } : { ok: false, pesan: 'Profil gagal dibuat.' }
    } catch (e) { return { ok: false, pesan: pesanGalat(e) } }
  }
  const r = daftarPengguna(u)
  if (r.ok && r.user) setSesi(r.user.id)
  return r
}

export { labelPeran } from './labels'
