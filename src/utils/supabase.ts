import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey)
}

export function getSupabaseConfigError(): string {
  return 'Supabase n’est pas configuré. Les données de démonstration restent actives tant que `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` ne sont pas définies.'
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl as string, supabaseKey as string)
  : null
