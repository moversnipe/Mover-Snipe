import {
  HANDLED_EVENT_TYPES,
  handleBrightDataEvent,
} from "@/features/scraping/webhook-handlers"
import { createHandler } from "@/lib/api/handler"
import { runOnce } from "@/lib/api/idempotency"
import { apiError, apiSuccess } from "@/lib/api/response"
import { webhookEventStore } from "@/lib/api/webhook-event-store"
import { verifyBrightDataWebhook } from "@/lib/brightdata/webhooks"
import { ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"

// Secret comparison uses Node crypto.
export const runtime = "nodejs"

export const POST = createHandler(async ({ request }) => {
  const event = await verifyBrightDataWebhook(request)

  if (!HANDLED_EVENT_TYPES.has(event.status)) {
    return apiSuccess({ received: true, handled: false })
  }

  try {
    // A snapshot completes once, so its id is the event id.
    const outcome = await runOnce(
      webhookEventStore,
      {
        provider: "brightdata",
        eventId: event.snapshotId,
        eventType: event.status,
      },
      () => handleBrightDataEvent(event)
    )
    return apiSuccess({ received: true, handled: true, outcome })
  } catch (error) {
    // Non-2xx makes Bright Data retry; the ledger row is marked failed.
    logger.error("Bright Data webhook handler failed", {
      event: "scraping.brightdata_event.failed",
      snapshotId: event.snapshotId,
      status: event.status,
      message: error instanceof Error ? error.message : String(error),
    })
    return apiError(ErrorCode.INTERNAL, "Webhook handler failed")
  }
})
