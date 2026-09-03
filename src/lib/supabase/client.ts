import { createBrowserClient } from "@supabase/ssr"

import { clientEnv } from "@/lib/env/client"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Supabase client for Client Components. Runs as the signed-in user (or anon)
 * and is subject to RLS.
 */
export const createClient = () =>
  createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
