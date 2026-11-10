import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, CheckCircle2, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Button, Card, Page, Pesan, TopBar, cx, kelasInput } from '../components/ui'
import { LabelStatus } from '../components/laporan'
import { useSesi } from '../lib/auth'
import { DESKRIPSI_MAKS, DESKRIPSI_MIN, KATEGORI, validasiFoto, validasiLaporan, type IsianLaporan } from '../lib/pengaduan'
import { repo, segarkan } from '../lib/repo'
import { today } from '../lib/date'
import type { KategoriLaporan, Pengaduan } from '../lib/types'

const PELAPOR = ['ortu', 'siswa', 'guru']

/** Kompres & gambar ulang foto (buang EXIF/lokasi). Sisi terpanjang 1280 px, JPEG ~0.75 → umumnya 150–350 KB. */
async function siapkanFoto(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null)
  const img: CanvasImageSource & { width: number; height: number } = bmp ?? await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); const u = URL.createObjectURL(file); i.onload = () => { URL.revokeObjectURL(u); res(i) }; i.onerror = rej; i.src = u
  })
  const skala = Math.min(1, 1280 / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * skala)
  c.height = Math.round(img.height * skala)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Gagal memproses foto'))), 'image/jpeg', 0.75))
}

export default function BuatLaporan() {
  const user = useSesi()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const awal = KATEGORI.some((k) => k.key === params.get('kategori')) ? (params.get('kategori') as KategoriLaporan) : undefined
  const [isian, setIsian] = useState<IsianLaporan>({ kategori: awal, deskripsi: '', tanggalKejadian: today() })
  const [disentuh, setDisentuh] = useState<Record<string, boolean>>({})
  const [foto, setFoto] = useState<{ blob: Blob; url: string; kb: number } | null>(null)
  const [galatFoto, setGalatFoto] = useState('')
  const [prosesFoto, setProsesFoto] = useState(false)
  const [mengirim, setMengirim] = useState(false)
  const [galat, setGalat] = useState('')
  const [mirip, setMirip] = useState<Pengaduan[] | null>(null)
  const [selesai, setSelesai] = useState<Pengaduan | null>(null)
  const kamera = useRef<HTMLInputElement>(null)
  const galeri = useRef<HTMLInputElement>(null)
  const refs = { kategori: useRef<HTMLFieldSetElement>(null), deskripsi: useRef<HTMLTextAreaElement>(null), tanggalKejadian: useRef<HTMLInputElement>(null) }

  if (!user) return <Navigate to="/masuk" replace />
  if (!PELAPOR.includes(user.peran)) return <Navigate to="/app" replace />

  const errors = validasiLaporan(isian)
  const tampil = (k: keyof IsianLaporan) => (disentuh[k] || disentuh.kirim ? errors[k] : undefined)

  const pilihFoto = async (f?: File) => {
    setGalatFoto('')
    if (!f) return
    const salah = validasiFoto(f)
    if (salah) { setGalatFoto(salah); return }
    setProsesFoto(true)
    try {
      const blob = await siapkanFoto(f)
      if (foto) URL.revokeObjectURL(foto.url)
      setFoto({ blob, url: URL.createObjectURL(blob), kb: Math.round(blob.size / 1024) })
    } catch {
      setGalatFoto('Foto tidak bisa dibaca. Coba foto lain atau kirim tanpa foto.')
    } finally {
      setProsesFoto(false)
    }
  }

  const kirim = async (abaikanMirip = false) => {
    setDisentuh((d) => ({ ...d, kirim: true }))
    setGalat('')
    const urutan: (keyof IsianLaporan)[] = ['kategori', 'deskripsi', 'tanggalKejadian']
    const pertama = urutan.find((k) => errors[k])
    if (pertama) {
      const el = refs[pertama].current
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ;(el?.querySelector?.('input') ?? el)?.focus?.({ preventScroll: true })
      return
    }
    setMengirim(true)
    try {
      if (!abaikanMirip) {
        const m = await repo.cekMiripSaya(user, isian as Required<IsianLaporan>)
        if (m.length) { setMirip(m); setMengirim(false); return }
      }
      const r = await repo.buat(user, isian, foto?.blob)
      if (!r.ok) { setGalat(r.pesan); if (r.galat?.foto) setGalatFoto(r.galat.foto); return }
      segarkan()
      setSelesai(r.data)
      window.scrollTo(0, 0)
    } catch (e) {
      setGalat((e as Error).message || 'Laporan gagal dikirim. Coba lagi.')
    } finally {
      setMengirim(false)
    }
  }

  if (selesai) {
    return (
      <>
        <TopBar title="Laporan terkirim" />
        <Page>
          <Card className="text-center">
            <CheckCircle2 size={44} className="mx-auto text-leaf" />
            <h1 className="mt-2 text-xl font-extrabold text-ink">Laporan berhasil dikirim</h1>
            <p className="mt-1 text-sm text-muted">Simpan nomor ini untuk memantau perkembangan.</p>
            <p className="mt-3 rounded-xl bg-cream py-3 font-mono text-xl font-bold tracking-wide text-ink">{selesai.nomor}</p>
            <div className="mt-3 flex justify-center"><LabelStatus status={selesai.status} /></div>
            <p className="mt-3 text-sm text-muted">Petugas sekolah akan memeriksa kelengkapan laporan. Kamu bisa melihat status dan tanggapan di halaman riwayat.</p>
          </Card>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button onClick={() => nav(`/laporan/${selesai.id}`)}>Lihat detail laporan</Button>
            <Button variant="outline" onClick={() => nav('/laporan')}>Ke riwayat laporan</Button>
          </div>
        </Page>
      </>
    )
  }

  return (
    <>
      <TopBar title="Buat laporan" back />
      <Page>
        <p className="text-sm text-muted">Laporan diperiksa petugas sekolah sebelum diteruskan. Namamu dan nama anak tidak ditampilkan ke publik atau ke SPPG.</p>
        <form noValidate onSubmit={(e) => { e.preventDefault(); kirim() }} className="mt-4 space-y-5">
          <fieldset ref={refs.kategori} aria-describedby={tampil('kategori') ? 'galat-kategori' : undefined} tabIndex={-1} className="outline-none">
            <legend className="text-[15px] font-bold text-ink">1. Kategori masalah <span className="text-brick">*</span></legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {KATEGORI.map((k) => (
                <label key={k.key} className={cx('flex min-h-[56px] cursor-pointer items-start gap-3 rounded-xl border bg-white p-3', isian.kategori === k.key ? 'border-leaf ring-2 ring-leaf/20' : tampil('kategori') ? 'border-brick/50' : 'border-line')}>
                  <input type="radio" name="kategori" value={k.key} checked={isian.kategori === k.key} onChange={() => { setIsian({ ...isian, kategori: k.key }); setDisentuh({ ...disentuh, kategori: true }) }} className="mt-1 h-4 w-4 shrink-0 accent-leaf" />
                  <span><span className="block text-sm font-bold text-ink">{k.label}</span><span className="block text-xs leading-snug text-muted">{k.ket}</span></span>
                </label>
              ))}
            </div>
            {tampil('kategori') && <p id="galat-kategori" className="mt-1.5 text-sm font-semibold text-brick">{errors.kategori}</p>}
          </fieldset>

          <div>
            <label htmlFor="deskripsi" className="text-[15px] font-bold text-ink">2. Ceritakan yang terjadi <span className="text-brick">*</span></label>
            <p id="bantu-deskripsi" className="text-xs text-muted">Sebutkan menu/bagian yang bermasalah, kelas, dan jam bila tahu. Jangan tulis nama anak.</p>
            <textarea
              id="deskripsi" ref={refs.deskripsi} rows={5} value={isian.deskripsi}
              onChange={(e) => setIsian({ ...isian, deskripsi: e.target.value.slice(0, DESKRIPSI_MAKS) })}
              onBlur={() => setDisentuh({ ...disentuh, deskripsi: true })}
              aria-invalid={!!tampil('deskripsi')} aria-describedby={`bantu-deskripsi${tampil('deskripsi') ? ' galat-deskripsi' : ''}`}
              placeholder="Contoh: Lauk ayam kecap di kelas 4A berbau asam saat dibuka pukul 10.30, banyak siswa tidak menghabiskan."
              className={cx(kelasInput, 'mt-1.5 py-3 leading-relaxed', tampil('deskripsi') ? 'border-brick' : 'border-line')}
            />
            <div className="flex justify-between gap-2 text-xs">
              {tampil('deskripsi') ? <p id="galat-deskripsi" className="font-semibold text-brick">{errors.deskripsi}</p> : <span className="text-muted">Minimal {DESKRIPSI_MIN} karakter</span>}
              <span className={cx('shrink-0 tabular-nums', isian.deskripsi.trim().length < DESKRIPSI_MIN ? 'text-muted' : 'text-leaf')}>{isian.deskripsi.length}/{DESKRIPSI_MAKS}</span>
            </div>
          </div>

          <div>
            <label htmlFor="tanggal" className="text-[15px] font-bold text-ink">3. Tanggal kejadian <span className="text-brick">*</span></label>
            <input
              id="tanggal" ref={refs.tanggalKejadian} type="date" max={today()} value={isian.tanggalKejadian}
              onChange={(e) => setIsian({ ...isian, tanggalKejadian: e.target.value })} onBlur={() => setDisentuh({ ...disentuh, tanggalKejadian: true })}
              aria-invalid={!!tampil('tanggalKejadian')} aria-describedby={tampil('tanggalKejadian') ? 'galat-tanggal' : undefined}
              className={cx(kelasInput, 'mt-1.5 h-12 sm:max-w-xs', tampil('tanggalKejadian') ? 'border-brick' : 'border-line')}
            />
            {tampil('tanggalKejadian') && <p id="galat-tanggal" className="mt-1.5 text-sm font-semibold text-brick">{errors.tanggalKejadian}</p>}
          </div>

          <div>
            <p className="text-[15px] font-bold text-ink">4. Foto bukti <span className="text-sm font-semibold text-muted">(opsional)</span></p>
            <p className="text-xs text-muted">Foto makanan/wadah saja, tanpa wajah anak. Foto dikecilkan dan data lokasi dihapus otomatis.</p>
            {foto ? (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-line bg-white p-2">
                <img src={foto.url} alt="Pratinjau foto bukti" className="h-20 w-24 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-ink">Foto siap dikirim</p>
                  <p className="text-xs text-muted">{foto.kb} KB setelah dikompres</p>
                </div>
                <button type="button" onClick={() => { URL.revokeObjectURL(foto.url); setFoto(null) }} className="grid h-11 w-11 place-items-center rounded-lg text-brick hover:bg-brick-soft" aria-label="Hapus foto"><Trash2 size={18} /></button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" disabled={prosesFoto} onClick={() => kamera.current?.click()} className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-leaf/40 bg-leaf-soft/40 text-sm font-bold text-leaf disabled:opacity-60">
                  {prosesFoto ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />} Kamera
                </button>
                <button type="button" disabled={prosesFoto} onClick={() => galeri.current?.click()} className="flex h-14 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-bold text-ink disabled:opacity-60">
                  <ImagePlus size={18} /> Galeri
                </button>
              </div>
            )}
            <input ref={kamera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { pilihFoto(e.target.files?.[0]); e.target.value = '' }} />
            <input ref={galeri} type="file" accept="image/*" hidden onChange={(e) => { pilihFoto(e.target.files?.[0]); e.target.value = '' }} />
            {galatFoto && <p className="mt-1.5 text-sm font-semibold text-brick" role="alert">{galatFoto}</p>}
          </div>

          {mirip && (
            <Pesan jenis="peringatan" aksi={
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="h-11" onClick={() => { setMirip(null); kirim(true) }}>Tetap kirim laporan baru</Button>
                <Button type="button" variant="outline" className="h-11" onClick={() => nav(`/laporan/${mirip[0].id}`)}>Lihat laporan sebelumnya</Button>
              </div>
            }>
              <p className="font-bold">Kamu sudah pernah mengirim laporan serupa</p>
              <ul className="mt-1 list-disc pl-4">{mirip.map((m) => <li key={m.id}><span className="font-mono">{m.nomor}</span> · {m.deskripsi.slice(0, 60)}…</li>)}</ul>
              <p className="mt-1 text-xs">Bila ini kejadian berbeda, silakan tetap kirim.</p>
            </Pesan>
          )}
          {galat && <Pesan jenis="galat">{galat}</Pesan>}
          {disentuh.kirim && Object.keys(errors).length > 0 && <Pesan jenis="galat">Lengkapi {Object.keys(errors).length} isian yang ditandai merah.</Pesan>}

          <div className="sticky bottom-[72px] z-10 -mx-4 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
            <Button type="submit" className="w-full" disabled={mengirim || prosesFoto}>
              {mengirim ? <><Loader2 size={18} className="animate-spin" /> Mengirim…</> : 'Kirim laporan'}
            </Button>
          </div>
          <p className="text-center text-xs text-muted">Bila anak sakit, segera hubungi puskesmas atau fasilitas kesehatan terdekat. Aplikasi ini tidak menggantikan penanganan medis. <Link to="/tentang#etika" className="font-semibold text-leaf">Etika data</Link></p>
        </form>
      </Page>
    </>
  )
}
