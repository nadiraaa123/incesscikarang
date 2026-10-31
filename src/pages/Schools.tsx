import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ChevronRight, MapPin, Search, FlaskConical } from 'lucide-react'
import { Bintang, Card, Kosong, Page, Sumber, TopBar } from '../components/ui'
import { partisipasi, statBulanIni, useDB } from '../lib/db'

export default function Schools() {
  const d = useDB()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const wid = params.get('wilayah') ?? (q ? 'semua' : d.wilayah[0].id)
  const w = d.wilayah.find((x) => x.id === wid)
  const pilihWilayah = (id: string) => { const n = new URLSearchParams(params); n.set('wilayah', id); setParams(n, { replace: true }) }

  const hasil = d.sekolah
    .filter((s) => wid === 'semua' || s.wilayahId === wid)
    .filter((s) => `${s.nama} ${s.kec} ${s.kab} ${s.npsn}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <TopBar title="Cari sekolah" />
      <Page>
        <label className="block">
          <span className="mb-1 flex items-center gap-1 text-sm font-semibold text-ink"><MapPin size={15} className="text-leaf" />1. Pilih wilayah</span>
          <select value={wid} onChange={(e) => pilihWilayah(e.target.value)} className="h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] font-semibold text-ink outline-none focus:border-leaf" aria-label="Pilih wilayah">
            {d.wilayah.filter((x) => !x.uji).map((x) => <option key={x.id} value={x.id}>{x.nama}, {x.provinsi}</option>)}
            <option value="semua">Semua wilayah</option>
            {d.wilayah.filter((x) => x.uji).map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-1 flex items-center gap-1 text-sm font-semibold text-ink"><Search size={15} className="text-leaf" />2. Cari atau pilih sekolah</span>
          <div className="flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-leaf">
            <Search size={18} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nama sekolah, kecamatan, atau NPSN" className="h-full flex-1 bg-transparent text-[15px] outline-none" aria-label="Cari sekolah" />
          </div>
        </label>

        {w?.kejadian && (
          <Card className="mt-4 border-brick/30 bg-brick-soft/40">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-brick" />
              <div>
                <p className="text-sm font-bold text-ink">Kejadian di {w.nama}: {w.kejadian.korban.toLocaleString('id-ID')} korban</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{w.kejadian.ringkas}</p>
                <p className="mt-0.5 text-xs text-muted">{w.kejadian.tanggal}</p>
                <Sumber sumber={w.kejadian.sumber} url={w.kejadian.url} />
              </div>
            </div>
          </Card>
        )}
        {w?.uji && (
          <Card className="mt-4 bg-sun-soft/60">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink"><FlaskConical size={16} className="mt-0.5 shrink-0 text-[#8A5D06]" />Sekolah di wilayah ini fiktif dan berisi data contoh agar alur aplikasi bisa dicoba. Data contoh tidak pernah ditempelkan ke sekolah asli.</p>
          </Card>
        )}

        <p className="mt-4 text-sm text-muted">{hasil.length} sekolah{wid !== 'semua' && w ? ` di ${w.nama}` : ''}{!w?.uji && ' · identitas dari Data Referensi Kemendikdasmen'}</p>
        <div className="mt-2 space-y-2.5">
          {hasil.length === 0 && <Kosong judul="Sekolah tidak ditemukan" teks="Coba kata kunci lain atau pilih wilayah berbeda." />}
          {hasil.map((s) => {
            const st = statBulanIni(d, s.id)
            const p = partisipasi(d, s)
            return (
              <Link key={s.id} to={`/sekolah/${s.id}`} className="block">
                <Card className="flex items-center gap-3 p-3.5 hover:border-leaf">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{s.nama}</p>
                    <p className="text-xs text-muted">{s.asli ? `NPSN ${s.npsn} · ` : ''}{s.jenjang} · Kec. {s.kec}{s.asli ? `, ${s.kab}` : ''}</p>
                    {st.total > 0 ? (
                      <div className="mt-1.5 flex items-center gap-2 text-sm">
                        <Bintang nilai={st.rata} /> <span className="font-semibold tabular-nums">{st.rata.toFixed(1)}</span>
                        <span className="text-muted">· partisipasi {p.persen}%</span>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-xs font-semibold text-leaf">Belum ada laporan warga · jadi pelapor pertama</p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-muted" />
                </Card>
              </Link>
            )
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">Wilayah diurutkan dari jumlah korban dugaan keracunan MBG terbesar tahun 2026 menurut pemberitaan resmi. Sekolah dalam daftar bukan berarti terlibat dalam kejadian tersebut.</p>
      </Page>
    </>
  )
}
