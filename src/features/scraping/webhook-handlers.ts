import "server-only"

import { SCRAPE_MAX_RECORDS } from "@/features/scraping/schemas"
import { downloadSnapshot, type Json } from "@/lib/brightdata/server"
import type { BrightDataEvent } from "@/lib/brightdata/webhooks"
import { logger } from "@/lib/logger"
import { createAdminClient } from "@/lib/supabase/admin"
import type { TablesInsert } from "@/lib/supabase/database.types"

// Admin client throughout: the webhook runs with no user session, and
// `scrapes` has no client update policy while `scrape_records` has no client
// write policy at all. Every event is secret-verified in the route before it
// reaches this module, and the snapshot id is resolved against our own rows.

/**
 * Bright Data notification statuses this app reacts to. Anything else is
 * acknowledged and ignored.
 */
export const HANDLED_EVENT_TYPES = new Set(["ready", "failed"])

/** Rows per insert; keeps each request to Postgres well under its limits. */
const RECORD_BATCH_SIZE = 500

const throwIfError = (error: { message: string } | null, context: string) => {
  if (error) throw new Error(`${context}: ${error.message}`)
}

const findScrapeBySnapshotId = async (snapshotId: string) => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("scrapes")
    .select("id, status")
    .eq("snapshot_id", snapshotId)
    .maybeSingle()
  throwIfError(error, "look up scrape")
  // Unknown snapshot: most likely the notification raced the insert in
  // `startScrape`. Throwing makes the route answer non-2xx so Bright Data
  // retries once the row exists.
  if (!data) throw new Error(`No scrape for snapshot ${snapshotId}`)
  return data
}

const storeRecords = async (scrapeId: string, records: Json[]) => {
  const admin = createAdminClient()
  for (let start = 0; start < records.length; start += RECORD_BATCH_SIZE) {
    const rows: TablesInsert<"scrape_records">[] = records
      .slice(start, start + RECORD_BATCH_SIZE)
      .map((data, offset) => ({
        scrape_id: scrapeId,
        position: start + offset,
        data,
      }))
    const { error } = await admin.from("scrape_records").upsert(rows, {
      onConflict: "scrape_id,position",
      ignoreDuplicates: true,
    })
    throwIfError(error, "store scrape records")
  }
}

const completeScrape = async (
  scrapeId: string,
  fields:
    | { status: "ready"; record_count: number }
    | { status: "failed"; error: string | null }
) => {
  const admin = createAdminClient()
  const { error } = await admin
    .from("scrapes")
    .update({ ...fields, completed_at: new Date().toISOString() })
    .eq("id", scrapeId)
  throwIfError(error, "complete scrape")
}

/**
 * Applies one verified Bright Data completion notification: on `ready` it
 * downloads the snapshot and stores every record, on `failed` it records the
 * failure. Webhook route only; writes scrapes and scrape_records, is safe to
 * re-run, and throws on failure so Bright Data retries.
 */
export const handleBrightDataEvent = async (event: BrightDataEvent) => {
  const scrape = await findScrapeBySnapshotId(event.snapshotId)

  if (event.status === "ready") {
    const records = await downloadSnapshot(event.snapshotId)
    if (records.length > SCRAPE_MAX_RECORDS) {
      // Every trigger caps the run at the ceiling, so this is a defence
      // against an unexpected snapshot, not a normal path.
      await completeScrape(scrape.id, {
        status: "failed",
        error: `Snapshot has more than ${SCRAPE_MAX_RECORDS} records`,
      })
    } else {
      await storeRecords(scrape.id, records)
      await completeScrape(scrape.id, {
        status: "ready",
        record_count: records.length,
      })
    }
  } else if (event.status === "failed") {
    await completeScrape(scrape.id, { status: "failed", error: event.error })
  } else {
    throw new Error(`Unhandled Bright Data status ${event.status}`)
  }

  logger.info("Scrape completed", {
    event: "scraping.scrape.completed",
    scrapeId: scrape.id,
    snapshotId: event.snapshotId,
    status: event.status,
  })
}
