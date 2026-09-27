import { ChevronLeft, Clock, Heart, MapPin, MessageCircle, Pencil, Share2, ShieldCheck, Star, Timer, Trophy, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { ElegantButton, ElegantLink, IconButton } from '../../components/Buttons'
import { CategoryBadge } from '../../components/CategoryIcon'
import { MapView } from '../../components/MapView'
import { Verified } from '../../components/ProviderCard'
import { Stars } from '../../components/Rating'
import { EmptyState, PageLoader, Sheet } from '../../components/ui'
import { APP_NAME } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useLocation2 } from '../../context/LocationContext'
import { useRequireLogin } from '../../context/LoginPromptContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { useCategories } from '../../hooks/useCategories'
import { cn } from '../../lib/cn'
import { fmtCompact, fmtDistance, fmtMoney, fmtRating, timeAgo } from '../../lib/format'
import { distanceKm } from '../../lib/geo'
import { img } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'
import type { Post, Provider, Review, Service } from '../../lib/types'

type Tab = 'servicios' | 'trabajos' | 'resenas' | 'info'

export default function ProviderProfile() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const requireLogin = useRequireLogin()
  const { user } = useAuth()
  const { coords } = useLocation2()
  const { byId } = useCategories()
  const [tab, setTab] = useState<Tab>('servicios')
  const [openPost, setOpenPost] = useState<Post | null>(null)
  const [busy, setBusy] = useState(false)

  const page = useAsync(async () => {
    const [p, s, posts, reviews, fav] = await Promise.all([
      supabase.from('providers').select('*').eq('id', id).maybeSingle(),
      supabase.from('services').select('*').eq('provider_id', id).eq('active', true).order('price'),
      supabase.from('posts').select('*').eq('provider_id', id).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('provider_id', id).order('created_at', { ascending: false }).limit(30),
      user ? supabase.from('favorites').select('provider_id').eq('provider_id', id).maybeSingle() : Promise.resolve({ data: null }),
    ])
    return {
      provider: p.data as Provider | null,
      services: (s.data ?? []) as Service[],
      posts: (posts.data ?? []) as Post[],
      reviews: (reviews.data ?? []) as Review[],
      favorite: !!fav.data,
    }
  }, [id, user?.id])

  const provider = page.data?.provider
  const distance = useMemo(() => (provider ? distanceKm(coords, provider) : null), [coords, provider])
  if (page.loading && !page.data) return <PageLoader />
  if (!provider)
    return (
      <EmptyState
        icon={<Users className="size-8" />}
        title="Profesional no encontrado"
        body="Puede que haya cerrado su perfil."
        action={<ElegantLink to="/app/buscar">Buscar otros</ElegantLink>}
      />
    )

  const { services, posts, reviews, favorite } = page.data!
  const cat = byId(provider.category_id)
  const isMine = !!user && provider.user_id === user.id

  const toggleFavorite = async () => {
    if (!requireLogin('Crea una cuenta para guardar a tus profesionales favoritos.')) return
    page.setData({ ...page.data!, favorite: !favorite, provider: { ...provider, followers_count: provider.followers_count + (favorite ? -1 : 1) } })
    const res = favorite
      ? await supabase.from('favorites').delete().eq('provider_id', provider.id).eq('user_id', user!.id)
      : await supabase.from('favorites').insert({ provider_id: provider.id, user_id: user!.id })
    if (res.error) void page.reload(true)
    else if (!favorite) toast({ kind: 'success', title: 'Guardado en favoritos' })
  }

  const message = async () => {
    if (!requireLogin('Crea una cuenta para chatear con los profesionales.')) return
    setBusy(true)
    const { data, error } = await supabase.rpc('start_conversation', { p_provider_id: provider.id })
    setBusy(false)
    if (error) toast({ kind: 'error', title: errorMessage(error) })
    else navigate(`/app/mensajes/${data}`)
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: `${provider.display_name} en ${APP_NAME}`, text: provider.headline, url })
      else {
        await navigator.clipboard.writeText(url)
        toast({ kind: 'success', title: 'Enlace copiado' })
      }
    } catch {
      /* cancelado */
    }
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: 'servicios', label: `Servicios` },
    { value: 'trabajos', label: `Trabajos (${posts.length})` },
    { value: 'resenas', label: `Reseñas` },
    { value: 'info', label: 'Info' },
  ]

  return (
    <div className="pb-10">
      <div className="relative h-56 bg-ice">
        {provider.cover_url && <img src={img(provider.cover_url, 640, 300)} alt="" className="size-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-transparent to-navy/30" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),12px)]">
          <IconButton label="Volver" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/app/buscar'))}>
            <ChevronLeft className="size-6" />
          </IconButton>
          <div className="flex gap-2">
            <IconButton label="Compartir" onClick={() => void share()}>
              <Share2 className="size-5" />
            </IconButton>
            {!isMine && (
              <IconButton label={favorite ? 'Quitar de guardados' : 'Guardar'} onClick={() => void toggleFavorite()}>
                <Heart className={cn('size-5 transition', favorite && 'fill-rosa text-rosa')} />
              </IconButton>
            )}
          </div>
        </div>
      </div>

      <div className="relative px-4">
        <div className="-mt-12 flex items-end justify-between">
          <Avatar src={img(provider.avatar_url, 200)} name={provider.display_name} size="xl" className="rounded-full ring-4 ring-white" />
          <span className={cn('mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold', provider.available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
            <span className={cn('size-2 rounded-full', provider.available ? 'bg-ok' : 'bg-slate-400')} />
            {provider.available ? 'Disponible hoy' : 'Agenda completa hoy'}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <h1 className="text-[1.6rem] font-extrabold leading-tight tracking-[-0.04em]">{provider.display_name}</h1>
          {provider.verified && <Verified className="size-6" />}
        </div>
        <p className="mt-0.5 text-[15px] text-muted">{provider.headline}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-bold">
          {cat && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mist py-1 pl-1 pr-3">
              <CategoryBadge category={cat} size="sm" className="size-6 rounded-full" />
              {cat.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1.5">
            <MapPin className="size-3.5" /> {provider.comuna} · {fmtDistance(distance)}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-4 divide-x divide-line rounded-card border border-line py-3 text-center">
          <Stat icon={<Star className="size-4 fill-star text-star" />} value={provider.rating_count ? fmtRating(provider.rating_avg) : 'Nuevo'} label={`${fmtCompact(provider.rating_count)} reseñas`} />
          <Stat icon={<Trophy className="size-4 text-brand" />} value={fmtCompact(provider.jobs_count)} label="trabajos" />
          <Stat icon={<Users className="size-4 text-rosa" />} value={fmtCompact(provider.followers_count)} label="seguidores" />
          <Stat icon={<Timer className="size-4 text-ok" />} value={`${provider.response_minutes}′`} label="responde" />
        </div>

        {isMine ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <ElegantLink to="/pro/perfil" variant="light">
              <Pencil className="size-4" /> Editar
            </ElegantLink>
            <ElegantLink to="/pro">Mi panel</ElegantLink>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
            <ElegantButton variant="blue" onClick={() => setTab('servicios')} disabled={!services.length}>
              {services.length ? `Reservar desde ${fmtMoney(provider.price_from)}` : 'Sin servicios aún'}
            </ElegantButton>
            <ElegantButton variant="light" onClick={() => void message()} loading={busy} aria-label="Enviar mensaje">
              <MessageCircle className="size-5" />
            </ElegantButton>
          </div>
        )}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted">
          <ShieldCheck className="size-4 text-ok" /> Pago protegido por {APP_NAME}: se libera al terminar el trabajo
        </p>
      </div>

      <div className="no-scrollbar sticky top-0 z-20 mt-5 flex gap-1 overflow-x-auto border-b border-line bg-white/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn('shrink-0 border-b-[3px] px-3 py-3 text-sm font-extrabold transition', tab === t.value ? 'border-brand text-navy' : 'border-transparent text-muted')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {tab === 'servicios' &&
          (services.length ? (
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s.id} className="rounded-card border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-extrabold leading-snug">{s.title}</h3>
                      {s.description && <p className="mt-0.5 text-sm text-muted">{s.description}</p>}
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-muted">
                        <Clock className="size-3.5" /> {s.duration_min >= 60 ? `${Math.round((s.duration_min / 60) * 10) / 10} h` : `${s.duration_min} min`}
                      </p>
                    </div>
                    <span className="shrink-0 text-lg font-extrabold">{fmtMoney(s.price)}</span>
                  </div>
                  {!isMine && (
                    <ElegantLink to={`/app/reservar/${s.id}`} size="sm" block className="mt-3">
                      Reservar y pagar
                    </ElegantLink>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Clock className="size-8" />} title="Aún no hay servicios" />
          ))}

        {tab === 'trabajos' &&
          (posts.length ? (
            <div className="grid grid-cols-3 gap-1.5">
              {posts.map((p) => (
                <button key={p.id} onClick={() => setOpenPost(p)} className="relative aspect-square overflow-hidden rounded-xl bg-ice">
                  <img src={img(p.image_url, 240, 240)} alt={p.caption} loading="lazy" className="size-full object-cover transition hover:scale-105" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Heart className="size-8" />} title="Sin publicaciones" body="Aquí aparecerán las fotos de sus trabajos." />
          ))}

        {tab === 'resenas' && (
          <div>
            <div className="mb-4 flex items-center gap-4 rounded-card bg-mist p-4">
              <p className="text-5xl font-extrabold tracking-tighter">{fmtRating(provider.rating_avg)}</p>
              <div>
                <Stars value={provider.rating_avg} />
                <p className="mt-1 text-sm text-muted">{fmtCompact(provider.rating_count)} reseñas verificadas de clientes</p>
              </div>
            </div>
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-card border border-line p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={r.author_avatar} name={r.author_name} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-extrabold">{r.author_name}</p>
                      <Stars value={r.rating} size="sm" />
                    </div>
                    <span className="text-xs text-muted">{timeAgo(r.created_at)}</span>
                  </div>
                  {r.comment && <p className="mt-2.5 text-[15px] leading-snug">{r.comment}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'info' && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-1.5 font-extrabold">Sobre mí</h3>
              <p className="text-[15px] leading-relaxed text-navy/85">{provider.bio || 'Sin descripción.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoTile label="Experiencia" value={`${provider.years_experience} ${provider.years_experience === 1 ? 'año' : 'años'}`} />
              <InfoTile label="Atiende hasta" value={`${provider.service_radius_km} km`} />
            </div>
            <div className="h-56 overflow-hidden rounded-card border border-line">
              <MapView
                center={{ lat: provider.lat, lng: provider.lng }}
                zoom={provider.service_radius_km > 12 ? 10 : 11}
                interactive={false}
                radius={{ center: { lat: provider.lat, lng: provider.lng }, km: provider.service_radius_km }}
                me={coords}
              />
            </div>
            <p className="text-xs text-muted">Zona aproximada de trabajo. La dirección exacta solo se comparte al confirmar una reserva.</p>
          </div>
        )}
      </div>

      <Sheet open={!!openPost} onClose={() => setOpenPost(null)}>
        {openPost && (
          <div>
            <img src={img(openPost.image_url, 720)} alt={openPost.caption} className="w-full rounded-2xl" />
            <p className="mt-3 text-[15px] font-semibold">{openPost.caption}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Heart className="size-4 fill-rosa text-rosa" /> {fmtCompact(openPost.likes_count)} · {timeAgo(openPost.created_at)}
            </p>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="px-1">
      <p className="flex items-center justify-center gap-1 text-[15px] font-extrabold">
        {icon}
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] font-semibold text-muted">{label}</p>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-mist p-3.5">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  )
}
