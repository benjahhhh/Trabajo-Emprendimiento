import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '../lib/cn'

type Toast = { id: number; kind: 'success' | 'error' | 'info'; title: string; body?: string; link?: string }
type ToastState = { toast: (t: Omit<Toast, 'id'>) => void }

const ToastContext = createContext<ToastState | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)
  const navigate = useNavigate()

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq.current
      setToasts((list) => [...list.slice(-2), { ...t, id }])
      setTimeout(() => dismiss(id), t.kind === 'error' ? 6000 : 4200)
    },
    [dismiss],
  )
  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[2000] flex flex-col items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),12px)]">
        {toasts.map((t) => {
          const Icon = t.kind === 'success' ? CircleCheck : t.kind === 'error' ? CircleAlert : Info
          return (
            <div
              key={t.id}
              role="status"
              onClick={() => {
                if (t.link) navigate(t.link)
                dismiss(t.id)
              }}
              className={cn(
                'animate-fade-up pointer-events-auto flex w-full max-w-md cursor-pointer items-start gap-3 rounded-2xl border bg-white/95 p-3.5 shadow-card backdrop-blur',
                t.kind === 'error' ? 'border-danger/30' : 'border-line',
              )}
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', t.kind === 'success' ? 'text-ok' : t.kind === 'error' ? 'text-danger' : 'text-brand')} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug">{t.title}</p>
                {t.body && <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{t.body}</p>}
              </div>
              <button
                aria-label="Cerrar"
                className="rounded-full p-1 text-muted hover:bg-mist"
                onClick={(e) => {
                  e.stopPropagation()
                  dismiss(t.id)
                }}
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast fuera de ToastProvider')
  return ctx.toast
}
