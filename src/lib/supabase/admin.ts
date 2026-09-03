import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { clientEnv } from "@/lib/env/client"
import { serverEnv } from "@/lib/env/server"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Service-role client. BYPASSES RLS.
 *
 * Use only in trusted server code that acts on behalf of the system, such as
 * webhook handlers. It carries no user session on purpose: never pass user
 * cookies to it, and never let its results flow to the client unfiltered.
 */
export const createAdminClient = () =>
  createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
