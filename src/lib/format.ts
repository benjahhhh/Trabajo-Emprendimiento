import { CURRENCY, LOCALE, TIMEZONE } from '../config'

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 })
export const fmtMoney = (n: number | null | undefined) => money.format(Math.round(n ?? 0))

const compact = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })
export const fmtCompact = (n: number) => (n < 1000 ? String(n) : compact.format(n))

export function fmtDistance(km: number | null | undefined) {
  if (km === null || km === undefined || Number.isNaN(km)) return ''
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`
  return `${km.toLocaleString(LOCALE, { maximumFractionDigits: km < 10 ? 1 : 0 })} km`
}

export const fmtRating = (n: number) => (Number(n) || 0).toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const dateLong = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIMEZONE })
const dateShort = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short', timeZone: TIMEZONE })
const time = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIMEZONE })

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const fmtDateLong = (d: string | Date) => cap(dateLong.format(new Date(d)))
export const fmtDateShort = (d: string | Date) => cap(dateShort.format(new Date(d)).replace('.', ''))
export const fmtTime = (d: string | Date) => time.format(new Date(d))
export const fmtDateTime = (d: string | Date) => `${fmtDateShort(d)} · ${fmtTime(d)}`

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
export function timeAgo(d: string | Date) {
  const diff = (new Date(d).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 45) return 'ahora'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / (86400 * 7)), 'week')
  return rtf.format(Math.round(diff / (86400 * 30)), 'month')
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?'

export const firstName = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/)[0] ?? ''

export const pluralize = (n: number, one: string, many: string) => `${n.toLocaleString(LOCALE)} ${n === 1 ? one : many}`
