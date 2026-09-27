import { CalendarDays, Check, CircleCheck, Clock, CreditCard, LocateFixed, MapPin, MessageCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { ElegantButton, ElegantLink } from '../../components/Buttons'
import { CreditCardForm, type CardResult } from '../../components/CreditCardForm'
import { EmptyState, PageLoader, Spinner, TopBar } from '../../components/ui'
import { APP_NAME } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useLocation2 } from '../../context/LocationContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { cn } from '../../lib/cn'
import { fmtDateLong, fmtMoney, fmtTime } from '../../lib/format'
import { COMUNAS, reverseGeocode, type LatLng } from '../../lib/geo'
import { img } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'
import type { Booking, Provider, Service } from '../../lib/types'

type Step = 'details' | 'pay' | 'done'
const HOURS = Array.from({ length: 13 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`)
const WEEKDAY = new Intl.DateTimeFormat('es-CL', { weekday: 'short' })

function nextDays(n: number) {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  return Array.from({ length: n }, (_, i) => new Date(base.getTime() + i * 86400000))
}

export default function Book() {
  const { serviceId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { profile } = useAuth()
  const { coords } = useLocation2()
  const [step, setStep] = useState<Step>('details')
  const days = useMemo(() => nextDays(14), [])
  const [dayIdx, setDayIdx] = useState(0)
  const [time, setTime] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [point, setPoint] = useState<LatLng | null>(null)
  const [notes, setNotes] = useState('')
  const [locating, setLocating] = useState(false)
  const [paying, setPaying] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [card, setCard] = useState<CardResult | null>(null)

  const data = useAsync(async () => {
    const { data } = await supabase.from('services').select('*, provider:providers(*)').eq('id', serviceId).maybeSingle()
    return data as (Service & { provider: Provider }) | null
  }, [serviceId])

  useEffect(() => {
    if (!address && profile?.comuna) {
      setAddress(`${profile.comuna}, Santiago`)
      setPoint(COMUNAS[profile.comuna] ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.comuna])

  // El profesional de ejemplo acepta solo a los pocos segundos (simula la respuesta real)
  useEffect(() => {
    if (step !== 'done' || !booking || booking.status !== 'pending' || !data.data?.provider.is_demo) return
    const t = setTimeout(async () => {
      const { data: b } = await supabase.rpc('demo_accept_booking', { p_booking_id: booking.id })
      if (b) setBooking(b as Booking)
    }, 3500)
    return () => clearTimeout(t)
  }, [step, booking, data.data?.provider.is_demo])

  if (data.loading && !data.data) return <PageLoader />
  const service = data.data
  if (!service)
    return (
      <>
        <TopBar title="Reservar" />
        <EmptyState icon={<CalendarDays className="size-8" />} title="Servicio no disponible" action={<ElegantLink to="/app/buscar">Buscar otro</ElegantLink>} />
      </>
    )
  const provider = service.provider

  const now = new Date()
  const isToday = dayIdx === 0
  const hourDisabled = (h: string) => isToday && Number(h.slice(0, 2)) <= now.getHours() + 1
  const scheduled = (() => {
    if (!time) return null
    const d = new Date(days[dayIdx])
    d.setHours(Number(time.slice(0, 2)), 0, 0, 0)
    return d
  })()
  const canContinue = !!scheduled && address.trim().length > 4

  const fillMyLocation = async () => {
    setLocating(true)
    const geo = await reverseGeocode(coords)
    setLocating(false)
    setPoint(coords)
    if (geo?.address) setAddress(geo.address)
    else toast({ kind: 'info', title: 'Escribe tu dirección', body: 'No pudimos traducir tu ubicación a una dirección.' })
  }

  const pay = async (c: CardResult) => {
    if (!scheduled) return
    setPaying(true)
    setCard(c)
    await new Promise((r) => setTimeout(r, 1400)) // simula la pasarela de pago
    const { data: b, error } = await supabase.rpc('create_booking', {
      p_service_id: service.id,
      p_scheduled_at: scheduled.toISOString(),
      p_address: address.trim(),
      p_lat: point?.lat ?? null,
      p_lng: point?.lng ?? null,
      p_notes: notes.trim(),
      p_card_brand: c.brand,
      p_card_last4: c.last4,
    })
    setPaying(false)
    if (error) {
      toast({ kind: 'error', title: 'No se pudo completar el pago', body: errorMessage(error) })
      return
    }
    setBooking(b as Booking)
    setStep('done')
    window.scrollTo(0, 0)
  }

  const summary = (
    <div className="flex items-center gap-3 rounded-card border border-line p-3.5">
      <Avatar src={img(provider.avatar_url, 96)} name={provider.display_name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold">{service.title}</p>
        <p className="truncate text-sm text-muted">
          {provider.display_name} · {service.duration_min} min
        </p>
      </div>
      <p className="text-lg font-extrabold">{fmtMoney(service.price)}</p>
    </div>
  )

  if (step === 'done' && booking) {
    const accepted = booking.status === 'accepted'
    return (
      <div className="flex min-h-dvh flex-col px-5 pb-8 pt-[max(env(safe-area-inset-top),24px)]">
        <div className="flex flex-1 flex-col items-center pt-8 text-center">
          <div className="animate-pop grid size-24 place-items-center rounded-full bg-brand text-white shadow-[0_18px_40px_-12px_rgb(2_95_251/0.7)]">
            <Check className="size-12" strokeWidth={3} />
          </div>
          <h1 className="mt-6 text-[2rem] font-extrabold leading-tight tracking-[-0.045em]">¡Pago realizado!</h1>
          <p className="mt-1 text-muted">
            Solicitud <b className="text-navy">#{booking.code}</b> enviada a {provider.display_name}
          </p>

          <div className={cn('mt-6 flex w-full items-center gap-3 rounded-card p-4 text-left transition', accepted ? 'bg-emerald-50' : 'bg-mist')}>
            {accepted ? <CircleCheck className="size-7 shrink-0 text-ok" /> : <Spinner className="size-6 shrink-0" />}
            <div>
              <p className="font-extrabold">{accepted ? `${provider.display_name} aceptó tu solicitud` : `Esperando que ${provider.display_name} acepte…`}</p>
              <p className="text-sm text-muted">{accepted ? 'Ya puedes ver su teléfono y hablar por el chat.' : `Suele responder en ~${provider.response_minutes} min. Te avisaremos.`}</p>
            </div>
          </div>

          <dl className="mt-4 w-full divide-y divide-line rounded-card border border-line text-left text-sm">
            <Row icon={<CalendarDays className="size-4" />} label="Cuándo" value={`${fmtDateLong(booking.scheduled_at)} · ${fmtTime(booking.scheduled_at)}`} />
            <Row icon={<MapPin className="size-4" />} label="Dónde" value={booking.address} />
            <Row icon={<CreditCard className="size-4" />} label="Pagado" value={`${fmtMoney(booking.price)} · ${card?.brand ?? booking.card_brand} •••• ${booking.card_last4}`} />
          </dl>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <ShieldCheck className="size-4 text-ok" /> Retenido por {APP_NAME} hasta que confirmes el trabajo
          </p>
        </div>
        <div className="grid gap-3">
          <ElegantButton variant="blue" block onClick={() => navigate(`/app/reservas/${booking.id}`, { replace: true })}>
            Ver mi reserva
          </ElegantButton>
          <ElegantButton
            variant="light"
            block
            onClick={async () => {
              const { data: conv } = await supabase.rpc('start_conversation', { p_provider_id: provider.id })
              if (conv) navigate(`/app/mensajes/${conv}`, { replace: true })
            }}
          >
            <MessageCircle className="size-4" /> Ir al chat
          </ElegantButton>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <TopBar title={step === 'details' ? 'Reservar' : 'Pago seguro'} onBack={step === 'pay' ? () => setStep('details') : undefined} />
      <div className="px-4 pt-3">
        <div className="mb-4 flex items-center gap-2 text-xs font-extrabold">
          {['Detalles', 'Pago', 'Listo'].map((s, i) => {
            const active = (step === 'details' && i === 0) || (step === 'pay' && i === 1)
            const done = step === 'pay' && i === 0
            return (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span className={cn('grid size-6 place-items-center rounded-full', active ? 'bg-brand text-white' : done ? 'bg-ok text-white' : 'bg-mist text-muted')}>
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={active ? 'text-navy' : 'text-muted'}>{s}</span>
                {i < 2 && <span className="h-0.5 flex-1 rounded bg-line" />}
              </div>
            )
          })}
        </div>
        {summary}

        {step === 'details' ? (
          <div className="mt-6 space-y-6">
            <section>
              <h2 className="mb-2.5 flex items-center gap-2 font-extrabold">
                <CalendarDays className="size-5 text-brand" /> ¿Qué día?
              </h2>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                {days.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDayIdx(i)
                      setTime(null)
                    }}
                    className={cn(
                      'flex w-16 shrink-0 flex-col items-center rounded-2xl border-2 py-2.5 transition active:scale-95',
                      dayIdx === i ? 'border-navy bg-navy text-white' : 'border-line bg-white',
                    )}
                  >
                    <span className={cn('text-[11px] font-bold uppercase', dayIdx === i ? 'text-white/70' : 'text-muted')}>
                      {i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : WEEKDAY.format(d).replace('.', '')}
                    </span>
                    <span className="text-xl font-extrabold">{d.getDate()}</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-2.5 flex items-center gap-2 font-extrabold">
                <Clock className="size-5 text-brand" /> ¿A qué hora?
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    disabled={hourDisabled(h)}
                    onClick={() => setTime(h)}
                    className={cn(
                      'rounded-xl border-2 py-2.5 text-sm font-extrabold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35',
                      time === h ? 'border-brand bg-brand text-white' : 'border-line bg-white',
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-2.5 flex items-center gap-2 font-extrabold">
                <MapPin className="size-5 text-brand" /> ¿Dónde?
              </h2>
              <input className="field" placeholder="Calle, número y comuna" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
              <button onClick={() => void fillMyLocation()} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
                <LocateFixed className={cn('size-4', locating && 'animate-pulse')} /> {locating ? 'Buscando…' : 'Usar mi ubicación actual'}
              </button>
              <textarea
                className="field mt-3 min-h-20 resize-none"
                placeholder="Notas para el profesional (opcional): depto, timbre, detalles del trabajo…"
                value={notes}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
              />
            </section>
            <ElegantButton variant="navy" block disabled={!canContinue} onClick={() => setStep('pay')}>
              Continuar al pago · {fmtMoney(service.price)}
            </ElegantButton>
          </div>
        ) : (
          <div className="mt-5">
            <dl className="mb-6 space-y-2 rounded-card bg-mist p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Servicio</dt>
                <dd className="font-bold">{fmtMoney(service.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Traslado a domicilio</dt>
                <dd className="font-bold text-ok">Incluido</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Protección de pago</dt>
                <dd className="font-bold text-ok">Gratis</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="font-extrabold">Total</dt>
                <dd className="font-extrabold">{fmtMoney(service.price)}</dd>
              </div>
              <p className="pt-1 text-xs text-muted">
                {scheduled && `${fmtDateLong(scheduled)} · ${fmtTime(scheduled)} · `}La comisión de {APP_NAME} la paga el profesional: tú pagas el precio publicado.
              </p>
            </dl>
            <CreditCardForm amount={service.price} onPay={(c) => void pay(c)} loading={paying} />
          </div>
        )}
      </div>

      {paying && (
        <div className="fixed inset-0 z-[1800] grid place-items-center bg-white/85 backdrop-blur-sm">
          <div className="flex flex-col items-center text-center">
            <Spinner className="size-12 border-4" />
            <p className="mt-4 text-lg font-extrabold">Procesando pago…</p>
            <p className="text-sm text-muted">Conectando con el banco de forma segura</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5">
      <span className="mt-0.5 text-brand">{icon}</span>
      <dt className="w-16 shrink-0 font-bold text-muted">{label}</dt>
      <dd className="flex-1 font-semibold">{value}</dd>
    </div>
  )
}
