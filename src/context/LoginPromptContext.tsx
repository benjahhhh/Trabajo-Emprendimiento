import { LockKeyhole } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { ElegantLink } from '../components/Buttons'
import { Sheet } from '../components/ui'
import { useAuth } from './AuthContext'

type Ctx = { requireLogin: (reason?: string) => boolean }
const LoginPromptContext = createContext<Ctx | null>(null)

export function LoginPromptProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const [reason, setReason] = useState<string | null>(null)
  const requireLogin = useCallback(
    (r?: string) => {
      if (user) return true
      setReason(r ?? 'Crea una cuenta gratis para continuar.')
      return false
    },
    [user],
  )
  const value = useMemo(() => ({ requireLogin }), [requireLogin])
  const next = encodeURIComponent(location.pathname + location.search)
  return (
    <LoginPromptContext.Provider value={value}>
      {children}
      <Sheet open={reason !== null} onClose={() => setReason(null)}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-ice text-brand">
            <LockKeyhole className="size-7" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Entra para continuar</h2>
          <p className="mt-1 max-w-xs text-sm text-muted">{reason}</p>
          <div className="mt-5 grid w-full gap-2.5">
            <ElegantLink to={`/registro?next=${next}`} variant="blue" block onClick={() => setReason(null)}>
              Crear cuenta gratis
            </ElegantLink>
            <ElegantLink to={`/login?next=${next}`} variant="light" block onClick={() => setReason(null)}>
              Ya tengo cuenta
            </ElegantLink>
          </div>
        </div>
      </Sheet>
    </LoginPromptContext.Provider>
  )
}

export function useRequireLogin() {
  const ctx = useContext(LoginPromptContext)
  if (!ctx) throw new Error('useRequireLogin fuera de LoginPromptProvider')
  return ctx.requireLogin
}
