// Ajustes generales de la app. Para cambiar el nombre, la ciudad o la moneda, edita este archivo.
export const APP_NAME = 'Cerca'
export const APP_TAGLINE = 'Servicios a domicilio, cerca de ti'
export const LOCALE = 'es-CL'
export const CURRENCY = 'CLP'
export const TIMEZONE = 'America/Santiago'

// Ubicación por defecto si el usuario no comparte la suya (Providencia, Santiago)
export const DEFAULT_LOCATION = { lat: -33.4314, lng: -70.6093, label: 'Santiago' }

// Supabase: se leen de las variables de entorno. La clave publicable es pública por diseño
// (los datos están protegidos con RLS), por eso hay valores por defecto del proyecto de la demo.
const env = import.meta.env
export const SUPABASE_URL: string =
  env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcmjqhjapnoqkvfcihkc.supabase.co'
export const SUPABASE_KEY: string =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_zB9x5IyyhEpIIbwLih-hnw_K0mKN1lA'

// Cuentas de demostración para presentar la app sin registrarse
export const DEMO_ACCOUNTS = {
  client: { email: 'cliente.demo@example.com', password: 'cerca-demo-2026', label: 'Cliente demo' },
  pro: { email: 'profesional.demo@example.com', password: 'cerca-demo-2026', label: 'Profesional demo' },
}

// Tarjeta de prueba (el pago es simulado: cualquier número válido de 16 dígitos sirve)
export const TEST_CARD = { number: '4242 4242 4242 4242', name: 'MARTINA LOPEZ', expiry: '12/29', cvc: '123' }
