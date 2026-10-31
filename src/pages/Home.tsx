import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, ChevronRight, ChefHat, Truck, School, Utensils, ClipboardPen, BookOpen, Soup, Users, ArrowRight } from 'lucide-react'
import { Card, Demo, Footer, Page, Sumber, TopBar, cx } from '../components/ui'
import { ItemMasukan } from '../components/mbg'
import { FotoAtauIlustrasi, HeroScene, Ompreng } from '../components/ilustrasi'
import { daftarMasukan, menuHariIni, peringkatSekolah, sekolahById, sppgById, useDB } from '../lib/db'
import { STAT_KERACUNAN, STAT_NASIONAL } from '../lib/sources'
import { useSesi } from '../lib/auth'
import { fmtTanggal } from '../lib/date'

function Judul({ kecil, children, aksi }: { kecil: string; children: React.ReactNode; aksi?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-9 flex items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-leaf">{kecil}</p>
        <h2 className="mt-0.5 text-[19px] font-extrabold leading-tight text-ink">{children}</h2>
      </div>
      {aksi}
    </div>
  )
}

export default function Home() {
  const d = useDB()
  const user = useSesi()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const contoh = sekolahById(d, 'sdn2-tarogong')!
  const menu = menuHariIni(d, contoh.sppgId)
  const masukan = daftarMasukan(d).slice(0, 2)
  const peringkat = peringkatSekolah(d).slice(0, 3)
  const keLapor = user ? (user.peran === 'sppg' ? '/mitra/sppg' : '/app') : '/masuk'

  return (
    <>
      <TopBar />
      <Page className="pt-0">
        {/* HERO */}
        <section className="-mx-4">
          <FotoAtauIlustrasi src="/images/hero.jpg" alt="Makan siang Makan Bergizi Gratis di sekolah" fallback={<HeroScene className="h-full w-full" />} className="h-[210px] w-full bg-leaf" />
          <div className="relative -mt-6 rounded-t-3xl bg-cream px-4 pt-6">
            <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-tight text-ink">Pantau makan bergizi gratis di sekolahmu</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">Lihat menu dan perjalanan makanan, laporkan kondisi anak, dan pantau tanggapan dapur secara terbuka.</p>
            <form
              className="mt-4 flex h-[52px] items-center gap-2 rounded-2xl border border-line bg-white pl-4 pr-1.5 shadow-sm focus-within:border-leaf"
              onSubmit={(e) => { e.preventDefault(); nav(`/sekolah?q=${encodeURIComponent(q)}`) }}
              role="search"
            >
              <Search size={19} className="shrink-0 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama sekolah" className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" aria-label="Cari sekolah" />
              <button type="submit" className="h-10 rounded-xl bg-leaf px-4 text-sm font-bold text-white">Cari</button>
            </form>
          </div>
        </section>

        {/* AKSES CEPAT */}
        <nav aria-label="Akses cepat" className="mt-5 grid grid-cols-4 gap-2">
          {[
            { to: '/sekolah', label: 'Cari sekolah', icon: School, warna: 'bg-leaf-soft text-leaf' },
            { to: keLapor, label: 'Lapor hari ini', icon: ClipboardPen, warna: 'bg-brick-soft text-brick' },
            { to: `/sekolah/${contoh.id}`, label: 'Menu hari ini', icon: Soup, warna: 'bg-sun-soft text-[#8A5D06]' },
            { to: '/tentang', label: 'Cara kerja', icon: BookOpen, warna: 'bg-slate2-soft text-slate2' },
          ].map(({ to, label, icon: I, warna }) => (
            <Link key={label} to={to} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-2.5 text-center ring-1 ring-line hover:ring-leaf">
              <span className={cx('grid h-11 w-11 place-items-center rounded-xl', warna)}><I size={21} /></span>
              <span className="text-[11.5px] font-semibold leading-tight text-ink">{label}</span>
            </Link>
          ))}
        </nav>

        {/* MENU HARI INI */}
        <Judul kecil="Contoh hari ini" aksi={<Demo />}>Isi ompreng MBG</Judul>
        <Card className="overflow-hidden p-0">
          <FotoAtauIlustrasi src="/images/menu.jpg" alt="Foto ompreng MBG" fallback={<Ompreng className="h-full w-full bg-[#EFE8DA]" />} className="aspect-[3/2] w-full bg-[#EFE8DA]" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-ink">{contoh.nama}</p>
                <p className="text-xs text-muted">{fmtTanggal(menu?.tanggal ?? '', { weekday: 'long', day: 'numeric', month: 'long' })} · diinput {sppgById(d, contoh.sppgId)?.nama}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-cream px-2 py-1 text-right">
                <span className="block text-[15px] font-extrabold tabular-nums leading-none text-ink">{menu?.gizi.energi}</span>
                <span className="text-[10px] text-muted">kkal</span>
              </span>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {menu?.items.map((it) => (
                <li key={it.nama} className="rounded-xl bg-cream px-3 py-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">{it.kategori}</p>
                  <p className="text-sm font-semibold leading-snug text-ink">{it.nama}</p>
                </li>
              ))}
            </ul>
            <Link to={`/sekolah/${contoh.id}`} className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-line py-3 text-sm font-bold text-leaf hover:border-leaf">
              Lihat dasbor sekolah ini <ArrowRight size={16} />
            </Link>
          </div>
        </Card>

        {/* PERJALANAN */}
        <Judul kecil="Cara kerja">Dari dapur sampai piring</Judul>
        <Card>
          <ol className="relative grid grid-cols-4 gap-1 text-center">
            <span className="absolute left-[12.5%] right-[12.5%] top-6 h-0.5 bg-line" aria-hidden="true" />
            {[
              [ChefHat, 'Dapur SPPG', 'input menu & gizi'],
              [Truck, 'Dikirim', 'waktu tercatat'],
              [School, 'Sekolah', 'foto & cocokkan'],
              [Utensils, 'Piring anak', 'lapor & nilai'],
            ].map(([I, j, t], i) => {
              const Icon = I as typeof ChefHat
              return (
                <li key={j as string} className="relative">
                  <span className={cx('relative mx-auto grid h-12 w-12 place-items-center rounded-full ring-4 ring-white', i === 3 ? 'bg-leaf text-white' : 'bg-leaf-soft text-leaf')}><Icon size={22} /></span>
                  <p className="mt-2 text-[12.5px] font-bold leading-tight text-ink">{j as string}</p>
                  <p className="text-[11px] leading-tight text-muted">{t as string}</p>
                </li>
              )
            })}
          </ol>
          <p className="mt-4 rounded-xl bg-cream p-3 text-[13px] leading-relaxed text-ink">Hasil laporan tampil terbuka di dasbor tiap sekolah. SPPG bisa menanggapi, tapi <span className="font-semibold">laporan warga tidak bisa dihapus</span>.</p>
        </Card>

        {/* ANGKA */}
        <Judul kecil="Data resmi">MBG dalam angka</Judul>
        <div className="grid grid-cols-2 gap-3">
          {STAT_NASIONAL.slice(0, 2).map((s) => (
            <Card key={s.label} className="p-3.5">
              <p className="text-[12px] font-semibold text-muted">{s.label}</p>
              <p className="mt-1 text-[22px] font-extrabold tabular-nums leading-none text-ink">{s.nilai}</p>
              <p className="mt-1 text-[12px] text-muted">{s.keterangan}</p>
              <Sumber sumber="Kemenkeu" tanggal={s.tanggal} url={s.url} />
            </Card>
          ))}
        </div>
        <Card className="mt-3 p-3.5">
          <p className="text-[12px] font-semibold text-muted">Korban keracunan makanan MBG</p>
          <div className="mt-2 grid grid-cols-2 divide-x divide-line">
            {STAT_KERACUNAN.map((s, i) => (
              <div key={s.label} className={i ? 'pl-3' : 'pr-3'}>
                <span className={cx('inline-block rounded px-1.5 py-0.5 text-[10.5px] font-bold', s.jenis === 'resmi' ? 'bg-slate2-soft text-slate2' : 'bg-sun-soft text-[#8A5D06]')}>{s.jenis === 'resmi' ? 'Resmi · BGN' : 'Independen · JPPI'}</span>
                <p className="mt-1.5 text-[20px] font-extrabold tabular-nums leading-none text-ink">{s.nilai}</p>
                <p className="mt-1 text-[11.5px] leading-snug text-muted">{s.jenis === 'resmi' ? 'sejak 22 Jul 2026, 71 kejadian' : 'akumulasi sejak 2025'}</p>
                <Sumber sumber={s.sumber} tanggal={s.tanggal} url={s.url} />
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-line pt-2 text-[12px] leading-relaxed text-muted">Dua angka ditampilkan berdampingan karena berbeda. Inilah alasan data perlu terbuka dan bisa diperiksa bersama.</p>
        </Card>
        <Card className="mt-3 flex items-center justify-between p-3.5">
          <div>
            <p className="text-[12px] font-semibold text-muted">{STAT_NASIONAL[2].label}</p>
            <p className="text-[12px] text-muted">{STAT_NASIONAL[2].keterangan}</p>
            <Sumber sumber={STAT_NASIONAL[2].sumber} url={STAT_NASIONAL[2].url} />
          </div>
          <p className="text-[26px] font-extrabold tabular-nums text-ink">{STAT_NASIONAL[2].nilai}</p>
        </Card>

        {/* MASUKAN */}
        <Judul kecil="Suara warga" aksi={<Link to="/sekolah" className="text-sm font-bold text-leaf">Semua</Link>}>Masukan & tanggapan dapur</Judul>
        <div className="space-y-3">
          {masukan.map((m) => <ItemMasukan key={m.id} d={d} m={m} tampilSekolah />)}
        </div>

        {/* PARTISIPASI */}
        <Judul kecil="Bulan ini" aksi={<Demo />}>Sekolah paling aktif</Judul>
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {peringkat.map(({ s, persen }, i) => (
              <li key={s.id}>
                <Link to={`/sekolah/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-cream">
                  <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold', i === 0 ? 'bg-sun text-white' : 'bg-cream text-ink')}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-ink">{s.nama}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full bg-leaf" style={{ width: `${persen}%` }} /></div>
                  </div>
                  <span className="w-11 text-right text-[15px] font-bold tabular-nums text-ink">{persen}%</span>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <p className="mt-2 flex items-center gap-1 text-[11.5px] text-muted"><Users size={13} /> Diukur dari persentase warga yang aktif melapor, bukan jumlah keluhan.</p>

        {/* AJAKAN */}
        <section className="mt-9 overflow-hidden rounded-2xl bg-leaf p-5 text-white">
          <p className="text-[19px] font-extrabold leading-snug">Orang tua, siswa, atau guru?</p>
          <p className="mt-1 text-sm text-white/85">Daftar dengan kode undangan dari wali kelas. Melapor cukup 1 menit sehari.</p>
          <div className="mt-4 flex gap-2">
            <Link to="/daftar" className="flex h-11 flex-1 items-center justify-center rounded-xl bg-white text-sm font-bold text-leaf">Daftar</Link>
            <Link to="/masuk" className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/40 text-sm font-bold text-white">Masuk</Link>
          </div>
          <p className="mt-4 flex items-start gap-2 text-[12.5px] text-white/85"><ShieldCheck size={16} className="mt-0.5 shrink-0" />Nama pelapor dan nama anak tidak pernah ditampilkan ke publik.</p>
        </section>

        <Footer />
      </Page>
    </>
  )
}
