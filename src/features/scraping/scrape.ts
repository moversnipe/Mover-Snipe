import "server-only"

import { ROUTES } from "@/config/routes"
import { absoluteUrl } from "@/config/site"
import { getUserOrThrow } from "@/features/auth/queries"
import { applyScrapeOutcome } from "@/features/scraping/jobs"
import { getScrapeJob, SCRAPE_JOB_COLUMNS } from "@/features/scraping/queries"
import {
  type RunScrapeJobInput,
  runScrapeJobSchema,
} from "@/features/scraping/schemas"
import { scrape, type ScrapeResponse } from "@/lib/brightdata/client"
import {
  SCRAPE_JOB_QUERY_PARAM,
  webhookAuthorization,
} from "@/lib/brightdata/webhooks"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

/** The scrape job as stored, after Bright Data's synchronous answer was applied. */
export type ScrapeJob = NonNullable<Awaited<ReturnType<typeof getScrapeJob>>>

/** Absolute webhook URL for one job; Bright Data posts records and status notices to it. */
export const scrapeWebhookUrl = (jobId: string) =>
  absoluteUrl(
    `${ROUTES.api.brightdataWebhook}?${SCRAPE_JOB_QUERY_PARAM}=${jobId}`
  )

/**
 * Runs a Bright Data scraper on up to 20 inputs for the signed-in user and
 * returns the job. Contacts Bright Data and is billed per record. The job
 * comes back `ready` with its records when Bright Data answers within the
 * synchronous window, otherwise `running` and the webhook completes it.
 * Throws `AppError(EXTERNAL_SERVICE)` when Bright Data rejects the request;
 * the job is then stored as `failed`.
 */
export const runScrapeJob = async (
  input: RunScrapeJobInput
): Promise<ScrapeJob> => {
  const parsed = runScrapeJobSchema.parse(input)
  const user = await getUserOrThrow()

  const supabase = await createClient()
  const { data: job, error } = await supabase
    .from("scrape_jobs")
    .insert({
      user_id: user.id,
      dataset_id: parsed.datasetId,
      input: parsed.input,
    })
    .select(SCRAPE_JOB_COLUMNS)
    .single()
  if (error || !job) {
    logger.error("Scrape job insert failed", {
      event: "scraping.scrape_job.create_failed",
      userId: user.id,
      datasetId: parsed.datasetId,
      code: error?.code,
    })
    throw new AppError(ErrorCode.INTERNAL, "Could not start the scrape.")
  }
  logger.info("Scrape job created", {
    event: "scraping.scrape_job.created",
    jobId: job.id,
    userId: user.id,
    datasetId: parsed.datasetId,
    inputCount: parsed.input.length,
  })

  let outcome: ScrapeResponse
  try {
    outcome = await scrape({
      datasetId: parsed.datasetId,
      input: parsed.input,
      webhook: {
        url: scrapeWebhookUrl(job.id),
        authorization: webhookAuthorization(job.id),
      },
    })
  } catch (error) {
    await applyScrapeOutcome(job.id, {
      status: "failed",
      error: "Bright Data rejected the request.",
    })
    throw error
  }
  await applyScrapeOutcome(job.id, outcome)

  const stored = await getScrapeJob(job.id)
  if (!stored) throw new AppError(ErrorCode.NOT_FOUND, "Scrape job not found.")
  return stored
}
