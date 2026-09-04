import "server-only"

import { randomUUID } from "node:crypto"

import { ROUTES } from "@/config/routes"
import { absoluteUrl } from "@/config/site"
import { getUserOrThrow } from "@/features/auth/queries"
import { failScrape, storeScrapeRecords } from "@/features/scraping/completion"
import type { ScrapeStatus } from "@/features/scraping/enums"
import { getScrape } from "@/features/scraping/queries"
import {
  type StartScrapeInput,
  type SyncScrapeInput,
  startScrapeSchema,
  syncScrapeSchema,
} from "@/features/scraping/schemas"
import {
  downloadSnapshot,
  getSnapshotProgress,
  triggerCollection,
} from "@/lib/brightdata/server"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export type ScrapeState = {
  /** Scrape id; pass it to `getScrape`, `listScrapeRecords`, `syncScrape`. */
  id: string
  /** Bright Data snapshot id (s_...) for this run. */
  snapshotId: string
  /** `running` until Bright Data delivers, then `ready` or `failed`. */
  status: ScrapeStatus
}

/** Where Bright Data POSTs the records of one scrape. Exported for tests. */
export const scrapeDeliveryUrl = (scrapeId: string) =>
  absoluteUrl(`${ROUTES.api.brightdataWebhook}?scrape=${scrapeId}`)

/**
 * Starts a Bright Data collection for the signed-in user and records it as a
 * `running` scrape. Signed-in users only. Contacts Bright Data and is billed
 * per run; each call starts a new run. Bright Data delivers the records to
 * the webhook when the job completes, which stores them and updates the
 * status.
 */
export const startScrape = async (
  input: StartScrapeInput
): Promise<ScrapeState> => {
  const parsed = startScrapeSchema.parse(input)
  const user = await getUserOrThrow()

  // The id is minted here so it can travel in the delivery URL; the delivered
  // body is the bare records array and carries no reference of its own.
  const scrapeId = randomUUID()
  const { snapshotId } = await triggerCollection({
    ...parsed,
    endpoint: scrapeDeliveryUrl(scrapeId),
  })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scrapes")
    .insert({
      id: scrapeId,
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

/**
 * Brings one of the signed-in user's running scrapes up to date from Bright
 * Data: stores the records if the snapshot is ready, marks it failed if the
 * collection failed, otherwise leaves it running. Signed-in users only, own
 * scrapes only (RLS). Read-only against Bright Data; writes the scrape's
 * completion the same way the webhook does, so it is the fallback when a
 * delivery never reached us. Safe to call repeatedly.
 */
export const syncScrape = async (
  input: SyncScrapeInput
): Promise<ScrapeState> => {
  const { scrapeId } = syncScrapeSchema.parse(input)
  await getUserOrThrow()

  const scrape = await getScrape({ scrapeId })
  if (!scrape) throw new AppError(ErrorCode.NOT_FOUND, "Scrape not found.")
  const state = {
    id: scrape.id,
    snapshotId: scrape.snapshot_id,
    status: scrape.status,
  }
  if (scrape.status !== "running") return state

  const progress = await getSnapshotProgress(scrape.snapshot_id)
  if (progress.status === "ready") {
    await storeScrapeRecords(
      scrape.id,
      await downloadSnapshot(scrape.snapshot_id)
    )
    return { ...state, status: "ready" }
  }
  if (progress.status === "failed") {
    await failScrape(scrape.id, "Bright Data reported the collection as failed")
    return { ...state, status: "failed" }
  }
  return state
}
