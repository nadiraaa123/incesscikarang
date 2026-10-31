import { useState } from 'react'
import { cx } from './ui'

/** Ompreng (baki stainless MBG) tampak atas: nasi, lauk, tempe, sayur, buah. */
export function Ompreng({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Ilustrasi ompreng MBG berisi nasi, ayam, tempe, sayur, dan buah">
      <defs>
        <linearGradient id="baja" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9ECEB" />
          <stop offset=".5" stopColor="#C7CDCA" />
          <stop offset="1" stopColor="#E2E6E4" />
        </linearGradient>
        <linearGradient id="sekat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B9C0BC" />
          <stop offset="1" stopColor="#D3D8D5" />
        </linearGradient>
      </defs>
      <ellipse cx="180" cy="226" rx="150" ry="10" fill="#000" opacity=".08" />
      <rect x="18" y="14" width="324" height="204" rx="26" fill="url(#baja)" />
      <rect x="26" y="22" width="308" height="188" rx="20" fill="none" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth="2" />
      {/* nasi */}
      <rect x="36" y="32" width="150" height="168" rx="16" fill="url(#sekat)" />
      <path d="M58 132c-6-40 26-68 53-68s57 22 52 66c-3 30-26 46-53 46s-48-16-52-44z" fill="#FCFBF7" />
      {Array.from({ length: 26 }).map((_, i) => (
        <ellipse key={i} cx={70 + ((i * 37) % 84)} cy={88 + ((i * 23) % 70)} rx="4.5" ry="2.2" fill="#EFEBE1" transform={`rotate(${(i * 47) % 180} ${70 + ((i * 37) % 84)} ${88 + ((i * 23) % 70)})`} />
      ))}
      {/* ayam kecap */}
      <rect x="194" y="32" width="130" height="80" rx="14" fill="url(#sekat)" />
      <path d="M210 92c2-26 30-40 58-36 24 4 40 14 40 28 0 14-22 20-52 20s-47-4-46-12z" fill="#7A3A17" />
      <path d="M222 78c14-12 42-14 64-4" stroke="#A85A2A" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M232 92c10-6 30-6 44 0" stroke="#5E2A10" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".6" />
      {/* tempe */}
      <rect x="194" y="120" width="62" height="80" rx="14" fill="url(#sekat)" />
      <rect x="204" y="134" width="42" height="22" rx="4" fill="#C89A55" />
      <rect x="204" y="162" width="42" height="22" rx="4" fill="#B98843" />
      {[210, 218, 226, 234, 240].map((x) => <circle key={x} cx={x} cy={145} r="1.6" fill="#8C6430" />)}
      {[212, 220, 228, 236].map((x) => <circle key={x} cx={x} cy={173} r="1.6" fill="#7E5826" />)}
      {/* sayur */}
      <rect x="262" y="120" width="62" height="38" rx="12" fill="url(#sekat)" />
      <circle cx="276" cy="139" r="8" fill="#4E8F3F" /><circle cx="290" cy="135" r="7" fill="#6BAA55" /><circle cx="304" cy="141" r="8" fill="#3E7D35" />
      <rect x="282" y="142" width="10" height="5" rx="2" fill="#E5853A" /><rect x="298" y="132" width="8" height="5" rx="2" fill="#E5853A" />
      {/* buah */}
      <rect x="262" y="164" width="62" height="36" rx="12" fill="url(#sekat)" />
      <circle cx="292" cy="182" r="13" fill="#F09A25" />
      <circle cx="287" cy="177" r="3.5" fill="#F8C66E" />
      <path d="M292 169c2-4 6-5 9-4" stroke="#3F7F3A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** Komposisi hero: rantang bersusun + ompreng di atas latar hijau. */
export function HeroScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 390 230" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Ilustrasi rantang dan ompreng makanan bergizi">
      <rect width="390" height="230" fill="#1F5E3B" />
      <g opacity=".12" stroke="#FAF7F0" strokeWidth="1.2" fill="none">
        {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx="330" cy="40" r={20 + i * 22} />)}
      </g>
      <circle cx="78" cy="58" r="34" fill="#D99A1E" opacity=".9" />
      {/* rantang */}
      <g transform="translate(40 70)">
        <path d="M30 6c0-10 14-16 34-16s34 6 34 16" fill="none" stroke="#E9EDE9" strokeWidth="6" strokeLinecap="round" />
        <rect x="18" y="8" width="92" height="34" rx="8" fill="#F4F1EA" />
        <rect x="18" y="46" width="92" height="34" rx="8" fill="#E8E3D8" />
        <rect x="18" y="84" width="92" height="34" rx="8" fill="#DCD5C7" />
        <rect x="10" y="20" width="10" height="90" rx="4" fill="#C8CFCA" />
        <rect x="108" y="20" width="10" height="90" rx="4" fill="#C8CFCA" />
        <rect x="18" y="38" width="92" height="4" fill="#CFC8B9" />
        <rect x="18" y="76" width="92" height="4" fill="#C2BAAA" />
        <circle cx="94" cy="104" r="16" fill="#D99A1E" />
        <path d="M86 104l6 6 10-11" fill="none" stroke="#1F5E3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* ompreng miring */}
      <g transform="translate(170 46) rotate(-6)">
        <rect x="0" y="0" width="200" height="132" rx="18" fill="#E3E7E5" />
        <rect x="8" y="8" width="90" height="116" rx="12" fill="#C9CFCC" />
        <path d="M22 80c-4-26 16-44 34-44s38 14 34 42c-2 20-16 30-34 30s-31-10-34-28z" fill="#FCFBF7" />
        <rect x="104" y="8" width="88" height="56" rx="12" fill="#C9CFCC" />
        <path d="M114 50c2-18 22-26 40-24 16 2 28 9 28 18 0 9-14 13-34 13s-34-3-34-7z" fill="#7A3A17" />
        <rect x="104" y="70" width="42" height="54" rx="10" fill="#C9CFCC" />
        <circle cx="116" cy="90" r="7" fill="#4E8F3F" /><circle cx="130" cy="98" r="7" fill="#6BAA55" /><circle cx="118" cy="108" r="6" fill="#3E7D35" />
        <rect x="150" y="70" width="42" height="54" rx="10" fill="#C9CFCC" />
        <circle cx="171" cy="97" r="13" fill="#F09A25" />
      </g>
    </svg>
  )
}

/** Foto asli bila tersedia di /public/images, ilustrasi bila belum. */
export function FotoAtauIlustrasi({ src, alt, fallback, className, kredit }: { src: string; alt: string; fallback: React.ReactNode; className?: string; kredit?: string }) {
  const [gagal, setGagal] = useState(false)
  return (
    <figure className={cx('relative overflow-hidden', className)}>
      {gagal ? fallback : <img src={src} alt={alt} onError={() => setGagal(true)} className="h-full w-full object-cover" />}
      {!gagal && kredit && <figcaption className="absolute bottom-1.5 right-2 rounded bg-black/40 px-1.5 text-[10px] text-white">{kredit}</figcaption>}
    </figure>
  )
}
