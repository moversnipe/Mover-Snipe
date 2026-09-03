import "server-only"

import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

/** Active products with their active prices, for the pricing table. RLS-filtered. */
export const getProductsWithPrices = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, description, image, metadata, prices(id, unit_amount, currency, type, interval, interval_count, trial_period_days)"
    )
    .eq("active", true)
    .eq("prices.active", true)
    .order("name")

  if (error) throw error
  return data
})

/** The user's current subscription (trialing or active), or null. */
export const getActiveSubscription = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, status, cancel_at_period_end, current_period_end, trial_end, prices(id, unit_amount, currency, type, interval, products(name))"
    )
    .eq("user_id", userId)
    .in("status", ["trialing", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
})
