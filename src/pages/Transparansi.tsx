import { useState } from 'react'
import { Info, ShieldCheck } from 'lucide-react'
import { Button, Card, Demo, Footer, H2, Memuat, Page, Pesan, TopBar, cx } from '../components/ui'
import { KATEGORI, LABEL_PERIODE, labelKategori, type Periode, type StatistikPublik } from '../lib/pengaduan'
import { repo, useKueri } from '../lib/repo'
import { fmtBulan } from '../lib/date'

const MUDA = '#A9CDB6' // laporan masuk (satu hue dengan "selesai": bagian dari keseluruhan)
const TUA = '#1F5E3B' // laporan selesai

export default function Transparansi() {
  const [periode, setPeriode] = useState<Periode>('90')
  const q = useKueri(() => repo.statistik(periode), [periode])
  return (
    <>
      <TopBar />
      <Page lebar="dasbor">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-leaf">Transparansi publik</p>
        <h1 className="mt-0.5 text-2xl font-extrabold leading-tight text-ink">Perkembangan laporan warga</h1>
        <p className="mt-1 text-sm text-muted">Angka agregat dari seluruh laporan di Rantang Terang. Tidak memuat identitas pelapor, anak, nomor kontak, gejala individual, atau catatan pribadi.</p>

        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Periode">
          {(Object.keys(LABEL_PERIODE) as Periode[]).map((p) => (
            <button key={p} role="radio" aria-checked={periode === p} onClick={() => setPeriode(p)} className={cx('h-10 rounded-full border px-4 text-sm font-bold', periode === p ? 'border-leaf bg-leaf text-white' : 'border-line bg-white text-ink')}>{LABEL_PERIODE[p]}</button>
          ))}
        </div>

        {q.galat ? <div className="mt-4"><Pesan jenis="galat" aksi={<Button variant="outline" className="h-10" onClick={q.muatUlang}>Coba lagi</Button>}>{q.galat}</Pesan></div>
          : !q.data ? <Memuat teks="Memuat statistik…" /> : <Isi s={q.data} memuat={q.memuat} />}

        <H2>Definisi angka</H2>
        <Card className="text-[13.5px] leading-relaxed text-ink">
          <dl className="space-y-2">
            <div><dt className="font-bold">Laporan masuk</dt><dd className="text-muted">Semua laporan yang dikirim dalam periode, termasuk yang masih menunggu verifikasi dan yang ditolak.</dd></div>
            <div><dt className="font-bold">Terverifikasi</dt><dd className="text-muted">Laporan yang lolos pemeriksaan petugas (status apa pun setelah Terverifikasi, termasuk Selesai). Tidak termasuk Menunggu Verifikasi dan Ditolak.</dd></div>
            <div><dt className="font-bold">Dalam penanganan</dt><dd className="text-muted">Laporan terverifikasi yang belum selesai: Terverifikasi, Diteruskan ke SPPG, Diteruskan ke Pihak Kesehatan Terkait, dan Dalam Penanganan.</dd></div>
            <div><dt className="font-bold">Persentase penyelesaian</dt><dd className="text-muted">Selesai ÷ Terverifikasi × 100%. Laporan yang ditolak dan yang belum diverifikasi tidak dihitung, agar angka tidak tampak rendah karena laporan yang memang tidak layak ditindaklanjuti.</dd></div>
            <div><dt className="font-bold">Periode</dt><dd className="text-muted">Dihitung dari tanggal laporan dikirim (WIB), bukan tanggal kejadian. Status yang dipakai adalah status saat ini. Grafik bulanan selalu menampilkan 6 bulan terakhir.</dd></div>
          </dl>
        </Card>
        <p className="mt-3 flex items-start gap-2 text-xs text-muted"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-leaf" />Pembatasan berlaku di sumber data: halaman ini hanya menerima angka hitungan dari server, bukan baris laporan.</p>
        <Footer />
      </Page>
    </>
  )
}

function Isi({ s, memuat }: { s: StatistikPublik; memuat: boolean }) {
  const kpi: [string, number, string?][] = [
    ['Laporan masuk', s.masuk],
    ['Terverifikasi', s.terverifikasi],
    ['Dalam penanganan', s.dalamPenanganan],
    ['Selesai', s.selesai],
  ]
  return (
    <div className={cx('transition-opacity', memuat && 'opacity-60')} aria-busy={memuat}>
      {s.adaContoh && <p className="mt-3 flex items-center gap-2 text-xs text-muted"><Demo /> Mode demo: angka berasal dari data contoh sekolah uji coba.</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi.map(([l, n]) => (
          <Card key={l} className="p-3.5">
            <p className="text-xs font-semibold text-muted">{l}</p>
            <p className="mt-1 text-[28px] font-extrabold tabular-nums leading-none text-ink">{n.toLocaleString('id-ID')}</p>
          </Card>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_2fr]">
        <Card>
          <p className="text-xs font-semibold text-muted">Persentase penyelesaian</p>
          <p className="mt-1 text-[40px] font-extrabold tabular-nums leading-none text-ink">{s.persenSelesai === null ? '–' : `${s.persenSelesai}%`}</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream" aria-hidden="true"><div className="h-full rounded-full bg-leaf" style={{ width: `${s.persenSelesai ?? 0}%` }} /></div>
          <p className="mt-2 text-[12.5px] leading-snug text-muted">{s.selesai} selesai dari {s.terverifikasi} laporan terverifikasi. {s.persenSelesai === null && 'Belum ada laporan terverifikasi di periode ini.'}</p>
          <p className="mt-2 flex items-start gap-1.5 border-t border-line pt-2 text-[12px] text-muted"><Info size={13} className="mt-0.5 shrink-0" />Tidak dihitung: {s.menunggu} menunggu verifikasi, {s.ditolak} ditolak.</p>
        </Card>
        <Card>
          <p className="font-bold text-ink">Laporan per kategori</p>
          <p className="text-xs text-muted">{LABEL_PERIODE[s.periode]}</p>
          <Legenda />
          <PerKategori s={s} />
        </Card>
      </div>

      <Card className="mt-3">
        <p className="font-bold text-ink">Perkembangan 6 bulan terakhir</p>
        <p className="text-xs text-muted">Berdasarkan bulan laporan dikirim</p>
        <Legenda />
        <PerBulan s={s} />
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-leaf">Lihat sebagai tabel</summary>
          <table className="mt-2 w-full text-left text-[13px]">
            <thead><tr className="border-b border-line text-muted"><th className="py-1.5 font-semibold">Bulan</th><th className="font-semibold">Masuk</th><th className="font-semibold">Selesai</th></tr></thead>
            <tbody>{s.perBulan.map((b) => <tr key={b.bulan} className="border-b border-line/60"><td className="py-1.5">{fmtBulan(b.bulan)} {b.bulan.slice(0, 4)}</td><td className="tabular-nums">{b.masuk}</td><td className="tabular-nums">{b.selesai}</td></tr>)}</tbody>
          </table>
        </details>
      </Card>
    </div>
  )
}

function Legenda() {
  return (
    <div className="mt-2 flex gap-4 text-xs text-muted">
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: MUDA }} />Masuk</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: TUA }} />Selesai</span>
    </div>
  )
}

function PerKategori({ s }: { s: StatistikPublik }) {
  const maks = Math.max(1, ...s.perKategori.map((k) => k.total))
  return (
    <ul className="mt-3 space-y-2.5">
      {KATEGORI.map(({ key }) => {
        const k = s.perKategori.find((x) => x.kategori === key) ?? { total: 0, selesai: 0 }
        return (
          <li key={key} title={`${labelKategori(key)}: ${k.total} masuk, ${k.selesai} selesai`}>
            <div className="flex justify-between gap-2 text-[13px]"><span className="font-semibold text-ink">{labelKategori(key)}</span><span className="tabular-nums text-muted">{k.total} masuk · {k.selesai} selesai</span></div>
            <div className="relative mt-1 h-3 rounded-r" style={{ width: `${Math.max(k.total ? 2 : 0, (k.total / maks) * 100)}%`, background: MUDA, borderRadius: 4 }}>
              <div className="absolute inset-y-0 left-0" style={{ width: `${k.total ? (k.selesai / k.total) * 100 : 0}%`, background: TUA, borderRadius: 4 }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function PerBulan({ s }: { s: StatistikPublik }) {
  const [aktif, setAktif] = useState<number | null>(null)
  const maks = Math.max(1, ...s.perBulan.map((b) => b.masuk))
  const b = aktif !== null ? s.perBulan[aktif] : null
  return (
    <div className="mt-3">
      <p className="h-5 text-[13px] text-ink" aria-live="polite">{b ? <><span className="font-bold">{fmtBulan(b.bulan)} {b.bulan.slice(0, 4)}</span>: {b.masuk} masuk, {b.selesai} selesai</> : <span className="text-muted">Sentuh atau arahkan ke batang untuk detail</span>}</p>
      <div className="mt-2 flex h-40 items-end gap-2 border-b border-line sm:gap-4">
        {s.perBulan.map((x, i) => (
          <button key={x.bulan} type="button" onMouseEnter={() => setAktif(i)} onMouseLeave={() => setAktif(null)} onFocus={() => setAktif(i)} onBlur={() => setAktif(null)} onClick={() => setAktif(i)}
            aria-label={`${fmtBulan(x.bulan)}: ${x.masuk} masuk, ${x.selesai} selesai`} className="flex h-full flex-1 items-end justify-center">
            <span className={cx('relative block w-full max-w-[44px] rounded-t transition-opacity', aktif !== null && aktif !== i && 'opacity-50')} style={{ height: `${(x.masuk / maks) * 100}%`, minHeight: x.masuk ? 4 : 0, background: MUDA, borderRadius: '4px 4px 0 0' }}>
              <span className="absolute inset-x-0 bottom-0 block" style={{ height: `${x.masuk ? (x.selesai / x.masuk) * 100 : 0}%`, background: TUA, borderRadius: x.selesai === x.masuk ? '4px 4px 0 0' : 0 }} />
            </span>
          </button>
        ))}
      </div>
      <div className="mt-1 flex gap-2 sm:gap-4">{s.perBulan.map((x) => <span key={x.bulan} className="flex-1 text-center text-[11px] text-muted">{fmtBulan(x.bulan)}</span>)}</div>
    </div>
  )
}
