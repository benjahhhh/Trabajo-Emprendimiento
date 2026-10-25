import { Camera, LocateFixed } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { ElegantButton } from '../../components/Buttons'
import { PageLoader, TopBar } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useLocation2 } from '../../context/LocationContext'
import { useToast } from '../../context/ToastContext'
import { useCategories } from '../../hooks/useCategories'
import { COMUNAS, type LatLng } from '../../lib/geo'
import { img } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'
import { uploadImage } from '../app/Profile'

export default function ProProfileEdit() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, provider, refresh } = useAuth()
  const { locate } = useLocation2()
  const { categories } = useCategories()
  const [form, setForm] = useState(() => (provider ? { ...provider } : null))
  const [phone, setPhone] = useState('')
  const [point, setPoint] = useState<LatLng | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!provider) return
    void supabase
      .from('provider_private')
      .select('phone')
      .eq('provider_id', provider.id)
      .maybeSingle()
      .then(({ data }) => setPhone(data?.phone ?? ''))
  }, [provider])

  if (!provider) return <Navigate to="/pro/alta" replace />
  if (!form) return <PageLoader />
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v })

  const upload = async (kind: 'avatar' | 'cover', file?: File) => {
    if (!file || !user) return
    setUploading(kind)
    try {
      const url = await uploadImage(user.id, file, kind)
      set(kind === 'avatar' ? 'avatar_url' : 'cover_url', url)
    } catch (e) {
      toast({ kind: 'error', title: 'No se pudo subir la imagen', body: errorMessage(e) })
    } finally {
      setUploading(null)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const comunaChanged = form.comuna !== provider.comuna
    const base = point ?? (comunaChanged ? COMUNAS[form.comuna] : null)
    const [p, pp] = await Promise.all([
      supabase
        .from('providers')
        .update({
          display_name: form.display_name.trim(),
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          category_id: form.category_id,
          comuna: form.comuna,
          service_radius_km: form.service_radius_km,
          years_experience: form.years_experience,
          available: form.available,
          avatar_url: form.avatar_url,
          cover_url: form.cover_url,
          ...(base ? { lat: base.lat, lng: base.lng } : {}),
        })
        .eq('id', provider.id),
      supabase.from('provider_private').upsert({ provider_id: provider.id, phone: phone.trim() }),
    ])
    setSaving(false)
    const error = p.error ?? pp.error
    if (error) return toast({ kind: 'error', title: errorMessage(error) })
    await refresh()
    toast({ kind: 'success', title: 'Perfil actualizado' })
    navigate('/pro')
  }

  return (
    <div className="pb-10">
      <TopBar title="Editar perfil profesional" />
      <form onSubmit={save}>
        <div className="relative h-40 bg-ice">
          {form.cover_url && <img src={img(form.cover_url, 640, 320)} alt="" className="size-full object-cover" />}
          <button type="button" onClick={() => coverRef.current?.click()} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold shadow">
            <Camera className="size-4" /> {uploading === 'cover' ? 'Subiendo…' : 'Cambiar portada'}
          </button>
          <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => void upload('cover', e.target.files?.[0])} />
        </div>
        <div className="-mt-10 px-4">
          <button type="button" onClick={() => avatarRef.current?.click()} className="relative" aria-label="Cambiar foto">
            <Avatar src={img(form.avatar_url, 200)} name={form.display_name} size="xl" className="ring-4 ring-white" />
            <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-brand text-white ring-[3px] ring-white">
              {uploading === 'avatar' ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="size-4" />}
            </span>
          </button>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={(e) => void upload('avatar', e.target.files?.[0])} />
        </div>
        <div className="space-y-4 px-4 pt-4">
          <div>
            <label className="label" htmlFor="dn">Nombre público</label>
            <input id="dn" className="field" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} maxLength={60} required />
          </div>
          <div>
            <label className="label" htmlFor="hl">Frase corta</label>
            <input id="hl" className="field" value={form.headline} onChange={(e) => set('headline', e.target.value)} maxLength={70} />
          </div>
          <div>
            <label className="label" htmlFor="bio">Sobre ti</label>
            <textarea id="bio" className="field min-h-28 resize-none" value={form.bio} onChange={(e) => set('bio', e.target.value)} maxLength={600} />
          </div>
          <div>
            <label className="label" htmlFor="cat">Categoría</label>
            <select id="cat" className="field" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="com">Comuna</label>
              <select id="com" className="field" value={form.comuna} onChange={(e) => set('comuna', e.target.value)}>
                {Object.keys(COMUNAS).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="yrs">Años de experiencia</label>
              <input id="yrs" type="number" min={0} max={60} className="field" value={form.years_experience} onChange={(e) => set('years_experience', Number(e.target.value))} />
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const c = await locate()
              if (c) setPoint(c)
            }}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand"
          >
            <LocateFixed className="size-4" /> {point ? 'Ubicación exacta lista ✓' : 'Actualizar a mi ubicación exacta'}
          </button>
          <div>
            <label className="label" htmlFor="rad">
              Atiendo hasta <b className="text-navy">{form.service_radius_km} km</b>
            </label>
            <input id="rad" type="range" min={2} max={30} value={form.service_radius_km} onChange={(e) => set('service_radius_km', Number(e.target.value))} className="w-full accent-brand" />
          </div>
          <div>
            <label className="label" htmlFor="tel">Teléfono de contacto (privado)</label>
            <input id="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+56 9 1234 5678" />
            <p className="mt-1 text-xs text-muted">El cliente lo ve solo cuando aceptas su reserva.</p>
          </div>
          <ElegantButton type="submit" variant="blue" block loading={saving}>
            Guardar perfil
          </ElegantButton>
        </div>
      </form>
    </div>
  )
}
