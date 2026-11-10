import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { modeOnline } from '../supabase'
import { useDB } from '../db'
import { repoLokal } from './lokal'
import { repoSupabase } from './supabase'
import type { Repo } from './types'

export type { Cakupan, DetailPengaduan, Hasil, Mirip, Repo } from './types'

export const repo: Repo = modeOnline ? repoSupabase : repoLokal

/* Revisi global: dinaikkan setiap aksi berhasil agar semua kueri memuat ulang. */
let revisi = 0
const pendengar = new Set<() => void>()
export function segarkan() { revisi++; pendengar.forEach((l) => l()) }
const useRevisi = () => useSyncExternalStore((cb) => { pendengar.add(cb); return () => pendengar.delete(cb) }, () => revisi)

export interface Kueri<T> { data: T | undefined; memuat: boolean; galat: string; muatUlang: () => void }

/** Kueri async sederhana dengan status memuat & galat. Mode lokal ikut berubah saat data lokal berubah. */
export function useKueri<T>(fn: () => Promise<T>, deps: unknown[]): Kueri<T> {
  const rev = useRevisi()
  const lokal = useDB()
  const [st, setSt] = useState<{ data?: T; memuat: boolean; galat: string }>({ memuat: true, galat: '' })
  const [paksa, setPaksa] = useState(0)
  useEffect(() => {
    let batal = false
    setSt((s) => ({ ...s, memuat: true, galat: '' }))
    fn().then(
      (data) => { if (!batal) setSt({ data, memuat: false, galat: '' }) },
      (e: unknown) => { if (!batal) setSt((s) => ({ ...s, memuat: false, galat: (e as Error)?.message || 'Gagal memuat data.' })) },
    )
    return () => { batal = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, rev, paksa, modeOnline ? 0 : lokal])
  const muatUlang = useCallback(() => setPaksa((n) => n + 1), [])
  return { data: st.data, memuat: st.memuat, galat: st.galat, muatUlang }
}
