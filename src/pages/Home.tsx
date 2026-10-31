import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, MessageSquareReply, Search, ShieldCheck, Smartphone, Soup, Users, ChevronRight, Camera, ClipboardCheck, BarChart3 } from 'lucide-react'
import { Card, Demo, Footer, Foto, H2, LinkButton, Page, Sumber, TopBar } from '../components/ui'
import { ItemMasukan } from '../components/mbg'
import { daftarMasukan, peringkatSekolah, useDB } from '../lib/db'
import { STAT_KERACUNAN, STAT_NASIONAL } from '../lib/sources'
import { useSesi } from '../lib/auth'

export default function Home() {
  const d = useDB()
  const user = useSesi()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const masukan = daftarMasukan(d).slice(0, 3)
  const peringkat = peringkatSekolah(d).slice(0, 3)

  return (
    <>
      <TopBar />
      <Page className="pt-0">
        {/* Hero */}
        <section className="-mx-4 bg-white pb-5">
          <Foto src="/images/hero.jpg" alt="Orang tua dan guru menyiapkan makan siang sekolah" className="h-44 w-full" />
          <div className="px-4 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-leaf">Pemantauan Makan Bergizi Gratis</p>
            <h1 className="mt-1 text-[26px] font-extrabold leading-tight text-ink">Pantau MBG dari sekolahmu</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Rantang Terang adalah platform warga untuk memastikan Makan Bergizi Gratis di sekolah aman, bergizi, dan sesuai menu, dengan hasil yang terbuka untuk semua.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink">
              {[
                [Eye, 'Lihat menu, gizi, dan perjalanan makanan anak'],
                [Smartphone, 'Lapor kondisi dan nilai menu langsung dari HP'],
                [MessageSquareReply, 'Pantau tanggapan dapur (SPPG) secara terbuka'],
              ].map(([Icon, t]) => {
                const I = Icon as typeof Eye
                return (
                  <li key={t as string} className="flex items-center gap-2"><I size={16} className="text-leaf" />{t as string}</li>
                )
              })}
            </ul>
            <form
              className="mt-4 flex h-12 items-center gap-2 rounded-xl border border-line bg-cream px-3 focus-within:border-leaf"
              onSubmit={(e) => { e.preventDefault(); nav(`/sekolah?q=${encodeURIComponent(q)}`) }}
              role="search"
            >
              <Search size={18} className="text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari sekolah (nama atau kecamatan)" className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" aria-label="Cari sekolah" />
            </form>
            <LinkButton to={user ? '/app' : '/masuk'} className="mt-3 w-full">Lapor hari ini</LinkButton>
          </div>
        </section>

        {/* Statistik */}
        <H2>MBG dalam angka</H2>
        <div className="grid grid-cols-1 gap-3">
          {STAT_NASIONAL.map((s) => (
            <Card key={s.label} className="p-3.5">
              <p className="text-xs font-semibold text-muted">{s.label}</p>
              <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-ink">{s.nilai}</p>
              <p className="text-sm text-muted">{s.keterangan}</p>
              <Sumber sumber={s.sumber} tanggal={s.tanggal} url={s.url} />
            </Card>
          ))}
          <Card className="p-3.5">
            <p className="text-xs font-semibold text-muted">Korban keracunan makanan MBG</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {STAT_KERACUNAN.map((s) => (
                <div key={s.label} className="rounded-lg bg-cream p-2.5">
                  <p className={s.jenis === 'resmi' ? 'text-[11px] font-bold text-slate2' : 'text-[11px] font-bold text-[#8A5D06]'}>{s.label}</p>
                  <p className="mt-0.5 text-lg font-extrabold tabular-nums text-ink">{s.nilai}</p>
                  <p className="text-[11.5px] leading-snug text-muted">{s.keterangan}</p>
                  <Sumber sumber={s.sumber} tanggal={s.tanggal} url={s.url} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">Angka resmi dan independen ditampilkan berdampingan. Perbedaan ini menunjukkan perlunya data yang terbuka dan dapat diperiksa bersama.</p>
          </Card>
        </div>

        {/* Cara kerja */}
        <H2>Cara kerja</H2>
        <Card>
          <ol className="space-y-3">
            {[
              [Soup, 'SPPG menginput menu & gizi', 'Menu harian tampil ke orang tua, siswa, dan publik.'],
              [Camera, 'Sekolah mencatat makanan tiba', 'Petugas memotret dan mencocokkan dengan menu.'],
              [ClipboardCheck, 'Orang tua & siswa melapor', 'Kondisi setelah makan dan penilaian menu, dipisah.'],
              [BarChart3, 'Hasil terbuka, SPPG menanggapi', 'Dasbor publik per sekolah. Laporan asli tidak bisa dihapus.'],
            ].map(([Icon, j, t], i) => {
              const I = Icon as typeof Soup
              return (
                <li key={j as string} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-leaf-soft text-leaf"><I size={18} /></span>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{i + 1}. {j as string}</p>
                    <p className="text-sm text-muted">{t as string}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </Card>

        {/* Masukan terbaru */}
        <H2 aksi={<Link to="/sekolah" className="text-sm font-semibold text-leaf">Lihat sekolah</Link>}>Masukan terbaru & tanggapan</H2>
        <div className="space-y-3">
          {masukan.map((m) => <ItemMasukan key={m.id} d={d} m={m} tampilSekolah />)}
        </div>

        {/* Peringkat partisipasi */}
        <H2>Partisipasi tertinggi bulan ini</H2>
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {peringkat.map(({ s, persen, aktif, terdaftar }, i) => (
              <li key={s.id}>
                <Link to={`/sekolah/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-cream">
                  <span className="w-5 text-center text-lg font-extrabold tabular-nums text-leaf">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{s.nama}</p>
                    <p className="text-xs text-muted">{aktif} dari {terdaftar} akun aktif melapor</p>
                  </div>
                  <span className="text-[15px] font-bold tabular-nums text-ink">{persen}%</span>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <p className="mt-2 flex items-center gap-1 text-[11.5px] text-muted"><Users size={13} /> Dihitung dari persentase pelapor aktif, bukan jumlah keluhan. <Demo /></p>

        <Card className="mt-6 bg-leaf text-white">
          <div className="flex gap-3">
            <ShieldCheck className="shrink-0" />
            <div>
              <p className="font-bold">Datamu terlindungi</p>
              <p className="mt-1 text-sm text-white/85">Publik hanya melihat data agregat. Nama pelapor dan nama anak tidak pernah ditampilkan.</p>
              <Link to="/tentang#etika" className="mt-2 inline-block text-sm font-bold underline underline-offset-2">Baca etika data</Link>
            </div>
          </div>
        </Card>

        <Footer />
      </Page>
    </>
  )
}
