import { ChevronLeft } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { cn } from '../lib/cn'

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block size-6 animate-spin rounded-full border-[3px] border-brand border-t-transparent', className)} />
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner />
    </div>
  )
}

export function TopBar({ title, back = true, right, transparent, onBack }: { title?: ReactNode; back?: boolean; right?: ReactNode; transparent?: boolean; onBack?: () => void }) {
  const navigate = useNavigate()
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center gap-2 px-3 pb-2 pt-[max(env(safe-area-inset-top),10px)]',
        transparent ? 'bg-transparent' : 'border-b border-line/70 bg-white/90 backdrop-blur-md',
      )}
    >
      {back && (
        <button
          aria-label="Volver"
          onClick={() => (onBack ? onBack() : window.history.length > 1 ? navigate(-1) : navigate('/app'))}
          className="grid size-10 place-items-center rounded-full text-navy transition hover:bg-mist active:scale-90"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}
      <h1 className={cn('min-w-0 flex-1 truncate text-[1.05rem] font-extrabold tracking-tight', !back && 'pl-2 text-xl')}>{title}</h1>
      {right}
    </header>
  )
}

export function Sheet({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[1500] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn('animate-sheet relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 shadow-2xl', className)}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
        {title && <h2 className="mb-4 text-xl font-extrabold tracking-tight">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-3xl bg-ice text-brand">{icon}</div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-4">
      <h2 className="text-[1.2rem] font-extrabold tracking-[-0.03em]">{title}</h2>
      {action}
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cn('flex rounded-full bg-mist p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition',
            value === o.value ? 'bg-white text-navy shadow-sm' : 'text-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-ok' : 'bg-line')}
    >
      <span className={cn('absolute top-1 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-6' : 'left-1')} />
    </button>
  )
}
