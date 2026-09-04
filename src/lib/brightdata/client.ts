import "server-only"

import { z } from "zod"

import { serverEnv } from "@/lib/env/server"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import type { Json } from "@/lib/supabase/database.types"

/**
 * Bright Data Web Scraper API (datasets v3).
 *
 * `scrape` is the synchronous endpoint: Bright Data answers within about a
 * minute with the records, or with 202 and a snapshot id once the collection
 * outlives that window. Every request also names our webhook as `endpoint`
 * (records are posted there) and `notify` (a status notice is posted there),
 * so a job that outlives the synchronous window is completed by
 * /api/webhooks/brightdata instead of by polling.
 */
const BASE_URL = "https://api.brightdata.com/datasets/v3"

/**
 * Bright Data's own synchronous limit is one minute. We give up a little
 * earlier so the calling function returns before typical platform limits, and
 * leave the job to the webhook.
 */
export const SCRAPE_TIMEOUT_MS = 55_000

/** One input row for a dataset, keyed by the dataset's input columns (usually `url`). */
export type ScrapeInputRecord = Record<string, string | number | boolean>

export type ScrapeRequest = {
  /** Bright Data dataset id (gd_...) of the scraper to run. */
  datasetId: string
  /** At most 20 rows: Bright Data's limit for the synchronous endpoint. */
  input: ScrapeInputRecord[]
  webhook: {
    /** Absolute URL Bright Data posts the records and the status notice to. */
    url: string
    /** `Authorization` value Bright Data must send back (see `webhookAuthorization`). */
    authorization: string
  }
}

export type ScrapeResponse =
  | { status: "ready"; records: Json[] }
  /** Still collecting; `snapshotId` is null when our own timeout hit first. */
  | { status: "running"; snapshotId: string | null }

const recordsSchema = z.array(z.json())

const acceptedSchema = z.object({ snapshot_id: z.string().min(1) })

const authorization = () => ({
  Authorization: `Bearer ${serverEnv.BRIGHTDATA_API_KEY}`,
})

const externalError = (message: string, fields: Record<string, unknown>) => {
  logger.error(message, { event: "brightdata.request.failed", ...fields })
  return new AppError(ErrorCode.EXTERNAL_SERVICE, "Scraping is unavailable.")
}

/** The response body as JSON, or null when it is not JSON. */
const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Runs one synchronous scrape. Server code only; contacts Bright Data and is
 * billed per delivered record. Returns the records when they arrive in time,
 * otherwise `running` and leaves delivery to the webhook. Throws
 * `AppError(EXTERNAL_SERVICE)` when Bright Data rejects the request.
 */
export const scrape = async ({
  datasetId,
  input,
  webhook,
}: ScrapeRequest): Promise<ScrapeResponse> => {
  const query = new URLSearchParams({
    dataset_id: datasetId,
    format: "json",
    include_errors: "true",
    endpoint: webhook.url,
    notify: webhook.url,
    auth_header: webhook.authorization,
    uncompressed_webhook: "true",
  })

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/scrape?${query}`, {
      method: "POST",
      headers: { ...authorization(), "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
      signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { status: "running", snapshotId: null }
    }
    throw externalError("Bright Data scrape request failed", {
      datasetId,
      message: error instanceof Error ? error.message : String(error),
    })
  }

  if (response.status === 202) {
    const accepted = acceptedSchema.safeParse(await readJson(response))
    if (!accepted.success) {
      throw externalError("Bright Data 202 without snapshot id", { datasetId })
    }
    return { status: "running", snapshotId: accepted.data.snapshot_id }
  }

  if (!response.ok) {
    throw externalError("Bright Data rejected the scrape request", {
      datasetId,
      httpStatus: response.status,
    })
  }

  const records = recordsSchema.safeParse(await readJson(response))
  if (!records.success) {
    throw externalError("Bright Data returned an unexpected body", {
      datasetId,
    })
  }
  return { status: "ready", records: records.data }
}

/**
 * Downloads a finished snapshot's records. Server code only; read-only call
 * to Bright Data. Returns null while the snapshot is still being built and
 * throws `AppError(EXTERNAL_SERVICE)` on any other failure.
 */
export const downloadSnapshot = async (
  snapshotId: string
): Promise<Json[] | null> => {
  const url = `${BASE_URL}/snapshot/${encodeURIComponent(snapshotId)}?format=json`
  let response: Response
  try {
    response = await fetch(url, { headers: authorization() })
  } catch (error) {
    throw externalError("Bright Data snapshot download failed", {
      snapshotId,
      message: error instanceof Error ? error.message : String(error),
    })
  }

  if (response.status === 202) return null
  if (!response.ok) {
    throw externalError("Bright Data refused the snapshot download", {
      snapshotId,
      httpStatus: response.status,
    })
  }

  const records = recordsSchema.safeParse(await readJson(response))
  if (!records.success) {
    throw externalError("Bright Data snapshot had an unexpected body", {
      snapshotId,
    })
  }
  return records.data
}
