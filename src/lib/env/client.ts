import { z } from "zod"

/**
 * Public environment variables, safe for the browser bundle.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so each one must be
 * referenced statically (never `process.env[name]`).
 *
 * The Supabase key is the project's publishable key (`sb_publishable_...`).
 * The legacy `anon` JWT is accepted too because the local CLI stack may still
 * issue it; both grant the same low privileges under RLS.
 */
const supabasePublishableKey = z
  .string()
  .min(1)
  .refine(
    (key) => key.startsWith("sb_publishable_") || key.startsWith("eyJ"),
    "Expected a publishable key (sb_publishable_...) or legacy anon JWT"
  )

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
})

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
})

if (!parsed.success) {
  throw new Error(
    `Invalid public environment variables:\n${z.prettifyError(parsed.error)}`
  )
}

export const clientEnv = parsed.data
