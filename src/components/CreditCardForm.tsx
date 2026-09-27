import { LockKeyhole, ShieldCheck, Wand2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TEST_CARD } from '../config'
import { cardBrand, formatCardNumber, formatExpiry, validateCard, type CardBrand } from '../lib/card'
import { cn } from '../lib/cn'
import { fmtMoney } from '../lib/format'
import { ElegantButton } from './Buttons'

export type CardResult = { brand: CardBrand; last4: string; holder: string }

function BrandMark({ brand }: { brand: CardBrand }) {
  if (brand === 'Mastercard')
    return (
      <span className="flex">
        <span className="size-7 rounded-full bg-[#eb001b]" />
        <span className="-ml-3 size-7 rounded-full bg-[#f79e1b] mix-blend-screen" />
      </span>
    )
  if (brand === 'Visa') return <span className="text-2xl font-black italic tracking-tighter">VISA</span>
  if (brand === 'American Express') return <span className="rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-black text-[#2e77bc]">AMEX</span>
  if (brand === 'Tarjeta') return <span className="text-sm font-bold opacity-80">Crédito · Débito</span>
  return <span className="text-sm font-black">{brand}</span>
}

// Formulario de pago con tarjeta animada. El pago es simulado: nunca se envía ni guarda el número completo.
export function CreditCardForm({ amount, onPay, loading }: { amount: number; onPay: (card: CardResult) => void; loading?: boolean }) {
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [focus, setFocus] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const brand = cardBrand(number)
  const errors = useMemo(() => validateCard({ number, name, expiry, cvc }), [number, name, expiry, cvc])
  const valid = Object.keys(errors).length === 0

  const fillTest = () => {
    setNumber(TEST_CARD.number)
    setName(TEST_CARD.name)
    setExpiry(TEST_CARD.expiry)
    setCvc(TEST_CARD.cvc)
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!valid) return
    onPay({ brand, last4: number.replace(/\D/g, '').slice(-4), holder: name.trim() })
  }
  const shownNumber = (number || '•••• •••• •••• ••••').padEnd(19, '•')
  const err = (k: keyof typeof errors) => submitted && errors[k]

  return (
    <form onSubmit={submit} noValidate>
      <div className="card-3d mx-auto w-full max-w-[360px]">
        <div className={cn('card-3d__inner aspect-[1.586]', focus === 'cvc' && 'is-flipped')}>
          <div className="card-3d__face bg-[linear-gradient(135deg,#081B3A_0%,#11295a_45%,#025FFB_100%)] p-5 text-white shadow-[0_18px_40px_-16px_rgb(2_95_251/0.7)]">
            <div className="absolute -right-10 -top-12 size-44 rounded-full bg-rosa/40 blur-2xl" />
            <div className="absolute -bottom-16 left-10 size-40 rounded-full bg-brand/50 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="h-9 w-12 rounded-md bg-[linear-gradient(135deg,#f6d27a,#c9a13b)] shadow-inner" />
                <BrandMark brand={brand} />
              </div>
              <p className={cn('font-mono text-[1.28rem] tracking-[0.12em] transition', focus === 'number' && 'text-rosa')}>{shownNumber}</p>
              <div className="flex items-end justify-between gap-3 text-[11px] uppercase">
                <div className="min-w-0">
                  <p className="opacity-60">Titular</p>
                  <p className={cn('truncate text-sm font-bold tracking-wide', focus === 'name' && 'text-rosa')}>{name || 'NOMBRE APELLIDO'}</p>
                </div>
                <div className="text-right">
                  <p className="opacity-60">Vence</p>
                  <p className={cn('text-sm font-bold', focus === 'expiry' && 'text-rosa')}>{expiry || 'MM/AA'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card-3d__face card-3d__back bg-[linear-gradient(135deg,#11295a,#081B3A)] text-white">
            <div className="mt-6 h-11 bg-black/80" />
            <div className="mx-5 mt-5 flex items-center justify-end rounded bg-white px-3 py-2 font-mono text-navy">
              <span className="mr-auto h-3 w-2/3 rounded bg-[repeating-linear-gradient(90deg,#d1e2ff_0_6px,#fff_6px_12px)]" />
              {cvc || '•••'}
            </div>
            <p className="mx-5 mt-3 text-right text-[10px] opacity-70">Código de seguridad</p>
          </div>
        </div>
      </div>

      <button type="button" onClick={fillTest} className="mx-auto mt-4 flex items-center gap-1.5 rounded-full bg-ice px-3.5 py-2 text-[13px] font-bold text-brand transition active:scale-95">
        <Wand2 className="size-4" /> Usar tarjeta de prueba
      </button>

      <div className="mt-5 space-y-3.5">
        <div>
          <label className="label" htmlFor="cc-number">Número de tarjeta</label>
          <input
            id="cc-number"
            className={cn('field font-mono tracking-wider', err('number') && 'border-danger')}
            inputMode="numeric"
            autoComplete="off"
            placeholder="1234 5678 9012 3456"
            value={number}
            onFocus={() => setFocus('number')}
            onBlur={() => setFocus(null)}
            onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          />
          {err('number') && <p className="mt-1 text-xs font-semibold text-danger">{errors.number}</p>}
        </div>
        <div>
          <label className="label" htmlFor="cc-name">Nombre del titular</label>
          <input
            id="cc-name"
            className={cn('field uppercase', err('name') && 'border-danger')}
            autoComplete="off"
            placeholder="Como aparece en la tarjeta"
            value={name}
            onFocus={() => setFocus('name')}
            onBlur={() => setFocus(null)}
            onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 26))}
          />
          {err('name') && <p className="mt-1 text-xs font-semibold text-danger">{errors.name}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="cc-exp">Vencimiento</label>
            <input
              id="cc-exp"
              className={cn('field font-mono', err('expiry') && 'border-danger')}
              inputMode="numeric"
              autoComplete="off"
              placeholder="MM/AA"
              value={expiry}
              onFocus={() => setFocus('expiry')}
              onBlur={() => setFocus(null)}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            />
            {err('expiry') && <p className="mt-1 text-xs font-semibold text-danger">{errors.expiry}</p>}
          </div>
          <div>
            <label className="label" htmlFor="cc-cvc">CVC</label>
            <input
              id="cc-cvc"
              className={cn('field font-mono', err('cvc') && 'border-danger')}
              inputMode="numeric"
              autoComplete="off"
              placeholder={brand === 'American Express' ? '1234' : '123'}
              value={cvc}
              onFocus={() => setFocus('cvc')}
              onBlur={() => setFocus(null)}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, brand === 'American Express' ? 4 : 3))}
            />
            {err('cvc') && <p className="mt-1 text-xs font-semibold text-danger">{errors.cvc}</p>}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-mist p-3.5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ok" />
        <p className="text-[13px] leading-snug text-muted">
          <b className="text-navy">Pago protegido.</b> El dinero queda retenido hasta que confirmes que el trabajo está hecho. Si el profesional no acepta, se devuelve completo.
        </p>
      </div>

      <ElegantButton type="submit" variant="blue" block className="mt-5" loading={loading}>
        <LockKeyhole className="size-4" /> Pagar {fmtMoney(amount)}
      </ElegantButton>
      <p className="mt-3 text-center text-[11px] text-muted">Entorno de demostración: no se realizan cargos reales.</p>
    </form>
  )
}
