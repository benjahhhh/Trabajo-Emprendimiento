import { ArrowRight, BriefcaseBusiness, LocateFixed, MapPin, Search as SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BellButton } from '../../components/BellButton'
import { CategoryBadge } from '../../components/CategoryIcon'
import { Logo } from '../../components/Logo'
import { PostCard } from '../../components/PostCard'
import { ProviderTile } from '../../components/ProviderCard'
import { SectionTitle, Sheet } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useLocation2 } from '../../context/LocationContext'
import { useRequireLogin } from '../../context/LoginPromptContext'
import { useRealtime } from '../../context/RealtimeContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { useCategories } from '../../hooks/useCategories'
import { firstName } from '../../lib/format'
import { requestNotifications } from '../../lib/notify'
import { supabase } from '../../lib/supabase'
import type { Category, Post, ProviderResult } from '../../lib/types'

const QUICK = ['Corte de pasto', 'Cambio de aceite', 'Barbero', 'Gásfiter', 'Manicure', 'Paseo de perros', 'Electricista']

export default function Home() {
  const navigate = useNavigate()
  const toast = useToast()
  const requireLogin = useRequireLogin()
  const { user, profile, provider } = useAuth()
  const { coords, label, source, status, locate } = useLocation2()
  const { unreadNotifications, ringKey } = useRealtime()
  const { categories } = useCategories()
  const [q, setQ] = useState('')
  const [allCats, setAllCats] = useState(false)

  const nearby = useAsync(async () => {
    const { data } = await supabase.rpc('search_providers', { p_lat: coords.lat, p_lng: coords.lng, p_sort: 'distance', p_limit: 10 })
    return (data ?? []) as ProviderResult[]
  }, [coords.lat, coords.lng])

  const top = useAsync(async () => {
    const { data } = await supabase.rpc('search_providers', { p_lat: coords.lat, p_lng: coords.lng, p_sort: 'rating', p_limit: 10 })
    return (data ?? []) as ProviderResult[]
  }, [coords.lat, coords.lng])

  const feed = useAsync(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, provider:providers(id, display_name, avatar_url, category_id, comuna, verified)')
      .order('created_at', { ascending: false })
      .limit(8)
    const posts = (data ?? []) as Post[]
    let liked = new Set<string>()
    if (user && posts.length) {
      const { data: l } = await supabase.from('post_likes').select('post_id').in('post_id', posts.map((p) => p.id))
      liked = new Set((l ?? []).map((x) => x.post_id as string))
    }
    return { posts, liked }
  }, [user?.id])

  const pending = useAsync(async () => {
    if (!provider) return 0
    const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('provider_id', provider.id).eq('status', 'pending')
    return count ?? 0
  }, [provider?.id])

  const toggleLike = async (post: Post) => {
    if (!requireLogin('Crea una cuenta para dar me gusta y guardar a tus profesionales favoritos.') || !feed.data) return
    const liked = feed.data.liked.has(post.id)
    const next = new Set(feed.data.liked)
    if (liked) next.delete(post.id)
    else next.add(post.id)
    feed.setData({
      liked: next,
      posts: feed.data.posts.map((p) => (p.id === post.id ? { ...p, likes_count: p.likes_count + (liked ? -1 : 1) } : p)),
    })
    const res = liked
      ? await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user!.id)
      : await supabase.from('post_likes').insert({ post_id: post.id, user_id: user!.id })
    if (res.error) void feed.reload(true)
  }

  const onBell = async () => {
    if (!requireLogin('Entra para ver tus avisos: solicitudes aceptadas, pagos y mensajes.')) return
    await requestNotifications()
    navigate('/app/notificaciones')
  }

  const onLocate = async () => {
    const c = await locate()
    if (!c) toast({ kind: 'error', title: 'No pudimos obtener tu ubicación', body: 'Activa el permiso de ubicación en tu navegador. Mientras, usamos Santiago centro.' })
  }

  const search = (text: string) => navigate(`/app/buscar?q=${encodeURIComponent(text)}`)

  return (
    <div>
      <header className="slant-bottom relative overflow-hidden bg-navy px-4 pb-14 pt-[max(env(safe-area-inset-top),14px)] text-white">
        <div className="pointer-events-none absolute -right-10 top-[128px] h-8 w-44 -rotate-[8deg] bg-rosa" />
        <div className="pointer-events-none absolute -right-8 top-[160px] h-5 w-40 -rotate-[8deg] bg-brand" />
        <div className="relative flex items-center justify-between">
          <Logo light />
          <BellButton light count={unreadNotifications} ringKey={ringKey} onClick={onBell} />
        </div>
        <div className="relative mt-6">
          <p className="text-[15px] font-semibold text-white/70">Hola{user ? `, ${firstName(profile?.full_name)}` : ''} 👋</p>
          <h1 className="mt-1 max-w-[12ch] text-[2rem] font-extrabold leading-[1.05] tracking-[-0.045em]">¿Qué servicio necesitas hoy?</h1>
          <button
            onClick={onLocate}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-bold ring-1 ring-white/15 transition active:scale-95"
          >
            {status === 'locating' ? <LocateFixed className="size-4 animate-pulse" /> : <MapPin className="size-4 text-rosa" />}
            {status === 'locating' ? 'Buscando tu ubicación…' : label}
            {source === 'default' && status !== 'locating' && <span className="text-white/60">· usar mi ubicación</span>}
          </button>
        </div>
        <form
          className="relative mt-5"
          onSubmit={(e) => {
            e.preventDefault()
            search(q.trim())
          }}
        >
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej: cortar el pasto, cambio de aceite…"
            enterKeyHint="search"
            className="h-14 w-full rounded-2xl bg-white pl-12 pr-14 text-[16px] font-medium text-navy shadow-card outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-brand/30"
          />
          <button aria-label="Buscar" className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl bg-brand text-white transition active:scale-90">
            <ArrowRight className="size-5" />
          </button>
        </form>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {QUICK.map((t) => (
            <button key={t} onClick={() => search(t)} className="shrink-0 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold ring-1 ring-white/15 transition active:scale-95">
              {t}
            </button>
          ))}
        </div>
      </header>

      {provider && !!pending.data && (
        <Link to="/pro" className="animate-fade-up mx-4 -mt-6 mb-2 flex items-center gap-3 rounded-card bg-rosa p-4 text-navy shadow-card">
          <BriefcaseBusiness className="size-6" />
          <span className="flex-1 text-[15px] font-extrabold">
            Tienes {pending.data} {pending.data === 1 ? 'solicitud nueva' : 'solicitudes nuevas'}
          </span>
          <ArrowRight className="size-5" />
        </Link>
      )}

      <section className="mt-4 px-4">
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {(categories.length ? categories.slice(0, 7) : Array.from({ length: 7 }, (): Category | null => null)).map((c, i) =>
            c ? (
              <Link key={c.id} to={`/app/buscar?cat=${c.id}`} className="flex flex-col items-center gap-1.5 text-center transition active:scale-95">
                <CategoryBadge category={c} size="lg" />
                <span className="text-[12px] font-bold leading-tight">{c.name}</span>
              </Link>
            ) : (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="skeleton size-16 rounded-2xl" />
                <div className="skeleton h-3 w-12 rounded" />
              </div>
            ),
          )}
          <button onClick={() => setAllCats(true)} className="flex flex-col items-center gap-1.5 text-center transition active:scale-95">
            <span className="grid size-16 place-items-center rounded-2xl border-2 border-dashed border-line text-sm font-extrabold text-muted">+{Math.max(categories.length - 7, 0)}</span>
            <span className="text-[12px] font-bold leading-tight">Ver todas</span>
          </button>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle
          title="Cerca de ti"
          action={
            <Link to="/app/buscar?sort=distance&view=map" className="text-sm font-bold text-brand">
              Ver mapa
            </Link>
          }
        />
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {nearby.loading && !nearby.data
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-[216px] w-[228px] shrink-0 rounded-card" />)
            : nearby.data?.map((p) => <ProviderTile key={p.id} p={p} />)}
        </div>
      </section>

      <section className="mt-6 px-4">
        <Link to={provider ? '/pro' : '/pro/alta'} className="relative block overflow-hidden rounded-card bg-navy p-5 text-white">
          <div className="absolute -right-8 bottom-10 h-8 w-40 -rotate-[8deg] bg-rosa" />
          <div className="absolute -right-6 bottom-4 h-4 w-36 -rotate-[8deg] bg-brand" />
          <p className="relative text-xs font-extrabold uppercase tracking-[0.14em] text-rosa">Para profesionales</p>
          <h3 className="relative mt-1.5 max-w-[15ch] text-[1.45rem] font-extrabold leading-tight tracking-tight">
            {provider ? 'Gestiona tus solicitudes y ganancias' : 'Consigue clientes cerca de ti'}
          </h3>
          <p className="relative mt-1.5 max-w-[30ch] text-sm text-white/75">
            {provider ? 'Tu panel con agenda, pagos y reseñas.' : 'Sin mensualidad: solo pagas un 10% cuando consigues un trabajo.'}
          </p>
          <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold">
            {provider ? 'Ir a mi panel' : 'Ofrecer mis servicios'} <ArrowRight className="size-4" />
          </span>
        </Link>
      </section>

      <section className="mt-8">
        <SectionTitle
          title="Mejor valorados"
          action={
            <Link to="/app/buscar?sort=rating" className="text-sm font-bold text-brand">
              Ver todos
            </Link>
          }
        />
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {top.loading && !top.data
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-[216px] w-[228px] shrink-0 rounded-card" />)
            : top.data?.map((p) => <ProviderTile key={p.id} p={p} />)}
        </div>
      </section>

      <section className="mt-8 pb-4">
        <SectionTitle title="Trabajos recientes" />
        <div className="space-y-4 px-4">
          {feed.loading && !feed.data
            ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-80 rounded-card" />)
            : feed.data?.posts.map((p) => <PostCard key={p.id} post={p} liked={feed.data!.liked.has(p.id)} onLike={() => void toggleLike(p)} />)}
        </div>
      </section>

      <Sheet open={allCats} onClose={() => setAllCats(false)} title="Todas las categorías">
        <div className="grid grid-cols-4 gap-x-2 gap-y-5 pb-2">
          {categories.map((c) => (
            <Link key={c.id} to={`/app/buscar?cat=${c.id}`} onClick={() => setAllCats(false)} className="flex flex-col items-center gap-1.5 text-center">
              <CategoryBadge category={c} size="lg" />
              <span className="text-[12px] font-bold leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
