import {
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  Camera,
  ChevronRight,
  Download,
  Heart,
  Info,
  LogOut,
  Pencil,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { ElegantButton, ElegantLink } from '../../components/Buttons'
import { useInstall } from '../../components/InstallSheet'
import { Logo } from '../../components/Logo'
import { TopBar } from '../../components/ui'
import { APP_NAME, DEMO_ACCOUNTS } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { compressImage } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'

export async function uploadImage(userId: string, file: File, prefix: string) {
  const blob = await compressImage(file)
  const path = `${userId}/${prefix}-${Date.now()}.jpg`
  const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

export default function Profile() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, profile, provider, signOut, refresh } = useAuth()
  const { install, sheet } = useInstall()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [demoBusy, setDemoBusy] = useState<string | null>(null)

  const demoLogin = async (kind: 'client' | 'pro') => {
    setDemoBusy(kind)
    const { error } = await supabase.auth.signInWithPassword({ email: DEMO_ACCOUNTS[kind].email, password: DEMO_ACCOUNTS[kind].password })
    setDemoBusy(null)
    if (error) toast({ kind: 'error', title: errorMessage(error) })
    else toast({ kind: 'success', title: `Entraste como ${DEMO_ACCOUNTS[kind].label.toLowerCase()}` })
  }

  if (!user)
    return (
      <div>
        <TopBar title="Perfil" back={false} />
        <div className="px-4 pt-4">
          <div className="relative overflow-hidden rounded-card bg-navy p-6 text-white">
            <div className="absolute -right-8 top-4 h-7 w-40 -rotate-[8deg] bg-rosa" />
            <div className="absolute -right-8 top-[42px] h-4 w-36 -rotate-[8deg] bg-brand" />
            <Logo light className="relative" />
            <h2 className="relative mt-5 max-w-[16ch] text-[1.6rem] font-extrabold leading-tight tracking-tight">Reserva, chatea y paga seguro</h2>
            <p className="relative mt-1.5 text-sm text-white/75">Crea tu cuenta gratis en 30 segundos.</p>
            <div className="relative mt-5 grid gap-2.5">
              <ElegantLink to="/registro?next=/app/perfil" variant="blue" block>
                Crear cuenta
              </ElegantLink>
              <ElegantLink to="/login?next=/app/perfil" variant="light" block>
                Ya tengo cuenta
              </ElegantLink>
            </div>
          </div>
          <div className="mt-4 rounded-card border border-line p-4">
            <p className="font-extrabold">Modo presentación</p>
            <p className="mt-0.5 text-sm text-muted">Entra con una cuenta de ejemplo para enseñar la app.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ElegantButton size="sm" variant="light" loading={demoBusy === 'client'} onClick={() => void demoLogin('client')}>
                Cliente demo
              </ElegantButton>
              <ElegantButton size="sm" variant="light" loading={demoBusy === 'pro'} onClick={() => void demoLogin('pro')}>
                Profesional demo
              </ElegantButton>
            </div>
          </div>
          <Menu
            items={[
              { icon: Download, label: 'Instalar la app', onClick: () => void install() },
              { icon: Info, label: `Cómo funciona ${APP_NAME}`, to: '/' },
            ]}
          />
        </div>
        {sheet}
      </div>
    )

  const onAvatar = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(user.id, file, 'avatar')
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      if (error) throw error
      await refresh()
      toast({ kind: 'success', title: 'Foto actualizada' })
    } catch (e) {
      toast({ kind: 'error', title: 'No se pudo subir la foto', body: errorMessage(e) })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="pb-8">
      <TopBar title="Perfil" back={false} />
      <div className="px-4 pt-5">
        <div className="flex items-center gap-4">
          <button onClick={() => fileRef.current?.click()} className="relative" aria-label="Cambiar foto">
            <Avatar src={profile?.avatar_url} name={profile?.full_name || user.email || '?'} size="xl" />
            <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-brand text-white ring-[3px] ring-white">
              {uploading ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="size-4" />}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onAvatar(e.target.files?.[0])} />
          <div className="min-w-0">
            <h1 className="truncate text-[1.5rem] font-extrabold tracking-tight">{profile?.full_name || 'Tu perfil'}</h1>
            <p className="truncate text-sm text-muted">{user.email}</p>
            {profile?.comuna && <p className="text-sm font-semibold text-muted">{profile.comuna}</p>}
          </div>
        </div>

        {provider ? (
          <Link to="/pro" className="mt-6 flex items-center gap-4 rounded-card bg-navy p-4 text-white">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
              <BriefcaseBusiness className="size-6 text-rosa" />
            </span>
            <span className="flex-1">
              <span className="block font-extrabold">Panel profesional</span>
              <span className="block text-sm text-white/70">Solicitudes, agenda y ganancias</span>
            </span>
            <ChevronRight className="size-5" />
          </Link>
        ) : (
          <Link to="/pro/alta" className="relative mt-6 block overflow-hidden rounded-card bg-rosa p-5 text-navy">
            <div className="absolute -right-6 bottom-4 h-6 w-32 -rotate-[8deg] bg-white/40" />
            <p className="relative text-xs font-extrabold uppercase tracking-[0.14em]">¿Tienes un oficio?</p>
            <p className="relative mt-1 max-w-[18ch] text-xl font-extrabold leading-tight tracking-tight">Ofrece tus servicios y consigue clientes cerca</p>
            <p className="relative mt-3 inline-flex items-center gap-1 text-sm font-extrabold">
              Empezar gratis <ChevronRight className="size-4" />
            </p>
          </Link>
        )}

        <Menu
          items={[
            { icon: Pencil, label: 'Editar perfil', to: '/app/perfil/editar' },
            { icon: CalendarDays, label: 'Mis reservas', to: '/app/reservas' },
            { icon: Heart, label: 'Profesionales guardados', to: '/app/guardados' },
            { icon: BellRing, label: 'Notificaciones', to: '/app/notificaciones' },
            { icon: BarChart3, label: 'Modelo de negocio', to: '/negocio' },
            { icon: Download, label: 'Instalar la app', onClick: () => void install() },
            { icon: Info, label: `Cómo funciona ${APP_NAME}`, to: '/' },
          ]}
        />
        <ElegantButton
          variant="danger"
          block
          className="mt-6"
          onClick={async () => {
            await signOut()
            navigate('/app')
          }}
        >
          <LogOut className="size-4" /> Cerrar sesión
        </ElegantButton>
        <p className="mt-6 text-center text-xs text-muted">{APP_NAME} · Proyecto de emprendimiento 2026</p>
      </div>
      {sheet}
    </div>
  )
}

type Item = { icon: LucideIcon; label: string; to?: string; onClick?: () => void }
function Menu({ items }: { items: Item[] }) {
  return (
    <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line">
      {items.map(({ icon: Icon, label, to, onClick }) => {
        const inner = (
          <>
            <span className="grid size-9 place-items-center rounded-xl bg-mist text-navy">
              <Icon className="size-[18px]" />
            </span>
            <span className="flex-1 font-bold">{label}</span>
            <ChevronRight className="size-5 text-muted" />
          </>
        )
        return (
          <li key={label}>
            {to ? (
              <Link to={to} className="flex items-center gap-3 px-4 py-3 transition active:bg-mist">
                {inner}
              </Link>
            ) : (
              <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-mist">
                {inner}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
