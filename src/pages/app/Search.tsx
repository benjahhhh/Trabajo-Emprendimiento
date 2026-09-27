import { List, LocateFixed, Map as MapIcon, Search as SearchIcon, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ElegantButton } from '../../components/Buttons'
import { MapView } from '../../components/MapView'
import { ProviderRow, ProviderRowSkeleton } from '../../components/ProviderCard'
import { EmptyState, Segmented, Sheet, Toggle } from '../../components/ui'
import { useLocation2 } from '../../context/LocationContext'
import { useAsync } from '../../hooks/useAsync'
import { useCategories } from '../../hooks/useCategories'
import { cn } from '../../lib/cn'
import { fmtRating } from '../../lib/format'
import { img } from '../../lib/images'
import { supabase } from '../../lib/supabase'
import type { ProviderResult } from '../../lib/types'

type Sort = 'recommended' | 'distance' | 'rating' | 'price'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'recommended', label: 'Recomendados' },
  { value: 'distance', label: 'Más cercanos' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'price', label: 'Menor precio' },
]
const DISTANCES = [2, 5, 10, 20]
const RATINGS = [4, 4.5, 4.8]

export default function Search() {
  const [params, setParams] = useSearchParams()
  const { categories, byId } = useCategories()
  const { coords, label, source, locate, status } = useLocation2()
  const q = params.get('q') ?? ''
  const cat = params.get('cat') ?? ''
  const sort = (params.get('sort') as Sort) || 'recommended'
  const view = params.get('view') === 'map' ? 'map' : 'list'
  const maxKm = params.get('km') ? Number(params.get('km')) : null
  const minRating = params.get('min') ? Number(params.get('min')) : null
  const nowOnly = params.get('now') === '1'
  const [text, setText] = useState(q)
  const [selected, setSelected] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const catRow = useRef<HTMLDivElement>(null)

  const update = (patch: Record<string, string | number | null>) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v === null || v === '') n.delete(k)
          else n.set(k, String(v))
        }
        return n
      },
      { replace: true },
    )

  useEffect(() => setText(q), [q])
  useEffect(() => {
    if (text === q) return
    const t = setTimeout(() => update({ q: text.trim() || null }), 380)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  // Lleva a la vista la categoría seleccionada
  useEffect(() => {
    if (!cat) return
    catRow.current?.querySelector(`[data-cat="${cat}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [cat, categories.length])

  const results = useAsync(async () => {
    const { data, error } = await supabase.rpc('search_providers', {
      p_lat: coords.lat,
      p_lng: coords.lng,
      p_query: q || null,
      p_category: cat || null,
      p_sort: sort,
      p_max_km: maxKm,
      p_min_rating: minRating,
      p_available_only: nowOnly,
      p_limit: 60,
    })
    if (error) throw error
    return (data ?? []) as ProviderResult[]
  }, [q, cat, sort, maxKm, minRating, nowOnly, coords.lat, coords.lng])

  const list = results.data ?? []
  const pins = useMemo(
    () => list.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, avatar: img(p.avatar_url, 88), name: p.display_name, tag: p.rating_count ? `★ ${fmtRating(p.rating_avg)}` : 'Nuevo' })),
    [list],
  )
  const selectedProvider = list.find((p) => p.id === selected) ?? null
  const activeFilters = (maxKm ? 1 : 0) + (minRating ? 1 : 0) + (nowOnly ? 1 : 0)
  const title = cat ? byId(cat)?.name : q ? `“${q}”` : 'Todos los servicios'

  return (
    <div className={cn(view === 'map' && 'flex h-[calc(100dvh-84px-env(safe-area-inset-bottom))] flex-col')}>
      <div className="sticky top-0 z-30 border-b border-line/70 bg-white/95 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-md">
        <div className="flex gap-2 px-4">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="¿Qué necesitas?"
              enterKeyHint="search"
              className="h-12 w-full rounded-2xl bg-mist pl-11 pr-10 text-[16px] font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-brand/40"
            />
            {text && (
              <button aria-label="Borrar" onClick={() => setText('')} className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-line/70 text-muted">
                <X className="size-4" />
              </button>
            )}
          </div>
          <button
            aria-label="Filtros"
            onClick={() => setFiltersOpen(true)}
            className={cn('relative grid size-12 place-items-center rounded-2xl transition active:scale-95', activeFilters ? 'bg-navy text-white' : 'bg-mist text-navy')}
          >
            <SlidersHorizontal className="size-5" />
            {activeFilters > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rosa text-[10px] font-extrabold text-navy ring-2 ring-white">{activeFilters}</span>}
          </button>
        </div>
        <div ref={catRow} className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
          <button className="chip" aria-pressed={!cat} onClick={() => update({ cat: null })}>
            Todas
          </button>
          {categories.map((c) => (
            <button key={c.id} data-cat={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => update({ cat: cat === c.id ? null : c.id })}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="no-scrollbar mt-2 flex gap-4 overflow-x-auto px-4 pb-2.5">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => update({ sort: s.value === 'recommended' ? null : s.value })}
              className={cn('shrink-0 border-b-2 pb-1 text-[13px] font-extrabold transition', sort === s.value ? 'border-brand text-navy' : 'border-transparent text-muted')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold">{title}</p>
          <p className="truncate text-xs text-muted">
            {results.loading ? 'Buscando…' : `${list.length} profesionales`} cerca de {label}
            {source === 'default' && (
              <button onClick={() => void locate()} className="ml-1 font-bold text-brand">
                {status === 'locating' ? '· localizando…' : '· usar mi ubicación'}
              </button>
            )}
          </p>
        </div>
        <Segmented
          className="w-[150px] shrink-0"
          value={view}
          onChange={(v) => update({ view: v === 'map' ? 'map' : null })}
          options={[
            { value: 'list', label: <><List className="size-4" /> Lista</> },
            { value: 'map', label: <><MapIcon className="size-4" /> Mapa</> },
          ]}
        />
      </div>

      {view === 'list' ? (
        <div className="space-y-3 px-4 pb-6">
          {results.loading && !results.data ? (
            Array.from({ length: 5 }).map((_, i) => <ProviderRowSkeleton key={i} />)
          ) : list.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-8" />}
              title="Sin resultados"
              body="Prueba con otra palabra (por ejemplo «pasto», «aceite» o «uñas») o quita algún filtro."
              action={
                <ElegantButton size="sm" onClick={() => setParams({}, { replace: true })}>
                  Limpiar búsqueda
                </ElegantButton>
              }
            />
          ) : (
            list.map((p, i) => <ProviderRow key={p.id} p={p} rank={sort === 'recommended' || sort === 'rating' ? i : undefined} />)
          )}
        </div>
      ) : (
        <div className="relative min-h-0 flex-1">
          <MapView center={coords} me={coords} pins={pins} selectedId={selected} onSelect={setSelected} fitToPins={!selected} zoom={13} />
          <button
            onClick={() => void locate()}
            aria-label="Mi ubicación"
            className="absolute right-3 top-3 z-[500] grid size-11 place-items-center rounded-full bg-white text-brand shadow-card active:scale-90"
          >
            <LocateFixed className={cn('size-5', status === 'locating' && 'animate-pulse')} />
          </button>
          {selectedProvider && (
            <div className="animate-fade-up absolute inset-x-3 bottom-3 z-[500]">
              <div className="relative">
                <button aria-label="Cerrar" onClick={() => setSelected(null)} className="absolute -top-3 right-2 z-10 grid size-7 place-items-center rounded-full bg-navy text-white shadow">
                  <X className="size-4" />
                </button>
                <ProviderRow p={selectedProvider} />
              </div>
            </div>
          )}
        </div>
      )}

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros">
        <p className="label">Distancia máxima</p>
        <div className="flex flex-wrap gap-2">
          <button className="chip" aria-pressed={!maxKm} onClick={() => update({ km: null })}>
            Sin límite
          </button>
          {DISTANCES.map((d) => (
            <button key={d} className="chip" aria-pressed={maxKm === d} onClick={() => update({ km: d })}>
              {d} km
            </button>
          ))}
        </div>
        <p className="label mt-5">Valoración mínima</p>
        <div className="flex flex-wrap gap-2">
          <button className="chip" aria-pressed={!minRating} onClick={() => update({ min: null })}>
            Todas
          </button>
          {RATINGS.map((r) => (
            <button key={r} className="chip" aria-pressed={minRating === r} onClick={() => update({ min: r })}>
              ★ {fmtRating(r)}+
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-mist p-4">
          <div>
            <p className="font-bold">Disponibles ahora</p>
            <p className="text-xs text-muted">Solo profesionales que atienden hoy</p>
          </div>
          <Toggle checked={nowOnly} onChange={(v) => update({ now: v ? 1 : null })} label="Disponibles ahora" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <ElegantButton variant="light" onClick={() => update({ km: null, min: null, now: null })}>
            Limpiar
          </ElegantButton>
          <ElegantButton variant="blue" onClick={() => setFiltersOpen(false)}>
            Ver {list.length}
          </ElegantButton>
        </div>
      </Sheet>
    </div>
  )
}
