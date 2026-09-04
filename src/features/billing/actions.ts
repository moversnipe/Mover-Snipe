"use server"

import { redirect } from "next/navigation"

import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/features/billing/checkout"
import { checkoutSchema } from "@/features/billing/schemas"
import {
  type ActionResult,
  failFromError,
  failValidation,
} from "@/lib/actions/result"
import { logger } from "@/lib/logger"

/**
 * Form adapter over `createCheckoutSession`: validates the picked price and
 * sends the browser to Stripe Checkout. Signed-in users only; returns a failed
 * result instead of redirecting when the session cannot be created.
 */
export const startCheckout = async (
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> => {
  const validated = checkoutSchema.safeParse({
    priceId: formData.get("priceId"),
  })
  if (!validated.success) return failValidation(validated.error)

  let url: string
  try {
    const session = await createCheckoutSession(validated.data)
    url = session.url
  } catch (error) {
    logger.error("Stripe checkout session failed", {
      event: "billing.checkout_session.failed",
      priceId: validated.data.priceId,
    })
    return failFromError(error)
  }

  redirect(url)
}

/**
 * Button adapter over `createBillingPortalSession`: sends the browser to the
 * Stripe Customer Portal. Signed-in users only; returns a failed result
 * instead of redirecting when the session cannot be created.
 */
export const openBillingPortal = async (): Promise<ActionResult> => {
  let url: string
  try {
    const session = await createBillingPortalSession()
    url = session.url
  } catch (error) {
    logger.error("Stripe portal session failed", {
      event: "billing.portal_session.failed",
    })
    return failFromError(error)
  }

  redirect(url)
}
