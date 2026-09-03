import "server-only"

import type Stripe from "stripe"

import { serverEnv } from "@/lib/env/server"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { stripe } from "@/lib/stripe/server"

/**
 * Verifies a Stripe webhook request against the raw body and returns the
 * event. Throws `AppError(VALIDATION)` (HTTP 400) when the signature header is
 * missing or invalid, so Stripe records the failure and does not retry.
 */
export const verifyStripeWebhook = async (
  request: Request
): Promise<Stripe.Event> => {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    throw new AppError(ErrorCode.VALIDATION, "Missing stripe-signature header")
  }

  try {
    return await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    logger.warn("Rejected Stripe webhook with invalid signature")
    throw new AppError(ErrorCode.VALIDATION, "Invalid signature")
  }
}
