import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { clientEnv } from "@/lib/env/client"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Runs as the signed-in user and is subject to RLS. Async: always `await` it.
 */
export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Safe to ignore: the proxy (src/proxy.ts) refreshes sessions.
          }
        },
      },
    }
  )
}
