import "server-only"

import { z } from "zod"

/**
 * Server-only environment variables. Importing this module from a Client
 * Component is a build error thanks to `server-only`, which keeps secrets out
 * of the browser bundle.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
})

const parsed = serverEnvSchema.safeParse(process.env)

if (!parsed.success) {
  throw new Error(
    `Invalid server environment variables:\n${z.prettifyError(parsed.error)}`
  )
}

export const serverEnv = parsed.data
