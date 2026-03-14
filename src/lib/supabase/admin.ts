import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Supabase client with the SERVICE_ROLE key.
 * Bypasses Row Level Security — use only in trusted server-side admin code.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local and Vercel environment variables.')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
