import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Home, School, ClipboardPen, UserRound, AlertTriangle, MessageSquareReply, Star, Info, BarChart3, History, ShieldCheck, Siren, LogIn, Loader2, XCircle, type LucideIcon } from 'lucide-react'
import { useSesi } from '../lib/auth'
import type { Pengguna } from '../lib/types'

export const panggilan = (nama: string) => {
  const w = nama.replace(/\(.*?\)/g, '').trim().split(/\s+/)
  return /^(pak|bu|ibu|bapak)$/i.test(w[0]) && w[1] ? `${w[0]} ${w[1]}` : w[0]
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* ---------- Identitas ---------- */

export function Logo({ size = 32 }: { size?: number }) {
  return <img src="/logo-96.png" width={size} height={size} decoding="async" alt="" aria-hidden="true" className="shrink-0 object-contain" />
}

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Rantang Terang, ke beranda">
      <Logo size={38} />
      <span className="text-[17px] font-extrabold tracking-tight text-ink">Rantang <span className="text-leaf">Terang</span></span>
    </Link>
  )
}

/* ---------- Kerangka halaman ---------- */

/** Navigasi sesuai peran. Dipakai bersama oleh bar bawah (HP) dan header (tablet/desktop). */
export function menuNavigasi(user?: Pengguna): { to: string; label: string; icon: LucideIcon; end?: boolean }[] {
  if (!user) return [
    { to: '/', label: 'Beranda', icon: Home, end: true },
    { to: '/sekolah', label: 'Sekolah', icon: School },
    { to: '/transparansi', label: 'Transparansi', icon: BarChart3 },
    { to: '/masuk', label: 'Masuk', icon: LogIn },
  ]
  if (user.peran === 'petugas') return [
    { to: '/app', label: 'Beranda', icon: Home, end: true },
    { to: '/petugas/verifikasi', label: 'Verifikasi', icon: ShieldCheck },
    { to: '/petugas/eskalasi', label: 'Eskalasi', icon: Siren },
    { to: '/transparansi', label: 'Publik', icon: BarChart3 },
    { to: '/app/profil', label: 'Saya', icon: UserRound },
  ]
  if (user.peran === 'sppg') return [
    { to: '/', label: 'Beranda', icon: Home, end: true },
    { to: '/mitra/sppg', label: 'Dasbor SPPG', icon: ClipboardPen },
    { to: '/sekolah', label: 'Sekolah', icon: School },
    { to: '/transparansi', label: 'Publik', icon: BarChart3 },
  ]
  if (user.peran === 'kesehatan') return [
    { to: '/', label: 'Beranda', icon: Home, end: true },
    { to: '/mitra/kesehatan', label: 'Kasus', icon: Siren },
    { to: '/transparansi', label: 'Publik', icon: BarChart3 },
  ]
  return [
    { to: '/app', label: 'Beranda', icon: Home, end: true },
    { to: '/lapor/baru', label: 'Lapor', icon: ClipboardPen },
    { to: '/laporan', label: 'Riwayat', icon: History },
    { to: '/transparansi', label: 'Publik', icon: BarChart3 },
    { to: '/app/profil', label: 'Saya', icon: UserRound },
  ]
}

export const berandaPeran = (user?: Pengguna) => (!user ? '/' : user.peran === 'sppg' ? '/mitra/sppg' : user.peran === 'kesehatan' ? '/mitra/kesehatan' : '/app')

function NavDesktop() {
  const user = useSesi()
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
      {menuNavigasi(user).filter((m) => m.to !== '/masuk' && m.to !== '/app/profil').map(({ to, label, end }) => (
        <NavLink key={to + label} to={to} end={end} className={({ isActive }) => cx('rounded-lg px-3 py-2 text-sm font-semibold', isActive ? 'bg-leaf-soft text-leaf' : 'text-muted hover:text-ink')}>{label}</NavLink>
      ))}
    </nav>
  )
}

function TombolAkun() {
  const user = useSesi()
  return user ? (
    <Link to={user.peran === 'sppg' || user.peran === 'kesehatan' ? berandaPeran(user) : '/app/profil'} className="flex min-h-[40px] items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-semibold text-ink">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-leaf-soft text-xs font-bold text-leaf">{user.nama.slice(0, 1)}</span>
      <span className="max-w-[110px] truncate">{panggilan(user.nama)}</span>
    </Link>
  ) : (
    <Link to="/masuk" className="rounded-lg px-3 py-2 text-sm font-bold text-leaf hover:bg-leaf-soft">Masuk</Link>
  )
}

export function TopBar({ title, back }: { title?: string; back?: boolean | string }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4">
        {title ? (
          <div className="flex min-w-0 items-center gap-1">
            {back && (
              <button onClick={() => (typeof back === 'string' ? nav(back) : window.history.length > 1 ? nav(-1) : nav('/'))} className="-ml-2 grid h-11 w-11 place-items-center rounded-lg text-ink hover:bg-white" aria-label="Kembali">
                <ArrowLeft size={20} />
              </button>
            )}
            <span className="hidden md:block"><Logo size={30} /></span>
            <h1 className="truncate text-[17px] font-bold text-ink">{title}</h1>
          </div>
        ) : <Brand />}
        <div className="flex items-center gap-2">
          <NavDesktop />
          <TombolAkun />
        </div>
      </div>
    </header>
  )
}

export function BottomNav() {
  const user = useSesi()
  const items = menuNavigasi(user)
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navigasi utama">
      <div className="mx-auto grid h-16 w-full max-w-[560px]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to + label} to={to} end={end} className={({ isActive }) => cx('flex flex-col items-center justify-center gap-1 text-[11px] font-semibold', isActive ? 'text-leaf' : 'text-muted')}>
            <Icon size={21} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/** lebar: 'baca' untuk halaman formulir/konten, 'dasbor' untuk daftar & dasbor (melebar di desktop). */
export function Page({ children, nav = true, className, lebar = 'baca' }: { children: ReactNode; nav?: boolean; className?: string; lebar?: 'baca' | 'dasbor' }) {
  return (
    <>
      <main className={cx('mx-auto w-full px-4', lebar === 'dasbor' ? 'max-w-[560px] md:max-w-3xl lg:max-w-5xl' : 'max-w-[560px] md:max-w-2xl', className?.includes('pt-0') ? '' : 'pt-4', nav ? 'pb-24 md:pb-12' : 'pb-10', className)}>{children}</main>
      {nav && <BottomNav />}
    </>
  )
}

export function Footer() {
  return (
    <footer className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-muted">
      <p className="font-semibold text-ink">Rantang Terang</p>
      <p>Dari dapur sampai piring, terbuka untuk semua.</p>
      <p className="mt-2">Rantang Terang adalah proyek independen tim Incess Cikarang untuk Web In Action – MIA 2026, bukan layanan resmi pemerintah. Data laporan warga pada versi ini adalah contoh untuk demo.</p>
      <div className="mt-3 flex gap-4 font-semibold text-leaf">
        <Link to="/tentang">Tentang & Data</Link>
        <Link to="/tentang#etika">Etika data</Link>
      </div>
    </footer>
  )
}

/* ---------- Komponen dasar ---------- */

export function Card({ children, className, as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return <Tag className={cx('rounded-xl border border-line bg-white p-4', className)}>{children}</Tag>
}

export function H2({ children, aksi }: { children: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-end justify-between gap-3">
      <h2 className="text-[17px] font-bold text-ink">{children}</h2>
      {aksi}
    </div>
  )
}

export function Button({ children, variant = 'primary', className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'danger' }) {
  const v = {
    primary: 'bg-leaf text-white hover:bg-leaf-dark disabled:bg-[#B9C4BD]',
    outline: 'border border-line bg-white text-ink hover:border-leaf',
    ghost: 'text-leaf hover:bg-leaf-soft',
    danger: 'border border-brick/30 bg-brick-soft text-brick',
  }[variant]
  return (
    <button {...rest} className={cx('inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-bold transition disabled:cursor-not-allowed', v, className)}>
      {children}
    </button>
  )
}

export function LinkButton({ to, children, variant = 'primary', className }: { to: string; children: ReactNode; variant?: 'primary' | 'outline'; className?: string }) {
  return (
    <Link to={to} className={cx('inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-bold', variant === 'primary' ? 'bg-leaf text-white hover:bg-leaf-dark' : 'border border-line bg-white text-ink hover:border-leaf', className)}>
      {children}
    </Link>
  )
}

type StatusJenis = 'menunggu' | 'diperiksa' | 'ditanggapi' | 'perhatian' | 'aman' | 'info'
export function Chip({ jenis, children }: { jenis: StatusJenis; children: ReactNode }) {
  const map = {
    menunggu: ['bg-[#F1F2F1] text-[#4B524E]', Clock],
    diperiksa: ['bg-slate2-soft text-slate2', CheckCircle2],
    ditanggapi: ['bg-leaf-soft text-leaf', MessageSquareReply],
    perhatian: ['bg-brick-soft text-brick', AlertTriangle],
    aman: ['bg-leaf-soft text-leaf', CheckCircle2],
    info: ['bg-sun-soft text-[#8A5D06]', Info],
  } as const
  const [cls, Icon] = map[jenis]
  return (
    <span className={cx('inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[11.5px] font-bold', cls)}>
      <Icon size={13} strokeWidth={2.4} />
      {children}
    </span>
  )
}

export function Sumber({ sumber, tanggal, url }: { sumber: string; tanggal?: string; url?: string }) {
  const isi = (
    <>
      Sumber: {sumber}
      {tanggal ? ` · ${tanggal}` : ''}
      {url && <ExternalLink size={11} className="ml-1 inline" />}
    </>
  )
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="mt-2 block text-[11.5px] leading-snug text-muted underline-offset-2 hover:underline">{isi}</a>
  ) : (
    <p className="mt-2 text-[11.5px] leading-snug text-muted">{isi}</p>
  )
}

export const Demo = () => <span className="rounded bg-[#F1F2F1] px-1.5 py-0.5 text-[10.5px] font-semibold text-muted">Contoh untuk demo</span>

export function Bintang({ nilai, ukuran = 14 }: { nilai: number; ukuran?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${nilai} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={ukuran} className={i <= Math.round(nilai) ? 'fill-sun text-sun' : 'text-line'} />
      ))}
    </span>
  )
}

export function PilihBintang({ nilai, onChange, label }: { nilai: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={nilai === i} aria-label={`${i} bintang`} onClick={() => onChange(i)} className="p-1">
          <Star size={30} className={i <= nilai ? 'fill-sun text-sun' : 'text-line'} />
        </button>
      ))}
    </div>
  )
}

/** Ilustrasi baki makanan (pengganti foto bila foto asli belum tersedia). */
export function Baki({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} role="img" aria-label="Ilustrasi baki makanan: nasi, lauk, sayur, dan buah">
      <rect width="320" height="200" fill="#EFE8DA" />
      <rect x="22" y="18" width="276" height="164" rx="22" fill="#D9DDDA" />
      <rect x="32" y="28" width="256" height="144" rx="16" fill="#C9CECB" />
      <rect x="40" y="36" width="122" height="128" rx="12" fill="#BFC5C1" />
      <ellipse cx="101" cy="100" rx="46" ry="40" fill="#FBFAF6" />
      <ellipse cx="92" cy="90" rx="10" ry="6" fill="#F1EEE6" />
      <rect x="170" y="36" width="110" height="60" rx="12" fill="#BFC5C1" />
      <path d="M186 74c8-22 52-26 74-8 4 10-6 18-36 18s-40-2-38-10z" fill="#8A4B22" />
      <path d="M196 66c10-8 30-10 46-4" stroke="#B5682F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="170" y="104" width="52" height="60" rx="12" fill="#BFC5C1" />
      <circle cx="186" cy="124" r="9" fill="#5E9B4C" /><circle cx="203" cy="132" r="10" fill="#3F7F3A" /><circle cx="190" cy="145" r="8" fill="#E08A3A" /><circle cx="207" cy="149" r="7" fill="#6FAE58" />
      <rect x="228" y="104" width="52" height="60" rx="12" fill="#BFC5C1" />
      <circle cx="254" cy="134" r="18" fill="#F0A030" /><circle cx="249" cy="128" r="4" fill="#F7C46A" />
      <path d="M254 116c2-6 8-8 12-6" stroke="#3F7F3A" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** Foto asli bila file tersedia di /public/images, ilustrasi bila belum. */
export function Foto({ src, alt, className, kredit }: { src: string; alt: string; className?: string; kredit?: string }) {
  const [gagal, setGagal] = useState(false)
  if (gagal) return <Baki className={cx('h-full w-full object-cover', className)} />
  return (
    <figure className={cx('relative overflow-hidden', className)}>
      <img src={src} alt={alt} onError={() => setGagal(true)} className="h-full w-full object-cover" loading="lazy" />
      {kredit && <figcaption className="absolute bottom-1 right-2 text-[10px] text-white/90 drop-shadow">{kredit}</figcaption>}
    </figure>
  )
}

export function Kosong({ ikon, judul, teks, aksi }: { ikon?: ReactNode; judul: string; teks?: string; aksi?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-white px-4 py-6 text-center">
      {ikon && <div className="mb-2 text-muted">{ikon}</div>}
      <p className="font-semibold text-ink">{judul}</p>
      {teks && <p className="mt-1 text-sm text-muted">{teks}</p>}
      {aksi && <div className="mt-3">{aksi}</div>}
    </div>
  )
}

export function Toast({ pesan, onClose }: { pesan: string; onClose: () => void }) {
  useEffect(() => {
    if (!pesan) return
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [pesan, onClose])
  if (!pesan) return null
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto w-[calc(100%-2rem)] max-w-[448px] rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg md:bottom-6">
      {pesan}
    </div>
  )
}

/** Kompres foto di browser sebelum disimpan (EXIF/lokasi ikut terbuang karena digambar ulang ke canvas). */
export async function kompresFoto(file: File, maks = 720): Promise<string> {
  const url = URL.createObjectURL(file)
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
  const skala = Math.min(1, maks / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * skala)
  c.height = Math.round(img.height * skala)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  URL.revokeObjectURL(url)
  return c.toDataURL('image/jpeg', 0.72)
}

/* ---------- Status muat & pesan ---------- */

export function Memuat({ teks = 'Memuat data…' }: { teks?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-muted">
      <Loader2 size={18} className="animate-spin text-leaf" /> {teks}
    </div>
  )
}

export function Pesan({ jenis, children, aksi }: { jenis: 'galat' | 'berhasil' | 'info' | 'peringatan'; children: ReactNode; aksi?: ReactNode }) {
  const gaya = {
    galat: ['border-brick/30 bg-brick-soft text-ink', XCircle, 'text-brick'],
    berhasil: ['border-leaf/30 bg-leaf-soft text-ink', CheckCircle2, 'text-leaf'],
    info: ['border-slate2/20 bg-slate2-soft text-ink', Info, 'text-slate2'],
    peringatan: ['border-sun/40 bg-sun-soft text-ink', AlertTriangle, 'text-[#8A5D06]'],
  } as const
  const [cls, Icon, warna] = gaya[jenis]
  return (
    <div role={jenis === 'galat' ? 'alert' : 'status'} className={cx('flex gap-2.5 rounded-xl border p-3 text-sm leading-relaxed', cls)}>
      <Icon size={18} className={cx('mt-0.5 shrink-0', warna)} />
      <div className="min-w-0 flex-1">{children}{aksi && <div className="mt-2">{aksi}</div>}</div>
    </div>
  )
}

export const kelasInput = 'w-full rounded-xl border bg-white px-3 text-[16px] outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15'
