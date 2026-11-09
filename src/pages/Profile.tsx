import { Link, Navigate } from 'react-router-dom'
import { Lock, LogOut } from 'lucide-react'
import { Card, Chip, H2, Page, TopBar } from '../components/ui'
import { useSesi, keluar, labelPeran } from '../lib/auth'
import { sekolahById, useDB, tanggapanUntuk } from '../lib/db'
import { fmtPendek } from '../lib/date'

export default function Profile() {
  const user = useSesi()
  const d = useDB()
  if (!user) return <Navigate to="/masuk?ke=profil" replace />
  if (user.peran === 'sppg') return <Navigate to="/mitra/sppg" replace />
  if (user.peran === 'kesehatan') return <Navigate to="/mitra/kesehatan" replace />
  const s = sekolahById(d, user.schoolId)
  const riwayat = [
    ...d.laporan.filter((l) => l.userId === user.id).map((l) => ({ id: l.id, tanggal: l.tanggal, jenis: 'Kondisi', teks: l.kondisi === 'aman' ? 'Aman' : `Keluhan: ${l.gejala.join(', ')}` })),
    ...d.penilaian.filter((p) => p.userId === user.id).map((p) => ({ id: p.id, tanggal: p.tanggal, jenis: 'Penilaian', teks: `${p.bintang} bintang${p.catatan ? ' · ' + p.catatan : ''}` })),
  ].sort((a, b) => b.tanggal.localeCompare(a.tanggal))

  return (
    <>
      <TopBar title="Saya" />
      <Page>
        <Card className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-leaf-soft text-lg font-extrabold text-leaf">{user.nama.slice(0, 1)}</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{user.nama}</p>
            <p className="truncate text-sm text-muted">{labelPeran[user.peran]} · {s?.nama}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted"><Lock size={11} /> Namamu hanya terlihat olehmu dan petugas sekolah.</p>
          </div>
        </Card>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Card className="p-3"><p className="text-2xl font-extrabold tabular-nums text-ink">{riwayat.length}</p><p className="text-xs text-muted">Laporan & penilaian terkirim</p></Card>
          <Card className="p-3"><p className="text-2xl font-extrabold tabular-nums text-leaf">{riwayat.filter((r) => tanggapanUntuk(d, r.id)).length}</p><p className="text-xs text-muted">Sudah ditanggapi SPPG</p></Card>
        </div>

        {user.peran !== 'petugas' && <Link to="/laporan" className="mt-6 flex min-h-[48px] items-center justify-between rounded-xl border border-line bg-white px-4 font-bold text-ink hover:border-leaf">Riwayat laporan masalah <span className="text-leaf">→</span></Link>}

        <H2>Laporan harian</H2>
        <Card className="mt-3 p-0">
          <ul className="divide-y divide-line">
            {riwayat.length ? riwayat.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 px-4 py-3">
                <div className="min-w-0"><p className="text-sm font-semibold text-ink">{r.jenis} · {fmtPendek(r.tanggal)}</p><p className="truncate text-xs text-muted">{r.teks}</p></div>
                {tanggapanUntuk(d, r.id) ? <Chip jenis="ditanggapi">Ditanggapi</Chip> : <Chip jenis="diperiksa">Tercatat</Chip>}
              </li>
            )) : <li className="px-4 py-6 text-center text-sm text-muted">Belum ada laporan.</li>}
          </ul>
        </Card>
        <button onClick={() => keluar()} className="mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 text-sm font-semibold text-muted"><LogOut size={15} /> Keluar</button>
      </Page>
    </>
  )
}
