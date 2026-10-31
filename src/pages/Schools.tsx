import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { Bintang, Card, Kosong, Page, TopBar } from '../components/ui'
import { partisipasi, statBulanIni, useDB } from '../lib/db'

export default function Schools() {
  const d = useDB()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const hasil = d.sekolah.filter((s) => `${s.nama} ${s.kec} ${s.kab}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <TopBar title="Cari sekolah" />
      <Page>
        <div className="flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-leaf">
          <Search size={18} className="text-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nama sekolah atau kecamatan" className="h-full flex-1 bg-transparent text-[15px] outline-none" aria-label="Cari sekolah" />
        </div>
        <p className="mt-3 text-sm text-muted">{hasil.length} sekolah · data contoh wilayah Kab. Garut</p>
        <div className="mt-3 space-y-3">
          {hasil.length === 0 && <Kosong judul="Sekolah tidak ditemukan" teks="Coba kata kunci lain, misalnya “Tarogong”." />}
          {hasil.map((s) => {
            const st = statBulanIni(d, s.id)
            const p = partisipasi(d, s)
            return (
              <Link key={s.id} to={`/sekolah/${s.id}`}>
                <Card className="flex items-center gap-3 p-3.5 hover:border-leaf">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{s.nama}</p>
                    <p className="text-xs text-muted">{s.jenjang} · Kec. {s.kec}, {s.kab}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-sm">
                      <Bintang nilai={st.rata} /> <span className="font-semibold tabular-nums">{st.rata.toFixed(1)}</span>
                      <span className="text-muted">· partisipasi {p.persen}%</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted" />
                </Card>
              </Link>
            )
          })}
        </div>
      </Page>
    </>
  )
}
