import { scrapeDeliverySchema } from "@/features/scraping/schemas"
import { handleBrightDataDelivery } from "@/features/scraping/webhook-handlers"
import { createHandler } from "@/lib/api/handler"
import { runOnce } from "@/lib/api/idempotency"
import { apiError, apiSuccess } from "@/lib/api/response"
import { parseSearchParams } from "@/lib/api/validate"
import { webhookEventStore } from "@/lib/api/webhook-event-store"
import { verifyBrightDataWebhook } from "@/lib/brightdata/webhooks"
import { ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"

// Secret comparison uses Node crypto.
export const runtime = "nodejs"

export const POST = createHandler(async ({ request }) => {
  const { records } = await verifyBrightDataWebhook(request)
  const { scrape: scrapeId } = parseSearchParams(request, scrapeDeliverySchema)

  try {
    // A collection is delivered once per scrape, so the scrape id is the
    // event id.
    const outcome = await runOnce(
      webhookEventStore,
      { provider: "brightdata", eventId: scrapeId, eventType: "delivery" },
      () => handleBrightDataDelivery({ scrapeId, records })
    )
    return apiSuccess({ received: true, handled: true, outcome })
  } catch (error) {
    // Non-2xx makes Bright Data retry; the ledger row is marked failed.
    logger.error("Bright Data webhook handler failed", {
      event: "scraping.brightdata_delivery.failed",
      scrapeId,
      message: error instanceof Error ? error.message : String(error),
    })
    return apiError(ErrorCode.INTERNAL, "Webhook handler failed")
  }
})
