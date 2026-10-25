import { Star } from 'lucide-react'
import { cn } from '../lib/cn'
import { fmtCompact, fmtRating } from '../lib/format'

export function Rating({ value, count, className, light }: { value: number; count?: number; className?: string; light?: boolean }) {
  if (count === 0)
    return <span className={cn('inline-flex items-center rounded-full bg-rosa/20 px-2 py-0.5 text-[11px] font-extrabold text-navy', className)}>Nuevo</span>
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-bold', className)}>
      <Star className="size-4 fill-star text-star" />
      {fmtRating(value)}
      {count !== undefined && <span className={cn('font-medium', light ? 'text-white/70' : 'text-muted')}>({fmtCompact(count)})</span>}
    </span>
  )
}

export function Stars({ value, size = 'md', onChange }: { value: number; size?: 'sm' | 'md' | 'lg'; onChange?: (v: number) => void }) {
  const cls = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-9' : 'size-5'
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        onChange ? (
          <button key={i} type="button" aria-label={`${i} estrellas`} onClick={() => onChange(i)} className="p-0.5 transition active:scale-90">
            <Star className={cn(cls, i <= value ? 'fill-star text-star' : 'text-line')} />
          </button>
        ) : (
          <Star key={i} className={cn(cls, i <= Math.round(value) ? 'fill-star text-star' : 'fill-line text-line')} />
        ),
      )}
    </span>
  )
}
