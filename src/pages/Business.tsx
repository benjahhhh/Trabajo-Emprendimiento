import { CalendarClock, CreditCard, Handshake, LocateFixed, Minus, Plus, RefreshCw, ShieldCheck, Wallet } from 'lucide-react'
import { useState } from 'react'
import { ElegantButton } from '../components/Buttons'
import { BarList, ColumnChart, DataTable, type Datum } from '../components/Charts'
import { PageLoader, TopBar } from '../components/ui'
import { APP_NAME } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLocation2 } from '../context/LocationContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { fmtMoney } from '../lib/format'
import { errorMessage, supabase } from '../lib/supabase'
import type { PlatformStats } from '../lib/types'

const compactMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} M` : n >= 1000 ? `$${Math.round(n / 1000).toLocaleString('es-CL')} mil` : fmtMoney(n)
const axisMoney = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))

export default function Business() {
  const toast = useToast()
  const { profile } = useAuth()
  const { coords, locate } = useLocation2()
  const [busy, setBusy] = useState<string | null>(null)
  const [tableDaily, setTableDaily] = useState(false)
  const [tableCats, setTableCats] = useState(false)

  const stats = useAsync(async () => {
    const { data, error } = await supabase.rpc('platform_stats')
    if (error) throw error
    return data as PlatformStats
  }, [])

  if (stats.error)
    return (
      <>
        <TopBar title="Modelo de negocio" />
        <p className="p-6 text-center text-muted">{errorMessage(stats.error)}</p>
      </>
    )
  if (!stats.data) return <PageLoader />
  const s = stats.data
  const rate = Number(s.commission_rate)
  const pct = Math.round(rate * 100)

  const daily: Datum[] = s.daily.map((d) => {
    const date = new Date(`${d.day}T12:00:00`)
    return {
      key: d.day,
      label: String(date.getDate()),
      detail: date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }),
      value: Number(d.commission),
    }
  })
  const cats = [...s.by_category].sort((a, b) => b.gmv - a.gmv)
  const top = cats.slice(0, 7)
  const restGmv = cats.slice(7).reduce((sum, c) => sum + Number(c.gmv), 0)
  const catData: Datum[] = [...top.map((c) => ({ key: c.id, label: c.name, value: Number(c.gmv) })), ...(restGmv ? [{ key: 'otras', label: `Otras (${cats.length - 7})`, value: restGmv }] : [])]
  const cancelRate = s.bookings_total ? Math.round((s.bookings_cancelled / s.bookings_total) * 100) : 0

  const admin = async (key: string, fn: () => PromiseLike<{ error: unknown; data?: unknown }>, ok: string) => {
    setBusy(key)
    const { error } = await fn()
    setBusy(null)
    if (error) toast({ kind: 'error', title: errorMessage(error) })
    else {
      toast({ kind: 'success', title: ok })
      void stats.reload(true)
    }
  }

  return (
    <div className="pb-12">
      <TopBar title="Modelo de negocio" />
      <div className="space-y-5 px-4 pt-4">
        <section className="relative overflow-hidden rounded-card bg-navy p-5 pb-12 text-white">
          <div className="absolute -right-10 bottom-5 h-7 w-52 -rotate-[6deg] bg-rosa" />
          <div className="absolute -right-8 -bottom-1 h-5 w-48 -rotate-[6deg] bg-brand" />
          <p className="relative text-sm font-bold text-white/70">Comisiones ganadas por {APP_NAME}</p>
          <p className="relative mt-1 text-[3.1rem] font-extrabold leading-none tracking-[-0.04em]">{fmtMoney(s.commission_earned)}</p>
          <p className="relative mt-2 text-sm text-white/75">
            {pct}% de {fmtMoney(s.gmv_completed)} en trabajos completados · {fmtMoney(s.commission_pending)} más en reservas en curso
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Tile label="Volumen transaccionado" value={compactMoney(s.gmv)} note="pagos procesados en la app" />
          <Tile label="Ticket medio" value={fmtMoney(s.avg_ticket)} note="por trabajo completado" />
          <Tile label="Trabajos completados" value={s.bookings_completed.toLocaleString('es-CL')} note={`${s.bookings_active} en curso ahora`} />
          <Tile label="Pagado a profesionales" value={compactMoney(s.paid_to_providers)} note={`el ${100 - pct}% de cada trabajo`} />
          <Tile label="Usuarios" value={s.users.toLocaleString('es-CL')} note={`${s.real_providers} profesionales registrados`} />
          <Tile label="Cancelaciones" value={`${cancelRate}%`} note="reembolsadas al cliente" />
        </section>

        <section className="rounded-card border border-line p-4">
          <h2 className="font-extrabold">Así se reparte cada pago</h2>
          <p className="text-sm text-muted">Ejemplo con un servicio de {fmtMoney(10000)}</p>
          <div className="mt-4 flex h-3.5 overflow-hidden rounded-full bg-ice">
            <div className="h-full rounded-r-[4px] bg-brand" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="flex items-center gap-1.5 font-bold text-muted">
                <span className="size-2.5 rounded-full bg-brand" /> {APP_NAME} ({pct}%)
              </p>
              <p className="text-lg font-extrabold">{fmtMoney(10000 * rate)}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-bold text-muted">
                <span className="size-2.5 rounded-full bg-ice ring-1 ring-brand/30" /> Profesional ({100 - pct}%)
              </p>
              <p className="text-lg font-extrabold">{fmtMoney(10000 * (1 - rate))}</p>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-line p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-extrabold">Comisión por día</h2>
              <p className="text-sm text-muted">Últimos 14 días · trabajos completados</p>
            </div>
            <button onClick={() => setTableDaily(!tableDaily)} className="shrink-0 text-sm font-bold text-brand">
              {tableDaily ? 'Ver gráfica' : 'Ver tabla'}
            </button>
          </div>
          {tableDaily ? (
            <DataTable headers={['Día', 'Trabajos', 'Volumen', 'Comisión']} rows={s.daily.map((d, i) => [daily[i].detail ?? d.day, d.bookings, fmtMoney(d.gmv), fmtMoney(d.commission)])} />
          ) : (
            <ColumnChart data={daily} format={fmtMoney} formatAxis={axisMoney} ariaLabel="Comisión diaria de los últimos 14 días" />
          )}
        </section>

        <section className="rounded-card border border-line p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-extrabold">Volumen por categoría</h2>
              <p className="text-sm text-muted">Pagos de trabajos completados</p>
            </div>
            <button onClick={() => setTableCats(!tableCats)} className="shrink-0 text-sm font-bold text-brand">
              {tableCats ? 'Ver gráfica' : 'Ver tabla'}
            </button>
          </div>
          {tableCats ? (
            <DataTable headers={['Categoría', 'Trabajos', 'Volumen', 'Comisión']} rows={cats.map((c) => [c.name, c.bookings, fmtMoney(c.gmv), fmtMoney(c.commission)])} />
          ) : (
            <BarList data={catData} format={compactMoney} />
          )}
        </section>

        <section className="rounded-card bg-mist p-4">
          <h2 className="font-extrabold">Cómo gana dinero {APP_NAME}</h2>
          <ol className="mt-3 space-y-3">
            {[
              { icon: CreditCard, t: 'El cliente paga en la app', d: 'Reserva y paga con tarjeta el precio publicado.' },
              { icon: ShieldCheck, t: 'El dinero queda retenido', d: 'Protege al cliente: si el profesional no acepta, se devuelve entero.' },
              { icon: Handshake, t: 'Trabajo hecho, pago liberado', d: `El profesional recibe el ${100 - pct}% y ${APP_NAME} cobra un ${pct}% por conseguirle el cliente.` },
              { icon: Wallet, t: 'Sin mensualidad', d: 'El profesional solo paga cuando gana. Así es fácil sumar oferta.' },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-bold">{t}</span>
                  <span className="block text-sm text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {profile?.is_admin && (
          <section className="rounded-card border-2 border-dashed border-brand/40 p-4">
            <h2 className="font-extrabold">Controles de administrador</h2>
            <p className="text-sm text-muted">Para la presentación en vivo.</p>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-mist p-3">
              <span className="font-bold">Comisión</span>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Bajar comisión"
                  disabled={!!busy || pct <= 5}
                  onClick={() => void admin('rate', () => supabase.rpc('admin_set_commission', { p_rate: (pct - 1) / 100 }), `Comisión: ${pct - 1}%`)}
                  className="grid size-9 place-items-center rounded-full bg-white shadow-sm disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-12 text-center text-lg font-extrabold">{pct}%</span>
                <button
                  aria-label="Subir comisión"
                  disabled={!!busy || pct >= 30}
                  onClick={() => void admin('rate', () => supabase.rpc('admin_set_commission', { p_rate: (pct + 1) / 100 }), `Comisión: ${pct + 1}%`)}
                  className="grid size-9 place-items-center rounded-full bg-white shadow-sm disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2.5">
              <ElegantButton
                size="sm"
                variant="light"
                loading={busy === 'move'}
                onClick={async () => {
                  const c = (await locate()) ?? coords
                  void admin('move', () => supabase.rpc('relocate_demo_providers', { p_lat: c.lat, p_lng: c.lng }), 'Profesionales demo movidos a tu zona')
                }}
              >
                <LocateFixed className="size-4" /> Traer profesionales demo a mi ubicación
              </ElegantButton>
              <ElegantButton size="sm" variant="light" loading={busy === 'refresh'} onClick={() => void admin('refresh', () => supabase.rpc('admin_refresh_demo'), 'Datos demo actualizados a hoy')}>
                <RefreshCw className="size-4" /> Actualizar fechas de los datos demo
              </ElegantButton>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <CalendarClock className="size-4" /> Solo afecta a los datos de ejemplo.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-card border border-line p-3.5">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 text-[1.35rem] font-extrabold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted">{note}</p>
    </div>
  )
}
