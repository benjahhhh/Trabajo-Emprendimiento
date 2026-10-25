import { BadgeCheck, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { useCategories } from '../hooks/useCategories'
import { cn } from '../lib/cn'
import { fmtDistance, fmtMoney } from '../lib/format'
import { img } from '../lib/images'
import type { ProviderResult } from '../lib/types'
import { Avatar } from './Avatar'
import { CategoryBadge } from './CategoryIcon'
import { Rating } from './Rating'

export function Verified({ className }: { className?: string }) {
  return <BadgeCheck className={cn('size-[18px] shrink-0 fill-brand text-white', className)} aria-label="Verificado" />
}

// Fila de resultado de búsqueda
export function ProviderRow({ p, rank }: { p: ProviderResult; rank?: number }) {
  return (
    <Link to={`/app/p/${p.id}`} className="flex gap-3.5 rounded-card border border-line bg-white p-3.5 shadow-card transition active:scale-[0.99]">
      <div className="relative">
        <Avatar src={p.avatar_url} name={p.display_name} size="lg" square online={p.available} />
        {rank !== undefined && rank < 3 && (
          <span className="absolute -left-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-rosa text-[11px] font-extrabold text-navy ring-2 ring-white">
            {rank + 1}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-[15px] font-extrabold tracking-tight">{p.display_name}</h3>
          {p.verified && <Verified />}
        </div>
        <p className="truncate text-[13px] text-muted">{p.headline}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          <Rating value={p.rating_avg} count={p.rating_count} className="text-[13px]" />
          <span className="inline-flex items-center gap-1 font-semibold text-muted">
            <MapPin className="size-3.5" />
            {fmtDistance(p.distance_km)}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between text-right">
        <span className="text-[11px] font-semibold text-muted">desde</span>
        <span className="text-[15px] font-extrabold">{fmtMoney(p.price_from)}</span>
      </div>
    </Link>
  )
}

// Tarjeta horizontal para carruseles
export function ProviderTile({ p }: { p: ProviderResult }) {
  const { byId } = useCategories()
  const cat = byId(p.category_id)
  return (
    <Link to={`/app/p/${p.id}`} className="w-[228px] shrink-0 snap-start overflow-hidden rounded-card border border-line bg-white shadow-card transition active:scale-[0.98]">
      <div className="relative h-28 bg-ice">
        {p.cover_url && <img src={img(p.cover_url, 460, 224)} alt="" loading="lazy" className="size-full object-cover" />}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold backdrop-blur">
          {fmtDistance(p.distance_km)}
        </span>
        {cat && <CategoryBadge category={cat} size="sm" className="absolute right-2.5 top-2.5 ring-2 ring-white" />}
      </div>
      <div className="relative px-3 pb-3 pt-7">
        <Avatar src={p.avatar_url} name={p.display_name} size="md" className="absolute -top-6 left-3 ring-[3px] ring-white" online={p.available} />
        <div className="flex items-center gap-1">
          <h3 className="truncate text-[15px] font-extrabold tracking-tight">{p.display_name}</h3>
          {p.verified && <Verified className="size-4" />}
        </div>
        <p className="truncate text-xs text-muted">{p.headline}</p>
        <div className="mt-2 flex items-center justify-between">
          <Rating value={p.rating_avg} count={p.rating_count} className="text-[13px]" />
          <span className="text-[13px] font-extrabold">{fmtMoney(p.price_from)}</span>
        </div>
      </div>
    </Link>
  )
}

export function ProviderRowSkeleton() {
  return (
    <div className="flex gap-3.5 rounded-card border border-line bg-white p-3.5">
      <div className="skeleton size-16 rounded-2xl" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
    </div>
  )
}
