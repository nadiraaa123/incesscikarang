const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => toISODate(new Date())
export const nowTime = () => {
  const d = new Date()
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`
}
export const monthKey = (iso: string) => iso.slice(0, 7)

export const isSchoolDay = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6

/** Hari sekolah terakhir sampai hari ini (bila hari ini Sabtu/Minggu, mundur ke Jumat). */
export const lastSchoolDay = () => {
  const d = new Date()
  while (!isSchoolDay(d)) d.setDate(d.getDate() - 1)
  return toISODate(d)
}

/** n hari sekolah sebelum tanggal acuan (tidak termasuk acuan). */
export const schoolDaysBefore = (iso: string, n: number) => {
  const out: string[] = []
  const d = new Date(iso + 'T00:00:00')
  while (out.length < n) {
    d.setDate(d.getDate() - 1)
    if (isSchoolDay(d)) out.push(toISODate(d))
  }
  return out
}

export const fmtTanggal = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', opts)

export const fmtPendek = (iso: string) => fmtTanggal(iso, { day: 'numeric', month: 'short' })

export const fmtBulan = (key: string) => new Date(key + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short' })

export const monthsBack = (n: number) => {
  const out: string[] = []
  const d = new Date()
  d.setDate(1)
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(`${x.getFullYear()}-${pad(x.getMonth() + 1)}`)
  }
  return out
}
