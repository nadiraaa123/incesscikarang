import { Link } from 'react-router-dom'
import { Camera, CheckCircle2, ChevronRight, Clock, Copy, HeartPulse, Loader, Lock, MessageSquareReply, Send, ShieldCheck, Siren, StickyNote, XCircle } from 'lucide-react'
import type { JejakPengaduan, Pengaduan, StatusLaporan, Urgensi } from '../lib/types'
import { ALUR_UTAMA, LABEL_STATUS, LABEL_URGENSI, labelKategori, masukEskalasi } from '../lib/pengaduan'
import { fmtPendek } from '../lib/date'
import { Demo, cx } from './ui'

/* Satu sumber gaya status agar label konsisten di semua halaman. Warna selalu didampingi ikon + teks. */
const GAYA_STATUS: Record<StatusLaporan, [string, typeof Clock]> = {
  menunggu_verifikasi: ['bg-[#F1F2F1] text-[#4B524E] ring-[#DADDDB]', Clock],
  terverifikasi: ['bg-slate2-soft text-slate2 ring-slate2/20', ShieldCheck],
  ditolak: ['bg-brick-soft text-brick ring-brick/25', XCircle],
  diteruskan_sppg: ['bg-sun-soft text-[#7A5206] ring-sun/30', Send],
  diteruskan_kesehatan: ['bg-[#F3E8F1] text-[#7A2E6B] ring-[#7A2E6B]/20', HeartPulse],
  dalam_penanganan: ['bg-slate2-soft text-slate2 ring-slate2/20', Loader],
  selesai: ['bg-leaf-soft text-leaf ring-leaf/25', CheckCircle2],
}

export function LabelStatus({ status, kecil }: { status: StatusLaporan; kecil?: boolean }) {
  const [cls, Icon] = GAYA_STATUS[status]
  return (
    <span className={cx('inline-flex max-w-full items-center gap-1 rounded-full font-bold ring-1 ring-inset', kecil ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs', cls)}>
      <Icon size={kecil ? 12 : 13} strokeWidth={2.4} className="shrink-0" />
      <span className="truncate">{LABEL_STATUS[status]}</span>
    </span>
  )
}

const GAYA_URGENSI: Record<Urgensi, string> = {
  normal: 'border-line bg-white text-muted',
  sedang: 'border-sun/50 bg-sun-soft text-[#7A5206]',
  tinggi: 'border-brick bg-brick text-white',
}

export function LabelUrgensi({ urgensi, kecil }: { urgensi?: Urgensi; kecil?: boolean }) {
  if (!urgensi) return <span className={cx('inline-flex items-center rounded-md border border-dashed border-line font-semibold text-muted', kecil ? 'px-1.5 text-[11px]' : 'px-2 py-0.5 text-xs')}>Urgensi belum ditetapkan</span>
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md border font-bold', kecil ? 'px-1.5 text-[11px]' : 'px-2 py-0.5 text-xs', GAYA_URGENSI[urgensi])}>
      {urgensi === 'tinggi' && <Siren size={12} />}Urgensi {LABEL_URGENSI[urgensi]}
    </span>
  )
}

export const fmtWaktu = (iso: string) => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function sejak(iso: string) {
  const menit = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (menit < 60) return `${menit} menit lalu`
  const jam = Math.round(menit / 60)
  if (jam < 24) return `${jam} jam lalu`
  return `${Math.round(jam / 24)} hari lalu`
}

/** Progres alur utama. Ditolak dan cabang pihak kesehatan ditampilkan sebagai keterangan, bukan tahap wajib. */
export function ProgresAlur({ p }: { p: Pengaduan }) {
  if (p.status === 'ditolak') {
    return <p className="flex items-center gap-2 rounded-lg bg-brick-soft px-3 py-2 text-sm font-semibold text-brick"><XCircle size={16} /> Laporan ditolak pada tahap verifikasi</p>
  }
  const posisi = p.status === 'diteruskan_kesehatan' ? 2 : ALUR_UTAMA.indexOf(p.status)
  const label = ['Menunggu verifikasi', 'Terverifikasi', 'Diteruskan', 'Ditangani', 'Selesai']
  return (
    <div>
      <ol className="grid grid-cols-5 gap-1" aria-label={`Tahap ${posisi + 1} dari 5: ${LABEL_STATUS[p.status]}`}>
        {label.map((l, i) => (
          <li key={l} className="min-w-0">
            <div className={cx('h-1.5 rounded-full', i <= posisi ? (p.status === 'selesai' ? 'bg-leaf' : 'bg-slate2') : 'bg-line')} />
            <p className={cx('mt-1 truncate text-[10.5px] font-semibold leading-tight sm:text-[11px]', i === posisi ? 'text-ink' : 'text-muted')}>{l}</p>
          </li>
        ))}
      </ol>
      {p.keKesehatan && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#7A2E6B]"><HeartPulse size={13} /> Melibatkan pihak kesehatan terkait</p>}
    </div>
  )
}

const IKON_JEJAK = { dibuat: Send, status: CheckCircle2, urgensi: Siren, catatan: StickyNote, tanggapan: MessageSquareReply }

function judulJejak(j: JejakPengaduan) {
  if (j.jenis === 'dibuat') return 'Laporan dikirim'
  if (j.jenis === 'status') return j.ke ? `Status: ${LABEL_STATUS[j.ke]}` : 'Status diperbarui'
  if (j.jenis === 'urgensi') return `Urgensi ditetapkan: ${j.urgensi ? LABEL_URGENSI[j.urgensi] : '-'}`
  if (j.jenis === 'tanggapan') return 'Tanggapan SPPG'
  return 'Catatan tindak lanjut'
}

/** Riwayat penanganan, urut waktu. Append-only: setiap baris adalah tindakan yang tercatat beserta waktunya. */
export function Linimasa({ jejak, tampilInternal }: { jejak: JejakPengaduan[]; tampilInternal?: boolean }) {
  if (!jejak.length) return <p className="text-sm text-muted">Belum ada riwayat.</p>
  return (
    <ol className="relative">
      {jejak.map((j, i) => {
        const Icon = IKON_JEJAK[j.jenis]
        const akhir = i === jejak.length - 1
        return (
          <li key={j.id} className="relative flex gap-3 pb-4 last:pb-0">
            {!akhir && <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-px bg-line" aria-hidden="true" />}
            <span className={cx('relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full', j.jenis === 'tanggapan' ? 'bg-leaf text-white' : j.ke === 'ditolak' ? 'bg-brick-soft text-brick' : j.ke === 'selesai' ? 'bg-leaf-soft text-leaf' : 'bg-cream text-ink ring-1 ring-line')}>
              <Icon size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-sm font-bold text-ink">{judulJejak(j)}</p>
                <time dateTime={j.waktu} className="text-[11.5px] tabular-nums text-muted">{fmtWaktu(j.waktu)}</time>
              </div>
              <p className="text-xs text-muted">oleh {j.aktorLabel}{tampilInternal && !j.untukPelapor && <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-cream px-1 font-semibold"><Lock size={10} /> internal</span>}</p>
              {j.catatan && <p className="break-anywhere mt-1 whitespace-pre-line rounded-lg bg-cream px-3 py-2 text-[13.5px] leading-relaxed text-ink">{j.catatan}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function KartuLaporan({ p, sekolah, tampilUrgensi, tampilMirip }: { p: Pengaduan; sekolah?: string; tampilUrgensi?: boolean; tampilMirip?: boolean }) {
  return (
    <Link to={`/laporan/${p.id}`} className={cx('block rounded-xl border bg-white p-3.5 transition hover:border-leaf focus-visible:border-leaf', tampilUrgensi && p.urgensi === 'tinggi' && p.status !== 'selesai' ? 'border-brick/50' : 'border-line')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[12px] font-semibold text-muted">{p.nomor}</p>
          <p className="mt-0.5 font-bold text-ink">{labelKategori(p.kategori)}</p>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-muted" />
      </div>
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink/80">{p.deskripsi}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <LabelStatus status={p.status} kecil />
        {tampilUrgensi && p.status !== 'menunggu_verifikasi' && p.status !== 'ditolak' && <LabelUrgensi urgensi={p.urgensi} kecil />}
        {tampilUrgensi && masukEskalasi(p) && p.status !== 'selesai' && <span className="rounded-md bg-brick-soft px-1.5 text-[11px] font-bold text-brick">Jalur eskalasi</span>}
        {tampilMirip && p.kemungkinanDuplikat.length > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-sun-soft px-1.5 text-[11px] font-bold text-[#7A5206]"><Copy size={11} /> Mungkin terkait ({p.kemungkinanDuplikat.length})</span>}
        {p.fotoUrl && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted"><Camera size={12} /> Foto</span>}
        {p.demo && <Demo />}
      </div>
      <p className="mt-2 text-[11.5px] text-muted">
        {sekolah && <>{sekolah} · </>}Kejadian {fmtPendek(p.tanggalKejadian)} · diperbarui {sejak(p.diperbarui)}
      </p>
    </Link>
  )
}
