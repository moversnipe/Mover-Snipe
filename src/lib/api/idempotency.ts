import "server-only"

import { logger } from "@/lib/logger"

export type WebhookEventKey = {
  /** Short provider slug, e.g. "stripe". */
  provider: string
  /** The provider's unique event id. */
  eventId: string
  eventType: string
}

/**
 * Persistence for the idempotency ledger. `claim` must be atomic: true when
 * the caller now owns the event, false when it was already processed or is
 * being processed elsewhere. See public.claim_webhook_event.
 */
export type WebhookEventStore = {
  claim: (key: WebhookEventKey) => Promise<boolean>
  markProcessed: (key: WebhookEventKey) => Promise<void>
  markFailed: (key: WebhookEventKey, error: string) => Promise<void>
}

export type RunOnceOutcome = "processed" | "duplicate"

/**
 * Runs `handler` at most once per (provider, eventId) across replays and
 * concurrent deliveries. A throwing handler marks the event failed and
 * rethrows so the route returns non-2xx and the provider retries.
 */
export const runOnce = async (
  store: WebhookEventStore,
  key: WebhookEventKey,
  handler: () => Promise<void>
): Promise<RunOnceOutcome> => {
  const claimed = await store.claim(key)
  if (!claimed) {
    logger.info("Duplicate webhook delivery skipped", { ...key })
    return "duplicate"
  }

  try {
    await handler()
  } catch (error) {
    await store.markFailed(
      key,
      error instanceof Error ? error.message : String(error)
    )
    throw error
  }

  await store.markProcessed(key)
  return "processed"
}
