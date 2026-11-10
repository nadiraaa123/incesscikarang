import { useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Building2, ClipboardCheck, Copy, HeartPulse, Loader2, Lock, School, ShieldCheck, UserRound } from 'lucide-react'
import { Button, Card, Demo, H2, Kosong, Memuat, Page, Pesan, Toast, TopBar, cx, kelasInput } from '../components/ui'
import { LabelStatus, LabelUrgensi, Linimasa, ProgresAlur, fmtWaktu } from '../components/laporan'
import { useSesi } from '../lib/auth'
import { aksiTersedia, cekAksi, LABEL_STATUS, LABEL_URGENSI, labelKategori, masukEskalasi, STATUS_AKTIF, URGENSI_ESKALASI, type Aksi } from '../lib/pengaduan'
import { repo, segarkan, useKueri, type DetailPengaduan } from '../lib/repo'
import { fmtTanggal } from '../lib/date'
import type { Pengguna, Urgensi } from '../lib/types'

export default function DetailLaporan() {
  const { id = '' } = useParams()
  const user = useSesi()
  const q = useKueri(() => (user ? repo.detail(user, id) : Promise.resolve(null)), [user?.id, id])
  if (!user) return <Navigate to="/masuk" replace />
  const pelapor = ['ortu', 'siswa', 'guru'].includes(user.peran)
  const kembali = pelapor ? '/laporan' : user.peran === 'petugas' ? '/petugas/eskalasi' : user.peran === 'sppg' ? '/mitra/sppg' : '/mitra/kesehatan'

  return (
    <>
      <TopBar title="Detail laporan" back={kembali} />
      <Page lebar="dasbor">
        {q.memuat && !q.data ? <Memuat /> : q.galat ? (
          <Pesan jenis="galat" aksi={<Button variant="outline" className="h-10" onClick={q.muatUlang}>Coba lagi</Button>}>{q.galat}</Pesan>
        ) : !q.data ? (
          <Kosong judul="Laporan tidak ditemukan" teks="Laporan tidak ada atau berada di luar kewenangan akunmu." aksi={<Link to={kembali} className="font-bold text-leaf">Kembali</Link>} />
        ) : <Isi d={q.data} user={user} />}
      </Page>
    </>
  )
}

function Baris({ ikon, label, children }: { ikon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <span className="mt-0.5 text-muted">{ikon}</span>
      <div className="min-w-0"><dt className="text-xs text-muted">{label}</dt><dd className="text-sm font-semibold text-ink">{children}</dd></div>
    </div>
  )
}

function Isi({ d, user }: { d: DetailPengaduan; user: Pengguna }) {
  const { p } = d
  const pelapor = ['ortu', 'siswa', 'guru'].includes(user.peran)
  const staf = !pelapor
  const tanggapan = d.jejak.filter((j) => j.jenis === 'tanggapan')

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
      <div className="min-w-0">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="break-anywhere font-mono text-sm font-bold text-muted">{p.nomor}</p>
              <h1 className="text-xl font-extrabold leading-tight text-ink">{labelKategori(p.kategori)}</h1>
            </div>
            <LabelStatus status={p.status} />
          </div>
          {staf && p.status !== 'menunggu_verifikasi' && p.status !== 'ditolak' && (
            <div className="mt-2 flex flex-wrap gap-1.5"><LabelUrgensi urgensi={p.urgensi} />{masukEskalasi(p) && p.status !== 'selesai' && <span className="rounded-md bg-brick-soft px-2 py-0.5 text-xs font-bold text-brick">Jalur eskalasi</span>}</div>
          )}
          <div className="mt-4"><ProgresAlur p={p} /></div>
        </Card>

        {p.status === 'ditolak' && (
          <div className="mt-3"><Pesan jenis="galat"><p className="font-bold">Alasan penolakan</p><p className="break-anywhere">{p.alasanTolak}</p>{pelapor && <Link to={`/lapor/baru?kategori=${p.kategori}`} className="mt-1 inline-block font-bold text-leaf">Kirim laporan baru dengan informasi lebih lengkap</Link>}</Pesan></div>
        )}
        {p.status === 'selesai' && p.hasil && (
          <div className="mt-3"><Pesan jenis="berhasil"><p className="font-bold">Hasil penyelesaian</p><p className="break-anywhere">{p.hasil}</p></Pesan></div>
        )}

        <H2>Laporan asli</H2>
        <Card>
          <p className="flex items-center gap-1 text-[11.5px] font-semibold text-muted"><Lock size={12} /> Isi laporan tidak dapat diubah oleh siapa pun, termasuk SPPG. {p.demo && <Demo />}</p>
          <p className="break-anywhere mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">{p.deskripsi}</p>
          {d.fotoTampil && <img src={d.fotoTampil} alt="Foto bukti dari pelapor" loading="lazy" className="mt-3 max-h-[360px] w-full rounded-lg bg-cream object-contain" />}
          <dl className="mt-3 grid border-t border-line pt-1 sm:grid-cols-2">
            <Baris ikon={<ClipboardCheck size={15} />} label="Tanggal kejadian">{fmtTanggal(p.tanggalKejadian)}</Baris>
            <Baris ikon={<ClipboardCheck size={15} />} label="Dikirim">{fmtWaktu(p.dibuat)}</Baris>
            <Baris ikon={<School size={15} />} label="Sekolah">{d.sekolah ?? p.schoolId}</Baris>
            {d.pelapor && <Baris ikon={<UserRound size={15} />} label="Pelapor (hanya terlihat petugas sekolah)">{d.pelapor}</Baris>}
          </dl>
        </Card>

        {pelapor && tanggapan.length > 0 && (
          <>
            <H2>Tanggapan SPPG</H2>
            <div className="space-y-2">
              {tanggapan.map((t) => (
                <div key={t.id} className="rounded-xl border-l-4 border-leaf bg-leaf-soft/60 px-3 py-2.5">
                  <p className="break-anywhere text-[14px] leading-relaxed text-ink">{t.catatan}</p>
                  <p className="mt-1 text-[11.5px] text-muted">{t.aktorLabel} · {fmtWaktu(t.waktu)}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {d.mirip.length > 0 && (
          <>
            <H2>Mungkin terkait</H2>
            <Pesan jenis="peringatan">
              <p className="text-[13px]">Laporan berikut mirip (sekolah, kategori, dan tanggal berdekatan). Ini <span className="font-bold">bukan tanda laporan palsu</span>: laporan dari orang berbeda bisa saling menguatkan. Periksa isinya sebelum memutuskan.</p>
              <ul className="mt-2 space-y-1.5">
                {d.mirip.map((m) => (
                  <li key={m.id}>
                    <Link to={`/laporan/${m.id}`} className="block rounded-lg bg-white/70 px-2.5 py-2 hover:bg-white">
                      <span className="flex flex-wrap items-center gap-1.5"><Copy size={12} /><span className="font-mono text-xs font-bold">{m.nomor}</span><LabelStatus status={m.status} kecil />{m.pelaporSama && <span className="text-[11px] font-bold text-brick">Pelapor yang sama</span>}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-ink/80">{m.deskripsi}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Pesan>
          </>
        )}

        <H2>Riwayat penanganan</H2>
        <Card><Linimasa jejak={d.jejak} tampilInternal={staf} /></Card>
        {pelapor && <p className="mt-2 text-xs text-muted">Catatan internal petugas dan pihak kesehatan tidak ditampilkan di sini untuk menjaga kerahasiaan data.</p>}
      </div>

      <aside className="min-w-0 lg:sticky lg:top-20">
        <H2>Penanggung jawab</H2>
        <Card className="py-2">
          <dl>
            <Baris ikon={<ShieldCheck size={15} />} label="Verifikasi">{d.petugas ?? <span className="font-normal text-muted">Belum diperiksa</span>}</Baris>
            <Baris ikon={<Building2 size={15} />} label="SPPG">{d.sppg ?? <span className="font-normal text-muted">Belum diteruskan</span>}</Baris>
            {(p.keKesehatan || (staf && masukEskalasi(p))) && <Baris ikon={<HeartPulse size={15} />} label="Pihak kesehatan terkait">{d.faskes ?? <span className="font-normal text-muted">Belum diteruskan</span>}</Baris>}
            <Baris ikon={<ClipboardCheck size={15} />} label="Terakhir diperbarui">{fmtWaktu(p.diperbarui)}</Baris>
          </dl>
        </Card>
        {staf && <PanelTindakan d={d} user={user} />}
      </aside>
    </div>
  )
}

const JUDUL_AKSI: Record<Aksi, string> = {
  verifikasi: 'Terverifikasi',
  tolak: 'Tolak laporan',
  teruskan_sppg: 'Teruskan ke SPPG',
  teruskan_kesehatan: 'Teruskan ke Pihak Kesehatan Terkait',
  mulai_tangani: 'Tandai Dalam Penanganan',
  selesaikan: 'Tandai Selesai',
}

function PanelTindakan({ d, user }: { d: DetailPengaduan; user: Pengguna }) {
  const { p } = d
  const [form, setForm] = useState<Aksi | null>(null)
  const [teks, setTeks] = useState('')
  const [jugaKesehatan, setJugaKesehatan] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [untukPelapor, setUntukPelapor] = useState(user.peran !== 'kesehatan')
  const [sibuk, setSibuk] = useState('')
  const [galat, setGalat] = useState('')
  const [toast, setToast] = useState('')
  const aksi = aksiTersedia(p, user.peran)

  const jalankan = async (kunci: string, fn: () => Promise<{ ok: boolean; pesan?: string }>, sukses: string) => {
    setSibuk(kunci); setGalat('')
    try {
      const r = await fn()
      if (!r.ok) { setGalat(r.pesan ?? 'Gagal.'); return false }
      segarkan(); setToast(sukses); return true
    } catch (e) { setGalat((e as Error).message); return false } finally { setSibuk('') }
  }

  const lakukan = async (a: Aksi) => {
    const isian = a === 'tolak' ? { alasan: teks } : a === 'selesaikan' ? { hasil: teks } : { catatan: teks }
    const salah = cekAksi(p, a, user.peran, isian)
    if (salah) { setGalat(salah); return }
    const ok = await jalankan(a, () => repo.aksi(user, p.id, a, isian), `Status: ${LABEL_STATUS[ { verifikasi: 'terverifikasi', tolak: 'ditolak', teruskan_sppg: 'diteruskan_sppg', teruskan_kesehatan: 'diteruskan_kesehatan', mulai_tangani: 'dalam_penanganan', selesaikan: 'selesai' }[a] as keyof typeof LABEL_STATUS]}`)
    if (ok && a === 'teruskan_sppg' && jugaKesehatan) await jalankan('teruskan_kesehatan', () => repo.aksi(user, p.id, 'teruskan_kesehatan', { catatan: 'Diteruskan bersamaan karena masuk jalur eskalasi.' }), 'Diteruskan ke SPPG dan pihak kesehatan terkait')
    if (ok) { setForm(null); setTeks('') }
  }

  const butuhTeks = (a: Aksi) => a === 'tolak' || a === 'selesaikan'
  const bisaCatat = STATUS_AKTIF.includes(p.status)
  const urgensiBisa = user.peran === 'petugas' && STATUS_AKTIF.includes(p.status)

  return (
    <>
      <H2>Tindakan</H2>
      <Card className="space-y-4">
        {galat && <Pesan jenis="galat">{galat}</Pesan>}

        {user.peran === 'petugas' && p.status === 'menunggu_verifikasi' && (
          <div className="rounded-lg bg-cream p-3 text-[13px] leading-relaxed text-ink">
            <p className="font-bold">Periksa sebelum memutuskan</p>
            <ul className="mt-1 list-disc pl-4 text-muted">
              <li>Kategori sesuai isi laporan</li><li>Deskripsi cukup jelas untuk ditindaklanjuti</li><li>Tanggal kejadian masuk akal</li><li>Foto bukti (bila ada) relevan</li>
            </ul>
          </div>
        )}

        {urgensiBisa && (
          <div>
            <p className="text-sm font-bold text-ink">Tingkat urgensi</p>
            <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tingkat urgensi">
              {(['normal', 'sedang', 'tinggi'] as Urgensi[]).map((u) => (
                <button key={u} type="button" role="radio" aria-checked={p.urgensi === u} disabled={!!sibuk}
                  onClick={() => jalankan('urgensi', () => repo.setUrgensi(user, p.id, u), `Urgensi: ${LABEL_URGENSI[u]}`)}
                  className={cx('h-11 rounded-xl border text-sm font-bold', p.urgensi === u ? (u === 'tinggi' ? 'border-brick bg-brick text-white' : u === 'sedang' ? 'border-sun bg-sun-soft text-[#7A5206]' : 'border-leaf bg-leaf-soft text-leaf') : 'border-line bg-white text-ink')}>
                  {LABEL_URGENSI[u]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] leading-snug text-muted">Ditentukan petugas berdasarkan kategori dan isi laporan sesuai prosedur yang berlaku. Urgensi {URGENSI_ESKALASI.map((u) => LABEL_URGENSI[u]).join('/')} masuk jalur eskalasi. Aplikasi tidak menentukan urgensi dan tidak memberi diagnosis.</p>
          </div>
        )}

        {aksi.length > 0 && (
          <div className="space-y-2">
            {aksi.map((a) => {
              const dinonaktif = (a === 'teruskan_sppg' && !p.urgensi) || (a === 'teruskan_kesehatan' && !(p.urgensi && URGENSI_ESKALASI.includes(p.urgensi)))
              if (a === 'teruskan_kesehatan' && dinonaktif) return null
              return (
                <div key={a}>
                  {form === a ? (
                    <div className="rounded-xl border border-leaf/40 p-3">
                      <label className="text-sm font-bold text-ink" htmlFor={`teks-${a}`}>{a === 'tolak' ? 'Alasan penolakan (wajib, terlihat oleh pelapor)' : a === 'selesaikan' ? 'Hasil penyelesaian (wajib, terlihat oleh pelapor)' : 'Catatan (opsional)'}</label>
                      <textarea id={`teks-${a}`} rows={3} value={teks} onChange={(e) => setTeks(e.target.value.slice(0, 600))} className={cx(kelasInput, 'mt-1.5 border-line py-2 text-[15px]')}
                        placeholder={a === 'tolak' ? 'Contoh: Informasi belum cukup, mohon sebutkan menu dan kelas.' : a === 'selesaikan' ? 'Contoh: SPPG mengganti pemasok; dicek 3 hari tanpa keluhan.' : ''} />
                      {a === 'teruskan_sppg' && p.urgensi && URGENSI_ESKALASI.includes(p.urgensi) && (
                        <label className="mt-2 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-leaf" checked={jugaKesehatan} onChange={(e) => setJugaKesehatan(e.target.checked)} />Teruskan juga ke pihak kesehatan terkait (bila diperlukan sesuai prosedur)</label>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button variant="outline" className="h-11 w-24" onClick={() => { setForm(null); setTeks(''); setGalat('') }}>Batal</Button>
                        <Button variant={a === 'tolak' ? 'danger' : 'primary'} className="h-11 flex-1" disabled={!!sibuk || (butuhTeks(a) && teks.trim().length < 10)} onClick={() => lakukan(a)}>
                          {sibuk === a ? <Loader2 size={16} className="animate-spin" /> : null}Konfirmasi
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant={a === 'tolak' ? 'outline' : 'primary'} className={cx('w-full', a === 'tolak' && 'text-brick')} disabled={!!sibuk || dinonaktif} onClick={() => { setForm(a); setTeks(''); setGalat('') }}>
                      {JUDUL_AKSI[a]}
                    </Button>
                  )}
                  {a === 'teruskan_sppg' && !p.urgensi && <p className="mt-1 text-xs text-muted">Tetapkan tingkat urgensi terlebih dahulu.</p>}
                </div>
              )
            })}
          </div>
        )}

        {bisaCatat && (
          <div className="border-t border-line pt-3">
            <label htmlFor="catatan" className="text-sm font-bold text-ink">{user.peran === 'sppg' ? 'Tanggapan / tindak lanjut SPPG' : 'Catatan tindak lanjut'}</label>
            <textarea id="catatan" rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value.slice(0, 600))} className={cx(kelasInput, 'mt-1.5 border-line py-2 text-[15px]')}
              placeholder={user.peran === 'sppg' ? 'Jelaskan temuan dan perbaikan yang dilakukan' : 'Contoh: sudah dikonfirmasi ke wali kelas'} />
            {user.peran === 'sppg' ? <p className="text-[11.5px] text-muted">Tanggapan tampil ke pelapor di samping laporan asli. Laporan asli tidak berubah.</p> : (
              <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-leaf" checked={untukPelapor} onChange={(e) => setUntukPelapor(e.target.checked)} />Tampilkan ke pelapor{!untukPelapor && <span className="text-xs text-muted">(catatan internal)</span>}</label>
            )}
            <Button className="mt-2 h-11 w-full" variant="outline" disabled={!!sibuk || catatan.trim().length < 10}
              onClick={async () => { if (await jalankan('catatan', () => repo.catatan(user, p.id, catatan, untukPelapor), 'Catatan tersimpan di riwayat')) setCatatan('') }}>
              {sibuk === 'catatan' && <Loader2 size={16} className="animate-spin" />}Simpan catatan
            </Button>
          </div>
        )}

        {!aksi.length && !bisaCatat && !urgensiBisa && <p className="text-sm text-muted">Tidak ada tindakan untuk status ini.</p>}
        {user.peran === 'kesehatan' && <p className="text-[11.5px] text-muted">Data yang dibagikan ke pihak kesehatan dibatasi: tanpa identitas pelapor atau anak. Catatan default bersifat internal.</p>}
      </Card>
      <Toast pesan={toast} onClose={() => setToast('')} />
    </>
  )
}
