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
import { isAppError, toErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"

/**
 * An expected outcome (not signed in, plan gone) is user error and logs as a
 * warning; anything else is a fault. Both carry the code so they can be triaged.
 */
const logFailure = (
  message: string,
  error: unknown,
  fields: { event: string; priceId?: string }
) => {
  const line = { ...fields, code: toErrorCode(error) }
  if (isAppError(error)) logger.warn(message, line)
  else logger.error(message, line)
}

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
    logFailure("Stripe checkout session failed", error, {
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
    logFailure("Stripe portal session failed", error, {
      event: "billing.portal_session.failed",
    })
    return failFromError(error)
  }

  redirect(url)
}
