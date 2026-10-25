import { CalendarDays, Camera, Check, ChevronRight, Eye, Inbox, MapPin, MessageCircle, Pencil, Percent, Star, Tag, Wallet, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { ElegantButton } from '../../components/Buttons'
import { Rating } from '../../components/Rating'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, PageLoader, Segmented, Toggle, TopBar } from '../../components/ui'
import { APP_NAME } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeEvent } from '../../context/RealtimeContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { fmtDateTime, fmtMoney } from '../../lib/format'
import { img } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'
import type { Booking } from '../../lib/types'

type Tab = 'requests' | 'agenda' | 'history'

export default function ProDashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const { provider, refresh, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('requests')
  const [busy, setBusy] = useState<string | null>(null)

  const data = useAsync(async () => {
    if (!provider) return null
    const [b, s] = await Promise.all([
      supabase.from('bookings').select('*').eq('provider_id', provider.id).order('scheduled_at', { ascending: true }),
      supabase.from('platform_settings').select('commission_rate').maybeSingle(),
    ])
    return { bookings: (b.data ?? []) as Booking[], rate: Number(s.data?.commission_rate ?? 0.1) }
  }, [provider?.id])

  useRealtimeEvent((e) => {
    if (e.type === 'booking' && e.booking.provider_id === provider?.id) void data.reload(true)
  })

  if (loading) return <PageLoader />
  if (!provider) return <Navigate to="/pro/alta" replace />
  if (!data.data) return <PageLoader />

  const { bookings, rate } = data.data
  const pending = bookings.filter((b) => b.status === 'pending')
  const agenda = bookings.filter((b) => b.status === 'accepted')
  const history = bookings.filter((b) => ['completed', 'cancelled', 'rejected'].includes(b.status)).reverse()
  const completed = bookings.filter((b) => b.status === 'completed')
  const earned = completed.reduce((s, b) => s + b.provider_amount, 0)
  const commission = completed.reduce((s, b) => s + b.commission_amount, 0)
  const toCollect = agenda.reduce((s, b) => s + b.provider_amount, 0)
  const list = tab === 'requests' ? pending : tab === 'agenda' ? agenda : history

  const run = async (key: string, fn: () => PromiseLike<{ error: unknown }>, ok: string) => {
    setBusy(key)
    const { error } = await fn()
    setBusy(null)
    if (error) toast({ kind: 'error', title: errorMessage(error) })
    else {
      toast({ kind: 'success', title: ok })
      void data.reload(true)
      void refresh()
    }
  }

  const setAvailable = async (v: boolean) => {
    const { error } = await supabase.from('providers').update({ available: v }).eq('id', provider.id)
    if (error) toast({ kind: 'error', title: errorMessage(error) })
    else await refresh()
  }

  const chat = async (b: Booking) => {
    const { data: c } = await supabase.from('conversations').select('id').eq('client_id', b.client_id!).eq('provider_id', b.provider_id).maybeSingle()
    if (c) navigate(`/app/mensajes/${c.id}`)
  }

  return (
    <div className="pb-10">
      <TopBar title="Panel profesional" onBack={() => navigate('/app/perfil')} />
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <Avatar src={img(provider.avatar_url, 120)} name={provider.display_name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold tracking-tight">{provider.display_name}</p>
            <Rating value={provider.rating_avg} count={provider.rating_count} />
          </div>
          <Link to={`/app/p/${provider.id}`} className="grid size-11 place-items-center rounded-full bg-mist" aria-label="Ver mi perfil público">
            <Eye className="size-5" />
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-mist p-3.5">
          <div>
            <p className="font-extrabold">{provider.available ? 'Disponible para trabajos' : 'No disponible'}</p>
            <p className="text-xs text-muted">{provider.available ? 'Apareces primero en las búsquedas' : 'Sigues visible, pero sin la etiqueta de disponible'}</p>
          </div>
          <Toggle checked={provider.available} onChange={(v) => void setAvailable(v)} label="Disponible" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Kpi icon={<Wallet className="size-4" />} label="Ganado (neto)" value={fmtMoney(earned)} tone="bg-navy text-white" />
          <Kpi icon={<CalendarDays className="size-4" />} label="Por cobrar" value={fmtMoney(toCollect)} tone="bg-ice text-navy" />
          <Kpi icon={<Percent className="size-4" />} label={`Comisión ${APP_NAME}`} value={fmtMoney(commission)} tone="bg-rosa/20 text-navy" />
          <Kpi icon={<Star className="size-4" />} label="Trabajos hechos" value={String(provider.jobs_count)} tone="bg-mist text-navy" />
        </div>

        <details className="mt-3 rounded-2xl border border-line p-3.5 text-sm">
          <summary className="cursor-pointer font-extrabold">¿Cómo cobro?</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            <li>El cliente paga el servicio en la app al reservar.</li>
            <li>{APP_NAME} retiene el dinero mientras haces el trabajo.</li>
            <li>
              Al completarlo recibes el {Math.round((1 - rate) * 100)}%. {APP_NAME} se queda el {Math.round(rate * 100)}% por conseguirte el cliente. Sin mensualidad.
            </li>
          </ol>
        </details>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <QuickLink to="/pro/servicios" icon={<Tag className="size-5" />} label="Servicios" />
          <QuickLink to="/pro/publicaciones" icon={<Camera className="size-5" />} label="Fotos" />
          <QuickLink to="/pro/perfil" icon={<Pencil className="size-5" />} label="Perfil" />
        </div>

        <Segmented
          className="mt-6"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'requests', label: `Nuevas${pending.length ? ` (${pending.length})` : ''}` },
            { value: 'agenda', label: `Agenda${agenda.length ? ` (${agenda.length})` : ''}` },
            { value: 'history', label: 'Historial' },
          ]}
        />

        <div className="mt-4 space-y-3">
          {list.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-8" />}
              title={tab === 'requests' ? 'Sin solicitudes nuevas' : tab === 'agenda' ? 'Agenda libre' : 'Sin historial'}
              body={tab === 'requests' ? 'Cuando un cliente reserve, te llegará aquí y en tus notificaciones.' : undefined}
            />
          ) : (
            list.map((b) => (
              <article key={b.id} className="rounded-card border border-line p-4 shadow-card">
                <Link to={`/app/reservas/${b.id}`} className="flex items-start gap-3">
                  <Avatar name={b.client_name || 'Cliente'} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold">{b.service_title}</p>
                    <p className="truncate text-sm text-muted">
                      {b.client_name || 'Cliente'} · {fmtDateTime(b.scheduled_at)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                      <MapPin className="size-3.5 shrink-0" /> {b.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-ok">{fmtMoney(b.provider_amount)}</p>
                    <p className="text-[11px] text-muted">de {fmtMoney(b.price)}</p>
                  </div>
                </Link>
                <div className="mt-3 flex items-center gap-2">
                  {b.status === 'pending' ? (
                    <>
                      <ElegantButton
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        loading={busy === `r-${b.id}`}
                        onClick={() => void run(`r-${b.id}`, () => supabase.rpc('respond_booking', { p_booking_id: b.id, p_accept: false }), 'Solicitud rechazada. Se devolvió el pago al cliente.')}
                      >
                        <X className="size-4" /> Rechazar
                      </ElegantButton>
                      <ElegantButton
                        size="sm"
                        variant="blue"
                        className="flex-1"
                        loading={busy === `a-${b.id}`}
                        onClick={() => void run(`a-${b.id}`, () => supabase.rpc('respond_booking', { p_booking_id: b.id, p_accept: true }), '¡Trabajo confirmado!')}
                      >
                        <Check className="size-4" /> Aceptar
                      </ElegantButton>
                    </>
                  ) : b.status === 'accepted' ? (
                    <>
                      <ElegantButton size="sm" variant="light" onClick={() => void chat(b)}>
                        <MessageCircle className="size-4" />
                      </ElegantButton>
                      <ElegantButton
                        size="sm"
                        variant="blue"
                        className="flex-1"
                        loading={busy === `c-${b.id}`}
                        onClick={() => void run(`c-${b.id}`, () => supabase.rpc('complete_booking', { p_booking_id: b.id }), 'Trabajo completado. Pago liberado.')}
                      >
                        <Check className="size-4" /> Marcar completado
                      </ElegantButton>
                    </>
                  ) : (
                    <>
                      <StatusBadge status={b.status} />
                      <Link to={`/app/reservas/${b.id}`} className="ml-auto flex items-center text-sm font-bold text-brand">
                        Detalle <ChevronRight className="size-4" />
                      </Link>
                    </>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-card p-4 ${tone}`}>
      <p className="flex items-center gap-1.5 text-xs font-bold opacity-80">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-[1.35rem] font-extrabold tracking-tight">{value}</p>
    </div>
  )
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line py-3 text-sm font-bold transition active:scale-95">
      <span className="text-brand">{icon}</span>
      {label}
    </Link>
  )
}
