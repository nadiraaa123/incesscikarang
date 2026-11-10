import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ClipboardPen, HeartPulse, Inbox, ShieldCheck, Siren } from 'lucide-react'
import { Button, Card, Kosong, LinkButton, Memuat, Page, Pesan, TopBar, cx } from '../components/ui'
import { KartuLaporan } from '../components/laporan'
import { useSesi } from '../lib/auth'
import { masukEskalasi, STATUS_AKTIF, URUTAN_URGENSI } from '../lib/pengaduan'
import { repo, useKueri, type Kueri } from '../lib/repo'
import { sekolahById, useDB } from '../lib/db'
import type { Pengaduan, Peran } from '../lib/types'

function Filter<T extends string>({ pilihan, nilai, onChange }: { pilihan: [T, string, number?][]; nilai: T; onChange: (v: T) => void }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="tablist">
      {pilihan.map(([k, l, n]) => (
        <button key={k} role="tab" aria-selected={nilai === k} onClick={() => onChange(k)} className={cx('h-10 shrink-0 rounded-full border px-4 text-sm font-bold', nilai === k ? 'border-leaf bg-leaf text-white' : 'border-line bg-white text-ink')}>
          {l}{n !== undefined && <span className={cx('ml-1.5 tabular-nums', nilai === k ? 'text-white/80' : 'text-muted')}>{n}</span>}
        </button>
      ))}
    </div>
  )
}

function Daftar({ q, kosong, render, staf }: { q: Kueri<Pengaduan[]>; kosong: React.ReactNode; render: (list: Pengaduan[]) => Pengaduan[]; staf?: boolean }) {
  const d = useDB()
  if (q.memuat && !q.data) return <Memuat />
  if (q.galat) return <Pesan jenis="galat" aksi={<Button variant="outline" className="h-10" onClick={q.muatUlang}>Coba lagi</Button>}>{q.galat}</Pesan>
  const list = render(q.data ?? [])
  if (!list.length) return <>{kosong}</>
  return <div className="grid gap-3 md:grid-cols-2">{list.map((p) => <KartuLaporan key={p.id} p={p} sekolah={sekolahById(d, p.schoolId)?.nama} tampilUrgensi={staf} tampilMirip={staf} />)}</div>
}

function Wajib({ peran, children }: { peran: Peran[]; children: (u: NonNullable<ReturnType<typeof useSesi>>) => React.ReactNode }) {
  const user = useSesi()
  if (!user) return <Navigate to="/masuk" replace />
  if (!peran.includes(user.peran)) return <Navigate to="/" replace />
  return <>{children(user)}</>
}

/* ---------- Pelapor: riwayat laporan ---------- */

export function RiwayatLaporan() {
  const [f, setF] = useState<'semua' | 'proses' | 'selesai' | 'ditolak'>('semua')
  return (
    <Wajib peran={['ortu', 'siswa', 'guru']}>{(user) => <RiwayatIsi user={user} f={f} setF={setF} />}</Wajib>
  )
}
function RiwayatIsi({ user, f, setF }: { user: NonNullable<ReturnType<typeof useSesi>>; f: string; setF: (v: 'semua' | 'proses' | 'selesai' | 'ditolak') => void }) {
  const q = useKueri(() => repo.daftar(user, 'saya'), [user.id])
  const l = q.data ?? []
  const proses = (p: Pengaduan) => p.status === 'menunggu_verifikasi' || STATUS_AKTIF.includes(p.status)
  return (
    <>
      <TopBar title="Riwayat laporan" />
      <Page lebar="dasbor">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Pantau status, tanggapan, dan hasil setiap laporanmu.</p>
          <LinkButton to="/lapor/baru" className="h-11"><ClipboardPen size={17} /> Buat laporan</LinkButton>
        </div>
        <div className="mt-4">
          <Filter nilai={f as 'semua'} onChange={setF} pilihan={[['semua', 'Semua', l.length], ['proses', 'Diproses', l.filter(proses).length], ['selesai', 'Selesai', l.filter((p) => p.status === 'selesai').length], ['ditolak', 'Ditolak', l.filter((p) => p.status === 'ditolak').length]]} />
        </div>
        <div className="mt-3">
          <Daftar q={q} render={(x) => x.filter((p) => f === 'semua' || (f === 'proses' ? proses(p) : p.status === f))}
            kosong={<Kosong ikon={<Inbox />} judul={f === 'semua' ? 'Belum ada laporan' : 'Tidak ada laporan di filter ini'} teks="Laporan yang kamu kirim akan muncul di sini beserta perkembangannya." aksi={f === 'semua' && <LinkButton to="/lapor/baru">Buat laporan pertama</LinkButton>} />} />
        </div>
      </Page>
    </>
  )
}

/* ---------- Petugas: antrean verifikasi ---------- */

export function AntreanVerifikasi() {
  return <Wajib peran={['petugas']}>{(user) => <AntreanIsi user={user} />}</Wajib>
}
function AntreanIsi({ user }: { user: NonNullable<ReturnType<typeof useSesi>> }) {
  const d = useDB()
  const q = useKueri(() => repo.daftar(user, 'sekolah'), [user.id])
  const [f, setF] = useState<'menunggu' | 'ditolak' | 'semua'>('menunggu')
  const l = q.data ?? []
  return (
    <>
      <TopBar title="Verifikasi laporan" />
      <Page lebar="dasbor">
        <p className="text-sm text-muted">{sekolahById(d, user.schoolId)?.nama} · Laporan terlama tampil lebih dulu agar tidak ada yang terlewat.</p>
        <div className="mt-4">
          <Filter nilai={f} onChange={setF} pilihan={[['menunggu', 'Menunggu verifikasi', l.filter((p) => p.status === 'menunggu_verifikasi').length], ['ditolak', 'Ditolak', l.filter((p) => p.status === 'ditolak').length], ['semua', 'Semua laporan', l.length]]} />
        </div>
        {f === 'menunggu' && l.some((p) => p.status === 'menunggu_verifikasi' && p.kemungkinanDuplikat.length) && (
          <p className="mt-3 rounded-lg bg-sun-soft px-3 py-2 text-[13px] text-ink">Label <span className="font-bold">“Mungkin terkait”</span> hanya membantu pemeriksaan. Laporan mirip dari orang berbeda tidak otomatis ditolak.</p>
        )}
        <div className="mt-3">
          <Daftar q={q} staf
            render={(x) => (f === 'semua' ? x : x.filter((p) => (f === 'menunggu' ? p.status === 'menunggu_verifikasi' : p.status === 'ditolak'))).sort((a, b) => (f === 'menunggu' ? a.dibuat.localeCompare(b.dibuat) : b.dibuat.localeCompare(a.dibuat)))}
            kosong={<Kosong ikon={<ShieldCheck />} judul={f === 'menunggu' ? 'Antrean kosong' : 'Tidak ada laporan'} teks={f === 'menunggu' ? 'Semua laporan sudah diperiksa.' : undefined} />} />
        </div>
      </Page>
    </>
  )
}

/* ---------- Petugas: monitoring eskalasi ---------- */

export function MonitoringEskalasi() {
  return <Wajib peran={['petugas']}>{(user) => <MonitoringIsi user={user} />}</Wajib>
}
function MonitoringIsi({ user }: { user: NonNullable<ReturnType<typeof useSesi>> }) {
  const q = useKueri(() => repo.daftar(user, 'sekolah'), [user.id])
  const [f, setF] = useState<'eskalasi' | 'aktif' | 'tanpa' | 'selesai'>('eskalasi')
  const l = q.data ?? []
  const aktif = l.filter((p) => STATUS_AKTIF.includes(p.status))
  const urut = (x: Pengaduan[]) => [...x].sort((a, b) => (URUTAN_URGENSI[a.urgensi ?? 'normal'] - URUTAN_URGENSI[b.urgensi ?? 'normal']) || a.diperbarui.localeCompare(b.diperbarui))
  const ringkas: [string, number, string, typeof Siren][] = [
    ['Jalur eskalasi aktif', aktif.filter(masukEskalasi).length, 'text-brick', Siren],
    ['Di pihak kesehatan', aktif.filter((p) => p.keKesehatan).length, 'text-[#7A2E6B]', HeartPulse],
    ['Sedang ditindaklanjuti', aktif.length, 'text-slate2', ShieldCheck],
    ['Menunggu verifikasi', l.filter((p) => p.status === 'menunggu_verifikasi').length, 'text-muted', Inbox],
  ]
  return (
    <>
      <TopBar title="Monitoring eskalasi" />
      <Page lebar="dasbor">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {ringkas.map(([label, n, warna, I]) => (
            <Card key={label} className="p-3">
              <I size={18} className={warna} />
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{q.memuat && !q.data ? '–' : n}</p>
              <p className="text-xs leading-tight text-muted">{label}</p>
            </Card>
          ))}
        </div>
        {l.some((p) => p.status === 'menunggu_verifikasi') && <Link to="/petugas/verifikasi" className="mt-2 block text-sm font-bold text-leaf">Buka antrean verifikasi →</Link>}
        <div className="mt-5">
          <Filter nilai={f} onChange={setF} pilihan={[['eskalasi', 'Jalur eskalasi', aktif.filter(masukEskalasi).length], ['aktif', 'Semua aktif', aktif.length], ['tanpa', 'Belum ada urgensi', aktif.filter((p) => !p.urgensi).length], ['selesai', 'Selesai', l.filter((p) => p.status === 'selesai').length]]} />
        </div>
        <p className="mt-2 text-xs text-muted">Diurutkan: urgensi tertinggi, lalu yang paling lama tidak diperbarui.</p>
        <div className="mt-3">
          <Daftar q={q} staf
            render={(x) => f === 'selesai' ? x.filter((p) => p.status === 'selesai') : urut(x.filter((p) => STATUS_AKTIF.includes(p.status)).filter((p) => (f === 'eskalasi' ? masukEskalasi(p) : f === 'tanpa' ? !p.urgensi : true)))}
            kosong={<Kosong ikon={<Siren />} judul="Tidak ada kasus di filter ini" />} />
        </div>
      </Page>
    </>
  )
}

/* ---------- Mitra kesehatan ---------- */

export function KasusKesehatan() {
  return <Wajib peran={['kesehatan']}>{(user) => <KesehatanIsi user={user} />}</Wajib>
}
function KesehatanIsi({ user }: { user: NonNullable<ReturnType<typeof useSesi>> }) {
  const d = useDB()
  const q = useKueri(() => repo.daftar(user, 'mitra'), [user.id])
  const [f, setF] = useState<'aktif' | 'selesai'>('aktif')
  const l = q.data ?? []
  return (
    <>
      <TopBar />
      <Page lebar="dasbor">
        <h1 className="text-xl font-extrabold text-ink">{d.faskes.find((x) => x.id === user.faskesId)?.nama ?? 'Pihak kesehatan'}</h1>
        <p className="text-sm text-muted">Kasus yang diteruskan petugas sekolah melalui jalur eskalasi.</p>
        <div className="mt-3" /><Pesan jenis="info"><span className="text-[13px]">Data dibatasi sesuai kebutuhan penanganan: tanpa identitas pelapor, anak, atau nomor kontak. Aplikasi membantu pencatatan, bukan diagnosis.</span></Pesan>
        <div className="mt-4"><Filter nilai={f} onChange={setF} pilihan={[['aktif', 'Perlu ditangani', l.filter((p) => p.status !== 'selesai').length], ['selesai', 'Selesai', l.filter((p) => p.status === 'selesai').length]]} /></div>
        <div className="mt-3">
          <Daftar q={q} staf render={(x) => x.filter((p) => (f === 'selesai' ? p.status === 'selesai' : p.status !== 'selesai'))} kosong={<Kosong ikon={<HeartPulse />} judul="Tidak ada kasus" />} />
        </div>
      </Page>
    </>
  )
}
