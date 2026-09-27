import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { ElegantLink } from '../../components/Buttons'
import { EmptyState, TopBar } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeEvent } from '../../context/RealtimeContext'
import { useAsync } from '../../hooks/useAsync'
import { cn } from '../../lib/cn'
import { timeAgo } from '../../lib/format'
import { img } from '../../lib/images'
import { supabase } from '../../lib/supabase'
import type { Conversation } from '../../lib/types'

export default function Messages() {
  const { user } = useAuth()
  const convs = useAsync(async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*, provider:providers(id, display_name, avatar_url, is_demo, user_id, category_id), client:profiles(full_name, avatar_url)')
      .neq('last_message', '')
      .order('last_message_at', { ascending: false })
    return (data ?? []) as Conversation[]
  }, [user?.id])

  useRealtimeEvent((e) => {
    if (e.type === 'message') void convs.reload(true)
  })

  const list = convs.data ?? []
  return (
    <div>
      <TopBar title="Mensajes" back={false} />
      {convs.loading && !convs.data ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="size-8" />}
          title="Aún no tienes conversaciones"
          body="Escribe a un profesional desde su perfil o reserva un servicio: el chat se abre solo."
          action={
            <ElegantLink to="/app/buscar" variant="blue" size="sm">
              Buscar profesionales
            </ElegantLink>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {list.map((c) => {
            const iAmClient = c.client_id === user?.id
            const name = iAmClient ? c.provider?.display_name ?? 'Profesional' : c.client?.full_name || 'Cliente'
            const avatar = iAmClient ? img(c.provider?.avatar_url, 96) : c.client?.avatar_url
            const unread = new Date(c.last_message_at) > new Date(iAmClient ? c.client_last_read_at : c.provider_last_read_at)
            return (
              <li key={c.id}>
                <Link to={`/app/mensajes/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 transition active:bg-mist">
                  <Avatar src={avatar} name={name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('truncate', unread ? 'font-extrabold' : 'font-bold')}>{name}</p>
                      {!iAmClient && <span className="rounded-full bg-rosa/20 px-2 py-0.5 text-[10px] font-extrabold text-navy">Cliente</span>}
                    </div>
                    <p className={cn('truncate text-sm', unread ? 'font-semibold text-navy' : 'text-muted')}>{c.last_message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs text-muted">{timeAgo(c.last_message_at)}</span>
                    {unread && <span className="size-2.5 rounded-full bg-brand" />}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
