// Membuat akun demo di Supabase Auth + baris profil (peran & cakupan).
// JALANKAN DI KOMPUTER ADMIN, BUKAN DI FRONTEND/VERCEL:
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/buat-akun-demo.mjs
// Service role key melewati RLS; jangan pernah di-commit atau diberi awalan VITE_.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1) }
const sb = createClient(url, key, { auth: { persistSession: false } })
const email = (u) => `${u.toLowerCase().replace(/[^a-z0-9._-]/g, '')}@akun.rantangterang.id` // sama dengan emailAkun() di src/lib/supabase.ts

const AKUN = [
  { username: 'demo-ortu-sd', nama_tampil: 'Raka (orang tua)', peran: 'ortu', sekolah_id: 'uji-sd-1', kelas: '4A' },
  { username: 'demo-siswa-smp', nama_tampil: 'Dimas', peran: 'siswa', sekolah_id: 'uji-smp-1', kelas: '8B' },
  { username: 'demo-guru', nama_tampil: 'Bu Ratna', peran: 'guru', sekolah_id: 'uji-sd-1' },
  { username: 'PTG-SD-01', nama_tampil: 'Pak Anton', peran: 'petugas', sekolah_id: 'uji-sd-1' },
  { username: 'PTG-SMP-01', nama_tampil: 'Bu Sari', peran: 'petugas', sekolah_id: 'uji-smp-1' },
  { username: 'SPPG-DEMO-01', nama_tampil: 'Ibu Dewi (ahli gizi)', peran: 'sppg', sppg_id: 'SPPG-DEMO-01' },
  { username: 'PKM-DEMO-01', nama_tampil: 'dr. Laras (Puskesmas)', peran: 'kesehatan', faskes_id: 'PKM-DEMO-01' },
]
const PIN = process.env.PIN_DEMO ?? '123456'

for (const { username, ...profil } of AKUN) {
  let { data, error } = await sb.auth.admin.createUser({ email: email(username), password: PIN, email_confirm: true })
  if (error && /registered|exists/i.test(error.message)) {
    const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 })
    data = { user: list.users.find((u) => u.email === email(username)) }
    error = null
  }
  if (error || !data?.user) { console.error(`✗ ${username}: ${error?.message}`); continue }
  const { error: e2 } = await sb.from('profil').upsert({ user_id: data.user.id, ...profil })
  console.log(e2 ? `✗ ${username}: ${e2.message}` : `✓ ${username} (${profil.peran})`)
}
