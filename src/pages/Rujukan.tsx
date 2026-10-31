import { useParams } from 'react-router-dom'
import { FileHeart, ShieldOff, Clock } from 'lucide-react'
import { Button, Card, Chip, Kosong, Page, TopBar } from '../components/ui'
import { cabutRujukan, menuHariIni, sekolahById, sppgById, useDB } from '../lib/db'
import { useSesi } from '../lib/auth'

export default function Rujukan() {
  const { token } = useParams()
  const d = useDB()
  const user = useSesi()
  const r = d.rujukan.find((x) => x.token === token)
  if (!r) return (<><TopBar title="Kartu rujukan" back="/" /><Page nav={false}><Kosong judul="Kartu tidak ditemukan" /></Page></>)
  const kedaluwarsa = new Date(r.berlakuHingga).getTime() < Date.now()
  const s = sekolahById(d, r.schoolId)!
  const tanggal = r.dibuat.slice(0, 10)
  const menu = menuHariIni(d, s.sppgId, d.menu.some((m) => m.tanggal === tanggal) ? tanggal : undefined)
  const pemilik = user?.id === r.userId

  if (r.dicabut || kedaluwarsa) {
    return (<><TopBar title="Kartu rujukan" back="/" /><Page nav={false}><Kosong ikon={<ShieldOff />} judul={r.dicabut ? 'Akses kartu telah dicabut' : 'Kartu sudah kedaluwarsa'} teks="Ringkasan ini tidak lagi dapat dilihat." /></Page></>)
  }
  return (
    <>
      <TopBar title="Kartu rujukan" back="/app" />
      <Page nav={false}>
        <Card className="border-brick/30">
          <div className="flex items-center gap-2"><FileHeart className="text-brick" /><h1 className="text-lg font-extrabold text-ink">Ringkasan riwayat makan</h1></div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Clock size={12} /> Berlaku sampai {new Date(r.berlakuHingga).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-muted">Sekolah</dt><dd className="font-semibold text-ink">{s.nama}, {s.kab}</dd></div>
            <div><dt className="text-muted">Dapur penyedia</dt><dd className="font-semibold text-ink">{sppgById(d, s.sppgId)?.nama}</dd></div>
            <div><dt className="text-muted">Jam makan</dt><dd className="font-semibold text-ink">{menu?.proses.find((p) => p.langkah.startsWith('Dimakan'))?.waktu ?? '—'} WIB</dd></div>
            <div><dt className="text-muted">Menu yang dikonsumsi</dt><dd className="font-semibold text-ink">{menu?.items.map((i) => i.nama).join(', ')}</dd></div>
            <div><dt className="text-muted">Gejala dilaporkan</dt><dd className="mt-1 flex flex-wrap gap-1">{r.gejala.map((g) => <Chip key={g} jenis="perhatian">{g}</Chip>)}</dd></div>
          </dl>
          <p className="mt-4 rounded-lg bg-cream p-3 text-xs leading-relaxed text-muted">Kartu ini bukan diagnosis. Dibuat atas persetujuan orang tua dan tidak memuat nama anak. Penerimaan oleh puskesmas disimulasikan pada versi demo.</p>
        </Card>
        {pemilik && <Button variant="danger" className="mt-4 w-full" onClick={() => cabutRujukan(r.token)}>Cabut akses kartu</Button>}
      </Page>
    </>
  )
}
