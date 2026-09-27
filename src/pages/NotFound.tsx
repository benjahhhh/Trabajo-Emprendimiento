import { MapPinOff } from 'lucide-react'
import { ElegantLink } from '../components/Buttons'
import { EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <EmptyState icon={<MapPinOff className="size-8" />} title="Página no encontrada" body="El enlace no existe o se movió." action={<ElegantLink to="/app">Ir al inicio</ElegantLink>} />
    </div>
  )
}
