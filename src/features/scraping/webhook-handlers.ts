import "server-only"

import {
  applyScrapeOutcome,
  getScrapeJobAsSystem,
} from "@/features/scraping/jobs"
import { downloadSnapshot } from "@/lib/brightdata/client"
import type { BrightDataEvent } from "@/lib/brightdata/webhooks"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"

/**
 * Applies one authenticated Bright Data webhook call to its scrape job.
 * Webhook route only; completes the job (records or failure) and throws so
 * Bright Data retries when the job is unknown or its snapshot is not yet
 * downloadable. A job that is already ready or failed is left untouched.
 */
export const handleBrightDataEvent = async (event: BrightDataEvent) => {
  const job = await getScrapeJobAsSystem(event.jobId)
  if (!job) throw new AppError(ErrorCode.NOT_FOUND, "Unknown scrape job")

  if (job.status !== "running") {
    logger.info("Bright Data event for a finished job skipped", {
      event: "scraping.brightdata_event.skipped",
      jobId: job.id,
      eventId: event.id,
    })
    return
  }

  if (event.type === "delivery") {
    await applyScrapeOutcome(job.id, {
      status: "ready",
      records: event.records,
    })
  } else if (event.status === "failed") {
    await applyScrapeOutcome(job.id, {
      status: "failed",
      error: "Bright Data reported the collection failed.",
    })
  } else if (event.status === "ready") {
    // The notice can arrive before, or instead of, the delivery itself.
    const records = await downloadSnapshot(event.snapshotId)
    if (!records) {
      throw new AppError(ErrorCode.EXTERNAL_SERVICE, "Snapshot not ready yet")
    }
    await applyScrapeOutcome(job.id, { status: "ready", records })
  } else {
    await applyScrapeOutcome(job.id, {
      status: "running",
      snapshotId: event.snapshotId,
    })
  }

  logger.info("Bright Data event applied", {
    event: "scraping.brightdata_event.processed",
    jobId: job.id,
    eventId: event.id,
    eventType: event.type,
  })
}
