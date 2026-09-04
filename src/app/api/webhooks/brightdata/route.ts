import { handleBrightDataEvent } from "@/features/scraping/webhook-handlers"
import { createHandler } from "@/lib/api/handler"
import { runOnce } from "@/lib/api/idempotency"
import { apiError, apiSuccess } from "@/lib/api/response"
import { webhookEventStore } from "@/lib/api/webhook-event-store"
import { verifyBrightDataWebhook } from "@/lib/brightdata/webhooks"
import { ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"

// Reading the raw (possibly gzipped) body and the timing-safe secret
// comparison need Node APIs.
export const runtime = "nodejs"

export const POST = createHandler(async ({ request }) => {
  const event = await verifyBrightDataWebhook(request)

  try {
    const outcome = await runOnce(
      webhookEventStore,
      { provider: "brightdata", eventId: event.id, eventType: event.type },
      () => handleBrightDataEvent(event)
    )
    return apiSuccess({ received: true, handled: true, outcome })
  } catch (error) {
    // Non-2xx makes Bright Data retry; the ledger row is marked failed.
    logger.error("Bright Data webhook handler failed", {
      event: "scraping.brightdata_event.failed",
      eventId: event.id,
      eventType: event.type,
      message: error instanceof Error ? error.message : String(error),
    })
    return apiError(ErrorCode.INTERNAL, "Webhook handler failed")
  }
})
