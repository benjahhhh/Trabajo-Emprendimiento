import { useEffect, useState } from 'react'
import { cn } from '../lib/cn'

// Botón campana de Uiverse (vinodjangid07). Suena al pasar el ratón y cuando llega una notificación.
// Icono de campana: Font Awesome Free (licencia CC BY 4.0).
export function BellButton({
  count = 0,
  ringKey = 0,
  onClick,
  light,
  label = 'Notificaciones',
}: {
  count?: number
  ringKey?: number
  onClick?: () => void
  light?: boolean
  label?: string
}) {
  const [ringing, setRinging] = useState(false)
  useEffect(() => {
    if (!ringKey) return
    setRinging(true)
    const t = setTimeout(() => setRinging(false), 950)
    return () => clearTimeout(t)
  }, [ringKey])

  return (
    <button type="button" aria-label={count ? `${label} (${count} sin leer)` : label} onClick={onClick} className={cn('bell-button', light && 'bell-button--light', ringing && 'is-ringing')}>
      <svg viewBox="0 0 448 512" className="bell" aria-hidden="true">
        <path d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-rosa px-1 text-[10px] font-extrabold text-navy">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
