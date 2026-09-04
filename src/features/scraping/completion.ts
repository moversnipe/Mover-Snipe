import "server-only"

import { SCRAPE_MAX_RECORDS } from "@/features/scraping/schemas"
import type { Json } from "@/lib/brightdata/server"
import { logger } from "@/lib/logger"
import { createAdminClient } from "@/lib/supabase/admin"
import type { TablesInsert } from "@/lib/supabase/database.types"

// Admin client throughout: completion is written either by the webhook, which
// has no user session, or by `syncScrape` after an RLS-scoped read proved the
// caller owns the row. `scrapes` has no client update policy and
// `scrape_records` no client write policy, so these are the only writers of
// status, record_count, error, completed_at and of the records.

/** Rows per insert; keeps each request to Postgres well under its limits. */
const RECORD_BATCH_SIZE = 500

const throwIfError = (error: { message: string } | null, context: string) => {
  if (error) throw new Error(`${context}: ${error.message}`)
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

  logger.info("Scrape completed", {
    event: "scraping.scrape.completed",
    scrapeId,
    status: fields.status,
  })
}

/**
 * Stores the records of a finished collection and marks the scrape `ready`,
 * or `failed` when there are more than SCRAPE_MAX_RECORDS. Server code only,
 * for a scrape whose ownership or origin was already verified; writes
 * scrape_records and scrapes and is safe to re-run.
 */
export const storeScrapeRecords = async (scrapeId: string, records: Json[]) => {
  if (records.length > SCRAPE_MAX_RECORDS) {
    // Every trigger caps the run at the ceiling, so this is a defence against
    // an unexpected snapshot, not a normal path.
    await completeScrape(scrapeId, {
      status: "failed",
      error: `Snapshot has more than ${SCRAPE_MAX_RECORDS} records`,
    })
    return
  }

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

  await completeScrape(scrapeId, {
    status: "ready",
    record_count: records.length,
  })
}

/**
 * Marks a scrape `failed` with the given reason. Server code only, for a
 * scrape whose ownership was already verified; writes scrapes and is safe to
 * re-run.
 */
export const failScrape = async (scrapeId: string, error: string | null) =>
  completeScrape(scrapeId, { status: "failed", error })
