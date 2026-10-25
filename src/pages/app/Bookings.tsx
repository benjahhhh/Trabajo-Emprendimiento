import { BriefcaseBusiness, CalendarDays, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { ElegantLink } from '../../components/Buttons'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, Segmented, TopBar } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeEvent } from '../../context/RealtimeContext'
import { useAsync } from '../../hooks/useAsync'
import { fmtDateTime, fmtMoney } from '../../lib/format'
import { img } from '../../lib/images'
import { supabase } from '../../lib/supabase'
import type { Booking } from '../../lib/types'

export default function Bookings() {
  const { user, provider } = useAuth()
  const [tab, setTab] = useState<'next' | 'past'>('next')

  const bookings = useAsync(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, provider:providers(id, display_name, avatar_url, category_id, is_demo, user_id, comuna)')
      .eq('client_id', user!.id)
      .order('scheduled_at', { ascending: true })
    return (data ?? []) as Booking[]
  }, [user?.id])

  useRealtimeEvent((e) => {
    if (e.type === 'booking') void bookings.reload(true)
  })

  const all = bookings.data ?? []
  const upcoming = all.filter((b) => b.status === 'pending' || b.status === 'accepted')
  const past = all.filter((b) => !(b.status === 'pending' || b.status === 'accepted')).reverse()
  const list = tab === 'next' ? upcoming : past

  return (
    <div>
      <TopBar title="Mis reservas" back={false} />
      <div className="px-4 pt-3">
        {provider && (
          <Link to="/pro" className="mb-4 flex items-center gap-3 rounded-card bg-navy p-4 text-white">
            <BriefcaseBusiness className="size-5 text-rosa" />
            <span className="flex-1 text-sm font-bold">Solicitudes de tus clientes en el panel profesional</span>
            <ChevronRight className="size-5" />
          </Link>
        )}
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'next', label: `Próximas${upcoming.length ? ` (${upcoming.length})` : ''}` },
            { value: 'past', label: 'Historial' },
          ]}
        />
        <div className="mt-4 space-y-3 pb-6">
          {bookings.loading && !bookings.data ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-card" />)
          ) : list.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-8" />}
              title={tab === 'next' ? 'No tienes reservas próximas' : 'Sin historial todavía'}
              body="Busca un servicio, elige al profesional más cercano o mejor valorado y resérvalo en un minuto."
              action={
                <ElegantLink to="/app/buscar" variant="blue" size="sm">
                  Buscar un servicio
                </ElegantLink>
              }
            />
          ) : (
            list.map((b) => <BookingCard key={b.id} b={b} />)
          )}
        </div>
      </div>
    </div>
  )
}

export function BookingCard({ b, as = 'client' }: { b: Booking; as?: 'client' | 'provider' }) {
  const name = as === 'client' ? b.provider?.display_name ?? 'Profesional' : b.client_name || 'Cliente'
  const avatar = as === 'client' ? img(b.provider?.avatar_url, 96) : undefined
  return (
    <Link to={`/app/reservas/${b.id}`} className="flex items-center gap-3 rounded-card border border-line bg-white p-3.5 shadow-card transition active:scale-[0.99]">
      <Avatar src={avatar} name={name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold">{b.service_title}</p>
        <p className="truncate text-sm text-muted">
          {name} · {fmtDateTime(b.scheduled_at)}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <StatusBadge status={b.status} />
          <span className="text-xs font-bold text-muted">#{b.code}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-extrabold">{fmtMoney(as === 'client' ? b.price : b.provider_amount)}</p>
        {as === 'provider' && <p className="text-[11px] text-muted">neto</p>}
      </div>
    </Link>
  )
}
