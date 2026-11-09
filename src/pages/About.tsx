import { ExternalLink } from 'lucide-react'
import { Card, Footer, H2, Page, TopBar, Button } from '../components/ui'
import { DAFTAR_SUMBER } from '../lib/sources'
import { resetDemo } from '../lib/db'

export default function About() {
  return (
    <>
      <TopBar title="Tentang & Data" back />
      <Page>
        <Card>
          <h1 className="text-xl font-extrabold text-ink">Tentang Rantang Terang</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">
            Rantang adalah wadah makanan yang diantar dari dapur dengan rasa percaya. Rantang Terang ingin makanan Makan Bergizi Gratis (MBG) sampai ke anak dengan kepercayaan yang sama: menunya jelas, perjalanannya tercatat, dan suara orang tua serta siswa didengar secara terbuka.
          </p>
          <p className="mt-2 text-sm text-muted">Tema: Designing Digital Futures – Powering Public Transparency. Subtema: Civic Reporting & Accountability, didukung Public Service Tracking.</p>
        </Card>

        <H2>Siapa melakukan apa</H2>
        <Card className="p-0">
          <ul className="divide-y divide-line text-sm">
            {[
              ['Publik', 'Melihat dasbor tiap sekolah tanpa akun.'],
              ['Orang tua / wali (PAUD, SD, SLB)', 'Melapor kondisi anak sore hari dan menilai menu.'],
              ['Siswa / santri (SMP, SMA, pesantren)', 'Foto sebelum makan, lapor kondisi sebelum pulang.'],
              ['Guru & tenaga kependidikan', 'Ikut melapor dan menilai, dihitung tanpa nama.'],
              ['Petugas sekolah', 'Memotret makanan tiba & saat makan, mencocokkan menu, memeriksa peringatan.'],
              ['SPPG (dapur)', 'Menginput menu & gizi, menanggapi masukan. Tidak bisa menghapus laporan.'],
            ].map(([a, b]) => (
              <li key={a} className="px-4 py-3"><p className="font-semibold text-ink">{a}</p><p className="text-muted">{b}</p></li>
            ))}
          </ul>
        </Card>

        <H2>Aturan pelaporan</H2>
        <Card className="p-0">
          <ul className="divide-y divide-line text-sm">
            {[
              ['Lapor kondisi', '1 kali per hari sekolah untuk setiap akun.'],
              ['Penilaian menu', '1 kali per hari. Masukan tertulis tampil di dasbor publik tanpa nama.'],
              ['Peringatan', 'Muncul bila keluhan ≥3 laporan, ≥2% siswa, dari ≥2 kelas, lalu diperiksa petugas sekolah sebelum diteruskan.'],
              ['Tanggapan SPPG', 'SPPG dapat menanggapi, tetapi tidak dapat mengubah atau menghapus laporan asli.'],
              ['Laporan tidak sesuai', 'Petugas dapat menandai laporan yang tidak sesuai. Laporan tetap tersimpan sebagai jejak.'],
            ].map(([a, b]) => (
              <li key={a} className="px-4 py-3"><p className="font-semibold text-ink">{a}</p><p className="text-muted">{b}</p></li>
            ))}
          </ul>
        </Card>

        <H2><span id="etika">Etika data</span></H2>
        <Card>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink">
            <li>Publik hanya melihat data agregat. Nama pelapor dan nama anak tidak pernah ditampilkan.</li>
            <li>Pendaftaran memakai kode undangan dari wali kelas atau kepala sekolah, sehingga hanya warga sekolah yang dapat melapor.</li>
            <li>Peringatan baru muncul bila keluhan ≥3 laporan, ≥2% siswa, dari ≥2 kelas, dan diperiksa petugas sekolah lebih dulu.</li>
            <li>Foto diperkecil dan digambar ulang di perangkat sebelum disimpan, sehingga data lokasi (EXIF) terbuang. Foto wajah siswa tidak diperbolehkan.</li>
            <li>Kartu rujukan hanya dibuat atas persetujuan pengguna, berlaku 24 jam, dan dapat dicabut.</li>
            <li>Rantang Terang bukan alat diagnosis dan tidak menggantikan penanganan medis.</li>
          </ul>
        </Card>

        <H2>Sumber data</H2>
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {DAFTAR_SUMBER.map((s) => (
              <li key={s.nama}>
                <a href={s.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 px-4 py-3 text-sm hover:bg-cream">
                  <div className="flex-1"><p className="font-semibold text-ink">{s.nama}</p><p className="text-xs text-muted">{s.penerbit}</p></div>
                  <ExternalLink size={14} className="mt-1 text-muted" />
                </a>
              </li>
            ))}
          </ul>
        </Card>
        <p className="mt-2 text-sm text-muted">Data sekolah, akun, laporan, penilaian, dan foto pada versi ini adalah contoh untuk demo. Menu dan gizi dicontohkan sebagai input SPPG; integrasi dengan sistem resmi belum tersedia.</p>

        <H2>Untuk juri & penguji</H2>
        <Card>
          <p className="text-sm text-ink">Data tersimpan di browser ini. Tombol berikut mengembalikan semua data contoh ke kondisi awal.</p>
          <Button variant="outline" className="mt-3 w-full" onClick={() => { if (confirm('Kembalikan data contoh ke kondisi awal?')) resetDemo() }}>Reset data demo</Button>
        </Card>
        <Footer />
      </Page>
    </>
  )
}
