import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound, School, ShieldCheck, Lock } from 'lucide-react'
import { Brand, Button, Card, Page, TopBar, cx } from '../components/ui'
import { daftarPengguna, getDB, sekolahById, useDB } from '../lib/db'
import { labelPeran, masuk, masukSebagai } from '../lib/auth'
import type { Peran, Undangan } from '../lib/types'

const tujuan = (peran: Peran) => (peran === 'sppg' ? '/mitra/sppg' : '/app')

const input = 'h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-leaf'

export function Masuk() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const d = useDB()
  const [u, setU] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')

  const kirim = (e: React.FormEvent) => {
    e.preventDefault()
    const r = masuk(u, pin)
    if (!r.ok) return setErr(r.pesan)
    nav(params.get('ke') === 'profil' && r.user!.peran !== 'sppg' ? '/app/profil' : tujuan(r.user!.peran))
  }
  const demo = d.pengguna.filter((p) => p.demo)

  return (
    <>
      <TopBar title="Masuk" back="/" />
      <Page nav={false}>
        <div className="mb-5 mt-2"><Brand /></div>
        <h1 className="text-2xl font-extrabold text-ink">Masuk untuk melapor</h1>
        <p className="mt-1 text-sm text-muted">Melihat data sekolah tidak perlu akun. <Link to="/sekolah" className="font-semibold text-leaf">Lihat dasbor publik</Link></p>
        <form onSubmit={kirim} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Nomor WhatsApp atau ID</span>
            <input className={input} value={u} onChange={(e) => setU(e.target.value)} placeholder="08xxxxxxxxxx" autoComplete="username" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">PIN 6 digit</span>
            <input className={input} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" type="password" autoComplete="current-password" placeholder="••••••" />
          </label>
          {err && <p role="alert" className="rounded-lg bg-brick-soft px-3 py-2 text-sm font-semibold text-brick">{err}</p>}
          <Button type="submit" className="w-full" disabled={!u || pin.length !== 6}>Masuk</Button>
        </form>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted"><Lock size={12} /> PIN salah 5 kali, akun dikunci 15 menit.</p>
        <Link to="/daftar" className="mt-4 flex h-12 items-center justify-center rounded-xl border border-line bg-white font-bold text-ink hover:border-leaf">Belum punya akun? Daftar</Link>

        <Card className="mt-6">
          <p className="text-sm font-bold text-ink">Akun demo untuk juri</p>
          <p className="text-xs text-muted">Sekali ketuk, tanpa mengetik PIN (PIN semua akun demo: 123456).</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {demo.map((p) => (
              <button key={p.id} onClick={() => { masukSebagai(p); nav(tujuan(p.peran)) }} className="rounded-lg border border-line px-3 py-2 text-left hover:border-leaf">
                <span className="block text-[13px] font-bold text-ink">{labelPeran[p.peran].split(' / ')[0]}{p.schoolId ? ` ${sekolahById(d, p.schoolId)?.jenjang}` : ''}</span>
                <span className="block truncate text-[11px] text-muted">{p.username}</span>
              </button>
            ))}
          </div>
        </Card>
        <p className="mt-4 text-center text-xs text-muted">SPPG dan fasilitas kesehatan masuk dengan ID mitra yang diverifikasi.</p>
      </Page>
    </>
  )
}

export function Daftar() {
  const nav = useNavigate()
  const [langkah, setLangkah] = useState(1)
  const [kode, setKode] = useState('')
  const [und, setUnd] = useState<Undangan | null>(null)
  const [peran, setPeran] = useState<Peran | null>(null)
  const [f, setF] = useState({ wa: '', nama: '', anak: '', waOrtu: '', pin: '', setuju: false })
  const [err, setErr] = useState('')

  const sekolah = und ? sekolahById(getDB(), und.schoolId) : undefined
  const pilihanPeran: Peran[] = !und || !sekolah ? [] : und.tipe === 'staf' ? ['guru', 'petugas'] : ['PAUD', 'SD', 'SLB'].includes(sekolah.jenjang) ? ['ortu'] : ['siswa']

  const cekKode = (e: React.FormEvent) => {
    e.preventDefault()
    const u = getDB().undangan.find((x) => x.kode.toLowerCase() === kode.trim().toLowerCase())
    if (!u) return setErr('Kode tidak dikenali. Minta kode ke wali kelas atau kepala sekolah.')
    setErr(''); setUnd(u); setLangkah(2)
  }
  const kirim = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^08\d{8,11}$/.test(f.wa)) return setErr('Nomor WhatsApp harus diawali 08 dan berisi 10–13 angka.')
    if (f.pin.length !== 6) return setErr('PIN harus 6 angka.')
    if (peran === 'siswa' && !/^08\d{8,11}$/.test(f.waOrtu)) return setErr('Isi nomor WhatsApp orang tua dengan benar.')
    if (!f.setuju) return setErr('Centang persetujuan penggunaan data terlebih dahulu.')
    const r = daftarPengguna({ username: f.wa, pin: f.pin, nama: f.nama || 'Pengguna', peran: peran!, schoolId: und!.schoolId, kelas: und!.kelas, anak: f.anak || undefined, waOrtu: f.waOrtu || undefined })
    if (!r.ok) return setErr(r.pesan)
    masukSebagai(r.user!)
    nav('/app')
  }

  return (
    <>
      <TopBar title="Daftar" back={langkah > 1 ? undefined : '/masuk'} />
      <Page nav={false}>
        <ol className="mb-5 grid grid-cols-3 gap-2" aria-label="Langkah pendaftaran">
          {['Kode undangan', 'Peran', 'Data & PIN'].map((l, i) => (
            <li key={l}>
              <div className={cx('h-1.5 rounded-full', i < langkah ? 'bg-leaf' : 'bg-line')} />
              <p className={cx('mt-1 text-[11px] font-semibold', i + 1 === langkah ? 'text-leaf' : 'text-muted')}>{i + 1}. {l}</p>
            </li>
          ))}
        </ol>

        {langkah === 1 && (
          <form onSubmit={cekKode}>
            <h1 className="text-xl font-extrabold text-ink">Masukkan kode undangan</h1>
            <p className="mt-1 text-sm text-muted">Kode dibagikan wali kelas (untuk orang tua dan siswa) atau kepala sekolah (untuk guru dan petugas). Kode menentukan sekolah, jenjang, dan kelasmu.</p>
            <div className="relative mt-4">
              <KeyRound size={18} className="absolute left-3 top-3.5 text-muted" />
              <input className={cx(input, 'pl-10 uppercase tracking-wide')} value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Contoh: KLS-SD2TK-4A" aria-label="Kode undangan" />
            </div>
            {err && <p role="alert" className="mt-3 rounded-lg bg-brick-soft px-3 py-2 text-sm font-semibold text-brick">{err}</p>}
            <Button type="submit" className="mt-4 w-full" disabled={!kode}>Lanjut</Button>
            <Card className="mt-5 bg-cream">
              <p className="text-xs font-bold text-ink">Kode contoh untuk demo</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {getDB().undangan.map((x) => (
                  <button type="button" key={x.kode} onClick={() => setKode(x.kode)} className="rounded-md border border-line bg-white px-2 py-1 font-mono text-xs text-ink">{x.kode}</button>
                ))}
              </div>
            </Card>
          </form>
        )}

        {langkah === 2 && sekolah && (
          <div>
            <Card className="flex items-start gap-3 border-leaf/40 bg-leaf-soft/50">
              <School className="mt-0.5 text-leaf" size={20} />
              <div className="flex-1">
                <p className="font-bold text-ink">{sekolah.nama}</p>
                <p className="text-sm text-muted">{sekolah.jenjang}{und?.kelas ? ` · Kelas ${und.kelas}` : ' · Kode staf'} · {sekolah.kab}</p>
              </div>
              <CheckCircle2 className="text-leaf" size={20} />
            </Card>
            <button onClick={() => { setLangkah(1); setUnd(null); setPeran(null) }} className="mt-2 text-sm font-semibold text-leaf">Bukan sekolahmu? Ganti kode</button>
            <h1 className="mt-5 text-xl font-extrabold text-ink">Daftar sebagai</h1>
            <div className="mt-3 space-y-2">
              {pilihanPeran.map((p) => (
                <button key={p} onClick={() => setPeran(p)} className={cx('w-full rounded-xl border bg-white p-4 text-left', peran === p ? 'border-leaf ring-2 ring-leaf/20' : 'border-line')}>
                  <p className="font-bold text-ink">{labelPeran[p]}</p>
                  <p className="text-sm text-muted">
                    {p === 'ortu' && 'Melapor kondisi anak dan menilai menu. Anak PAUD/SD/SLB tidak membuat akun sendiri.'}
                    {p === 'siswa' && 'Foto makanan sebelum makan, lapor kondisi sebelum pulang. Orang tua ikut memantau.'}
                    {p === 'guru' && 'Ikut menerima MBG, melapor kondisi dan menilai menu. Dihitung tanpa nama.'}
                    {p === 'petugas' && 'Mencatat makanan yang tiba dan memeriksa peringatan sekolah.'}
                  </p>
                </button>
              ))}
            </div>
            <Button className="mt-4 w-full" disabled={!peran} onClick={() => setLangkah(3)}>Lanjut</Button>
          </div>
        )}

        {langkah === 3 && peran && (
          <form onSubmit={kirim} className="space-y-4">
            <div>
              <h1 className="text-xl font-extrabold text-ink">Data singkat & PIN</h1>
              <p className="mt-1 text-sm text-muted">{labelPeran[peran]} · {sekolah?.nama}</p>
            </div>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Nomor WhatsApp</span><input className={input} inputMode="tel" value={f.wa} onChange={(e) => setF({ ...f, wa: e.target.value.replace(/\D/g, '') })} placeholder="08xxxxxxxxxx" /></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Nama tampilan</span><input className={input} value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder="Contoh: Bu Rina" /></label>
            {peran === 'ortu' && <label className="block"><span className="mb-1 block text-sm font-semibold">Nama panggilan anak</span><input className={input} value={f.anak} onChange={(e) => setF({ ...f, anak: e.target.value })} placeholder="Hanya terlihat olehmu" /></label>}
            {peran === 'siswa' && (
              <label className="block"><span className="mb-1 block text-sm font-semibold">Nomor WhatsApp orang tua</span><input className={input} inputMode="tel" value={f.waOrtu} onChange={(e) => setF({ ...f, waOrtu: e.target.value.replace(/\D/g, '') })} placeholder="08xxxxxxxxxx" />
                <span className="mt-1 block text-xs text-muted">Orang tua akan menerima tautan untuk memantau dan menyetujui pendaftaranmu (disimulasikan pada versi demo).</span></label>
            )}
            <label className="block"><span className="mb-1 block text-sm font-semibold">Buat PIN 6 digit</span><input className={input} type="password" inputMode="numeric" value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="••••••" /></label>
            <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-3 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-leaf" checked={f.setuju} onChange={(e) => setF({ ...f, setuju: e.target.checked })} />
              <span><ShieldCheck size={14} className="mr-1 inline text-leaf" />Saya setuju data dipakai untuk pemantauan MBG. Nama saya dan nama anak tidak ditampilkan ke publik.</span>
            </label>
            {err && <p role="alert" className="rounded-lg bg-brick-soft px-3 py-2 text-sm font-semibold text-brick">{err}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setLangkah(2)} className="w-24">Kembali</Button>
              <Button type="submit" className="flex-1">Buat akun</Button>
            </div>
          </form>
        )}
      </Page>
    </>
  )
}
