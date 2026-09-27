export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Diners Club' | 'Discover' | 'Tarjeta'

export function cardBrand(num: string): CardBrand {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'American Express'
  if (/^3(0[0-5]|[68])/.test(n)) return 'Diners Club'
  if (/^6(011|5)/.test(n)) return 'Discover'
  return 'Tarjeta'
}

export const cardLength = (brand: CardBrand) => (brand === 'American Express' ? 15 : brand === 'Diners Club' ? 14 : 16)

export function formatCardNumber(raw: string) {
  const brand = cardBrand(raw)
  const n = raw.replace(/\D/g, '').slice(0, cardLength(brand))
  if (brand === 'American Express') return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ')
  if (brand === 'Diners Club') return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 14)].filter(Boolean).join(' ')
  return n.replace(/(.{4})/g, '$1 ').trim()
}

export function formatExpiry(raw: string) {
  const n = raw.replace(/\D/g, '').slice(0, 4)
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n
}

// Validación de formato (pago simulado: no se comprueba con ningún banco)
export function validateCard(c: { number: string; name: string; expiry: string; cvc: string }) {
  const errors: Partial<Record<'number' | 'name' | 'expiry' | 'cvc', string>> = {}
  const brand = cardBrand(c.number)
  const digits = c.number.replace(/\D/g, '')
  if (digits.length !== cardLength(brand)) errors.number = 'Número incompleto'
  if (c.name.trim().length < 3) errors.name = 'Escribe el nombre del titular'
  const [mm, yy] = c.expiry.split('/').map((x) => parseInt(x, 10))
  const now = new Date()
  const expDate = new Date(2000 + (yy || 0), mm || 0, 0, 23, 59)
  if (!mm || mm < 1 || mm > 12 || !yy) errors.expiry = 'Fecha no válida'
  else if (expDate < now) errors.expiry = 'Tarjeta vencida'
  const cvcLen = brand === 'American Express' ? 4 : 3
  if (c.cvc.replace(/\D/g, '').length !== cvcLen) errors.cvc = `${cvcLen} dígitos`
  return errors
}
