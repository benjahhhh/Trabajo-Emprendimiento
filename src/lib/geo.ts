export type LatLng = { lat: number; lng: number }

export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

// Dirección aproximada a partir de coordenadas (OpenStreetMap Nominatim)
export async function reverseGeocode({ lat, lng }: LatLng): Promise<{ address: string; area: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address ?? {}
    const street = [a.road, a.house_number].filter(Boolean).join(' ')
    const area = a.city_district || a.suburb || a.town || a.city || a.municipality || ''
    const address = [street, area].filter(Boolean).join(', ') || data.display_name || ''
    return { address, area }
  } catch {
    return null
  }
}

export const COMUNAS: Record<string, LatLng> = {
  'Santiago Centro': { lat: -33.4372, lng: -70.6506 },
  Providencia: { lat: -33.4314, lng: -70.6093 },
  'Ñuñoa': { lat: -33.4569, lng: -70.5979 },
  'Las Condes': { lat: -33.4125, lng: -70.565 },
  Vitacura: { lat: -33.39, lng: -70.576 },
  'Lo Barnechea': { lat: -33.353, lng: -70.518 },
  'La Reina': { lat: -33.445, lng: -70.54 },
  'Peñalolén': { lat: -33.486, lng: -70.543 },
  Macul: { lat: -33.487, lng: -70.599 },
  'La Florida': { lat: -33.523, lng: -70.598 },
  'Puente Alto': { lat: -33.61, lng: -70.576 },
  'San Joaquín': { lat: -33.496, lng: -70.629 },
  'San Miguel': { lat: -33.496, lng: -70.651 },
  'La Cisterna': { lat: -33.53, lng: -70.664 },
  'Estación Central': { lat: -33.459, lng: -70.698 },
  'Maipú': { lat: -33.51, lng: -70.758 },
  'Quinta Normal': { lat: -33.429, lng: -70.698 },
  Independencia: { lat: -33.415, lng: -70.665 },
  Recoleta: { lat: -33.406, lng: -70.641 },
  Huechuraba: { lat: -33.367, lng: -70.633 },
}
