import { Check, LocateFixed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ElegantButton } from '../../components/Buttons'
import { CategoryBadge } from '../../components/CategoryIcon'
import { TopBar } from '../../components/ui'
import { APP_NAME } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useLocation2 } from '../../context/LocationContext'
import { useToast } from '../../context/ToastContext'
import { useCategories } from '../../hooks/useCategories'
import { cn } from '../../lib/cn'
import { CATEGORY_COVERS } from '../../lib/covers'
import { COMUNAS, type LatLng } from '../../lib/geo'
import { errorMessage, supabase } from '../../lib/supabase'

const DURATIONS = [30, 45, 60, 90, 120, 180, 240]

export default function ProOnboarding() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, profile, provider, refresh } = useAuth()
  const { locate } = useLocation2()
  const { categories } = useCategories()
  const [cat, setCat] = useState('')
  const [displayName, setDisplayName] = useState(profile?.full_name ?? '')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [comuna, setComuna] = useState(profile?.comuna ?? 'Providencia')
  const [gps, setGps] = useState<LatLng | null>(null)
  const [radius, setRadius] = useState(10)
  const [years, setYears] = useState(3)
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [svcTitle, setSvcTitle] = useState('')
  const [svcPrice, setSvcPrice] = useState('')
  const [svcDuration, setSvcDuration] = useState(60)
  const [saving, setSaving] = useState(false)

  // El perfil llega un instante después del registro: rellena los datos cuando esté
  useEffect(() => {
    if (!profile) return
    setDisplayName((d) => d || profile.full_name)
    setPhone((p) => p || profile.phone || '')
    if (profile.comuna) setComuna((c) => (c === 'Providencia' ? profile.comuna! : c))
  }, [profile])

  if (provider) return <Navigate to="/pro" replace />

  const valid = cat && displayName.trim().length >= 2 && headline.trim().length >= 4 && svcTitle.trim().length >= 2 && Number(svcPrice) > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !user) return
    setSaving(true)
    try {
      const base = gps ?? COMUNAS[comuna] ?? COMUNAS.Providencia
      // si no usa GPS, se ubica cerca del centro de su comuna
      const point = gps ?? { lat: base.lat + (Math.random() - 0.5) * 0.01, lng: base.lng + (Math.random() - 0.5) * 0.01 }
      const { data: p, error } = await supabase
        .from('providers')
        .insert({
          user_id: user.id,
          category_id: cat,
          display_name: displayName.trim(),
          headline: headline.trim(),
          bio: bio.trim(),
          avatar_url: profile?.avatar_url ?? null,
          cover_url: CATEGORY_COVERS[cat] ?? null,
          comuna,
          lat: point.lat,
          lng: point.lng,
          service_radius_km: radius,
          years_experience: years,
          available: true,
        })
        .select()
        .single()
      if (error) throw error
      const [pp, s] = await Promise.all([
        supabase.from('provider_private').upsert({ provider_id: p.id, phone: phone.trim() }),
        supabase.from('services').insert({ provider_id: p.id, title: svcTitle.trim(), price: Math.round(Number(svcPrice)), duration_min: svcDuration }),
      ])
      if (pp.error) throw pp.error
      if (s.error) throw s.error
      await refresh()
      toast({ kind: 'success', title: '¡Ya eres profesional!', body: 'Tu perfil ya aparece en las búsquedas cercanas.' })
      navigate('/pro', { replace: true })
    } catch (err) {
      toast({ kind: 'error', title: 'No se pudo crear tu perfil', body: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-10">
      <TopBar title="Ofrecer mis servicios" />
      <form onSubmit={submit} className="space-y-7 px-4 pt-4">
        <div className="relative overflow-hidden rounded-card bg-navy p-5 pb-10 text-white">
          <div className="absolute -right-8 bottom-4 h-6 w-36 -rotate-[8deg] bg-rosa" />
          <p className="relative text-xs font-extrabold uppercase tracking-[0.14em] text-rosa">Sin mensualidad</p>
          <p className="relative mt-1 max-w-[22ch] text-xl font-extrabold leading-tight">Solo pagas un 10% cuando {APP_NAME} te consigue un trabajo.</p>
          <p className="relative mt-2 text-sm text-white/75">El cliente paga en la app y recibes el resto al terminar.</p>
        </div>

        <section>
          <h2 className="mb-3 font-extrabold">1 · ¿Qué ofreces?</h2>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cn('relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2 text-center transition', cat === c.id ? 'border-brand bg-ice/40' : 'border-transparent')}
              >
                <CategoryBadge category={c} />
                <span className="text-[11px] font-bold leading-tight">{c.name}</span>
                {cat === c.id && (
                  <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-brand text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-extrabold">2 · Tu perfil público</h2>
          <div>
            <label className="label" htmlFor="dn">Nombre que verán los clientes</label>
            <input id="dn" className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ej: Barber Nico" maxLength={60} />
          </div>
          <div>
            <label className="label" htmlFor="hl">Frase corta</label>
            <input id="hl" className="field" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Ej: Cortes y barba a domicilio" maxLength={70} />
          </div>
          <div>
            <label className="label" htmlFor="bio">Sobre ti</label>
            <textarea id="bio" className="field min-h-24 resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tu experiencia, qué incluye tu servicio, herramientas…" maxLength={600} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="yrs">Años de experiencia</label>
              <input id="yrs" type="number" min={0} max={60} className="field" value={years} onChange={(e) => setYears(Number(e.target.value))} />
            </div>
            <div>
              <label className="label" htmlFor="tel">Teléfono (privado)</label>
              <input id="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9…" inputMode="tel" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-extrabold">3 · ¿Dónde trabajas?</h2>
          <div>
            <label className="label" htmlFor="com">Comuna base</label>
            <select id="com" className="field" value={comuna} onChange={(e) => setComuna(e.target.value)}>
              {Object.keys(COMUNAS).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                const c = await locate()
                if (c) setGps(c)
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand"
            >
              <LocateFixed className="size-4" /> {gps ? 'Ubicación exacta guardada ✓' : 'Usar mi ubicación exacta'}
            </button>
          </div>
          <div>
            <label className="label" htmlFor="rad">
              Atiendo hasta <b className="text-navy">{radius} km</b> a la redonda
            </label>
            <input id="rad" type="range" min={2} max={30} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-brand" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-extrabold">4 · Tu primer servicio</h2>
          <div>
            <label className="label" htmlFor="st">Nombre del servicio</label>
            <input id="st" className="field" value={svcTitle} onChange={(e) => setSvcTitle(e.target.value)} placeholder="Ej: Corte a domicilio" maxLength={80} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="sp">Precio (CLP)</label>
              <input id="sp" type="number" min={500} step={500} className="field" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} placeholder="12000" inputMode="numeric" />
            </div>
            <div>
              <label className="label" htmlFor="sd">Duración</label>
              <select id="sd" className="field" value={svcDuration} onChange={(e) => setSvcDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d < 60 ? `${d} min` : `${d / 60} h`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {Number(svcPrice) > 0 && (
            <p className="rounded-2xl bg-mist p-3 text-sm">
              Por cada reserva de <b>${Number(svcPrice).toLocaleString('es-CL')}</b> recibirás <b className="text-ok">${Math.round(Number(svcPrice) * 0.9).toLocaleString('es-CL')}</b> (comisión 10%).
            </p>
          )}
        </section>

        <ElegantButton type="submit" variant="blue" block disabled={!valid} loading={saving}>
          Publicar mi perfil
        </ElegantButton>
      </form>
    </div>
  )
}
