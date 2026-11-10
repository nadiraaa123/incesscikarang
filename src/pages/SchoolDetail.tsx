import { useParams } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { AlertTriangle, ImageOff, TrendingDown, TrendingUp, Minus, ExternalLink, UserPlus } from 'lucide-react'
import { Bintang, Card, Chip, Demo, H2, Kosong, LinkButton, Page, Sumber, TopBar } from '../components/ui'
import { ItemMasukan, KartuMenu, Perjalanan } from '../components/mbg'
import { daftarMasukan, hariOperasional, menuHariIni, partisipasi, peringkatSekolah, sekolahById, sppgById, statBulanIni, tren, useDB, cekAmbang, wilayahById } from '../lib/db'
import { fmtBulan, fmtTanggal } from '../lib/date'

export default function SchoolDetail() {
  const { id } = useParams()
  const d = useDB()
  const s = sekolahById(d, id)
  if (!s) return (<><TopBar title="Sekolah" back="/sekolah" /><Page><Kosong judul="Sekolah tidak ditemukan" /></Page></>)
  const sppg = sppgById(d, s.sppgId)
  const menu = menuHariIni(d, s.sppgId)
  const st = statBulanIni(d, s.id)
  const data = tren(d, s.id).map((t) => ({ ...t, label: fmtBulan(t.bulan) }))
  const p = partisipasi(d, s)
  const rank = peringkatSekolah(d).findIndex((x) => x.s.id === s.id) + 1
  const masukan = daftarMasukan(d, { schoolId: s.id })
  const fotoHariIni = d.foto.filter((f) => f.schoolId === s.id && f.tanggal === hariOperasional() && f.jenis !== 'siswa')
  const amb = cekAmbang(d, s.id)
  const peringatan = d.peringatan.find((w) => w.schoolId === s.id && w.tanggal === hariOperasional())
  const maxSebaran = Math.max(1, ...st.sebaran)
  const w = wilayahById(d, s.wilayahId)
  const adaData = st.total > 0

  return (
    <>
      <TopBar title="Dasbor sekolah" back />
      <Page>
        <nav className="mb-2 text-xs text-muted" aria-label="Breadcrumb">Beranda › Sekolah › <span className="text-ink">{s.nama}</span></nav>
        <Card>
          <h1 className="text-xl font-extrabold text-ink">{s.nama}</h1>
          <p className="text-sm text-muted">{s.asli ? `NPSN ${s.npsn} · ` : ''}{s.jenjang} · Kec. {s.kec}, {s.kab}{s.siswa ? ` · ${s.siswa} siswa` : ''}</p>
          {s.alamat && <p className="mt-1 text-sm text-muted">{s.alamat}</p>}
          <p className="mt-2 text-sm text-ink">{sppg ? <>Dilayani <span className="font-semibold">{sppg.nama}</span></> : <span className="text-muted">SPPG penyedia belum tercatat di Rantang Terang</span>}</p>
          {s.asli && s.sumberUrl && <a href={s.sumberUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-leaf">Data resmi Kemendikdasmen <ExternalLink size={12} /></a>}
          {!s.asli && <p className="mt-2"><Demo /></p>}
          <p className="mt-1 text-xs text-muted">{fmtTanggal(hariOperasional())}</p>
        </Card>

        {peringatan?.status === 'diperiksa' && amb.jumlah >= 3 && (
          <div className="mt-3 flex gap-2 rounded-xl border border-brick/30 bg-brick-soft p-3 text-sm text-ink">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-brick" />
            <p><span className="font-bold">Perlu perhatian:</span> {amb.jumlah} laporan keluhan dari {amb.kelas} kelas hari ini. Sudah dicek petugas sekolah. Tindak lanjut per laporan tercatat dan rekapnya tampil di halaman Transparansi.</p>
          </div>
        )}

        {w?.kejadian && (
          <Card className="mt-3 border-brick/30 bg-brick-soft/40">
            <p className="text-sm font-bold text-ink">Konteks wilayah: {w.kejadian.korban.toLocaleString('id-ID')} korban dugaan keracunan MBG di {w.nama}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{w.kejadian.ringkas} ({w.kejadian.tanggal})</p>
            <Sumber sumber={w.kejadian.sumber} url={w.kejadian.url} />
            <p className="mt-1 text-[11.5px] text-muted">Informasi wilayah, bukan berarti sekolah ini terlibat.</p>
          </Card>
        )}

        {!adaData && (
          <Card className="mt-3 text-center">
            <UserPlus className="mx-auto text-leaf" />
            <p className="mt-2 font-bold text-ink">Belum ada laporan warga untuk sekolah ini</p>
            <p className="mt-1 text-sm text-muted">Orang tua, siswa, dan guru bisa mulai melapor setelah mendapat kode undangan dari wali kelas atau kepala sekolah.</p>
            <LinkButton to="/daftar" className="mt-3 w-full">Jadi pelapor pertama</LinkButton>
          </Card>
        )}

        <H2>Hari ini</H2>
        <div className="space-y-3">
          <KartuMenu menu={menu} sppgNama={sppg?.nama} />
          <Perjalanan menu={menu} sampai={fotoHariIni.length ? 6 : 5} />
          <Card>
            <h3 className="font-bold text-ink">Foto dari sekolah</h3>
            {fotoHariIni.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {fotoHariIni.map((f) => (
                  <figure key={f.id}>
                    <img src={f.dataUrl} alt={`Foto ${f.jenis}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
                    <figcaption className="mt-1 text-xs text-muted">{f.jenis === 'penerimaan' ? 'Saat diterima' : 'Saat makan'}{f.cocok && ` · ${f.cocok === 'sesuai' ? 'Sesuai menu' : 'Tidak sesuai menu'}`}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted"><ImageOff size={16} /> Petugas belum mengunggah foto hari ini.</p>
            )}
          </Card>
        </div>

        {adaData && (<>
        <H2>Penilaian bulan ini</H2>
        <Card>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-4xl font-extrabold tabular-nums text-ink">{st.rata.toFixed(1)}</p>
              <Bintang nilai={st.rata} />
            </div>
            <div className="flex-1 text-sm">
              <p className="text-muted">{st.total} penilaian</p>
              <p className={st.selisih > 0 ? 'mt-1 flex items-center gap-1 font-semibold text-leaf' : st.selisih < 0 ? 'mt-1 flex items-center gap-1 font-semibold text-brick' : 'mt-1 flex items-center gap-1 font-semibold text-muted'}>
                {st.selisih > 0 ? <TrendingUp size={16} /> : st.selisih < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                {st.selisih > 0 ? 'Naik' : st.selisih < 0 ? 'Turun' : 'Tetap'} {Math.abs(st.selisih).toFixed(1)} dari bulan lalu
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((b) => (
              <div key={b} className="flex items-center gap-2 text-xs">
                <span className="w-3 tabular-nums text-muted">{b}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream">
                  <div className="h-full rounded-full bg-sun" style={{ width: `${(st.sebaran[b - 1] / maxSebaran) * 100}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums text-muted">{st.sebaran[b - 1]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(st.aspek).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-cream px-3 py-2">
                <p className="text-xs capitalize text-muted">{k}</p>
                <p className="font-bold tabular-nums text-ink">{v.toFixed(1)} <span className="text-xs font-medium text-muted">/ 5</span></p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
            <span className="text-muted">Keluhan kesehatan bulan ini</span>
            <span className="font-bold tabular-nums text-ink">{st.keluhan}</span>
          </div>
          <p className="mt-2 flex items-center gap-2 text-[11.5px] text-muted">Penilaian menu dipisah dari keluhan kesehatan. <Demo /></p>
        </Card>

        <H2>Tren 6 bulan</H2>
        <Card className="pb-2 pl-1">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#EEE9DF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5B635E' }} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#5B635E' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)} bintang`, 'Rata-rata']} contentStyle={{ borderRadius: 8, border: '1px solid #E7E1D6', fontSize: 12 }} />
                <Line isAnimationActive={false} type="monotone" dataKey="rata" stroke="#1F5E3B" strokeWidth={2.5} dot={{ r: 3, fill: '#1F5E3B' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <H2>Partisipasi warga</H2>
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold tabular-nums text-ink">{p.persen}%</p>
              <p className="text-sm text-muted">{p.aktif} dari {p.terdaftar} akun aktif melapor bulan ini</p>
            </div>
            <Chip jenis="info">Peringkat {rank} di {s.kab}</Chip>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full bg-leaf" style={{ width: `${p.persen}%` }} /></div>
          {s.tertibCatat && <p className="mt-3 text-sm font-semibold text-leaf">Badge sekolah: Tertib Catat (20 hari pencatatan lengkap)</p>}
        </Card>

        </>)}

        <H2>Masukan & tanggapan SPPG</H2>
        <div className="space-y-3">
          {masukan.length === 0 ? <Kosong judul="Belum ada masukan tertulis" /> : masukan.map((m) => <ItemMasukan key={m.id} d={d} m={m} />)}
        </div>
      </Page>
    </>
  )
}
