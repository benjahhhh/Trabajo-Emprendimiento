import { Clock, Pencil, Plus, Tag, Trash } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router'
import { ElegantButton } from '../../components/Buttons'
import { EmptyState, PageLoader, Sheet, Toggle, TopBar } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { cn } from '../../lib/cn'
import { fmtMoney } from '../../lib/format'
import { errorMessage, supabase } from '../../lib/supabase'
import type { Service } from '../../lib/types'

type Draft = { id?: string; title: string; description: string; price: string; duration_min: number; active: boolean }
const EMPTY: Draft = { title: '', description: '', price: '', duration_min: 60, active: true }
const DURATIONS = [15, 20, 30, 45, 60, 90, 120, 180, 240, 300]

export default function ProServices() {
  const toast = useToast()
  const { provider, refresh } = useAuth()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  const list = useAsync(async () => {
    if (!provider) return []
    const { data } = await supabase.from('services').select('*').eq('provider_id', provider.id).order('created_at')
    return (data ?? []) as Service[]
  }, [provider?.id])

  if (!provider) return <Navigate to="/pro/alta" replace />
  if (!list.data) return <PageLoader />

  const save = async () => {
    if (!draft) return
    const row = { title: draft.title.trim(), description: draft.description.trim(), price: Math.round(Number(draft.price)), duration_min: draft.duration_min, active: draft.active }
    if (row.title.length < 2 || !(row.price > 0)) return toast({ kind: 'error', title: 'Completa nombre y precio' })
    setSaving(true)
    const { error } = draft.id
      ? await supabase.from('services').update(row).eq('id', draft.id)
      : await supabase.from('services').insert({ ...row, provider_id: provider.id })
    setSaving(false)
    if (error) return toast({ kind: 'error', title: errorMessage(error) })
    setDraft(null)
    toast({ kind: 'success', title: 'Servicio guardado' })
    void list.reload(true)
    void refresh()
  }

  const remove = async (s: Service) => {
    if (!window.confirm(`¿Eliminar «${s.title}»?`)) return
    const { error } = await supabase.from('services').delete().eq('id', s.id)
    if (error) toast({ kind: 'error', title: errorMessage(error) })
    else {
      void list.reload(true)
      void refresh()
    }
  }

  return (
    <div className="pb-10">
      <TopBar
        title="Mis servicios"
        right={
          <button onClick={() => setDraft(EMPTY)} className="grid size-10 place-items-center rounded-full bg-brand text-white" aria-label="Nuevo servicio">
            <Plus className="size-5" />
          </button>
        }
      />
      <div className="space-y-3 px-4 pt-4">
        {list.data.length === 0 ? (
          <EmptyState icon={<Tag className="size-8" />} title="Aún no tienes servicios" action={<ElegantButton onClick={() => setDraft(EMPTY)}>Crear servicio</ElegantButton>} />
        ) : (
          list.data.map((s) => (
            <div key={s.id} className={cn('rounded-card border border-line p-4', !s.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-extrabold">{s.title}</p>
                  {s.description && <p className="text-sm text-muted">{s.description}</p>}
                  <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-muted">
                    <Clock className="size-3.5" /> {s.duration_min} min {!s.active && '· oculto'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold">{fmtMoney(s.price)}</p>
                  <p className="text-[11px] text-muted">recibes {fmtMoney(Math.round(s.price * 0.9))}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <ElegantButton size="sm" variant="light" className="flex-1" onClick={() => setDraft({ ...s, price: String(s.price) })}>
                  <Pencil className="size-4" /> Editar
                </ElegantButton>
                <ElegantButton size="sm" variant="danger" onClick={() => void remove(s)} aria-label="Eliminar">
                  <Trash className="size-4" />
                </ElegantButton>
              </div>
            </div>
          ))
        )}
      </div>

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Editar servicio' : 'Nuevo servicio'}>
        {draft && (
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="t">Nombre</label>
              <input id="t" className="field" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={80} placeholder="Ej: Corte + barba" />
            </div>
            <div>
              <label className="label" htmlFor="d">Descripción</label>
              <textarea id="d" className="field min-h-20 resize-none" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={300} placeholder="Qué incluye" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="p">Precio (CLP)</label>
                <input id="p" type="number" min={500} step={500} inputMode="numeric" className="field" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="m">Duración</label>
                <select id="m" className="field" value={draft.duration_min} onChange={(e) => setDraft({ ...draft, duration_min: Number(e.target.value) })}>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d < 60 ? `${d} min` : `${d / 60} h`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-mist p-3.5">
              <span className="font-bold">Visible para clientes</span>
              <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} label="Visible" />
            </div>
            <ElegantButton variant="blue" block loading={saving} onClick={() => void save()}>
              Guardar
            </ElegantButton>
          </div>
        )}
      </Sheet>
    </div>
  )
}
