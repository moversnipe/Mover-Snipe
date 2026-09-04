import "server-only"

import { cache } from "react"

import {
  type ProductsWithPricesInput,
  productsWithPricesSchema,
} from "@/features/billing/schemas"
import { createClient } from "@/lib/supabase/server"

/**
 * Lists active products with their active prices: products by name, each
 * product's prices by unit amount, at most `limit` products (default and
 * maximum 100). Anyone may call it; RLS decides visibility. Read-only.
 * Takes a scalar so React.cache can dedupe calls with the same limit.
 */
export const getProductsWithPrices = cache(
  async (limit?: ProductsWithPricesInput["limit"]) => {
    const parsed = productsWithPricesSchema.parse({ limit })
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, description, image, metadata, prices(id, unit_amount, currency, type, interval, interval_count, trial_period_days)"
      )
      .eq("active", true)
      .eq("prices.active", true)
      .order("name")
      .order("unit_amount", { referencedTable: "prices" })
      .limit(parsed.limit)

    if (error) throw error
    return data
  }
)

/**
 * Returns the given user's newest trialing or active subscription with its
 * price and product name, or null when there is none. Callers pass their own
 * verified id; RLS returns nothing for anyone else's. Read-only.
 */
export const getActiveSubscription = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, status, cancel_at_period_end, current_period_end, trial_end, price:prices(id, unit_amount, currency, type, interval, product:products(name))"
    )
    .eq("user_id", userId)
    .in("status", ["trialing", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
})
