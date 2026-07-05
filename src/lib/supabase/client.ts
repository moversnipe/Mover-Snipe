import { createBrowserClient } from '@supabase/ssr'
import { isSupabaseConfigured } from '@/lib/supabase/config'

/**
 * Creates a Supabase client for browser-side operations.
 * Use this client for operations that don't require authentication or are safe to run in the browser.
 *
 * @throws {Error} When Supabase is not configured (env vars absent).
 * @returns {ReturnType<typeof createBrowserClient>} A Supabase client for browser-side operations.
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable it.'
    )
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
