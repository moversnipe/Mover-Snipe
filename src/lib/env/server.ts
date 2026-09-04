import "server-only"

import { z } from "zod"

/**
 * Server-only environment variables. Importing this module from a Client
 * Component is a build error thanks to `server-only`, which keeps secrets out
 * of the browser bundle.
 *
 * The Supabase key is a secret key (`sb_secret_...`), which bypasses RLS. The
 * legacy `service_role` JWT is accepted too for the local CLI stack.
 *
 * This holds ONE key's value. Edge Functions receive every secret key at once in
 * the platform's `SUPABASE_SECRET_KEYS` JSON object (see
 * `.claude/rules/edge-functions.md`); when copying from there, take the
 * `default` entry's value rather than the object itself.
 */
const supabaseSecretKey = z
  .string()
  .min(1)
  .refine(
    (key) => key.startsWith("sb_secret_") || key.startsWith("eyJ"),
    "Expected a secret key (sb_secret_...) or legacy service_role JWT"
  )

const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: supabaseSecretKey,
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  /** Bright Data API key, sent as a Bearer token to api.brightdata.com. */
  BRIGHTDATA_API_KEY: z.string().min(1),
  /**
   * Shared secret Bright Data echoes back in the Authorization header of every
   * webhook it sends us (the `auth_header` trigger parameter). Our own value,
   * so long and random: the webhook route verifies nothing else.
   */
  BRIGHTDATA_WEBHOOK_SECRET: z.string().min(32),
})

const parsed = serverEnvSchema.safeParse(process.env)

if (!parsed.success) {
  throw new Error(
    `Invalid server environment variables:\n${z.prettifyError(parsed.error)}`
  )
}

export const serverEnv = parsed.data
