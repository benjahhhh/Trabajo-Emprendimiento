import { BellOff, CalendarPlus, CalendarX, CircleCheck, CircleX, CreditCard, PartyPopper, Star, Wallet, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BellButton } from '../../components/BellButton'
import { EmptyState, TopBar } from '../../components/ui'
import { useRealtime, useRealtimeEvent } from '../../context/RealtimeContext'
import { useAsync } from '../../hooks/useAsync'
import { cn } from '../../lib/cn'
import { timeAgo } from '../../lib/format'
import { isIOS, isStandalone } from '../../lib/pwa'
import { notificationPermission, requestNotifications, showSystemNotification } from '../../lib/notify'
import { supabase } from '../../lib/supabase'
import type { AppNotification } from '../../lib/types'

const ICONS: Record<string, { icon: LucideIcon; cls: string }> = {
  booking_new: { icon: CalendarPlus, cls: 'bg-ice text-brand' },
  booking_created: { icon: CreditCard, cls: 'bg-ice text-brand' },
  booking_accepted: { icon: CircleCheck, cls: 'bg-emerald-50 text-ok' },
  booking_rejected: { icon: CircleX, cls: 'bg-rose-50 text-danger' },
  booking_cancelled: { icon: CalendarX, cls: 'bg-rose-50 text-danger' },
  booking_completed: { icon: Star, cls: 'bg-amber-50 text-star' },
  payout: { icon: Wallet, cls: 'bg-emerald-50 text-ok' },
  review: { icon: Star, cls: 'bg-amber-50 text-star' },
  welcome: { icon: PartyPopper, cls: 'bg-rosa/15 text-rosa' },
}

export default function Notifications() {
  const navigate = useNavigate()
  const { refreshCounts, ringKey, unreadNotifications } = useRealtime()
  const [perm, setPerm] = useState(notificationPermission())

  const list = useAsync(async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(60)
    return (data ?? []) as AppNotification[]
  }, [])

  useRealtimeEvent((e) => {
    if (e.type === 'notification') void list.reload(true)
  })

  const markAll = async () => {
    await supabase.from('notifications').update({ read: true }).eq('read', false)
    list.setData(list.data?.map((n) => ({ ...n, read: true })))
    void refreshCounts()
  }

  const open = async (n: AppNotification) => {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      void refreshCounts()
    }
    if (n.link) navigate(n.link)
    else list.setData(list.data?.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
  }

  const enable = async () => {
    const p = await requestNotifications()
    setPerm(p)
    if (p === 'granted') void showSystemNotification('Notificaciones activadas', 'Te avisaremos cuando acepten tu solicitud o te escriban.')
  }

  const permText =
    perm === 'granted'
      ? 'Activadas: te avisaremos aunque la app esté en segundo plano.'
      : perm === 'denied'
        ? 'Bloqueadas en el navegador. Actívalas en los ajustes del sitio.'
        : perm === 'unsupported'
          ? isIOS() && !isStandalone()
            ? 'En iPhone, instala la app en tu pantalla de inicio para recibir avisos.'
            : 'Tu navegador no admite notificaciones.'
          : 'Toca la campana para recibir avisos de reservas y mensajes.'

  return (
    <div className="pb-8">
      <TopBar
        title="Notificaciones"
        right={
          unreadNotifications > 0 ? (
            <button onClick={() => void markAll()} className="px-2 text-sm font-bold text-brand">
              Marcar leídas
            </button>
          ) : undefined
        }
      />
      <div className="px-4 pt-4">
        <div className="flex items-center gap-4 rounded-card bg-navy p-4 text-white">
          <BellButton light ringKey={ringKey} onClick={() => void enable()} label="Activar notificaciones" />
          <div>
            <p className="font-extrabold">{perm === 'granted' ? 'Avisos activados' : 'Activa los avisos'}</p>
            <p className="text-sm text-white/75">{permText}</p>
          </div>
        </div>
      </div>
      {list.loading && !list.data ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      ) : !list.data?.length ? (
        <EmptyState icon={<BellOff className="size-8" />} title="Sin notificaciones" body="Aquí verás cuando acepten tus solicitudes, te paguen o te dejen una reseña." />
      ) : (
        <ul className="mt-3">
          {list.data.map((n) => {
            const meta = ICONS[n.type] ?? ICONS.welcome
            const Icon = meta.icon
            return (
              <li key={n.id}>
                <button onClick={() => void open(n)} className={cn('flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-mist', !n.read && 'bg-ice/35')}>
                  <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl', meta.cls)}>
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block leading-snug', n.read ? 'font-bold' : 'font-extrabold')}>{n.title}</span>
                    {n.body && <span className="mt-0.5 block text-sm text-muted">{n.body}</span>}
                    <span className="mt-1 block text-xs text-muted">{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-brand" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
