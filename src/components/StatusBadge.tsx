import { cn } from '../lib/cn'
import type { BookingStatus } from '../lib/types'

export const STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: 'Esperando respuesta', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  accepted: { label: 'Confirmada', cls: 'bg-ice text-brand ring-brand/20' },
  completed: { label: 'Completada', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  cancelled: { label: 'Cancelada', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  rejected: { label: 'Rechazada', cls: 'bg-rose-50 text-rose-600 ring-rose-200' },
}

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const s = STATUS[status]
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1', s.cls, className)}>{s.label}</span>
}
