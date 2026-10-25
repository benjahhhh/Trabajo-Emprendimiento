import { ChevronLeft, ChevronRight, Info, SendHorizontal } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, PageLoader } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useRealtime, useRealtimeEvent } from '../../context/RealtimeContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { cn } from '../../lib/cn'
import { fmtTime } from '../../lib/format'
import { img } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'
import type { Booking, Conversation, Message } from '../../lib/types'

const QUICK = ['Hola, ¿tienes disponibilidad esta semana?', '¿Llevas tus propias herramientas?', '¿Atiendes en mi comuna?']
const dayLabel = (d: Date) => {
  const today = new Date()
  const y = new Date(Date.now() - 86400000)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === y.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Chat() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { setActiveConversation, refreshCounts } = useRealtime()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  const page = useAsync(async () => {
    const [c, m] = await Promise.all([
      supabase
        .from('conversations')
        .select('*, provider:providers(id, display_name, avatar_url, is_demo, user_id, category_id), client:profiles(full_name, avatar_url)')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('messages').select('*').eq('conversation_id', id).order('created_at').limit(300),
    ])
    const conv = c.data as Conversation | null
    let booking: Booking | null = null
    if (conv) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', conv.client_id)
        .eq('provider_id', conv.provider_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      booking = data as Booking | null
    }
    setMessages((m.data ?? []) as Message[])
    return { conv, booking }
  }, [id])

  const markRead = async () => {
    await supabase.rpc('mark_conversation_read', { p_conversation_id: id })
    void refreshCounts()
  }

  useEffect(() => {
    setActiveConversation(id)
    void markRead()
    return () => setActiveConversation(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useRealtimeEvent((e) => {
    if (e.type === 'message' && e.message.conversation_id === id) {
      setMessages((list) => (list.some((x) => x.id === e.message.id) ? list : [...list.filter((x) => !x.id.startsWith('tmp-') || x.body !== e.message.body), e.message]))
      if (e.message.sender_role === 'provider') setTyping(false)
      void markRead()
    }
    if (e.type === 'booking' && page.data?.conv && e.booking.provider_id === page.data.conv.provider_id) void page.reload(true)
  })

  useLayoutEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, typing])

  if (page.loading && !page.data) return <PageLoader />
  const conv = page.data?.conv
  if (!conv) return <EmptyState icon={<Info className="size-8" />} title="Conversación no encontrada" />

  const myRole: 'client' | 'provider' = conv.client_id === user?.id ? 'client' : 'provider'
  const name = myRole === 'client' ? conv.provider?.display_name ?? 'Profesional' : conv.client?.full_name || 'Cliente'
  const avatar = myRole === 'client' ? img(conv.provider?.avatar_url, 96) : conv.client?.avatar_url
  const demo = myRole === 'client' && !!conv.provider?.is_demo
  const booking = page.data?.booking

  const send = async (body: string) => {
    const clean = body.trim()
    if (!clean || !user) return
    setText('')
    const tmp: Message = { id: `tmp-${Date.now()}`, conversation_id: id, sender_id: user.id, sender_role: myRole, body: clean, created_at: new Date().toISOString() }
    setMessages((m) => [...m, tmp])
    const { data, error } = await supabase.from('messages').insert({ conversation_id: id, sender_id: user.id, sender_role: myRole, body: clean }).select().single()
    if (error) {
      setMessages((m) => m.filter((x) => x.id !== tmp.id))
      setText(clean)
      toast({ kind: 'error', title: 'No se envió el mensaje', body: errorMessage(error) })
      return
    }
    setMessages((m) => (m.some((x) => x.id === data.id) ? m.filter((x) => x.id !== tmp.id) : m.map((x) => (x.id === tmp.id ? (data as Message) : x))))
    if (demo) {
      // El profesional de ejemplo "escribe" y responde a los pocos segundos
      setTimeout(() => setTyping(true), 700)
      setTimeout(async () => {
        await supabase.rpc('demo_reply', { p_conversation_id: id })
        const { data: fresh } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at').limit(300)
        if (fresh) setMessages(fresh as Message[])
        setTyping(false)
      }, 2600)
    }
  }

  let lastDay = ''
  return (
    <div className="flex h-dvh flex-col">
      <header className="z-10 flex items-center gap-2 border-b border-line bg-white/95 px-2 pb-2 pt-[max(env(safe-area-inset-top),10px)] backdrop-blur">
        <button aria-label="Volver" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/app/mensajes'))} className="grid size-10 place-items-center rounded-full active:bg-mist">
          <ChevronLeft className="size-6" />
        </button>
        <Link to={myRole === 'client' ? `/app/p/${conv.provider_id}` : '#'} className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar src={avatar} name={name} size="sm" online={myRole === 'client' ? true : undefined} />
          <div className="min-w-0">
            <p className="truncate font-extrabold leading-tight">{name}</p>
            <p className="text-xs text-muted">{myRole === 'client' ? 'Profesional · responde rápido' : 'Cliente'}</p>
          </div>
        </Link>
      </header>

      {booking && (
        <Link to={`/app/reservas/${booking.id}`} className="flex items-center gap-2 border-b border-line bg-mist px-4 py-2.5 text-sm">
          <span className="font-bold">Reserva #{booking.code}</span>
          <StatusBadge status={booking.status} />
          <span className="ml-auto flex items-center font-bold text-brand">
            Ver <ChevronRight className="size-4" />
          </span>
        </Link>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <div className="mx-auto mb-4 max-w-xs text-center text-sm text-muted">
            <p className="font-bold text-navy">Escribe a {name}</p>
            <p>Resuelve dudas antes de reservar. Por seguridad, paga siempre dentro de la app.</p>
          </div>
        )}
        <div className="space-y-1.5">
          {messages.map((m) => {
            const d = new Date(m.created_at)
            const label = dayLabel(d)
            const showDay = label !== lastDay
            lastDay = label
            const mine = m.sender_role === myRole
            return (
              <div key={m.id}>
                {showDay && <p className="my-3 text-center text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>}
                {m.sender_role === 'system' ? (
                  <p className="mx-auto my-2 max-w-[90%] rounded-2xl bg-ice/70 px-3.5 py-2 text-center text-[13px] font-semibold text-navy">{m.body}</p>
                ) : (
                  <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-[20px] px-3.5 py-2 text-[15px] leading-snug',
                        mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-mist text-navy',
                        m.id.startsWith('tmp-') && 'opacity-70',
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={cn('mt-0.5 text-right text-[10px]', mine ? 'text-white/70' : 'text-muted')}>{fmtTime(m.created_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {typing && (
            <div className="flex">
              <div className="flex gap-1 rounded-[20px] rounded-bl-md bg-mist px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2 animate-bounce rounded-full bg-muted/60" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div ref={bottom} />
      </div>

      {messages.filter((m) => m.sender_role !== 'system').length === 0 && myRole === 'client' && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2">
          {QUICK.map((qk) => (
            <button key={qk} onClick={() => void send(qk)} className="chip shrink-0">
              {qk}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-end gap-2 border-t border-line bg-white px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          void send(text)
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(text)
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Escribe un mensaje…"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl bg-mist px-4 py-2.5 text-[16px] outline-none focus:ring-2 focus:ring-brand/30"
        />
        <button aria-label="Enviar" disabled={!text.trim()} className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white transition active:scale-90 disabled:opacity-40">
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  )
}
