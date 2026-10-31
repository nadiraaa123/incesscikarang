import type { DB, Menu, MenuItem, PoinLog, Riwayat } from './types'
import { SEKOLAH_ASLI, WILAYAH } from './sekolah-asli'
import { lastSchoolDay, monthsBack, schoolDaysBefore } from './date'

/**
 * Data contoh untuk demo. Semua laporan warga, penilaian, foto, dan akun di sini adalah CONTOH.
 * Angka statistik nasional (lihat sources.ts) adalah data resmi dengan sumber.
 */

const MENU_ROTASI: { items: MenuItem[]; gizi: Menu['gizi'] }[] = [
  {
    items: [
      { nama: 'Nasi putih', kategori: 'Makanan pokok', porsi: '150 g' },
      { nama: 'Ayam fillet kecap', kategori: 'Lauk pauk', porsi: '50 g' },
      { nama: 'Sayur capcay', kategori: 'Sayur', porsi: '75 g' },
      { nama: 'Jeruk manis', kategori: 'Buah', porsi: '1 buah' },
    ],
    gizi: { energi: 520, protein: 18, lemak: 14, karbo: 78 },
  },
  {
    items: [
      { nama: 'Nasi putih', kategori: 'Makanan pokok', porsi: '150 g' },
      { nama: 'Telur balado', kategori: 'Lauk pauk', porsi: '1 butir' },
      { nama: 'Tumis buncis wortel', kategori: 'Sayur', porsi: '70 g' },
      { nama: 'Pisang', kategori: 'Buah', porsi: '1 buah' },
    ],
    gizi: { energi: 495, protein: 16, lemak: 15, karbo: 74 },
  },
  {
    items: [
      { nama: 'Nasi kuning', kategori: 'Makanan pokok', porsi: '150 g' },
      { nama: 'Ikan tongkol suwir', kategori: 'Lauk pauk', porsi: '50 g' },
      { nama: 'Sayur bening bayam', kategori: 'Sayur', porsi: '80 g' },
      { nama: 'Semangka', kategori: 'Buah', porsi: '1 potong' },
    ],
    gizi: { energi: 510, protein: 19, lemak: 12, karbo: 80 },
  },
  {
    items: [
      { nama: 'Nasi putih', kategori: 'Makanan pokok', porsi: '150 g' },
      { nama: 'Tempe bacem & tahu', kategori: 'Lauk pauk', porsi: '60 g' },
      { nama: 'Sayur sop', kategori: 'Sayur', porsi: '80 g' },
      { nama: 'Susu UHT', kategori: 'Susu', porsi: '125 ml' },
    ],
    gizi: { energi: 530, protein: 17, lemak: 16, karbo: 76 },
  },
]

const proses = (): Menu['proses'] => [
  { langkah: 'Mulai dimasak', waktu: '04.30', sumber: 'SPPG' },
  { langkah: 'Pendinginan & pengemasan', waktu: '07.15', sumber: 'SPPG' },
  { langkah: 'Berangkat dari dapur', waktu: '09.10', sumber: 'SPPG' },
  { langkah: 'Tiba di sekolah', waktu: '09.45', sumber: 'Sekolah' },
  { langkah: 'Diperiksa petugas sekolah', waktu: '09.55', sumber: 'Sekolah' },
  { langkah: 'Dimakan siswa', waktu: '10.30', sumber: 'Sekolah' },
]

const riwayatSekolah = (schoolId: string, dasar: number, keluhanDasar: number): Riwayat[] => {
  const bulan = monthsBack(6)
  const naik = [-0.35, -0.2, -0.25, -0.05, 0.05, 0.12]
  return bulan.map((b, i) => {
    const rata = Math.min(4.9, +(dasar + naik[i]).toFixed(2))
    const total = 90 + i * 12
    const p5 = Math.round(total * (rata - 3) / 2 * 0.75)
    const p4 = Math.round(total * 0.3)
    const p3 = Math.round(total * 0.12)
    const p2 = Math.round(total * 0.05)
    const p1 = Math.max(1, total - p5 - p4 - p3 - p2 > 0 ? Math.round(total * 0.03) : 1)
    return {
      schoolId,
      bulan: b,
      rataBintang: rata,
      keluhan: Math.max(1, keluhanDasar - i),
      sebaran: [p1, p2, p3, p4, Math.max(p5, 10)],
      aspek: {
        rasa: +(rata - 0.1).toFixed(1),
        porsi: +(rata - 0.3).toFixed(1),
        kesegaran: +(rata + 0.05).toFixed(1),
        variasi: +(rata - 0.4).toFixed(1),
      },
    }
  })
}

export function buatSeed(): DB {
  const hariIni = lastSchoolDay()
  const lalu = schoolDaysBefore(hariIni, 7)
  const tanggalMenu = [hariIni, ...lalu]

  const menu: Menu[] = []
  for (const sppgId of ['SPPG-DEMO-01', 'SPPG-DEMO-02']) {
    tanggalMenu.forEach((t, i) => {
      const r = MENU_ROTASI[(i + (sppgId.endsWith('02') ? 1 : 0)) % MENU_ROTASI.length]
      menu.push({ id: `m-${sppgId}-${t}`, sppgId, tanggal: t, items: r.items, gizi: r.gizi, proses: proses() })
    })
  }

  const [k1, k2, k3] = lalu
  const poin: PoinLog[] = []
  const tambahPoin = (p: Omit<PoinLog, 'id'>) => poin.push({ ...p, id: `p-${poin.length + 1}` })
  // riwayat poin akun demo orang tua (contoh)
  const hariOrtu = schoolDaysBefore(hariIni, 9)
  hariOrtu.forEach((t, i) => {
    tambahPoin({ userId: 'u-ortu', kode: 'LAPOR_KONDISI', poin: 10, ref: `l-ortu-${i}`, waktu: `${t} 15.40`, ket: 'Lapor kondisi harian' })
    if (i % 2 === 0) tambahPoin({ userId: 'u-ortu', kode: 'PENILAIAN', poin: 5, ref: `r-ortu-${i}`, waktu: `${t} 15.42`, ket: 'Penilaian menu' })
  })
  tambahPoin({ userId: 'u-ortu', kode: 'TIDAK_BENAR', poin: -20, ref: 'l-ortu-8', waktu: `${hariOrtu[8]} 19.00`, ket: 'Laporan ditandai tidak sesuai oleh petugas' })
  // siswa & petugas
  lalu.slice(0, 4).forEach((t, i) => {
    tambahPoin({ userId: 'u-siswa', kode: 'FOTO_SISWA', poin: 5, waktu: `${t} 10.25`, ket: 'Foto sebelum makan' })
    tambahPoin({ userId: 'u-siswa', kode: 'LAPOR_KONDISI', poin: 10, ref: `l-siswa-${i}`, waktu: `${t} 13.50`, ket: 'Lapor kondisi harian' })
    tambahPoin({ userId: 'u-petugas-sd', kode: 'CATAT_PETUGAS', poin: 10, waktu: `${t} 10.00`, ket: 'Dua foto & cocokkan menu' })
  })

  return {
    versi: 2,
    wilayah: WILAYAH,
    sppg: [
      { id: 'SPPG-DEMO-01', nama: 'SPPG Uji Coba 01', kab: 'Wilayah uji coba', alamat: 'Alamat contoh' },
      { id: 'SPPG-DEMO-02', nama: 'SPPG Uji Coba 02', kab: 'Wilayah uji coba', alamat: 'Alamat contoh' },
    ],
    sekolah: [
      ...SEKOLAH_ASLI,
      { id: 'uji-sd-1', nama: 'SD Uji Coba 1', npsn: 'contoh', jenjang: 'SD', kab: 'Wilayah uji coba', kec: 'Data contoh', wilayahId: 'uji', sppgId: 'SPPG-DEMO-01', siswa: 312, akunTerdaftar: 180, pelaporAktifSeed: 121, tertibCatat: true },
      { id: 'uji-sd-2', nama: 'SD Uji Coba 2', npsn: 'contoh', jenjang: 'SD', kab: 'Wilayah uji coba', kec: 'Data contoh', wilayahId: 'uji', sppgId: 'SPPG-DEMO-01', siswa: 280, akunTerdaftar: 160, pelaporAktifSeed: 118, tertibCatat: true },
      { id: 'uji-smp-1', nama: 'SMP Uji Coba 1', npsn: 'contoh', jenjang: 'SMP', kab: 'Wilayah uji coba', kec: 'Data contoh', wilayahId: 'uji', sppgId: 'SPPG-DEMO-02', siswa: 640, akunTerdaftar: 290, pelaporAktifSeed: 152, tertibCatat: false },
      { id: 'uji-sd-3', nama: 'SD Uji Coba 3', npsn: 'contoh', jenjang: 'SD', kab: 'Wilayah uji coba', kec: 'Data contoh', wilayahId: 'uji', sppgId: 'SPPG-DEMO-01', siswa: 254, akunTerdaftar: 150, pelaporAktifSeed: 64, tertibCatat: false },
    ],
    menu,
    pengguna: [
      { id: 'u-ortu', username: 'demo-ortu-sd', pin: '123456', nama: 'Raka (orang tua)', peran: 'ortu', schoolId: 'uji-sd-1', kelas: '4A', anak: 'Dinda', demo: true },
      { id: 'u-siswa', username: 'demo-siswa-smp', pin: '123456', nama: 'Dimas', peran: 'siswa', schoolId: 'uji-smp-1', kelas: '8B', waOrtu: '0812xxxx', demo: true },
      { id: 'u-guru', username: 'demo-guru', pin: '123456', nama: 'Bu Ratna', peran: 'guru', schoolId: 'uji-sd-1', demo: true },
      { id: 'u-petugas-sd', username: 'PTG-SD-01', pin: '123456', nama: 'Pak Anton', peran: 'petugas', schoolId: 'uji-sd-1', demo: true },
      { id: 'u-petugas-smp', username: 'PTG-SMP-01', pin: '123456', nama: 'Bu Sari', peran: 'petugas', schoolId: 'uji-smp-1', demo: true },
      { id: 'u-sppg', username: 'SPPG-DEMO-01', pin: '123456', nama: 'Ibu Dewi (ahli gizi)', peran: 'sppg', sppgId: 'SPPG-DEMO-01', demo: true },
    ],
    undangan: [
      { kode: 'KLS-UJISD1-4A', schoolId: 'uji-sd-1', kelas: '4A', tipe: 'kelas' },
      { kode: 'KLS-UJISMP1-8B', schoolId: 'uji-smp-1', kelas: '8B', tipe: 'kelas' },
      { kode: 'STF-UJISD1', schoolId: 'uji-sd-1', tipe: 'staf' },
    ],
    laporan: [
      { id: 'l-x1', userId: 'warga-1', schoolId: 'uji-sd-1', kelas: '4A', tanggal: hariIni, waktu: '13.20', kondisi: 'aman', gejala: [], demo: true },
      { id: 'l-x2', userId: 'warga-2', schoolId: 'uji-sd-1', kelas: '5B', tanggal: hariIni, waktu: '13.45', kondisi: 'keluhan', gejala: ['Sakit perut'], jumlah: 1, catatan: 'Anak mengeluh perut kembung setelah makan siang.', demo: true },
      { id: 'l-x3', userId: 'warga-3', schoolId: 'uji-sd-1', kelas: '4A', tanggal: hariIni, waktu: '14.05', kondisi: 'keluhan', gejala: ['Mual atau muntah'], jumlah: 1, demo: true },
      { id: 'l-x4', userId: 'warga-4', schoolId: 'uji-smp-1', kelas: '8B', tanggal: k1, waktu: '13.10', kondisi: 'keluhan', gejala: ['Pusing'], jumlah: 1, catatan: 'Lauk terasa asam.', demo: true },
      { id: 'l-ortu-0', userId: 'u-ortu', schoolId: 'uji-sd-1', kelas: '4A', tanggal: k1, waktu: '15.40', kondisi: 'aman', gejala: [], demo: true },
      { id: 'l-ortu-1', userId: 'u-ortu', schoolId: 'uji-sd-1', kelas: '4A', tanggal: k2, waktu: '15.35', kondisi: 'aman', gejala: [], demo: true },
      { id: 'l-ortu-2', userId: 'u-ortu', schoolId: 'uji-sd-1', kelas: '4A', tanggal: k3, waktu: '15.50', kondisi: 'keluhan', gejala: ['Sakit perut'], jumlah: 1, demo: true },
    ],
    penilaian: [
      { id: 'r-x1', userId: 'warga-5', schoolId: 'uji-sd-1', tanggal: k1, bintang: 2, aspek: { rasa: 3, porsi: 2, kesegaran: 3, variasi: 2 }, catatan: 'Buah jeruk diganti biskuit kemasan, porsi nasi terlihat kurang.', demo: true },
      { id: 'r-x2', userId: 'warga-6', schoolId: 'uji-sd-1', tanggal: k2, bintang: 4, aspek: { rasa: 4, porsi: 4, kesegaran: 4, variasi: 3 }, catatan: 'Sayur masih hangat, anak suka. Mohon variasi lauk ditambah.', demo: true },
      { id: 'r-x3', userId: 'warga-7', schoolId: 'uji-smp-1', tanggal: k1, bintang: 2, aspek: { rasa: 2, porsi: 3, kesegaran: 2, variasi: 3 }, catatan: 'Lauk ikan sudah agak bau saat dibuka jam 12.', demo: true },
      { id: 'r-x4', userId: 'warga-8', schoolId: 'uji-sd-2', tanggal: k2, bintang: 5, aspek: { rasa: 5, porsi: 4, kesegaran: 5, variasi: 4 }, catatan: 'Menu lengkap dan tepat waktu.', demo: true },
    ],
    tanggapan: [
      { id: 't-1', targetId: 'r-x1', sppgId: 'SPPG-DEMO-01', jenis: 'perbaiki', isi: 'Stok jeruk dari pemasok terlambat. Mulai besok buah diganti pisang lokal, porsi nasi ditimbang ulang per baki.', waktu: `${k1} 18.20` },
    ],
    foto: [],
    poin,
    riwayat: [
      ...riwayatSekolah('uji-sd-1', 4.2, 6),
      ...riwayatSekolah('uji-sd-2', 4.5, 4),
      ...riwayatSekolah('uji-smp-1', 3.8, 9),
      ...riwayatSekolah('uji-sd-3', 4.0, 5),
    ],
    peringatan: [],
    rujukan: [],
  }
}
