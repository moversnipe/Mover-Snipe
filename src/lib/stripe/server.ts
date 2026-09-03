import "server-only"

import Stripe from "stripe"

import { serverEnv } from "@/lib/env/server"

/**
 * Server-only Stripe SDK instance. The API version is pinned by the installed
 * `stripe` package (see package.json); upgrade the package to move versions.
 */
export const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  typescript: true,
  appInfo: {
    name: "mover-snipe",
    url: "https://github.com/moversnipe/mover-snipe",
  },
})
