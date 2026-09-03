"use server"

import { redirect } from "next/navigation"

import { ROUTES } from "@/config/routes"
import { absoluteUrl } from "@/config/site"
import { getUser } from "@/features/auth/queries"
import { getOrCreateStripeCustomerId } from "@/features/billing/customers"
import { checkoutSchema } from "@/features/billing/schemas"
import {
  type ActionResult,
  fail,
  failFromError,
  failValidation,
} from "@/lib/actions/result"
import { ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { stripe } from "@/lib/stripe/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Starts a Stripe Checkout session for the given price and redirects to it.
 * Bound to a <form> via useActionState; returns a failed result on error.
 */
export const startCheckout = async (
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> => {
  const validated = checkoutSchema.safeParse({
    priceId: formData.get("priceId"),
  })
  if (!validated.success) return failValidation(validated.error)

  const user = await getUser()
  if (!user) return fail(ErrorCode.UNAUTHENTICATED, "Please sign in first.")

  // Re-validate the price against our RLS-protected mirror so a client cannot
  // check out with an inactive or unknown price.
  const supabase = await createClient()
  const { data: price, error: priceError } = await supabase
    .from("prices")
    .select("id, type")
    .eq("id", validated.data.priceId)
    .maybeSingle()
  if (priceError) {
    logger.error("Price lookup failed", {
      userId: user.id,
      priceId: validated.data.priceId,
      code: priceError.code,
    })
    return fail(ErrorCode.INTERNAL, "Could not load that plan.")
  }
  if (!price) return fail(ErrorCode.NOT_FOUND, "That plan is not available.")

  let url: string | null
  try {
    const customer = await getOrCreateStripeCustomerId(user)
    const session = await stripe.checkout.sessions.create({
      customer,
      mode: price.type === "recurring" ? "subscription" : "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: absoluteUrl(`${ROUTES.billing}?checkout=success`),
      cancel_url: absoluteUrl(`${ROUTES.billing}?checkout=canceled`),
    })
    url = session.url
  } catch (error) {
    logger.error("Stripe checkout session failed", {
      userId: user.id,
      priceId: price.id,
    })
    return failFromError(error)
  }

  if (!url) return fail(ErrorCode.EXTERNAL_SERVICE, "Checkout unavailable.")
  redirect(url)
}

/** Opens the Stripe Customer Portal for the signed-in user. */
export const openBillingPortal = async (): Promise<ActionResult> => {
  const user = await getUser()
  if (!user) return fail(ErrorCode.UNAUTHENTICATED, "Please sign in first.")

  let url: string
  try {
    const customer = await getOrCreateStripeCustomerId(user)
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: absoluteUrl(ROUTES.billing),
    })
    url = session.url
  } catch (error) {
    logger.error("Stripe portal session failed", { userId: user.id })
    return failFromError(error)
  }

  redirect(url)
}
