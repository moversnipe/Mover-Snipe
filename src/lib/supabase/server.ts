import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isSupabaseConfigured } from '@/lib/supabase/config'

/**
 * Creates a Supabase client for user-specific operations.
 * Use this client for operations that should respect the user's authentication and permissions.
 *
 * @throws {Error} When Supabase is not configured (env vars absent).
 * @returns {Promise<ReturnType<typeof createServerClient>>} A Supabase client authenticated as the current user.
 */
export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable it.'
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase admin client for system/service operations.
 * Use this client for operations that require elevated privileges or system-level access.
 * CAUTION: This bypasses RLS policies - use only for authorized system operations.
 *
 * @throws {Error} When Supabase is not configured (env vars absent).
 * @returns {Promise<ReturnType<typeof createServerClient>>} A Supabase client with admin privileges.
 */
export async function createAdminClient() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.local to enable it.'
    )
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}