import { clientEnv } from "@/lib/env/client"

export const siteConfig = {
  name: "Mover Snipe",
  description:
    "Next.js 16 + React 19 + Supabase + Stripe + shadcn/ui (Base UI)",
  url: clientEnv.NEXT_PUBLIC_SITE_URL,
} as const

/** Builds an absolute URL for redirects sent to Supabase Auth and Stripe. */
export const absoluteUrl = (path: string): string =>
  new URL(path, siteConfig.url).toString()
