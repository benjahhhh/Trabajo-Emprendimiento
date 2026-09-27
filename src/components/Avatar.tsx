import { useState } from 'react'
import { cn } from '../lib/cn'
import { initials } from '../lib/format'

const sizes = { xs: 'size-7 text-[10px]', sm: 'size-10 text-xs', md: 'size-12 text-sm', lg: 'size-16 text-lg', xl: 'size-24 text-2xl' }

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  square,
  online,
}: {
  src?: string | null
  name: string
  size?: keyof typeof sizes
  className?: string
  square?: boolean
  online?: boolean
}) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={cn('relative inline-block shrink-0', sizes[size], className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('size-full bg-ice object-cover', square ? 'rounded-2xl' : 'rounded-full')}
        />
      ) : (
        <span className={cn('grid size-full place-items-center bg-ice font-extrabold text-navy', square ? 'rounded-2xl' : 'rounded-full')}>
          {initials(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 size-3 rounded-full border-2 border-white',
            online ? 'bg-ok' : 'bg-slate-300',
            square && '-bottom-0.5 -right-0.5',
          )}
        />
      )}
    </span>
  )
}
