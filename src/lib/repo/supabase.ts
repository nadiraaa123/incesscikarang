import type { JejakPengaduan, Pengaduan, Pengguna, Urgensi } from '../types'
import { klien, pesanGalat } from '../supabase'
import { cariKemiripan, cekAksi, validasiLaporan, type StatistikPublik } from '../pengaduan'
import type { DetailPengaduan, Repo } from './types'

/**
 * Mode online. Pembatasan akses ditegakkan di database (RLS + fungsi SECURITY DEFINER),
 * bukan di kode ini. Fungsi di sini hanya memetakan kolom dan menampilkan pesan.
 * Catatan: adaptor ini sudah lolos type-check tetapi BELUM diuji terhadap project Supabase sungguhan.
 */

type Baris = Record<string, unknown>
const KOLOM_JEJAK = 'id, laporan_id, waktu, aktor_peran, aktor_label, jenis, dari, ke, urgensi, catatan, untuk_pelapor'
const BUCKET = 'bukti-laporan'

const keLaporan = (r: Baris): Pengaduan => ({
  id: r.id as string,
  nomor: r.nomor as string,
  pelaporId: (r.pelapor_id as string) ?? '',
  schoolId: r.sekolah_id as string,
  kategori: r.kategori as Pengaduan['kategori'],
  deskripsi: r.deskripsi as string,
  tanggalKejadian: r.tanggal_kejadian as string,
  fotoUrl: (r.foto_path as string) ?? undefined,
  dibuat: r.dibuat as string,
  diperbarui: r.diperbarui as string,
  status: r.status as Pengaduan['status'],
  urgensi: (r.urgensi as Urgensi) ?? undefined,
  alasanTolak: (r.alasan_tolak as string) ?? undefined,
  hasil: (r.hasil as string) ?? undefined,
  petugasId: (r.petugas_id as string) ?? undefined,
  sppgId: (r.sppg_id as string) ?? undefined,
  faskesId: (r.faskes_id as string) ?? undefined,
  keKesehatan: !!r.ke_kesehatan,
  kemungkinanDuplikat: (r.kemungkinan_duplikat as string[]) ?? [],
})

const keJejak = (r: Baris): JejakPengaduan => ({
  id: r.id as string,
  pengaduanId: r.laporan_id as string,
  waktu: r.waktu as string,
  aktorPeran: r.aktor_peran as JejakPengaduan['aktorPeran'],
  aktorLabel: r.aktor_label as string,
  jenis: r.jenis as JejakPengaduan['jenis'],
  dari: (r.dari as JejakPengaduan['dari']) ?? undefined,
  ke: (r.ke as JejakPengaduan['ke']) ?? undefined,
  urgensi: (r.urgensi as Urgensi) ?? undefined,
  catatan: (r.catatan as string) ?? undefined,
  untukPelapor: !!r.untuk_pelapor,
})

const mitra = (u: Pengguna) => u.peran === 'sppg' || u.peran === 'kesehatan'
const tabel = (u: Pengguna) => (mitra(u) ? 'v_laporan_mitra' : 'laporan')

async function namaMaster(t: 'sekolah' | 'sppg' | 'faskes', id?: string) {
  if (!id) return undefined
  const sb = await klien()
  const { data } = await sb.from(t).select('nama').eq('id', id).maybeSingle()
  return (data?.nama as string) ?? undefined
}

export const repoSupabase: Repo = {
  mode: 'supabase',

  async daftar(user, cakupan) {
    const sb = await klien()
    let q = sb.from(tabel(user)).select('*').order('dibuat', { ascending: false })
    if (cakupan === 'saya') q = q.eq('pelapor_id', user.id)
    if (cakupan === 'verifikasi') q = q.eq('status', 'menunggu_verifikasi')
    const { data, error } = await q
    if (error) throw new Error(pesanGalat(error))
    return (data ?? []).map(keLaporan)
  },

  async detail(user, id) {
    const sb = await klien()
    const { data, error } = await sb.from(tabel(user)).select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(pesanGalat(error))
    if (!data) return null
    const p = keLaporan(data)
    const [{ data: jejak }, sekolah, sppg, faskes] = await Promise.all([
      sb.from('laporan_jejak').select(KOLOM_JEJAK).eq('laporan_id', id).order('waktu'),
      namaMaster('sekolah', p.schoolId), namaMaster('sppg', p.sppgId), namaMaster('faskes', p.faskesId),
    ])
    const hasil: DetailPengaduan = { p, jejak: (jejak ?? []).map(keJejak), sekolah, sppg, faskes, mirip: [] }
    if (user.peran === 'petugas') {
      const [{ data: nmPetugas }, { data: nmPelapor }, { data: mirip }] = await Promise.all([
        p.petugasId ? sb.rpc('nama_profil_sekolah', { p_user: p.petugasId }) : Promise.resolve({ data: null }),
        sb.rpc('nama_profil_sekolah', { p_user: p.pelaporId }),
        p.kemungkinanDuplikat.length ? sb.from('laporan').select('id, nomor, status, pelapor_id, deskripsi').in('id', p.kemungkinanDuplikat) : Promise.resolve({ data: [] }),
      ])
      hasil.petugas = (nmPetugas as string) ?? undefined
      hasil.pelapor = (nmPelapor as string) ?? 'Pelapor'
      hasil.mirip = ((mirip ?? []) as Baris[]).map((m) => ({ id: m.id as string, nomor: m.nomor as string, status: m.status as Pengaduan['status'], pelaporSama: m.pelapor_id === p.pelaporId, deskripsi: m.deskripsi as string }))
    } else if (p.petugasId) hasil.petugas = 'Petugas sekolah'
    if (p.fotoUrl) {
      const { data: url } = await sb.storage.from(BUCKET).createSignedUrl(p.fotoUrl, 600)
      hasil.fotoTampil = url?.signedUrl
    }
    return hasil
  },

  async cekMiripSaya(user, isian) {
    const milik = (await this.daftar(user, 'saya')).filter((p) => p.status !== 'ditolak')
    const ids = cariKemiripan(milik, { ...isian, schoolId: user.schoolId!, pelaporId: user.id })
    return milik.filter((p) => ids.includes(p.id))
  },

  async buat(user, isian, foto) {
    const galat = validasiLaporan(isian)
    if (Object.keys(galat).length) return { ok: false, pesan: 'Periksa kembali isian yang ditandai.', galat }
    try {
      const sb = await klien()
      let foto_path: string | null = null
      if (foto) {
        foto_path = `${user.id}/${crypto.randomUUID()}.jpg`
        const { error } = await sb.storage.from(BUCKET).upload(foto_path, foto, { contentType: 'image/jpeg', upsert: false })
        if (error) return { ok: false, pesan: `Foto gagal diunggah: ${pesanGalat(error)}. Coba lagi atau kirim tanpa foto.`, galat: { foto: 'Foto gagal diunggah.' } }
      }
      const { data, error } = await sb.from('laporan').insert({
        nomor: 'otomatis', pelapor_id: user.id, sekolah_id: user.schoolId, kategori: isian.kategori,
        deskripsi: isian.deskripsi.trim(), tanggal_kejadian: isian.tanggalKejadian, foto_path,
      }).select('*').single()
      if (error) {
        if (foto_path) await sb.storage.from(BUCKET).remove([foto_path])
        return { ok: false, pesan: pesanGalat(error, 'Laporan gagal dikirim.') }
      }
      return { ok: true, data: keLaporan(data) }
    } catch (e) {
      return { ok: false, pesan: pesanGalat(e, 'Laporan gagal dikirim.') }
    }
  },

  async aksi(user, id, aksi, isian = {}) {
    try {
      const sb = await klien()
      // cek awal di klien hanya untuk pesan yang cepat; keputusan akhir tetap di server
      const { data } = await sb.from(tabel(user)).select('*').eq('id', id).maybeSingle()
      if (data) { const salah = cekAksi(keLaporan(data), aksi, user.peran, isian); if (salah) return { ok: false, pesan: salah } }
      const catatan = aksi === 'tolak' ? isian.alasan : aksi === 'selesaikan' ? isian.hasil : isian.catatan
      const { error } = await sb.rpc('ubah_status_laporan', { p_id: id, p_aksi: aksi, p_catatan: catatan ?? null })
      if (error) return { ok: false, pesan: pesanGalat(error) }
      return { ok: true, data: undefined }
    } catch (e) { return { ok: false, pesan: pesanGalat(e) } }
  },

  async setUrgensi(_user, id, urgensi) {
    try {
      const sb = await klien()
      const { error } = await sb.rpc('tetapkan_urgensi', { p_id: id, p_urgensi: urgensi })
      return error ? { ok: false, pesan: pesanGalat(error) } : { ok: true, data: undefined }
    } catch (e) { return { ok: false, pesan: pesanGalat(e) } }
  },

  async catatan(_user, id, teks, untukPelapor) {
    try {
      const sb = await klien()
      const { error } = await sb.rpc('tambah_catatan_laporan', { p_id: id, p_teks: teks, p_untuk_pelapor: untukPelapor })
      return error ? { ok: false, pesan: pesanGalat(error) } : { ok: true, data: undefined }
    } catch (e) { return { ok: false, pesan: pesanGalat(e) } }
  },

  async statistik(periode) {
    const sb = await klien()
    const { data, error } = await sb.rpc('statistik_publik', { p_periode: periode })
    if (error) throw new Error(pesanGalat(error))
    return data as StatistikPublik
  },
}
