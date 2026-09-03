import "server-only"

import type Stripe from "stripe"

import { getUserIdByStripeCustomerId } from "@/features/billing/customers"
import {
  pricingPlanIntervalSchema,
  pricingTypeSchema,
  subscriptionStatusSchema,
} from "@/features/billing/enums"
import { fromUnixSeconds } from "@/features/billing/format"
import { logger } from "@/lib/logger"
import { stripe } from "@/lib/stripe/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { TablesInsert } from "@/lib/supabase/database.types"

/**
 * Stripe event types this app reacts to. Anything else is acknowledged and
 * ignored so Stripe does not retry it.
 */
export const HANDLED_EVENT_TYPES = new Set<Stripe.Event.Type>([
  "product.created",
  "product.updated",
  "product.deleted",
  "price.created",
  "price.updated",
  "price.deleted",
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
])

const throwIfError = (error: { message: string } | null, context: string) => {
  if (error) throw new Error(`${context}: ${error.message}`)
}

const upsertProduct = async (product: Stripe.Product) => {
  const admin = createAdminClient()
  const row: TablesInsert<"products"> = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description,
    image: product.images[0] ?? null,
    metadata: product.metadata,
  }
  const { error } = await admin.from("products").upsert(row)
  throwIfError(error, "upsert product")
}

const deleteProduct = async (product: Stripe.Product) => {
  const admin = createAdminClient()
  const { error } = await admin.from("products").delete().eq("id", product.id)
  throwIfError(error, "delete product")
}

const upsertPrice = async (price: Stripe.Price) => {
  const admin = createAdminClient()
  const row: TablesInsert<"prices"> = {
    id: price.id,
    product_id:
      typeof price.product === "string" ? price.product : price.product.id,
    active: price.active,
    description: price.nickname,
    unit_amount: price.unit_amount,
    currency: price.currency,
    type: pricingTypeSchema.parse(price.type),
    interval: price.recurring
      ? pricingPlanIntervalSchema.parse(price.recurring.interval)
      : null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  }
  const { error } = await admin.from("prices").upsert(row)
  throwIfError(error, "upsert price")
}

const deletePrice = async (price: Stripe.Price) => {
  const admin = createAdminClient()
  const { error } = await admin.from("prices").delete().eq("id", price.id)
  throwIfError(error, "delete price")
}

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : (value?.id ?? null)

/**
 * Mirrors a subscription into `subscriptions`. Fetches the latest state from
 * Stripe rather than trusting the event payload, which may be stale when
 * events arrive out of order.
 */
const syncSubscription = async (
  subscriptionId: string,
  stripeCustomerId: string
) => {
  const userId = await getUserIdByStripeCustomerId(stripeCustomerId)
  if (!userId) {
    logger.warn("Subscription for unknown Stripe customer; skipping", {
      subscriptionId,
      stripeCustomerId,
    })
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  // Billing periods live on subscription items (Stripe API 2025-03-31+).
  const item = subscription.items.data[0]

  const row: TablesInsert<"subscriptions"> = {
    id: subscription.id,
    user_id: userId,
    status: subscriptionStatusSchema.parse(subscription.status),
    price_id: item ? item.price.id : null,
    quantity: item?.quantity ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: fromUnixSeconds(item?.current_period_start),
    current_period_end: fromUnixSeconds(item?.current_period_end),
    ended_at: fromUnixSeconds(subscription.ended_at),
    cancel_at: fromUnixSeconds(subscription.cancel_at),
    canceled_at: fromUnixSeconds(subscription.canceled_at),
    trial_start: fromUnixSeconds(subscription.trial_start),
    trial_end: fromUnixSeconds(subscription.trial_end),
    metadata: subscription.metadata,
    created_at: fromUnixSeconds(subscription.created) ?? undefined,
  }

  const admin = createAdminClient()
  const { error } = await admin.from("subscriptions").upsert(row)
  throwIfError(error, "upsert subscription")
}

/** Dispatches one verified Stripe event. Throws on failure so Stripe retries. */
export const handleStripeEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "product.created":
    case "product.updated":
      return upsertProduct(event.data.object)
    case "product.deleted":
      return deleteProduct(event.data.object)
    case "price.created":
    case "price.updated":
      return upsertPrice(event.data.object)
    case "price.deleted":
      return deletePrice(event.data.object)
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object
      const customerId = idOf(subscription.customer)
      if (customerId) await syncSubscription(subscription.id, customerId)
      return
    }
    case "checkout.session.completed": {
      const session = event.data.object
      const subscriptionId = idOf(session.subscription)
      const customerId = idOf(session.customer)
      if (session.mode === "subscription" && subscriptionId && customerId) {
        await syncSubscription(subscriptionId, customerId)
      }
      return
    }
    default:
      return
  }
}
