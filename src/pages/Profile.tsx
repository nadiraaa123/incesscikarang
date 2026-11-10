import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Award, CalendarCheck, Eye, Lock, LogOut, Star, Trophy } from 'lucide-react'
import { Card, Chip, H2, Page, TopBar, cx } from '../components/ui'
import { useSesi, keluar, labelPeran } from '../lib/auth'
import { badge, hariOperasional, profilPoin, sekolahById, streak, useDB, tanggapanUntuk } from '../lib/db'
import { fmtPendek, schoolDaysBefore } from '../lib/date'

const ikonBadge = { pertama: Eye, rutin: CalendarCheck, teliti: Star, tertib: Award } as const

export default function Profile() {
  const user = useSesi()
  const d = useDB()
  const [tab, setTab] = useState<'laporan' | 'poin'>('laporan')
  if (!user) return <Navigate to="/masuk?ke=profil" replace />
  if (user.peran === 'sppg') return <Navigate to="/mitra/sppg" replace />
  if (user.peran === 'kesehatan') return <Navigate to="/mitra/kesehatan" replace />
  const pp = profilPoin(d, user.id)
  const st = streak(d, user.id)
  const s = sekolahById(d, user.schoolId)
  const hari = [...schoolDaysBefore(hariOperasional(), 4).reverse(), hariOperasional()]
  const lapHari = new Set(d.laporan.filter((l) => l.userId === user.id).map((l) => l.tanggal))
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

        <Card className="mt-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Level</p>
              <p className="text-xl font-extrabold text-ink">{pp.level}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold tabular-nums text-leaf">{pp.total}</p>
              <p className="text-xs text-muted">poin</p>
            </div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full bg-leaf" style={{ width: `${Math.max(4, pp.progres * 100)}%` }} /></div>
          <p className="mt-1.5 text-sm text-muted">{pp.next ? `${pp.kurang} poin lagi menuju ${pp.next}` : 'Level tertinggi tercapai'}</p>
          <p className="mt-1 text-[11px] text-muted">Total dihitung dari riwayat poin di bawah, setiap poin bisa ditelusuri.</p>
        </Card>

        <Card className="mt-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-ink">Streak {st} hari sekolah</p>
            <Trophy size={18} className="text-sun" />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {hari.map((t) => (
              <div key={t} className={cx('rounded-lg py-2 text-center text-xs font-bold', lapHari.has(t) ? 'bg-leaf text-white' : 'bg-cream text-muted')}>
                {new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' })}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Sabtu, Minggu, dan libur tidak memutus streak.</p>
        </Card>

        <H2>Badge</H2>
        <div className="grid grid-cols-2 gap-3">
          {badge(d, user).map((b) => {
            const I = ikonBadge[b.kode as keyof typeof ikonBadge]
            return (
              <Card key={b.kode} className={cx('p-3.5', b.terbuka && 'border-leaf/50')}>
                <div className="flex items-start gap-2.5">
                  <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full', b.terbuka ? 'bg-leaf-soft text-leaf' : 'bg-cream text-muted')}>{b.terbuka ? <I size={18} /> : <Lock size={16} />}</span>
                  <div className="min-w-0">
                    <p className={cx('text-sm font-bold leading-tight', b.terbuka ? 'text-ink' : 'text-muted')}>{b.nama}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{b.ket}</p>
                    <p className={cx('mt-1 text-xs font-bold', b.terbuka ? 'text-leaf' : 'text-muted')}>{b.progres}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {user.peran !== 'petugas' && <Link to="/laporan" className="mt-6 flex min-h-[48px] items-center justify-between rounded-xl border border-line bg-white px-4 font-bold text-ink hover:border-leaf">Riwayat laporan masalah <span className="text-leaf">→</span></Link>}

        <div className="mt-6 grid grid-cols-2 rounded-xl border border-line bg-white p-1" role="tablist">
          {(['laporan', 'poin'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('h-10 rounded-lg text-sm font-bold', tab === t ? 'bg-leaf text-white' : 'text-muted')}>
              {t === 'laporan' ? 'Laporan harian' : 'Riwayat poin'}
            </button>
          ))}
        </div>

        <Card className="mt-3 p-0">
          <ul className="divide-y divide-line">
            {tab === 'laporan' && (riwayat.length ? riwayat.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 px-4 py-3">
                <div className="min-w-0"><p className="text-sm font-semibold text-ink">{r.jenis} · {fmtPendek(r.tanggal)}</p><p className="truncate text-xs text-muted">{r.teks}</p></div>
                {tanggapanUntuk(d, r.id) ? <Chip jenis="ditanggapi">Ditanggapi</Chip> : <Chip jenis="diperiksa">Tercatat</Chip>}
              </li>
            )) : <li className="px-4 py-6 text-center text-sm text-muted">Belum ada laporan.</li>)}
            {tab === 'poin' && pp.log.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div><p className="text-sm font-semibold text-ink">{p.ket}</p><p className="text-xs text-muted">{fmtPendek(p.waktu.slice(0, 10))}{p.ref ? ` · #${p.ref.toUpperCase().slice(0, 10)}` : ''}</p></div>
                <span className={cx('font-bold tabular-nums', p.poin < 0 ? 'text-brick' : 'text-leaf')}>{p.poin > 0 ? '+' : '−'}{Math.abs(p.poin)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <button onClick={() => keluar()} className="mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 text-sm font-semibold text-muted"><LogOut size={15} /> Keluar</button>
      </Page>
    </>
  )
}
