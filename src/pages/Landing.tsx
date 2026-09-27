import { ArrowRight, BadgeCheck, ChevronDown, CreditCard, MapPin, MessageCircle, Search, ShieldCheck, Star, Wallet, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { ElegantLink } from '../components/Buttons'
import { useInstall } from '../components/InstallSheet'
import { Logo, LogoMark } from '../components/Logo'
import { MapView } from '../components/MapView'
import { PhoneMockup } from '../components/PhoneMockup'
import { AppStoreBadge, GooglePlayBadge } from '../components/StoreBadges'
import { APP_NAME, DEFAULT_LOCATION } from '../config'
import { useAsync } from '../hooks/useAsync'
import { cn } from '../lib/cn'
import { CATEGORY_COVERS } from '../lib/covers'
import { fmtMoney, fmtRating } from '../lib/format'
import { img } from '../lib/images'
import { supabase } from '../lib/supabase'
import type { ProviderResult } from '../lib/types'

const FEATURES: { icon: LucideIcon; title: string; body: string; cls: string; rot: string }[] = [
  { icon: MapPin, title: 'El más cercano', body: 'Ve en el mapa quién está a minutos de tu casa.', cls: 'bg-brand text-white', rot: '-rotate-3' },
  { icon: ShieldCheck, title: 'Pago protegido', body: 'Pagas en la app y el dinero se libera al terminar.', cls: 'bg-rosa text-navy', rot: 'rotate-2' },
  { icon: Star, title: 'Reseñas reales', body: 'Solo opinan clientes que contrataron el servicio.', cls: 'bg-navy text-white', rot: '-rotate-2' },
  { icon: MessageCircle, title: 'Chat en la app', body: 'Resuelve dudas antes y después de reservar.', cls: 'bg-ice text-navy', rot: 'rotate-3' },
]

const CATEGORIES = [
  { id: 'jardineria', name: 'Corte de pasto' },
  { id: 'mecanica', name: 'Mecánico a domicilio' },
  { id: 'barberia', name: 'Barbero a domicilio' },
  { id: 'belleza', name: 'Manicure y belleza' },
  { id: 'gasfiteria', name: 'Gásfiter' },
  { id: 'aseo', name: 'Aseo de casas' },
  { id: 'mascotas', name: 'Paseo de perros' },
  { id: 'electricidad', name: 'Electricista' },
]

const PRICES = [
  ['Corte de pelo a domicilio', '$12.000', '45 min'],
  ['Corte de pasto (hasta 100 m²)', '$18.000', '1 h 30 min'],
  ['Cambio de aceite y filtro', '$45.000', '1 h'],
  ['Destape de cañería', '$25.000', '1 h'],
  ['Manicure semipermanente', '$15.000', '1 h'],
  ['Paseo de perro', '$6.000', '1 h'],
]

const FAQ = [
  ['¿Cómo pago un servicio?', 'Con tarjeta dentro de la app al reservar. El dinero queda retenido y se libera al profesional cuando confirmas que el trabajo está hecho. Si no te aceptan, se devuelve completo.'],
  ['¿Cuánto cobra la app?', `Para el cliente es gratis: pagas el precio publicado. El profesional paga un 10% de cada trabajo conseguido con ${APP_NAME}. Sin mensualidades.`],
  ['¿Cómo elijo al profesional?', 'Ordena por cercanía, valoración o precio, mira sus fotos de trabajos y reseñas, y escríbele por el chat antes de reservar.'],
  ['¿Cuándo veo su teléfono?', 'Cuando el profesional acepta tu reserva. Así los datos de contacto solo se comparten con trabajos confirmados.'],
  ['¿Cómo me uno como profesional?', 'Crea tu cuenta, elige tu categoría y publica tu primer servicio. En 3 minutos apareces en las búsquedas de tu zona.'],
  ['¿Está en App Store y Google Play?', `${APP_NAME} es una web app: se instala desde el navegador en iPhone y Android, con icono y notificaciones como cualquier app.`],
]

export default function Landing() {
  const { install, sheet } = useInstall()
  const pins = useAsync(async () => {
    const { data } = await supabase.rpc('search_providers', { p_lat: DEFAULT_LOCATION.lat, p_lng: DEFAULT_LOCATION.lng, p_sort: 'distance', p_limit: 48 })
    return (data ?? []) as ProviderResult[]
  }, [])
  const summary = useMemo(() => {
    const list = pins.data ?? []
    const minByCat: Record<string, number> = {}
    for (const p of list) if (p.price_from > 0) minByCat[p.category_id] = Math.min(minByCat[p.category_id] ?? Infinity, p.price_from)
    const rated = list.filter((p) => p.rating_count > 0)
    const avg = rated.length ? rated.reduce((s, p) => s + Number(p.rating_avg), 0) / rated.length : 4.8
    return { count: list.length || 48, avg, minByCat, cats: new Set(list.map((p) => p.category_id)).size || 16 }
  }, [pins.data])
  const mapPins = useMemo(
    () => (pins.data ?? []).map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, avatar: img(p.avatar_url, 88), name: p.display_name, tag: `★ ${fmtRating(p.rating_avg)}` })),
    [pins.data],
  )

  return (
    <div className="overflow-x-hidden bg-white text-navy">
      <header className="sticky top-0 z-50 border-b border-line/60 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
          <Link to="/" aria-label={APP_NAME}>
            <Logo />
          </Link>
          <nav className="ml-4 hidden gap-6 text-sm font-bold text-muted md:flex">
            <a href="#como-funciona" className="hover:text-navy">Cómo funciona</a>
            <a href="#servicios" className="hover:text-navy">Servicios</a>
            <a href="#profesionales" className="hover:text-navy">Profesionales</a>
            <a href="#preguntas" className="hover:text-navy">Preguntas</a>
          </nav>
          <ElegantLink to="/app" size="sm" className="ml-auto">
            Abrir app <ArrowRight className="size-4" />
          </ElegantLink>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute -left-20 bottom-[92px] h-14 w-[140%] -rotate-[5deg] bg-rosa" />
        <div className="pointer-events-none absolute -left-20 -bottom-2 h-24 w-[140%] -rotate-[5deg] bg-brand" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-44 pt-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-48 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-ice px-3 py-1.5 text-xs font-extrabold text-brand">
              <span className="size-2 rounded-full bg-brand" /> Ya disponible en Santiago
            </span>
            <h1 className="mt-5 text-[3.1rem] font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-[4.6rem] lg:text-[5.6rem]">
              Servicios <span className="text-brand">a domicilio</span>, cerca de ti
            </h1>
            <p className="mt-5 max-w-[34ch] text-lg text-muted sm:text-xl">
              Barberos, mecánicos, jardineros, gásfiter y más. Encuentra al más cercano o al mejor valorado, reserva y paga seguro en un minuto.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <AppStoreBadge onClick={() => void install('ios')} />
              <GooglePlayBadge onClick={() => void install('android')} />
            </div>
            <div className="mt-4">
              <ElegantLink to="/app" variant="blue">
                Probar la web app <ArrowRight className="size-5" />
              </ElegantLink>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <Stat value={String(summary.count)} label="profesionales" />
              <Stat value={String(summary.cats)} label="tipos de servicio" />
              <Stat value={`${fmtRating(summary.avg)} ★`} label="valoración media" />
            </dl>
          </div>
          <div className="relative mx-auto h-[600px] w-full max-w-[440px]">
            <div className="absolute left-0 top-10 h-[280px] w-[230px] -rotate-6 overflow-hidden bg-ice shadow-card sm:w-[260px] lg:-left-32 lg:w-[300px]">
              <img src={img(CATEGORY_COVERS.jardineria, 520, 520)} alt="Jardinero cortando el pasto" className="size-full object-cover" />
            </div>
            <div className="absolute bottom-6 left-2 z-10 rotate-3 rounded-2xl bg-white p-3 shadow-card">
              <p className="text-xs font-bold text-muted">Pago liberado</p>
              <p className="text-lg font-extrabold">+ $16.200</p>
            </div>
            <PhoneMockup className="absolute right-0 top-0 rotate-[4deg]" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="max-w-[18ch] text-[2.3rem] font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-5xl">{APP_NAME}: para cada trabajo en casa</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body, cls, rot }) => (
            <div key={title} className={cn('p-6 transition hover:rotate-0', cls, rot)}>
              <span className={cn('grid size-12 place-items-center rounded-full', cls.includes('text-white') ? 'bg-white/15' : 'bg-white/60')}>
                <Icon className="size-6" strokeWidth={1.6} />
              </span>
              <h3 className="mt-6 text-xl font-extrabold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-[15px] opacity-80">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="bg-mist py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-[2.3rem] font-extrabold tracking-[-0.045em] sm:text-5xl">Cómo funciona</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Search, t: 'Busca lo que necesitas', d: '«Cortar el pasto», «cambio de aceite», «barbero»… Te mostramos a los profesionales en lista y en mapa.' },
              { icon: BadgeCheck, t: 'Compara y elige', d: 'Ordena por cercanía, valoración o precio. Mira sus trabajos y reseñas, y escríbeles por el chat.' },
              { icon: CreditCard, t: 'Reserva y paga seguro', d: 'Elige día y hora, paga con tarjeta y listo. El pago se libera cuando confirmas el trabajo.' },
            ].map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="rounded-card bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-6xl font-extrabold tracking-tighter text-ice">0{i + 1}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-navy text-white">
                    <Icon className="size-6" />
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-extrabold tracking-tight">{t}</h3>
                <p className="mt-1.5 text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SERVICES */}
      <section id="servicios" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-[16ch] text-[2.3rem] font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-5xl">Todo lo que necesitas, a domicilio</h2>
          <ElegantLink to="/app/buscar" variant="light" size="sm">
            Ver las {summary.cats} categorías <ArrowRight className="size-4" />
          </ElegantLink>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/app/buscar?cat=${c.id}`} className="group relative aspect-[4/5] overflow-hidden bg-ice">
              <img src={img(CATEGORY_COVERS[c.id], 360, 450)} alt={c.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent p-4 pt-16 text-white">
                <p className="text-lg font-extrabold leading-tight tracking-tight">{c.name}</p>
                <p className="text-sm text-white/80">{summary.minByCat[c.id] ? `desde ${fmtMoney(summary.minByCat[c.id])}` : 'Ver profesionales'}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MAP */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div>
          <h2 className="text-[2.3rem] font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-5xl">Profesionales en todo Santiago</h2>
          <p className="mt-4 text-lg text-muted">Providencia, Ñuñoa, Las Condes, Maipú, La Florida, Puente Alto y más. La app te muestra primero a quien está más cerca.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Providencia', 'Ñuñoa', 'Las Condes', 'Vitacura', 'Santiago Centro', 'Maipú', 'La Florida', 'Macul', 'La Reina', 'Puente Alto'].map((c) => (
              <span key={c} className="rounded-full border border-line px-3 py-1.5 text-sm font-bold">
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="relative h-[380px] overflow-hidden border border-line shadow-card sm:h-[440px]">
          <MapView center={{ lat: DEFAULT_LOCATION.lat - 0.02, lng: DEFAULT_LOCATION.lng - 0.02 }} zoom={11} pins={mapPins} interactive={false} />
          <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-2xl bg-white/95 px-4 py-3 shadow-card">
            <p className="text-2xl font-extrabold">{summary.count}</p>
            <p className="text-xs font-bold text-muted">profesionales activos</p>
          </div>
        </div>
      </section>

      {/* PRICES */}
      <section className="bg-mist py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-[2.3rem] font-extrabold tracking-[-0.045em] sm:text-5xl">Precios de ejemplo</h2>
          <p className="mt-2 text-muted">Precios publicados por profesionales en la app. Incluyen el traslado a tu domicilio.</p>
          <div className="mt-8 overflow-hidden rounded-card bg-white shadow-card">
            {PRICES.map(([name, price, time]) => (
              <div key={name} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0">
                <span className="flex-1 font-bold">{name}</span>
                <span className="hidden text-sm text-muted sm:block">{time}</span>
                <span className="text-lg font-extrabold">{price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROS */}
      <section id="profesionales" className="relative overflow-hidden bg-navy pb-20 pt-32 text-white">
        <div className="pointer-events-none absolute -right-24 top-6 h-10 w-[520px] -rotate-[6deg] bg-rosa" />
        <div className="pointer-events-none absolute -right-24 top-[62px] h-6 w-[460px] -rotate-[6deg] bg-brand" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-rosa">Para profesionales</p>
            <h2 className="mt-3 text-[2.4rem] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl">Consigue clientes cerca de ti</h2>
            <p className="mt-5 max-w-[40ch] text-lg text-white/75">
              Crea tu perfil gratis, sube fotos de tus trabajos y recibe solicitudes de tu zona. Sin mensualidad: solo pagas un 10% cuando consigues un trabajo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ElegantLink to="/registro?pro=1&next=/pro/alta" variant="rosa">
                Quiero ofrecer mis servicios
              </ElegantLink>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Wallet, t: 'Cobro garantizado', d: 'El cliente paga antes. Tú recibes el 90% al terminar.' },
              { icon: MapPin, t: 'Clientes de tu zona', d: 'Eliges hasta cuántos km te desplazas.' },
              { icon: Star, t: 'Tu reputación suma', d: 'Cada reseña te sube en las búsquedas.' },
              { icon: MessageCircle, t: 'Todo en un lugar', d: 'Chat, agenda y pagos desde el celular.' },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="rounded-card bg-white/[0.07] p-5 ring-1 ring-white/10">
                <Icon className="size-6 text-rosa" />
                <p className="mt-3 font-extrabold">{t}</p>
                <p className="mt-1 text-sm text-white/70">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-[2.3rem] font-extrabold tracking-[-0.045em] sm:text-5xl">Preguntas frecuentes</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold">
                {q}
                <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-[36ch] text-white/70">La forma fácil de encontrar y contratar servicios a domicilio cerca de ti.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <AppStoreBadge onClick={() => void install('ios')} className="bg-white/10 hover:bg-white/15" />
              <GooglePlayBadge onClick={() => void install('android')} className="bg-white/10 hover:bg-white/15" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2.5">
              <p className="font-extrabold">App</p>
              <Link to="/app" className="block text-white/70 hover:text-white">Buscar servicios</Link>
              <Link to="/registro" className="block text-white/70 hover:text-white">Crear cuenta</Link>
              <Link to="/login" className="block text-white/70 hover:text-white">Entrar</Link>
            </div>
            <div className="space-y-2.5">
              <p className="font-extrabold">Profesionales</p>
              <Link to="/registro?pro=1&next=/pro/alta" className="block text-white/70 hover:text-white">Ofrecer servicios</Link>
              <Link to="/negocio" className="block text-white/70 hover:text-white">Modelo de negocio</Link>
              <a href="#preguntas" className="block text-white/70 hover:text-white">Preguntas</a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-white/50 sm:px-6">
            <span className="flex items-center gap-2">
              <LogoMark className="size-5" /> {APP_NAME} · Proyecto de emprendimiento 2026 · Santiago de Chile
            </span>
            <span>Fotos: Unsplash · Mapas: © Esri, © OpenStreetMap</span>
          </div>
        </div>
      </footer>
      {sheet}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-extrabold tracking-tight">{value}</dd>
      <dd className="text-sm font-semibold text-muted">{label}</dd>
    </div>
  )
}
