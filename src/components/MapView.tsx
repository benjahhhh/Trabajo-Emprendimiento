import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { cn } from '../lib/cn'
import type { LatLng } from '../lib/geo'

export type MapPin = { id: string; lat: number; lng: number; avatar?: string | null; name: string; tag?: string }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const pinIcon = (p: MapPin, active: boolean) =>
  L.divIcon({
    className: 'map-pin',
    html: `<div class="map-pin__wrap ${active ? 'is-active' : ''}">${
      p.avatar ? `<img class="map-pin__img" src="${esc(p.avatar)}" alt="" />` : `<div class="map-pin__img"></div>`
    }${p.tag ? `<span class="map-pin__tag">${esc(p.tag)}</span>` : ''}</div>`,
    iconSize: [52, 64],
    iconAnchor: [26, 26],
  })

const meIcon = L.divIcon({ className: 'map-pin', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] })

function Controller({ center, zoom, fit }: { center: LatLng; zoom: number; fit?: LatLng[] }) {
  const map = useMap()
  const fitKey = fit?.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|')
  useEffect(() => {
    if (fit && fit.length > 1) {
      map.fitBounds(L.latLngBounds(fit.map((p) => [p.lat, p.lng] as [number, number])), { padding: [48, 48], maxZoom: 15 })
    } else {
      map.setView([center.lat, center.lng], zoom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom, fitKey])
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150)
    return () => clearTimeout(t)
  }, [map])
  return null
}

export function MapView({
  center,
  pins = [],
  selectedId,
  onSelect,
  me,
  radius,
  zoom = 13,
  interactive = true,
  fitToPins,
  className,
}: {
  center: LatLng
  pins?: MapPin[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  me?: LatLng | null
  radius?: { center: LatLng; km: number }
  zoom?: number
  interactive?: boolean
  fitToPins?: boolean
  className?: string
}) {
  const icons = useMemo(() => new Map(pins.map((p) => [p.id, pinIcon(p, p.id === selectedId)])), [pins, selectedId])
  const fit = useMemo(() => (fitToPins && pins.length ? [...pins, ...(me ? [me] : [])] : undefined), [fitToPins, pins, me])

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      zoomControl={false}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      attributionControl
      className={cn('size-full', className)}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <Controller center={center} zoom={zoom} fit={fit} />
      {radius && (
        <Circle
          center={[radius.center.lat, radius.center.lng]}
          radius={radius.km * 1000}
          pathOptions={{ color: '#025FFB', weight: 2, fillColor: '#025FFB', fillOpacity: 0.08 }}
        />
      )}
      {me && <Marker position={[me.lat, me.lng]} icon={meIcon} interactive={false} />}
      {pins.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icons.get(p.id)!}
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          eventHandlers={onSelect ? { click: () => onSelect(p.id) } : undefined}
        />
      ))}
    </MapContainer>
  )
}
