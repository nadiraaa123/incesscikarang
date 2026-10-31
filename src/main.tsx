import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Schools from './pages/Schools'
import SchoolDetail from './pages/SchoolDetail'
import About from './pages/About'
import { Daftar, Masuk } from './pages/Auth'
import AppHome from './pages/AppHome'
import Profile from './pages/Profile'
import Sppg from './pages/Sppg'
import Rujukan from './pages/Rujukan'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sekolah" element={<Schools />} />
        <Route path="/sekolah/:id" element={<SchoolDetail />} />
        <Route path="/tentang" element={<About />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/daftar" element={<Daftar />} />
        <Route path="/app" element={<AppHome />} />
        <Route path="/app/profil" element={<Profile />} />
        <Route path="/mitra/sppg" element={<Sppg />} />
        <Route path="/rujukan/:token" element={<Rujukan />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
