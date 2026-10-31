import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LogOut, MessageSquareReply, Award } from 'lucide-react'
import { Button, Card, Chip, H2, Page, Toast, TopBar, cx } from '../components/ui'
import { ItemMasukan } from '../components/mbg'
import { useSesi, keluar } from '../lib/auth'
import { beriTanggapan, daftarMasukan, hariOperasional, menuHariIni, simpanMenu, sppgById, tanggapanUntuk, useDB } from '../lib/db'
import { fmtTanggal } from '../lib/date'

const KAT = ['Makanan pokok', 'Lauk pauk', 'Sayur', 'Buah', 'Susu']

export default function Sppg() {
  const user = useSesi()
  const d = useDB()
  const [toast, setToast] = useState('')
  const [aktif, setAktif] = useState<string | null>(null)
  const [jenis, setJenis] = useState<'perbaiki' | 'tidak_sesuai'>('perbaiki')
  const [isi, setIsi] = useState('')
  const menu = user?.sppgId ? menuHariIni(d, user.sppgId) : undefined
  const [items, setItems] = useState(menu?.items ?? [])
  const [gizi, setGizi] = useState(menu?.gizi ?? { energi: 0, protein: 0, lemak: 0, karbo: 0 })
  if (!user) return <Navigate to="/masuk" replace />
  if (user.peran !== 'sppg') return <Navigate to="/app" replace />
  const sppg = sppgById(d, user.sppgId)!
  const masukan = daftarMasukan(d, { sppgId: sppg.id })
  const belum = masukan.filter((m) => !tanggapanUntuk(d, m.id))
  const sekolah = d.sekolah.filter((s) => s.sppgId === sppg.id)

  return (
    <>
      <TopBar />
      <Page>
        <p className="text-xs text-muted">{fmtTanggal(hariOperasional())}</p>
        <h1 className="text-xl font-extrabold text-ink">{sppg.nama}</h1>
        <p className="text-sm text-muted">Mitra SPPG · melayani {sekolah.length} sekolah contoh</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Card className="p-3"><p className="text-2xl font-extrabold tabular-nums text-ink">{belum.length}</p><p className="text-xs text-muted">Masukan menunggu tanggapan</p></Card>
          <Card className="p-3"><p className="text-2xl font-extrabold tabular-nums text-ink">{masukan.length - belum.length}</p><p className="text-xs text-muted">Sudah ditanggapi</p></Card>
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted"><Award size={13} className="text-sun" /> Tanggapi semua masukan dalam 24 jam selama sebulan untuk badge publik “Dapur Responsif”.</p>

        <H2>Kotak masukan</H2>
        <div className="space-y-3">
          {masukan.map((m) => (
            <div key={m.id}>
              <ItemMasukan d={d} m={m} tampilSekolah />
              {aktif === m.id ? (
                <Card className="mt-2 border-leaf/50">
                  <p className="text-sm font-bold text-ink">Beri tanggapan</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {([['perbaiki', 'Benar, kami perbaiki'], ['tidak_sesuai', 'Info tidak sesuai']] as const).map(([k, l]) => (
                      <button key={k} onClick={() => setJenis(k)} className={cx('h-11 rounded-xl border text-sm font-bold', jenis === k ? 'border-leaf bg-leaf-soft text-leaf' : 'border-line bg-white')}>{l}</button>
                    ))}
                  </div>
                  <textarea value={isi} onChange={(e) => setIsi(e.target.value.slice(0, 400))} rows={3} placeholder={jenis === 'perbaiki' ? 'Jelaskan perbaikan yang dilakukan' : 'Jelaskan bukti/penjelasan, misalnya log suhu atau foto pengemasan'} className="mt-2 w-full rounded-xl border border-line p-3 text-[15px] outline-none focus:border-leaf" />
                  <p className="text-[11.5px] text-muted">Tanggapan tampil di samping laporan asli. Laporan warga tidak dapat diubah atau dihapus.</p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" className="w-24" onClick={() => setAktif(null)}>Batal</Button>
                    <Button className="flex-1" disabled={isi.trim().length < 10} onClick={() => { beriTanggapan(sppg.id, m.id, jenis, isi.trim()); setAktif(null); setIsi(''); setToast('Tanggapan dipublikasikan di dasbor sekolah.') }}>Kirim tanggapan</Button>
                  </div>
                </Card>
              ) : (
                <button onClick={() => { setAktif(m.id); setIsi(tanggapanUntuk(d, m.id)?.isi ?? '') }} className="mt-2 flex items-center gap-1.5 text-sm font-bold text-leaf"><MessageSquareReply size={15} />{tanggapanUntuk(d, m.id) ? 'Perbarui tanggapan' : 'Beri tanggapan'}</button>
              )}
            </div>
          ))}
        </div>

        <H2>Menu & gizi hari ini</H2>
        <Card>
          <p className="text-xs text-muted">Menu ini tampil ke orang tua, siswa, sekolah, dan publik.</p>
          <div className="mt-3 space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_88px] gap-2">
                <input value={it.nama} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, nama: e.target.value } : x)))} className="h-11 rounded-lg border border-line px-3 text-sm" aria-label={`Nama menu ${i + 1}`} />
                <input value={it.porsi} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, porsi: e.target.value } : x)))} className="h-11 rounded-lg border border-line px-2 text-sm" aria-label={`Porsi menu ${i + 1}`} />
                <select value={it.kategori} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, kategori: e.target.value as never } : x)))} className="col-span-2 -mt-1 h-9 rounded-lg border border-line bg-cream px-2 text-xs" aria-label={`Kategori menu ${i + 1}`}>
                  {KAT.map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {(Object.keys(gizi) as (keyof typeof gizi)[]).map((k) => (
              <label key={k} className="text-[11px] capitalize text-muted">{k}
                <input type="number" value={gizi[k]} onChange={(e) => setGizi({ ...gizi, [k]: +e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-line px-2 text-sm text-ink" />
              </label>
            ))}
          </div>
          <Button className="mt-3 w-full" onClick={() => { simpanMenu(sppg.id, items, gizi); setToast('Menu hari ini disimpan.') }}>Simpan menu</Button>
          <div className="mt-4 rounded-lg bg-cream p-3">
            <p className="text-sm font-bold text-ink">Catatan proses hari ini</p>
            <ul className="mt-1 space-y-1 text-sm">
              {menu?.proses.filter((p) => p.sumber === 'SPPG').map((p) => (
                <li key={p.langkah} className="flex justify-between"><span>{p.langkah}</span><span className="tabular-nums text-muted">{p.waktu}</span></li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] text-muted">Membantu penelusuran bila ada keluhan, sejalan dengan temuan Ombudsman RI soal pencatatan log suhu dan sampel.</p>
          </div>
        </Card>
        <div className="mt-3"><Chip jenis="info">Integrasi data resmi BGN belum tersedia pada versi ini</Chip></div>
        <button onClick={() => keluar()} className="mt-8 flex w-full items-center justify-center gap-2 text-sm font-semibold text-muted"><LogOut size={15} /> Keluar</button>
        <Toast pesan={toast} onClose={() => setToast('')} />
      </Page>
    </>
  )
}
