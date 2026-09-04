import "server-only"

import { getUserOrThrow } from "@/features/auth/queries"
import {
  type StartScrapeInput,
  startScrapeSchema,
} from "@/features/scraping/schemas"
import type { ScrapeStatus } from "@/features/scraping/enums"
import { triggerCollection } from "@/lib/brightdata/server"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export type StartedScrape = {
  /** Scrape id; pass it to `getScrape` and `listScrapeRecords`. */
  id: string
  /** Bright Data snapshot id (s_...) for this run. */
  snapshotId: string
  /** Always `running` right after the start; the webhook moves it on. */
  status: ScrapeStatus
}

/**
 * Starts a Bright Data collection for the signed-in user and records it as a
 * `running` scrape. Signed-in users only. Contacts Bright Data and is billed
 * per run; each call starts a new run. Completion arrives later through the
 * Bright Data webhook, which stores the records and updates the status.
 */
export const startScrape = async (
  input: StartScrapeInput
): Promise<StartedScrape> => {
  const parsed = startScrapeSchema.parse(input)
  const user = await getUserOrThrow()

  const { snapshotId } = await triggerCollection(parsed)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scrapes")
    .insert({
      user_id: user.id,
      dataset_id: parsed.datasetId,
      snapshot_id: snapshotId,
      input: parsed.input,
    })
    .select("id, snapshot_id, status")
    .single()
  if (error) {
    // The run is already started on Bright Data; keep its id in the log so
    // the snapshot can be recovered by hand.
    logger.error("Failed to record started scrape", {
      event: "scraping.scrape.create_failed",
      userId: user.id,
      datasetId: parsed.datasetId,
      snapshotId,
      code: error.code,
    })
    throw new AppError(ErrorCode.INTERNAL, "Could not save the scrape.")
  }

  logger.info("Scrape started", {
    event: "scraping.scrape.started",
    userId: user.id,
    scrapeId: data.id,
    datasetId: parsed.datasetId,
    snapshotId,
  })
  return { id: data.id, snapshotId: data.snapshot_id, status: data.status }
}
