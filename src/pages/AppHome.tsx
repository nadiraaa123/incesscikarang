import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertTriangle, Camera, CheckCircle2, ClipboardList, FileHeart, ImageOff, Lock, LogOut, Users } from 'lucide-react'
import { Button, Card, Chip, Demo, H2, Page, Toast, TopBar, cx, kompresFoto, panggilan } from '../components/ui'
import { KartuMenu, Perjalanan } from '../components/mbg'
import { FormKondisi, FormPenilaian, GEJALA } from '../components/forms'
import { useSesi, keluar, labelPeran } from '../lib/auth'
import { buatRujukan, cekAmbang, cocokkanMenu, fotoSiswaHariIni, hariOperasional, menuHariIni, profilPoin, sekolahById, simpanFoto, sppgById, streak, tandaiDiperiksa, useDB } from '../lib/db'
import { fmtTanggal } from '../lib/date'
import type { Pengguna } from '../lib/types'

export default function AppHome() {
  const user = useSesi()
  if (!user) return <Navigate to="/masuk" replace />
  if (user.peran === 'sppg') return <Navigate to="/mitra/sppg" replace />
  return (
    <>
      <TopBar />
      <Page>
        <Salam user={user} />
        {user.peran === 'ortu' && <BerandaOrtu user={user} />}
        {(user.peran === 'siswa' || user.peran === 'guru') && <BerandaSiswa user={user} />}
        {user.peran === 'petugas' && <BerandaPetugas user={user} />}
        <button onClick={() => keluar()} className="mt-8 flex w-full items-center justify-center gap-2 text-sm font-semibold text-muted"><LogOut size={15} /> Keluar</button>
      </Page>
    </>
  )
}

function Salam({ user }: { user: Pengguna }) {
  const d = useDB()
  const s = sekolahById(d, user.schoolId)
  const pp = profilPoin(d, user.id)
  return (
    <div>
      <p className="text-xs text-muted">{fmtTanggal(hariOperasional())}</p>
      <h1 className="text-xl font-extrabold text-ink">Halo, {panggilan(user.nama)}</h1>
      <p className="text-sm text-muted">{labelPeran[user.peran]} · {s?.nama}{user.kelas ? ` · Kelas ${user.kelas}` : ''}</p>
      <Link to="/app/profil" className="mt-3 flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
        <div>
          <p className="text-xs text-muted">Level</p>
          <p className="font-bold text-ink">{pp.level} · <span className="tabular-nums">{pp.total}</span> poin</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Streak</p>
          <p className="font-bold tabular-nums text-ink">{streak(d, user.id)} hari sekolah</p>
        </div>
      </Link>
    </div>
  )
}

function FotoSekolah({ schoolId }: { schoolId: string }) {
  const d = useDB()
  const foto = d.foto.filter((f) => f.schoolId === schoolId && f.tanggal === hariOperasional() && f.jenis !== 'siswa')
  return (
    <Card>
      <h3 className="font-bold text-ink">Foto makanan dari sekolah</h3>
      {foto.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {foto.map((f) => (
            <figure key={f.id}>
              <img src={f.dataUrl} alt={`Foto ${f.jenis}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
              <figcaption className="mt-1 text-xs text-muted">{f.jenis === 'penerimaan' ? 'Saat diterima' : 'Saat makan'}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted"><ImageOff size={16} /> Petugas sekolah belum mengunggah foto hari ini.</p>
      )}
    </Card>
  )
}

function BerandaOrtu({ user }: { user: Pengguna }) {
  const d = useDB()
  const [toast, setToast] = useState('')
  const s = sekolahById(d, user.schoolId)!
  const menu = menuHariIni(d, s.sppgId)
  return (
    <>
      <H2>Makanan {user.anak ?? 'anak'} hari ini</H2>
      <div className="space-y-3">
        <FotoSekolah schoolId={s.id} />
        <KartuMenu menu={menu} sppgNama={sppgById(d, s.sppgId)?.nama} />
        <Perjalanan menu={menu} />
      </div>
      <H2>Laporan sore</H2>
      <div className="space-y-3">
        <FormKondisi user={user} judul={`Bagaimana kondisi ${user.anak ?? 'anak'} setelah makan?`} onDone={setToast} />
        <FormPenilaian user={user} onDone={setToast} />
        <KartuRujukan user={user} />
      </div>
      <Link to={`/sekolah/${s.id}`} className="mt-4 block text-center text-sm font-semibold text-leaf">Lihat dasbor publik {s.nama}</Link>
      <Toast pesan={toast} onClose={() => setToast('')} />
    </>
  )
}

function BerandaSiswa({ user }: { user: Pengguna }) {
  const d = useDB()
  const [toast, setToast] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const s = sekolahById(d, user.schoolId)!
  const menu = menuHariIni(d, s.sppgId)
  const foto = fotoSiswaHariIni(d, user.id)
  const wajibFoto = user.peran === 'siswa'
  const terkunci = wajibFoto && !foto

  return (
    <>
      <H2>Menu hari ini</H2>
      <div className="space-y-3">
        <KartuMenu menu={menu} sppgNama={sppgById(d, s.sppgId)?.nama} />
        <Perjalanan menu={menu} />
      </div>
      {wajibFoto && (
        <>
          <H2>1. Foto sebelum makan</H2>
          <Card>
            {foto ? (
              <div className="flex items-center gap-3">
                <img src={foto.dataUrl} alt="Foto makananmu" className="h-20 w-24 rounded-lg object-cover" />
                <div className="flex-1"><p className="flex items-center gap-1 font-bold text-ink"><CheckCircle2 size={16} className="text-leaf" />Foto tersimpan</p><button onClick={() => ref.current?.click()} className="text-sm font-semibold text-leaf">Ulangi foto</button></div>
              </div>
            ) : (
              <button onClick={() => ref.current?.click()} className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-leaf/40 bg-leaf-soft/40 py-8 text-leaf">
                <Camera size={28} /><span className="mt-2 font-bold">Ketuk untuk memotret makananmu</span><span className="text-xs text-muted">Foto makanan saja, tanpa wajah teman</span>
              </button>
            )}
            <input ref={ref} type="file" accept="image/*" capture="environment" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; simpanFoto(user, 'siswa', await kompresFoto(f)); setToast('Foto tersimpan. +5 poin') }} />
          </Card>
        </>
      )}
      <H2>{wajibFoto ? '2. Sebelum pulang' : 'Laporan hari ini'}</H2>
      {terkunci && <p className="mb-2 flex items-center gap-1 text-sm text-muted"><Lock size={14} /> Terbuka setelah foto sebelum makan.</p>}
      <div className="space-y-3">
        <FormKondisi user={user} judul={user.peran === 'guru' ? 'Bagaimana kondisimu dan siswa setelah makan?' : 'Bagaimana badanmu setelah makan?'} onDone={setToast} disabled={terkunci} />
        <FormPenilaian user={user} onDone={setToast} disabled={terkunci} />
      </div>
      {user.peran === 'siswa' && <p className="mt-3 flex items-center gap-2 rounded-lg bg-cream p-3 text-sm text-muted"><Users size={16} /> Orang tuamu ikut melihat laporan ini lewat tautan pantau.</p>}
      {user.peran === 'guru' && <p className="mt-3 text-sm text-muted">Laporan guru dihitung tanpa nama di dasbor sekolah.</p>}
      <Toast pesan={toast} onClose={() => setToast('')} />
    </>
  )
}

function KartuRujukan({ user }: { user: Pengguna }) {
  const nav = useNavigate()
  const [buka, setBuka] = useState(false)
  const [gejala, setGejala] = useState<string[]>([])
  const [setuju, setSetuju] = useState(false)
  return (
    <Card>
      <div className="flex items-start gap-3">
        <FileHeart className="mt-0.5 shrink-0 text-brick" size={20} />
        <div className="flex-1">
          <h3 className="font-bold text-ink">Anak sakit dan perlu ke faskes?</h3>
          <p className="text-sm text-muted">Buat kartu ringkasan riwayat makan hari ini untuk ditunjukkan ke puskesmas atau dokter.</p>
        </div>
      </div>
      {!buka ? (
        <Button variant="outline" className="mt-3 w-full" onClick={() => setBuka(true)}>Buat kartu rujukan</Button>
      ) : (
        <div className="mt-3">
          <p className="text-sm font-semibold">Gejala</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {GEJALA.map((g) => (
              <button key={g} onClick={() => setGejala(gejala.includes(g) ? gejala.filter((x) => x !== g) : [...gejala, g])} className={cx('h-9 rounded-full border px-3 text-sm font-semibold', gejala.includes(g) ? 'border-brick bg-brick-soft text-brick' : 'border-line bg-white')}>{g}</button>
            ))}
          </div>
          <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-leaf" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />Saya setuju membagikan ringkasan ini. Tautan berlaku 24 jam dan bisa saya cabut kapan saja.</label>
          <Button className="mt-3 w-full" disabled={!gejala.length || !setuju} onClick={() => nav(`/rujukan/${buatRujukan(user, gejala)}`)}>Buat kartu</Button>
        </div>
      )}
    </Card>
  )
}

function BerandaPetugas({ user }: { user: Pengguna }) {
  const d = useDB()
  const [toast, setToast] = useState('')
  const refs = { penerimaan: useRef<HTMLInputElement>(null), makan: useRef<HTMLInputElement>(null) }
  const s = sekolahById(d, user.schoolId)!
  const menu = menuHariIni(d, s.sppgId)
  const foto = (j: 'penerimaan' | 'makan') => d.foto.find((f) => f.schoolId === s.id && f.tanggal === hariOperasional() && f.jenis === j)
  const lengkap = !!foto('penerimaan') && !!foto('makan')
  const cocok = foto('penerimaan')?.cocok
  const amb = cekAmbang(d, s.id)
  const peringatan = d.peringatan.find((w) => w.schoolId === s.id && w.tanggal === hariOperasional())
  const laporanHariIni = d.laporan.filter((l) => l.schoolId === s.id && l.tanggal === hariOperasional())

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ['Laporan masuk', laporanHariIni.length],
          ['Keluhan', amb.jumlah],
          ['Kelas', amb.kelas],
        ].map(([l, v]) => (
          <Card key={l as string} className="p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-ink">{v}</p><p className="text-[11px] text-muted">{l} hari ini</p></Card>
        ))}
      </div>

      {(amb.jumlah >= 3 || peringatan) && (
        <Card className={cx('mt-3', peringatan?.status === 'diperiksa' ? 'border-line' : 'border-brick/40 bg-brick-soft/60')}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-brick" size={20} />
            <div className="flex-1">
              <p className="font-bold text-ink">{amb.terlampaui ? 'Ambang keluhan terlampaui' : 'Keluhan perlu dicek'}</p>
              <p className="text-sm text-muted">{amb.jumlah} laporan dari {amb.kelas} kelas ({amb.persen}% siswa). Ambang: ≥3 laporan, ≥2% siswa, ≥2 kelas.</p>
              {peringatan?.status === 'diperiksa' ? (
                <Chip jenis="diperiksa">Sudah diperiksa & diteruskan</Chip>
              ) : (
                <Button className="mt-3 w-full" onClick={() => { tandaiDiperiksa(s.id); setToast('Peringatan diteruskan ke SPPG dan puskesmas (simulasi).') }}>Sudah dicek, teruskan</Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <H2>Menu dari SPPG</H2>
      <KartuMenu menu={menu} sppgNama={sppgById(d, s.sppgId)?.nama} />

      <H2>Catat makanan hari ini</H2>
      <div className="grid grid-cols-2 gap-3">
        {(['penerimaan', 'makan'] as const).map((j) => {
          const f = foto(j)
          return (
            <Card key={j} className="p-3">
              <p className="text-sm font-bold text-ink">{j === 'penerimaan' ? '1. Saat diterima' : '2. Saat makan'}</p>
              {f ? <img src={f.dataUrl} alt="" className="mt-2 aspect-[4/3] w-full rounded-lg object-cover" /> : (
                <button onClick={() => refs[j].current?.click()} className="mt-2 flex aspect-[4/3] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-leaf/40 bg-leaf-soft/40 text-leaf"><Camera size={22} /><span className="mt-1 text-xs font-bold">Ambil foto</span></button>
              )}
              {f && <button onClick={() => refs[j].current?.click()} className="mt-1 text-xs font-semibold text-leaf">Ulangi</button>}
              <input ref={refs[j]} type="file" accept="image/*" capture="environment" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; simpanFoto(user, j, await kompresFoto(file)) }} />
            </Card>
          )
        })}
      </div>
      <Card className="mt-3">
        <p className="text-sm font-bold text-ink">Apakah makanan sesuai menu?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant={cocok === 'sesuai' ? 'primary' : 'outline'} disabled={!lengkap} onClick={() => { cocokkanMenu(user, 'sesuai'); setToast('Tercatat sesuai menu. +10 poin') }}>Sesuai</Button>
          <Button variant={cocok === 'tidak' ? 'danger' : 'outline'} disabled={!lengkap} onClick={() => { cocokkanMenu(user, 'tidak'); setToast('Tercatat tidak sesuai. SPPG akan dikabari.') }}>Tidak sesuai</Button>
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted"><ClipboardList size={13} /> Pekerjaan sekitar 1–2 menit. Rekap ini melindungi sekolah bila ada keluhan. <Demo /></p>
      </Card>
      <Toast pesan={toast} onClose={() => setToast('')} />
    </>
  )
}
