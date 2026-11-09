import { useState } from 'react'
import { AlertTriangle, CheckCircle2, HeartPulse, Smile, Frown } from 'lucide-react'
import { Button, Card, PilihBintang, cx } from './ui'
import { kirimLaporan, kirimPenilaian, sudahLaporHariIni, sudahNilaiHariIni, useDB } from '../lib/db'
import type { Pengguna } from '../lib/types'

export const GEJALA = ['Mual atau muntah', 'Sakit perut', 'Diare', 'Pusing', 'Lainnya']

export function FormKondisi({ user, judul, onDone, disabled }: { user: Pengguna; judul: string; onDone: (msg: string) => void; disabled?: boolean }) {
  const d = useDB()
  const [kondisi, setKondisi] = useState<'aman' | 'keluhan' | null>(null)
  const [gejala, setGejala] = useState<string[]>([])
  const [jumlah, setJumlah] = useState(1)
  const [catatan, setCatatan] = useState('')
  const sudah = sudahLaporHariIni(d, user.id)
  const lap = d.laporan.find((l) => l.userId === user.id && l.tanggal === d.laporan.find((x) => x.userId === user.id)?.tanggal)

  if (sudah) {
    const l = d.laporan.filter((x) => x.userId === user.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0] ?? lap
    return (
      <Card className="flex items-start gap-3 border-leaf/40 bg-leaf-soft/50">
        <CheckCircle2 className="mt-0.5 shrink-0 text-leaf" />
        <div>
          <p className="font-bold text-ink">Laporan kondisi hari ini sudah terkirim</p>
          <p className="text-sm text-muted">{l?.kondisi === 'aman' ? 'Kondisi: aman' : `Keluhan: ${l?.gejala.join(', ')}`} · pukul {l?.waktu}. Laporan berikutnya bisa dikirim besok.</p>
        </div>
      </Card>
    )
  }

  const kirim = () => {
    const r = kirimLaporan(user, { kondisi: kondisi!, gejala: kondisi === 'keluhan' ? gejala : [], jumlah: kondisi === 'keluhan' && user.peran === 'guru' ? jumlah : kondisi === 'keluhan' ? 1 : undefined, catatan: catatan.trim() || undefined })
    onDone(r.ok ? 'Laporan terkirim. Terima kasih sudah melapor.' : r.pesan)
  }

  return (
    <Card className={cx(disabled && 'pointer-events-none opacity-50')}>
      <div className="flex items-center gap-2"><HeartPulse size={18} className="text-leaf" /><h3 className="font-bold text-ink">{judul}</h3></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setKondisi('aman')} className={cx('flex h-16 flex-col items-center justify-center rounded-xl border text-sm font-bold', kondisi === 'aman' ? 'border-leaf bg-leaf-soft text-leaf' : 'border-line bg-white text-ink')}>
          <Smile size={22} />Aman
        </button>
        <button type="button" onClick={() => setKondisi('keluhan')} className={cx('flex h-16 flex-col items-center justify-center rounded-xl border text-sm font-bold', kondisi === 'keluhan' ? 'border-brick bg-brick-soft text-brick' : 'border-line bg-white text-ink')}>
          <Frown size={22} />Ada keluhan
        </button>
      </div>
      {kondisi === 'keluhan' && (
        <>
          <div className="mt-3 flex gap-2 rounded-lg border border-brick/30 bg-brick-soft p-3 text-[13px] leading-relaxed text-ink">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-brick" />
            <p>Bila anak sakit, segera hubungi puskesmas atau fasilitas kesehatan terdekat. Aplikasi ini tidak menggantikan penanganan medis.</p>
          </div>
          <p className="mt-3 text-sm font-semibold text-ink">Gejala yang muncul</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {GEJALA.map((g) => {
              const on = gejala.includes(g)
              return (
                <button key={g} type="button" onClick={() => setGejala(on ? gejala.filter((x) => x !== g) : [...gejala, g])} className={cx('h-9 rounded-full border px-3 text-sm font-semibold', on ? 'border-brick bg-brick-soft text-brick' : 'border-line bg-white text-ink')}>
                  {g}
                </button>
              )
            })}
          </div>
          {user.peran === 'guru' && (
            <label className="mt-3 flex items-center justify-between text-sm font-semibold">Jumlah siswa terdampak
              <input type="number" min={1} max={999} value={jumlah} onChange={(e) => setJumlah(Math.max(1, +e.target.value))} className="h-10 w-20 rounded-lg border border-line px-2 text-right" />
            </label>
          )}
        </>
      )}
      {kondisi && (
        <label className="mt-3 block">
          <span className="text-sm font-semibold text-ink">Catatan (opsional)</span>
          <textarea value={catatan} onChange={(e) => setCatatan(e.target.value.slice(0, 280))} rows={2} placeholder="Contoh: mengeluh perut kembung setelah makan" className="mt-1 w-full rounded-xl border border-line p-3 text-[15px] outline-none focus:border-leaf" />
          <span className="block text-right text-[11px] text-muted">{catatan.length}/280 · tanpa nama anak</span>
        </label>
      )}
      <Button className="mt-3 w-full" disabled={!kondisi || (kondisi === 'keluhan' && gejala.length === 0)} onClick={kirim}>Kirim laporan kondisi</Button>
      <p className="mt-2 text-center text-[11.5px] text-muted">1 kali per hari sekolah. Keluhan dihitung tanpa nama dan diperiksa petugas sekolah sebelum diteruskan.</p>
    </Card>
  )
}

export function FormPenilaian({ user, onDone, disabled }: { user: Pengguna; onDone: (msg: string) => void; disabled?: boolean }) {
  const d = useDB()
  const [bintang, setBintang] = useState(0)
  const [aspek, setAspek] = useState({ rasa: 0, porsi: 0, kesegaran: 0, variasi: 0 })
  const [catatan, setCatatan] = useState('')
  if (sudahNilaiHariIni(d, user.id)) {
    return (
      <Card className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 shrink-0 text-leaf" />
        <div><p className="font-bold text-ink">Penilaian menu hari ini sudah terkirim</p><p className="text-sm text-muted">Terima kasih. Penilaianmu masuk ke dasbor sekolah tanpa nama.</p></div>
      </Card>
    )
  }
  const lengkap = bintang > 0 && Object.values(aspek).every((v) => v > 0)
  return (
    <Card className={cx(disabled && 'pointer-events-none opacity-50')}>
      <h3 className="font-bold text-ink">Nilai menu hari ini</h3>
      <p className="text-xs text-muted">Terpisah dari laporan kesehatan, supaya tidak memicu peringatan palsu.</p>
      <div className="mt-3"><PilihBintang nilai={bintang} onChange={setBintang} label="Penilaian keseluruhan" /></div>
      <div className="mt-3 space-y-2">
        {(Object.keys(aspek) as (keyof typeof aspek)[]).map((k) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm font-semibold capitalize text-ink">{k}</span>
            <div className="flex gap-1" role="radiogroup" aria-label={`Nilai ${k}`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={aspek[k] === n} onClick={() => setAspek({ ...aspek, [k]: n })} className={cx('h-8 w-8 rounded-lg border text-sm font-bold', aspek[k] >= n ? 'border-sun bg-sun-soft text-[#8A5D06]' : 'border-line bg-white text-muted')}>{n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <textarea value={catatan} onChange={(e) => setCatatan(e.target.value.slice(0, 280))} rows={2} placeholder="Masukan untuk SPPG (opsional), misalnya: buah diganti biskuit" className="mt-3 w-full rounded-xl border border-line p-3 text-[15px] outline-none focus:border-leaf" />
      <Button className="mt-2 w-full" variant={lengkap ? 'primary' : 'primary'} disabled={!lengkap} onClick={() => { const r = kirimPenilaian(user, { bintang, aspek, catatan: catatan.trim() || undefined }); onDone(r.ok ? 'Penilaian terkirim. Terima kasih atas masukanmu.' : r.pesan) }}>Kirim penilaian</Button>
      <p className="mt-2 text-center text-[11.5px] text-muted">1 kali per hari · masukan tertulis tampil di dasbor publik tanpa nama dan dapat ditanggapi SPPG.</p>
    </Card>
  )
}
