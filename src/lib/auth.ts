import { useSyncExternalStore } from 'react'
import { getDB, useDB } from './db'
import type { Pengguna } from './types'

/**
 * Sesi demo di browser. Di versi Supabase, ini diganti Supabase Auth.
 * PIN salah 5 kali -> akun dikunci 15 menit.
 */
const SESI = 'rantang-terang-sesi'
const KUNCI = 'rantang-terang-kunci'
const listeners = new Set<() => void>()

const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { /* abaikan */ }
}

let sesiId: string | null = read(SESI)

export function useSesi(): Pengguna | undefined {
  const id = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => sesiId)
  const d = useDB()
  return d.pengguna.find((p) => p.id === id)
}

function setSesi(id: string | null) {
  sesiId = id
  write(SESI, id)
  listeners.forEach((l) => l())
}

type Kunci = Record<string, { gagal: number; sampai?: number }>
const bacaKunci = (): Kunci => { try { return JSON.parse(read(KUNCI) ?? '{}') } catch { return {} } }

export function masuk(username: string, pin: string): { ok: boolean; pesan: string; user?: Pengguna } {
  const u = username.trim()
  const kunci = bacaKunci()
  const k = kunci[u]
  if (k?.sampai && k.sampai > Date.now()) {
    const menit = Math.ceil((k.sampai - Date.now()) / 60000)
    return { ok: false, pesan: `Terlalu banyak percobaan. Coba lagi dalam ${menit} menit.` }
  }
  const user = getDB().pengguna.find((p) => p.username.toLowerCase() === u.toLowerCase())
  if (!user || user.pin !== pin) {
    const gagal = (k?.gagal ?? 0) + 1
    kunci[u] = gagal >= 5 ? { gagal: 0, sampai: Date.now() + 15 * 60000 } : { gagal }
    write(KUNCI, JSON.stringify(kunci))
    // pesan sengaja tidak menyebut bagian mana yang salah
    return { ok: false, pesan: gagal >= 5 ? 'Terlalu banyak percobaan. Akun dikunci 15 menit.' : 'Nomor/ID atau PIN tidak sesuai.' }
  }
  delete kunci[u]
  write(KUNCI, JSON.stringify(kunci))
  setSesi(user.id)
  return { ok: true, pesan: '', user }
}

export const masukSebagai = (user: Pengguna) => setSesi(user.id)
export const keluar = () => setSesi(null)

export const labelPeran: Record<Pengguna['peran'], string> = {
  ortu: 'Orang tua / wali',
  siswa: 'Siswa / santri',
  guru: 'Guru / tenaga kependidikan',
  petugas: 'Petugas sekolah',
  sppg: 'Mitra SPPG',
}
