import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ElegantButton } from '../components/Buttons'
import { DEMO_ACCOUNTS } from '../config'
import { useToast } from '../context/ToastContext'
import { errorMessage, supabase } from '../lib/supabase'
import { AuthLayout } from './AuthLayout'

export default function Login() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const next = params.get('next') || '/app'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const login = async (mail: string, pass: string, key: string) => {
    setBusy(key)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: mail.trim(), password: pass })
    setBusy(null)
    if (error) setError(errorMessage(error))
    else {
      toast({ kind: 'success', title: '¡Hola de nuevo!' })
      navigate(next, { replace: true })
    }
  }

  return (
    <AuthLayout title="Hola de nuevo" subtitle="Entra para reservar, chatear y seguir tus trabajos.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void login(email, password, 'form')
        }}
      >
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder="tu@correo.cl" />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required minLength={6} placeholder="••••••••" />
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
        <ElegantButton type="submit" variant="blue" block loading={busy === 'form'}>
          Entrar
        </ElegantButton>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        ¿No tienes cuenta?{' '}
        <Link to={`/registro?next=${encodeURIComponent(next)}`} className="font-extrabold text-brand">
          Créala gratis
        </Link>
      </p>
      <div className="mt-8 rounded-card border border-dashed border-line p-4">
        <p className="text-sm font-extrabold">Modo presentación</p>
        <p className="text-xs text-muted">Cuentas de ejemplo para enseñar la app en clase.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ElegantButton size="sm" variant="light" loading={busy === 'client'} onClick={() => void login(DEMO_ACCOUNTS.client.email, DEMO_ACCOUNTS.client.password, 'client')}>
            Cliente demo
          </ElegantButton>
          <ElegantButton size="sm" variant="light" loading={busy === 'pro'} onClick={() => void login(DEMO_ACCOUNTS.pro.email, DEMO_ACCOUNTS.pro.password, 'pro')}>
            Profesional demo
          </ElegantButton>
        </div>
      </div>
    </AuthLayout>
  )
}
