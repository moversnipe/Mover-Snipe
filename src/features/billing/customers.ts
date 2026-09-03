import "server-only"

import type { SessionUser } from "@/features/auth/queries"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { stripe } from "@/lib/stripe/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Returns the Stripe customer id for a user, creating the Stripe customer and
 * the private `customers` mapping row on first use.
 *
 * Uses the admin client because `customers` has no client RLS policies.
 */
export const getOrCreateStripeCustomerId = async (
  user: SessionUser
): Promise<string> => {
  const admin = createAdminClient()

  const { data: existing, error: lookupError } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle()

  if (lookupError) {
    throw new AppError(ErrorCode.INTERNAL, "Could not look up customer", {
      cause: lookupError,
    })
  }
  if (existing) return existing.stripe_customer_id

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { supabase_user_id: user.id },
  })

  const { error: insertError } = await admin
    .from("customers")
    .insert({ id: user.id, stripe_customer_id: customer.id })

  // Two concurrent checkouts can race here. The primary key rejects the
  // second insert (Postgres 23505); return the mapping the winner stored.
  if (insertError?.code === "23505") {
    const { data: winner } = await admin
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()
    if (winner) {
      await stripe.customers.del(customer.id)
      return winner.stripe_customer_id
    }
  }

  if (insertError) {
    logger.error("Failed to persist Stripe customer mapping", {
      userId: user.id,
      stripeCustomerId: customer.id,
      code: insertError.code,
    })
    throw new AppError(ErrorCode.INTERNAL, "Could not save customer", {
      cause: insertError,
    })
  }

  return customer.id
}

/** Resolves the auth user id for a Stripe customer id, or null if unknown. */
export const getUserIdByStripeCustomerId = async (
  stripeCustomerId: string
): Promise<string | null> => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle()

  if (error) {
    throw new AppError(ErrorCode.INTERNAL, "Could not look up customer", {
      cause: error,
    })
  }
  return data?.id ?? null
}
