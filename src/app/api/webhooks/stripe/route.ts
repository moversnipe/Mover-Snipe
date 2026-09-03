import {
  HANDLED_EVENT_TYPES,
  handleStripeEvent,
} from "@/features/billing/webhook-handlers"
import { createHandler } from "@/lib/api/handler"
import { apiError, apiSuccess } from "@/lib/api/response"
import { ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { verifyStripeWebhook } from "@/lib/stripe/webhooks"

// Signature verification needs the raw body and Node crypto.
export const runtime = "nodejs"

export const POST = createHandler(async ({ request }) => {
  const event = await verifyStripeWebhook(request)

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
})
