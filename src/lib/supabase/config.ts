/**
 * Determines whether Supabase is configured for this deployment.
 *
 * Supabase is optional in this boilerplate: when the required public env vars
 * are absent, the middleware becomes a no-op and the client factories throw a
 * helpful error instead of instantiating a broken Supabase client.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so they are referenced
 * statically here (never via `process.env[name]`) to work in both server and
 * client contexts.
 *
 * @returns {boolean} True when both NEXT_PUBLIC_SUPABASE_URL and
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY are present and non-empty.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
