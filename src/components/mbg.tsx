import { CheckCircle2, Circle, Soup } from 'lucide-react'
import type { DB, Menu } from '../lib/types'
import { sekolahById, sppgById, tanggapanUntuk, type Masukan } from '../lib/db'
import { fmtPendek } from '../lib/date'
import { Bintang, Card, Chip, Demo, Kosong, cx } from './ui'

const warnaKategori: Record<string, string> = {
  'Makanan pokok': 'bg-[#F4EEDF] text-[#7A5B12]',
  'Lauk pauk': 'bg-[#F6E6DD] text-[#8A3E1C]',
  Sayur: 'bg-leaf-soft text-leaf',
  Buah: 'bg-sun-soft text-[#8A5D06]',
  Susu: 'bg-slate2-soft text-slate2',
}

export function KartuMenu({ menu, sppgNama, judul = 'Menu hari ini' }: { menu?: Menu; sppgNama?: string; judul?: string }) {
  if (!menu) return <Kosong ikon={<Soup />} judul="Menu belum diinput SPPG" teks="Menu dan kandungan gizi akan tampil setelah SPPG menginputnya." />
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-ink">{judul}</h3>
          <p className="text-xs text-muted">{fmtPendek(menu.tanggal)} · diinput {sppgNama ?? 'SPPG'}</p>
        </div>
        <Demo />
      </div>
      <ul className="mt-3 divide-y divide-line">
        {menu.items.map((it) => (
          <li key={it.nama} className="flex items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-ink">{it.nama}</p>
              <span className={cx('mt-0.5 inline-block rounded px-1.5 text-[11px] font-semibold', warnaKategori[it.kategori])}>{it.kategori}</span>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-muted">{it.porsi}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-4 gap-2 rounded-lg bg-cream p-2 text-center">
        {[
          ['Energi', `${menu.gizi.energi}`, 'kkal'],
          ['Protein', `${menu.gizi.protein}`, 'g'],
          ['Lemak', `${menu.gizi.lemak}`, 'g'],
          ['Karbo', `${menu.gizi.karbo}`, 'g'],
        ].map(([l, v, s]) => (
          <div key={l}>
            <p className="text-[11px] text-muted">{l}</p>
            <p className="text-sm font-bold tabular-nums text-ink">{v}<span className="ml-0.5 text-[10px] font-medium text-muted">{s}</span></p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-muted">Kandungan gizi dilaporkan SPPG, bukan hasil uji laboratorium.</p>
    </Card>
  )
}

export function Perjalanan({ menu, sampai }: { menu?: Menu; sampai?: number }) {
  if (!menu) return null
  const batas = sampai ?? menu.proses.length
  return (
    <Card>
      <h3 className="font-bold text-ink">Perjalanan makanan</h3>
      <p className="text-xs text-muted">Dari dapur sampai piring. Setiap langkah berlabel sumbernya.</p>
      <ol className="mt-3">
        {menu.proses.map((p, i) => {
          const selesai = i < batas
          return (
            <li key={p.langkah} className="relative flex gap-3 pb-3 last:pb-0">
              {i < menu.proses.length - 1 && <span className={cx('absolute left-[9px] top-5 h-full w-px', selesai ? 'bg-leaf/40' : 'bg-line')} />}
              {selesai ? <CheckCircle2 size={19} className="relative z-10 shrink-0 fill-white text-leaf" /> : <Circle size={19} className="relative z-10 shrink-0 fill-white text-line" />}
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                <p className={cx('text-sm', selesai ? 'font-semibold text-ink' : 'text-muted')}>{p.langkah}</p>
                <p className="shrink-0 text-xs tabular-nums text-muted">{selesai ? p.waktu : '—'} · <span className="font-medium">{p.sumber === 'SPPG' ? 'dilaporkan SPPG' : 'dicatat sekolah'}</span></p>
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

export function ItemMasukan({ d, m, tampilSekolah }: { d: DB; m: Masukan; tampilSekolah?: boolean }) {
  const t = tanggapanUntuk(d, m.id)
  const s = sekolahById(d, m.schoolId)
  return (
    <Card as="article" className="p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {m.jenis === 'keluhan' ? <Chip jenis="perhatian">Keluhan</Chip> : <Bintang nilai={m.bintang ?? 0} />}
          <span className="text-xs text-muted">{fmtPendek(m.tanggal)}</span>
        </div>
        {t ? <Chip jenis="ditanggapi">Ditanggapi SPPG</Chip> : <Chip jenis="menunggu">Menunggu tanggapan</Chip>}
      </div>
      {tampilSekolah && s && <p className="mt-2 text-xs font-semibold text-muted">{s.nama}</p>}
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink">“{m.teks}”</p>
      {m.gejala && m.gejala.length > 0 && <p className="mt-1 text-xs text-muted">Gejala: {m.gejala.join(', ')}</p>}
      <p className="mt-1 text-[11px] text-muted">Pelapor tidak ditampilkan {m.demo && '· '} {m.demo && <Demo />}</p>
      {t && (
        <div className="mt-3 rounded-lg border-l-4 border-leaf bg-leaf-soft/60 px-3 py-2">
          <p className="text-xs font-bold text-leaf">{t.jenis === 'perbaiki' ? 'Tanggapan SPPG: Benar, kami perbaiki' : 'Tanggapan SPPG: Informasi tidak sesuai'}</p>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink">{t.isi}</p>
          <p className="mt-1 text-[11px] text-muted">{sppgById(d, t.sppgId)?.nama} · {t.waktu.replace(/^\d{4}-/, '').replace('-', '/')} · Laporan asli tetap ditampilkan</p>
        </div>
      )}
    </Card>
  )
}
