import "server-only"

import { z } from "zod"

import { serverEnv } from "@/lib/env/server"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"

/**
 * Minimal client for the Bright Data Web Scraper API (asynchronous mode).
 *
 * Endpoints (https://docs.brightdata.com/api-reference/rest-api/scraper):
 * - POST /datasets/v3/trigger?dataset_id=…&endpoint=…  body: JSON array of inputs → { snapshot_id }
 *   Bright Data POSTs the collected records (a JSON array, uncompressed) to
 *   `endpoint` when the job completes, retrying on non-2xx.
 * - GET  /datasets/v3/progress/{snapshot_id} → { status: running | ready | failed | … }
 * - GET  /datasets/v3/snapshot/{snapshot_id}?format=json → 200 JSON array, 202 while not ready
 */
const BASE_URL = "https://api.brightdata.com/datasets/v3"

/** Scalar values Bright Data accepts in an input object (url, keyword, ...). */
export type BrightDataInput = Record<string, string | number | boolean>

/** Any JSON value, as `jsonb` stores it. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ])
)

/** The records of one snapshot, as Bright Data delivers or serves them. */
export const snapshotRecordsSchema = z.array(jsonSchema)

export type TriggerCollectionParams = {
  /** Bright Data dataset id, such as gd_l7q7dkf244hwjntr0. */
  datasetId: string
  /** One object per thing to collect, in the dataset's input shape. */
  input: readonly BrightDataInput[]
  /** Absolute HTTPS URL Bright Data POSTs the records to on completion. */
  endpoint: string
  /** Sets `type=discover_new&discover_by=<value>` for discovery datasets. */
  discoverBy?: string
  /** Maximum records collected per input object. */
  limitPerInput?: number
  /** Maximum records collected across the whole run. */
  limitMultipleResults?: number
}

export type TriggeredCollection = {
  /** Bright Data snapshot id (s_...) identifying this run. */
  snapshotId: string
}

export type SnapshotProgress = {
  /** Status as Bright Data reports it: running, ready, failed, or a transient value. */
  status: string
}

const authHeaders = () => ({
  Authorization: `Bearer ${serverEnv.BRIGHTDATA_API_KEY}`,
})

/** The Authorization header value Bright Data must send on every delivery. */
export const webhookAuthHeader = () =>
  `Bearer ${serverEnv.BRIGHTDATA_WEBHOOK_SECRET}`

/**
 * Builds the trigger URL. Exported for tests only. The query string carries
 * the webhook secret (as Bright Data's API requires), so this URL must never
 * be logged.
 */
export const buildTriggerUrl = (params: TriggerCollectionParams): string => {
  const url = new URL(`${BASE_URL}/trigger`)
  url.searchParams.set("dataset_id", params.datasetId)
  url.searchParams.set("format", "json")
  url.searchParams.set("include_errors", "true")
  url.searchParams.set("endpoint", params.endpoint)
  url.searchParams.set("uncompressed_webhook", "true")
  // The reference documents `auth_header`, the delivery guide
  // `webhook_header_Authorization`; both name the same header, so send both.
  url.searchParams.set("auth_header", webhookAuthHeader())
  url.searchParams.set("webhook_header_Authorization", webhookAuthHeader())
  if (params.discoverBy) {
    url.searchParams.set("type", "discover_new")
    url.searchParams.set("discover_by", params.discoverBy)
  }
  if (params.limitPerInput !== undefined) {
    url.searchParams.set("limit_per_input", String(params.limitPerInput))
  }
  if (params.limitMultipleResults !== undefined) {
    url.searchParams.set(
      "limit_multiple_results",
      String(params.limitMultipleResults)
    )
  }
  return url.toString()
}

const requestFailed = (operation: string, status: number) => {
  logger.error("Bright Data request failed", {
    event: "brightdata.request.failed",
    operation,
    status,
  })
  return new AppError(ErrorCode.EXTERNAL_SERVICE, "Bright Data request failed")
}

const triggerResponseSchema = z.object({ snapshot_id: z.string().min(1) })
const progressResponseSchema = z.object({ status: z.string().min(1) })

/**
 * Starts an asynchronous collection and returns its snapshot id. Server code
 * only. Contacts Bright Data and is billed per run; the records are delivered
 * to `endpoint` when the job completes.
 */
export const triggerCollection = async (
  params: TriggerCollectionParams
): Promise<TriggeredCollection> => {
  const response = await fetch(buildTriggerUrl(params), {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(params.input),
  })
  if (!response.ok) throw requestFailed("trigger", response.status)

  const parsed = triggerResponseSchema.safeParse(await response.json())
  if (!parsed.success) throw requestFailed("trigger", response.status)
  return { snapshotId: parsed.data.snapshot_id }
}

/** Reads the current status of a snapshot. Server code only; read-only. */
export const getSnapshotProgress = async (
  snapshotId: string
): Promise<SnapshotProgress> => {
  const url = `${BASE_URL}/progress/${encodeURIComponent(snapshotId)}`
  const response = await fetch(url, { headers: authHeaders() })
  if (!response.ok) throw requestFailed("progress", response.status)

  const parsed = progressResponseSchema.safeParse(await response.json())
  if (!parsed.success) throw requestFailed("progress", response.status)
  return { status: parsed.data.status }
}

/**
 * Downloads every record of a ready snapshot as a JSON array. Server code
 * only; read-only. Throws `AppError(EXTERNAL_SERVICE)` while Bright Data still
 * answers 202 (not ready).
 */
export const downloadSnapshot = async (snapshotId: string): Promise<Json[]> => {
  const url = `${BASE_URL}/snapshot/${encodeURIComponent(snapshotId)}?format=json`
  const response = await fetch(url, { headers: authHeaders() })
  if (!response.ok || response.status === 202) {
    throw requestFailed("snapshot", response.status)
  }

  const parsed = snapshotRecordsSchema.safeParse(await response.json())
  if (!parsed.success) throw requestFailed("snapshot", response.status)
  return parsed.data
}
