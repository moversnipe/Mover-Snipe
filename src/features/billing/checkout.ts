import "server-only"

import { ROUTES } from "@/config/routes"
import { absoluteUrl } from "@/config/site"
import { getUserOrThrow } from "@/features/auth/queries"
import { getOrCreateStripeCustomerId } from "@/features/billing/customers"
import type { CheckoutInput } from "@/features/billing/schemas"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { stripe } from "@/lib/stripe/server"
import { createClient } from "@/lib/supabase/server"

/** A Stripe-hosted page (Checkout or Customer Portal) for the browser to open. */
export type HostedSession = {
  /** Absolute URL of the Stripe-hosted page to open. Valid for a short time. */
  url: string
}

/**
 * Creates a Stripe Checkout session for one catalogue price and returns its
 * URL. Signed-in users only; the price must exist and be readable under RLS.
 * Contacts Stripe and creates the user's Stripe customer on first use; each
 * call creates a new session, and nothing is charged until the user pays.
 */
export const createCheckoutSession = async (
  input: CheckoutInput
): Promise<HostedSession> => {
  const user = await getUserOrThrow()

  // Re-validate the price against our RLS-protected mirror so a caller cannot
  // check out with an inactive or unknown price. RLS alone is not enough: a
  // subscriber can still read the archived price on their own subscription.
  const supabase = await createClient()
  const { data: price, error: priceError } = await supabase
    .from("prices")
    .select("id, type")
    .eq("id", input.priceId)
    .eq("active", true)
    .maybeSingle()
  if (priceError) {
    logger.error("Price lookup failed", {
      event: "billing.price.lookup_failed",
      userId: user.id,
      priceId: input.priceId,
      code: priceError.code,
    })
    throw new AppError(ErrorCode.INTERNAL, "Could not load that plan.")
  }
  if (!price) {
    throw new AppError(ErrorCode.NOT_FOUND, "That plan is not available.")
  }

  const customer = await getOrCreateStripeCustomerId(user)
  const session = await stripe.checkout.sessions
    .create({
      customer,
      mode: price.type === "recurring" ? "subscription" : "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: absoluteUrl(`${ROUTES.billing}?checkout=success`),
      cancel_url: absoluteUrl(`${ROUTES.billing}?checkout=canceled`),
    })
    .catch((error: unknown) => {
      logger.error("Stripe checkout session failed", {
        event: "billing.checkout_session.failed",
        userId: user.id,
        priceId: price.id,
      })
      throw error
    })
  if (!session.url) {
    throw new AppError(ErrorCode.EXTERNAL_SERVICE, "Checkout unavailable.")
  }

  logger.info("Checkout session created", {
    event: "billing.checkout_session.created",
    userId: user.id,
    priceId: price.id,
    checkoutSessionId: session.id,
  })
  return { url: session.url }
}

/**
 * Creates a Stripe Customer Portal session for the signed-in user and returns
 * its URL. Signed-in users only. Contacts Stripe and creates the user's Stripe
 * customer on first use; makes no other change.
 */
export const createBillingPortalSession = async (): Promise<HostedSession> => {
  const user = await getUserOrThrow()

  const customer = await getOrCreateStripeCustomerId(user)
  const session = await stripe.billingPortal.sessions
    .create({
      customer,
      return_url: absoluteUrl(ROUTES.billing),
    })
    .catch((error: unknown) => {
      logger.error("Stripe portal session failed", {
        event: "billing.portal_session.failed",
        userId: user.id,
      })
      throw error
    })

  logger.info("Billing portal session created", {
    event: "billing.portal_session.created",
    userId: user.id,
    portalSessionId: session.id,
  })
  return { url: session.url }
}
