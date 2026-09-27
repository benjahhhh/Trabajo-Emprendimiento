import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ElegantButton } from '../../components/Buttons'
import { TopBar } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { COMUNAS } from '../../lib/geo'
import { errorMessage, supabase } from '../../lib/supabase'

export default function EditProfile() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, profile, refresh } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [comuna, setComuna] = useState(profile?.comuna ?? '')
  const [saving, setSaving] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() || null, comuna: comuna || null })
      .eq('id', user!.id)
    setSaving(false)
    if (error) toast({ kind: 'error', title: errorMessage(error) })
    else {
      await refresh()
      toast({ kind: 'success', title: 'Perfil guardado' })
      navigate(-1)
    }
  }

  return (
    <div>
      <TopBar title="Editar perfil" />
      <form onSubmit={save} className="space-y-4 px-4 pt-5">
        <div>
          <label className="label" htmlFor="name">Nombre y apellido</label>
          <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input id="email" className="field bg-mist text-muted" value={user?.email ?? ''} disabled />
        </div>
        <div>
          <label className="label" htmlFor="phone">Teléfono</label>
          <input id="phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 1234 5678" inputMode="tel" autoComplete="tel" />
          <p className="mt-1 text-xs text-muted">Solo lo verá el profesional cuando acepte tu reserva.</p>
        </div>
        <div>
          <label className="label" htmlFor="comuna">Comuna</label>
          <select id="comuna" className="field" value={comuna} onChange={(e) => setComuna(e.target.value)}>
            <option value="">Elige tu comuna</option>
            {Object.keys(COMUNAS).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <ElegantButton type="submit" variant="blue" block loading={saving}>
          Guardar cambios
        </ElegantButton>
      </form>
    </div>
  )
}
