import type Stripe from "stripe"

import {
  HANDLED_EVENT_TYPES,
  handleStripeEvent,
} from "@/features/billing/webhook-handlers"
import { apiError, apiSuccess } from "@/lib/api/response"
import { serverEnv } from "@/lib/env/server"
import { ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { stripe } from "@/lib/stripe/server"

// Signature verification needs the raw body and Node crypto.
export const runtime = "nodejs"

export const POST = async (request: Request) => {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return apiError(ErrorCode.VALIDATION, "Missing stripe-signature header")
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    logger.warn("Rejected Stripe webhook with invalid signature")
    return apiError(ErrorCode.VALIDATION, "Invalid signature")
  }

  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    return apiSuccess({ received: true, handled: false })
  }

  try {
    await handleStripeEvent(event)
  } catch (error) {
    // Non-2xx makes Stripe retry with backoff.
    logger.error("Stripe webhook handler failed", {
      eventId: event.id,
      eventType: event.type,
      message: error instanceof Error ? error.message : String(error),
    })
    return apiError(ErrorCode.INTERNAL, "Webhook handler failed")
  }

  return apiSuccess({ received: true, handled: true })
}
