import { Heart } from 'lucide-react'
import { ElegantLink } from '../../components/Buttons'
import { ProviderRow } from '../../components/ProviderCard'
import { EmptyState, TopBar } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useLocation2 } from '../../context/LocationContext'
import { useAsync } from '../../hooks/useAsync'
import { distanceKm } from '../../lib/geo'
import { supabase } from '../../lib/supabase'
import type { Provider, ProviderResult } from '../../lib/types'

export default function Favorites() {
  const { user } = useAuth()
  const { coords } = useLocation2()
  const favs = useAsync(async () => {
    const { data } = await supabase.from('favorites').select('provider:providers(*)').eq('user_id', user!.id).order('created_at', { ascending: false })
    return ((data ?? []) as unknown as { provider: Provider }[]).map((f) => f.provider).filter(Boolean)
  }, [user?.id])

  const list: ProviderResult[] = (favs.data ?? []).map((p) => ({ ...p, category_name: '', distance_km: distanceKm(coords, p) }))
  return (
    <div>
      <TopBar title="Guardados" />
      <div className="space-y-3 px-4 pt-4 pb-8">
        {favs.loading && !favs.data ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-card" />)
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Heart className="size-8" />}
            title="Aún no guardas a nadie"
            body="Toca el corazón en el perfil de un profesional para tenerlo siempre a mano."
            action={
              <ElegantLink to="/app/buscar" variant="blue" size="sm">
                Explorar
              </ElegantLink>
            }
          />
        ) : (
          list.map((p) => <ProviderRow key={p.id} p={p} />)
        )}
      </div>
    </div>
  )
}
