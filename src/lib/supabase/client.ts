import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for use in Client Components.
 * Reads/writes cookies automatically via the browser.
 *
 * Singleton pattern: instantiate once per module to avoid multiple GoTrue clients.
 *
 * Usage:
 *   const supabase = createClient()
 *   const { data } = await supabase.from('courses').select('*')
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
