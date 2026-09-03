import "server-only"

import type { WebhookEventKey, WebhookEventStore } from "@/lib/api/idempotency"
import { createAdminClient } from "@/lib/supabase/admin"

const throwIfError = (error: { message: string } | null, context: string) => {
  if (error) throw new Error(`${context}: ${error.message}`)
}

/**
 * Supabase-backed WebhookEventStore over public.webhook_events.
 * Admin client: webhooks run without a user session and the table has no
 * client policies by design.
 */
export const webhookEventStore: WebhookEventStore = {
  claim: async ({ provider, eventId, eventType }: WebhookEventKey) => {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("claim_webhook_event", {
      p_provider: provider,
      p_event_id: eventId,
      p_event_type: eventType,
    })
    throwIfError(error, "claim webhook event")
    return data === true
  },

  markProcessed: async ({ provider, eventId }) => {
    const admin = createAdminClient()
    const { error } = await admin
      .from("webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        error: null,
      })
      .eq("provider", provider)
      .eq("event_id", eventId)
    throwIfError(error, "mark webhook event processed")
  },

  markFailed: async ({ provider, eventId }, message) => {
    const admin = createAdminClient()
    const { error } = await admin
      .from("webhook_events")
      .update({ status: "failed", error: message.slice(0, 1000) })
      .eq("provider", provider)
      .eq("event_id", eventId)
    throwIfError(error, "mark webhook event failed")
  },
}
