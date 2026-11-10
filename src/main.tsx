import { StrictMode, Suspense, lazy, useEffect, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import { Memuat } from './components/ui'
import { useSesiSiap } from './lib/auth'

// Halaman selain Beranda dimuat saat dibuka agar unduhan awal di HP lebih kecil
const Schools = lazy(() => import('./pages/Schools'))
const SchoolDetail = lazy(() => import('./pages/SchoolDetail'))
const About = lazy(() => import('./pages/About'))
const Masuk = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Masuk })))
const Daftar = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Daftar })))
const AppHome = lazy(() => import('./pages/AppHome'))
const Profile = lazy(() => import('./pages/Profile'))
const Sppg = lazy(() => import('./pages/Sppg'))
const Rujukan = lazy(() => import('./pages/Rujukan'))
const BuatLaporan = lazy(() => import('./pages/BuatLaporan'))
const DetailLaporan = lazy(() => import('./pages/DetailLaporan'))
const Transparansi = lazy(() => import('./pages/Transparansi'))
const RiwayatLaporan = lazy(() => import('./pages/DaftarLaporan').then((m) => ({ default: m.RiwayatLaporan })))
const AntreanVerifikasi = lazy(() => import('./pages/DaftarLaporan').then((m) => ({ default: m.AntreanVerifikasi })))
const MonitoringEskalasi = lazy(() => import('./pages/DaftarLaporan').then((m) => ({ default: m.MonitoringEskalasi })))
const KasusKesehatan = lazy(() => import('./pages/DaftarLaporan').then((m) => ({ default: m.KasusKesehatan })))

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

/** Mode online: tunggu sesi Supabase dipulihkan dulu, agar halaman berlogin tidak sempat dialihkan ke Masuk. */
function SesiSiap({ children }: { children: ReactNode }) {
  return useSesiSiap() ? <>{children}</> : <Memuat teks="Menyiapkan sesi…" />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollTop />
      <SesiSiap>
        <Suspense fallback={<Memuat />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sekolah" element={<Schools />} />
            <Route path="/sekolah/:id" element={<SchoolDetail />} />
            <Route path="/tentang" element={<About />} />
            <Route path="/transparansi" element={<Transparansi />} />
            <Route path="/masuk" element={<Masuk />} />
            <Route path="/daftar" element={<Daftar />} />
            <Route path="/app" element={<AppHome />} />
            <Route path="/app/profil" element={<Profile />} />
            <Route path="/lapor/baru" element={<BuatLaporan />} />
            <Route path="/laporan" element={<RiwayatLaporan />} />
            <Route path="/laporan/:id" element={<DetailLaporan />} />
            <Route path="/petugas/verifikasi" element={<AntreanVerifikasi />} />
            <Route path="/petugas/eskalasi" element={<MonitoringEskalasi />} />
            <Route path="/mitra/sppg" element={<Sppg />} />
            <Route path="/mitra/kesehatan" element={<KasusKesehatan />} />
            <Route path="/rujukan/:token" element={<Rujukan />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </SesiSiap>
    </BrowserRouter>
  </StrictMode>,
)
