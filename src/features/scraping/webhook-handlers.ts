import "server-only"

import { storeScrapeRecords } from "@/features/scraping/completion"
import type { BrightDataDelivery } from "@/lib/brightdata/webhooks"
import { createAdminClient } from "@/lib/supabase/admin"

// Admin client: the webhook runs with no user session. The delivery is
// secret-verified in the route before it reaches this module, and the scrape
// id comes from the URL we handed to Bright Data when triggering.

export type ScrapeDelivery = BrightDataDelivery & {
  /** The scrape the records belong to, from the delivery URL. */
  scrapeId: string
}

/**
 * Applies one verified Bright Data delivery: stores the records and marks the
 * scrape ready. Webhook route only; writes scrapes and scrape_records, is safe
 * to re-run, and throws on failure so Bright Data retries.
 */
export const handleBrightDataDelivery = async (delivery: ScrapeDelivery) => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("scrapes")
    .select("id")
    .eq("id", delivery.scrapeId)
    .maybeSingle()
  if (error) throw new Error(`look up scrape: ${error.message}`)
  // Unknown scrape: most likely the delivery raced the insert in
  // `startScrape`. Throwing makes the route answer non-2xx so Bright Data
  // retries once the row exists.
  if (!data) throw new Error(`No scrape ${delivery.scrapeId}`)

  await storeScrapeRecords(data.id, delivery.records)
}
