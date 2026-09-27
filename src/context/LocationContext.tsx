import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_LOCATION } from '../config'
import { reverseGeocode, type LatLng } from '../lib/geo'

type Status = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable'
type LocationState = {
  coords: LatLng
  label: string
  source: 'gps' | 'saved' | 'default'
  status: Status
  locate: () => Promise<LatLng | null>
  setManual: (coords: LatLng, label: string) => void
}

const KEY = 'cerca.location'
const LocationContext = createContext<LocationState | null>(null)

function readSaved(): { coords: LatLng; label: string } | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const saved = readSaved()
  const [coords, setCoords] = useState<LatLng>(saved?.coords ?? { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng })
  const [label, setLabel] = useState(saved?.label ?? DEFAULT_LOCATION.label)
  const [source, setSource] = useState<LocationState['source']>(saved ? 'saved' : 'default')
  const [status, setStatus] = useState<Status>('idle')

  const persist = (c: LatLng, l: string) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ coords: c, label: l }))
    } catch {
      /* modo privado */
    }
  }

  const locate = useCallback(async (): Promise<LatLng | null> => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return null
    }
    setStatus('locating')
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCoords(c)
          setSource('gps')
          setStatus('granted')
          resolve(c)
          const geo = await reverseGeocode(c)
          const l = geo?.area || 'Tu ubicación'
          setLabel(l)
          persist(c, l)
        },
        (err) => {
          setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      )
    })
  }, [])

  const setManual = useCallback((c: LatLng, l: string) => {
    setCoords(c)
    setLabel(l)
    setSource('saved')
    persist(c, l)
  }, [])

  // Si el permiso ya estaba concedido, actualiza la ubicación en silencio
  useEffect(() => {
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((p) => {
        if (p.state === 'granted') void locate()
      })
      .catch(() => {})
  }, [locate])

  const value = useMemo(() => ({ coords, label, source, status, locate, setManual }), [coords, label, source, status, locate, setManual])
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation2() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation2 fuera de LocationProvider')
  return ctx
}
