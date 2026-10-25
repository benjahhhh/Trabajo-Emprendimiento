import { BriefcaseBusiness, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ElegantButton } from '../components/Buttons'
import { useToast } from '../context/ToastContext'
import { cn } from '../lib/cn'
import { errorMessage, supabase } from '../lib/supabase'
import { AuthLayout } from './AuthLayout'

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const next = params.get('next') || '/app'
  const [role, setRole] = useState<'client' | 'pro'>(params.get('pro') ? 'pro' : 'client')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim(), phone: phone.trim() }, emailRedirectTo: `${window.location.origin}/app` },
    })
    setBusy(false)
    if (error) return setError(errorMessage(error))
    if (!data.session) return setSent(true)
    toast({ kind: 'success', title: `¡Bienvenido, ${name.trim().split(' ')[0]}!` })
    navigate(role === 'pro' ? '/pro/alta' : next, { replace: true })
  }

  if (sent)
    return (
      <AuthLayout title="Revisa tu correo" subtitle={`Te enviamos un enlace a ${email} para activar tu cuenta.`}>
        <Link to="/login" className="font-extrabold text-brand">
          Volver a entrar
        </Link>
      </AuthLayout>
    )

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Gratis. Encuentra profesionales o consigue clientes cerca de ti.">
      <div className="mb-5 grid grid-cols-2 gap-2">
        {(
          [
            { v: 'client', icon: UserRound, t: 'Busco servicios' },
            { v: 'pro', icon: BriefcaseBusiness, t: 'Ofrezco servicios' },
          ] as const
        ).map(({ v, icon: Icon, t }) => (
          <button
            key={v}
            type="button"
            onClick={() => setRole(v)}
            aria-pressed={role === v}
            className={cn('flex flex-col items-start gap-2 rounded-2xl border-2 p-3.5 text-left transition', role === v ? 'border-brand bg-ice/40' : 'border-line')}
          >
            <Icon className={cn('size-5', role === v ? 'text-brand' : 'text-muted')} />
            <span className="text-sm font-extrabold">{t}</span>
          </button>
        ))}
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="name">Nombre y apellido</label>
          <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" placeholder="Martina López" />
        </div>
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="tu@correo.cl" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Teléfono (opcional)</label>
          <input id="phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+56 9 1234 5678" />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
        <ElegantButton type="submit" variant="blue" block loading={busy}>
          {role === 'pro' ? 'Crear cuenta y continuar' : 'Crear cuenta'}
        </ElegantButton>
        <p className="text-center text-xs text-muted">Al crear tu cuenta aceptas los términos de uso y la política de privacidad.</p>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-extrabold text-brand">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
