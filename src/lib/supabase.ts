import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

// Traduce los errores más comunes al español
export function errorMessage(error: unknown): string {
  const msg = (error as { message?: string })?.message ?? String(error ?? '')
  if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.'
  if (/User already registered/i.test(msg)) return 'Ya existe una cuenta con ese correo.'
  if (/Password should be at least/i.test(msg)) return 'La contraseña debe tener al menos 6 caracteres.'
  if (/Unable to validate email|invalid format/i.test(msg)) return 'El correo no es válido.'
  if (/Email not confirmed/i.test(msg)) return 'Confirma tu correo antes de entrar.'
  if (/rate limit/i.test(msg)) return 'Demasiados intentos. Espera un momento.'
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'Sin conexión. Revisa tu internet.'
  if (/row-level security|permission denied/i.test(msg)) return 'No tienes permiso para hacer esto.'
  return msg || 'Algo salió mal. Inténtalo de nuevo.'
}
