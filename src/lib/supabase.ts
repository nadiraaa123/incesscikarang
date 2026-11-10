import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mode online aktif hanya bila VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY diisi (di Vercel: Environment Variables).
 * Anon key memang publik; keamanan bergantung pada RLS di supabase/schema.sql.
 * JANGAN pernah menaruh service role key di frontend.
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const modeOnline = !!(URL && KEY)

let klienP: Promise<SupabaseClient> | null = null
/** SDK dimuat saat pertama dibutuhkan agar mode demo tidak menanggung ukuran bundle-nya. */
export function klien(): Promise<SupabaseClient> {
  if (!modeOnline) return Promise.reject(new Error('Supabase belum dikonfigurasi'))
  klienP ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL!, KEY!, { auth: { persistSession: true, autoRefreshToken: true } }))
  return klienP
}

/** Akun memakai nomor WA/ID + PIN. Supabase Auth butuh email, jadi dipetakan ke alamat sintetis (tanpa email sungguhan). */
export const emailAkun = (username: string) => `${username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')}@akun.rantangterang.id`

/** Pesan galat Postgres/PostgREST → kalimat yang bisa dibaca pengguna. */
export function pesanGalat(e: unknown, cadangan = 'Terjadi kesalahan. Coba lagi.') {
  const m = (e as { message?: string })?.message ?? ''
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.'
  if (/JWT|not authenticated|Belum masuk/i.test(m)) return 'Sesi berakhir. Silakan masuk kembali.'
  return m || cadangan
}
