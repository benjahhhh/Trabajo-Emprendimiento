import { CalendarDays, Check, CreditCard, LockKeyhole, MapPin, MessageCircle, Phone, ShieldCheck, StickyNote, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { ElegantButton, ElegantLink } from '../../components/Buttons'
import { Stars } from '../../components/Rating'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState, PageLoader, TopBar } from '../../components/ui'
import { APP_NAME } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeEvent } from '../../context/RealtimeContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { cn } from '../../lib/cn'
import { fmtDateLong, fmtDateTime, fmtMoney, fmtTime } from '../../lib/format'
import { img } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'
import type { Booking, Review } from '../../lib/types'

const PAYMENT_LABEL = { held: 'Retenido por la app', released: 'Liberado al profesional', refunded: 'Reembolsado' }

export default function BookingDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const [busy, setBusy] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const page = useAsync(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, provider:providers(id, display_name, avatar_url, category_id, is_demo, user_id, comuna)')
      .eq('id', id)
      .maybeSingle()
    const booking = data as Booking | null
    if (!booking) return null
    const [contact, review] = await Promise.all([
      booking.status === 'accepted' || booking.status === 'completed'
        ? supabase.rpc('booking_contact', { p_booking_id: id })
        : Promise.resolve({ data: [] }),
      supabase.from('reviews').select('*').eq('booking_id', id).maybeSingle(),
    ])
    const c = ((contact.data ?? []) as { name: string; phone: string }[])[0] ?? null
    return { booking, contact: c, review: review.data as Review | null }
  }, [id])

  useRealtimeEvent((e) => {
    if (e.type === 'booking' && e.booking.id === id) void page.reload(true)
  })

  if (page.loading && !page.data) return <PageLoader />
  if (!page.data)
    return (
      <>
        <TopBar title="Reserva" />
        <EmptyState icon={<CalendarDays className="size-8" />} title="Reserva no encontrada" action={<ElegantLink to="/app/reservas">Mis reservas</ElegantLink>} />
      </>
    )

  const { booking: b, contact, review } = page.data
  const isClient = b.client_id === user?.id
  const isProvider = !!b.provider?.user_id && b.provider.user_id === user?.id
  const other = isClient ? b.provider?.display_name ?? 'Profesional' : b.client_name || 'Cliente'

  const act = async (key: string, fn: () => PromiseLike<{ error: unknown }>, ok: string) => {
    setBusy(key)
    const { error } = await fn()
    setBusy(null)
    if (error) toast({ kind: 'error', title: errorMessage(error) })
    else {
      toast({ kind: 'success', title: ok })
      void page.reload(true)
    }
  }

  const openChat = async () => {
    if (isClient) {
      const { data } = await supabase.rpc('start_conversation', { p_provider_id: b.provider_id })
      if (data) navigate(`/app/mensajes/${data}`)
    } else {
      const { data } = await supabase.from('conversations').select('id').eq('client_id', b.client_id!).eq('provider_id', b.provider_id).maybeSingle()
      if (data) navigate(`/app/mensajes/${data.id}`)
    }
  }

  const steps = [
    { label: 'Pagada y enviada', at: b.created_at, done: true },
    { label: b.status === 'rejected' ? 'Rechazada · pago devuelto' : b.status === 'cancelled' ? 'Cancelada · pago devuelto' : 'Aceptada por el profesional', at: b.accepted_at ?? b.cancelled_at, done: !!(b.accepted_at || b.cancelled_at), bad: b.status === 'rejected' || b.status === 'cancelled' },
    ...(b.status === 'rejected' || b.status === 'cancelled' ? [] : [{ label: 'Trabajo completado · pago liberado', at: b.completed_at, done: !!b.completed_at }]),
  ]

  const statusText: Record<string, string> = isClient
    ? {
        pending: `Tu pago está retenido. ${other} tiene que aceptar la solicitud.`,
        accepted: `${other} confirmó. Cuando termine el trabajo, confírmalo para liberar el pago.`,
        completed: 'Trabajo terminado y pago liberado. ¡Gracias por usar la app!',
        cancelled: 'Cancelaste esta reserva. Te devolvimos el dinero.',
        rejected: `${other} no pudo atenderte. Te devolvimos el dinero.`,
      }
    : {
        pending: 'Nueva solicitud. Acéptala para confirmar el trabajo y ver el contacto del cliente.',
        accepted: 'Trabajo confirmado. Márcalo como completado al terminar para recibir el pago.',
        completed: `Pago liberado. Recibiste ${fmtMoney(b.provider_amount)}.`,
        cancelled: 'El cliente canceló esta reserva.',
        rejected: 'Rechazaste esta solicitud.',
      }

  return (
    <div className="pb-10">
      <TopBar title={`Reserva #${b.code}`} />
      <div className="space-y-4 px-4 pt-4">
        <section className="rounded-card bg-mist p-4">
          <StatusBadge status={b.status} />
          <p className="mt-2 text-[15px] font-semibold leading-snug">{statusText[b.status]}</p>
          <ol className="mt-4 space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', s.done ? (s.bad ? 'bg-danger text-white' : 'bg-ok text-white') : 'bg-white text-muted ring-1 ring-line')}>
                  {s.done ? s.bad ? <X className="size-4" /> : <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn('flex-1 text-sm font-bold', !s.done && 'text-muted')}>{s.label}</span>
                {s.at && s.done && <span className="text-xs text-muted">{fmtDateTime(s.at)}</span>}
              </li>
            ))}
          </ol>
        </section>

        <section className="flex items-center gap-3 rounded-card border border-line p-3.5">
          <Avatar src={isClient ? img(b.provider?.avatar_url, 96) : undefined} name={other} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-muted">{isClient ? 'Profesional' : 'Cliente'}</p>
            {isClient ? (
              <Link to={`/app/p/${b.provider_id}`} className="block truncate font-extrabold">
                {other}
              </Link>
            ) : (
              <p className="truncate font-extrabold">{other}</p>
            )}
          </div>
          <ElegantButton size="sm" variant="light" onClick={() => void openChat()}>
            <MessageCircle className="size-4" /> Chat
          </ElegantButton>
        </section>

        <section className="rounded-card border border-line p-4">
          {contact?.phone ? (
            <div>
              <p className="text-xs font-bold text-muted">Contacto de {contact.name}</p>
              <p className="mt-0.5 text-lg font-extrabold">{contact.phone}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="boton-elegante boton-elegante--sm boton-elegante--light">
                  <Phone className="size-4" /> Llamar
                </a>
                <a
                  href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="boton-elegante boton-elegante--sm"
                  style={{ ['--be-bg' as string]: '#16a34a', ['--be-border' as string]: '#22c55e', ['--be-bg-hover' as string]: '#15803d' }}
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-mist text-muted">
                <LockKeyhole className="size-5" />
              </span>
              <p className="text-sm text-muted">
                {b.status === 'pending' ? 'El teléfono se desbloquea cuando la reserva es aceptada.' : 'Contacto no disponible para esta reserva.'}
              </p>
            </div>
          )}
        </section>

        <section className="divide-y divide-line rounded-card border border-line text-sm">
          <Detail icon={<CalendarDays className="size-4" />} label="Fecha" value={`${fmtDateLong(b.scheduled_at)} · ${fmtTime(b.scheduled_at)}`} />
          <Detail icon={<MapPin className="size-4" />} label="Dirección" value={b.address} />
          {b.notes && <Detail icon={<StickyNote className="size-4" />} label="Notas" value={b.notes} />}
        </section>

        <section className="rounded-card border border-line p-4 text-sm">
          <h3 className="mb-3 flex items-center gap-2 font-extrabold">
            <CreditCard className="size-4 text-brand" /> Pago
          </h3>
          <dl className="space-y-2">
            <Line label={b.service_title} value={fmtMoney(b.price)} />
            {isProvider && (
              <>
                <Line label={`Comisión ${APP_NAME} (${Math.round(b.commission_rate * 100)}%)`} value={`− ${fmtMoney(b.commission_amount)}`} muted />
                <Line label="Recibes" value={fmtMoney(b.provider_amount)} strong />
              </>
            )}
            {isClient && <Line label="Total pagado" value={fmtMoney(b.price)} strong />}
            <Line label="Método" value={`${b.card_brand} •••• ${b.card_last4}`} muted />
            <Line label="Estado del pago" value={PAYMENT_LABEL[b.payment_status]} muted />
            <Line label="Referencia" value={b.payment_ref} muted />
          </dl>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-4 shrink-0 text-ok" /> {APP_NAME} retiene el pago hasta que el trabajo se completa y cobra un {Math.round(b.commission_rate * 100)}% al profesional por el contacto conseguido.
          </p>
        </section>

        {isClient && b.status === 'completed' && (
          <section className="rounded-card border border-line p-4">
            {review ? (
              <div>
                <p className="text-xs font-bold text-muted">Tu reseña</p>
                <Stars value={review.rating} />
                {review.comment && <p className="mt-1 text-[15px]">{review.comment}</p>}
              </div>
            ) : (
              <div>
                <h3 className="font-extrabold">¿Qué tal fue con {other}?</h3>
                <div className="mt-2">
                  <Stars value={rating} size="lg" onChange={setRating} />
                </div>
                <textarea className="field mt-3 min-h-24 resize-none" placeholder="Cuenta cómo fue el trabajo (opcional)" value={comment} maxLength={600} onChange={(e) => setComment(e.target.value)} />
                <ElegantButton
                  variant="blue"
                  block
                  className="mt-3"
                  loading={busy === 'review'}
                  onClick={() => void act('review', () => supabase.rpc('submit_review', { p_booking_id: b.id, p_rating: rating, p_comment: comment }), '¡Gracias por tu reseña!')}
                >
                  Publicar reseña
                </ElegantButton>
              </div>
            )}
          </section>
        )}

        <div className="grid gap-3 pt-1">
          {isClient && b.status === 'accepted' && (
            <ElegantButton variant="blue" block loading={busy === 'complete'} onClick={() => void act('complete', () => supabase.rpc('complete_booking', { p_booking_id: b.id }), 'Trabajo confirmado. Pago liberado.')}>
              <Check className="size-5" /> Confirmar trabajo realizado
            </ElegantButton>
          )}
          {isProvider && b.status === 'pending' && (
            <div className="grid grid-cols-2 gap-3">
              <ElegantButton variant="danger" loading={busy === 'reject'} onClick={() => void act('reject', () => supabase.rpc('respond_booking', { p_booking_id: b.id, p_accept: false }), 'Solicitud rechazada')}>
                Rechazar
              </ElegantButton>
              <ElegantButton variant="blue" loading={busy === 'accept'} onClick={() => void act('accept', () => supabase.rpc('respond_booking', { p_booking_id: b.id, p_accept: true }), 'Solicitud aceptada')}>
                Aceptar
              </ElegantButton>
            </div>
          )}
          {isProvider && b.status === 'accepted' && (
            <ElegantButton variant="blue" block loading={busy === 'complete'} onClick={() => void act('complete', () => supabase.rpc('complete_booking', { p_booking_id: b.id }), 'Trabajo completado. Pago en camino.')}>
              <Check className="size-5" /> Marcar como completado
            </ElegantButton>
          )}
          {isClient && (b.status === 'pending' || b.status === 'accepted') && (
            <ElegantButton
              variant="danger"
              block
              loading={busy === 'cancel'}
              onClick={() => {
                if (window.confirm('¿Cancelar la reserva? Te devolveremos el pago completo.'))
                  void act('cancel', () => supabase.rpc('cancel_booking', { p_booking_id: b.id }), 'Reserva cancelada y reembolsada')
              }}
            >
              Cancelar reserva
            </ElegantButton>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5">
      <span className="mt-0.5 text-brand">{icon}</span>
      <span className="w-20 shrink-0 font-bold text-muted">{label}</span>
      <span className="flex-1 font-semibold">{value}</span>
    </div>
  )
}

function Line({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-3', strong && 'border-t border-line pt-2 text-base')}>
      <dt className={cn(muted ? 'text-muted' : 'font-semibold', strong && 'font-extrabold text-navy')}>{label}</dt>
      <dd className={cn('text-right', strong ? 'font-extrabold' : 'font-bold')}>{value}</dd>
    </div>
  )
}
