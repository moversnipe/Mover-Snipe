import "server-only"

import { z } from "zod"

import { ROUTES } from "@/config/routes"
import { absoluteUrl } from "@/config/site"
import { serverEnv } from "@/lib/env/server"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"

/**
 * Minimal client for the Bright Data Web Scraper API (asynchronous mode).
 *
 * Every collection is triggered with `notify` pointing at our webhook route
 * and `auth_header` carrying our shared secret, so completion always arrives
 * through `/api/webhooks/brightdata`; the results are then pulled with
 * `downloadSnapshot`. Records are never pushed into us, which keeps the
 * inbound request small and means a caller who knows the webhook secret can
 * only make us re-read a real snapshot, never inject data.
 *
 * Endpoints (https://docs.brightdata.com/api-reference/web-scraper-api):
 * - POST /datasets/v3/trigger?dataset_id=…  body: JSON array of inputs  → { snapshot_id }
 * - GET  /datasets/v3/snapshot/{snapshot_id}?format=json → 200 JSON array, 202 while not ready
 */
const BASE_URL = "https://api.brightdata.com/datasets/v3"

/** Scalar values Bright Data accepts in an input object (url, keyword, ...). */
export type BrightDataInput = Record<string, string | number | boolean>

export type TriggerCollectionParams = {
  /** Bright Data dataset id, such as gd_l7q7dkf244hwjntr0. */
  datasetId: string
  /** One object per thing to collect, in the dataset's input shape. */
  input: readonly BrightDataInput[]
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

const authHeaders = () => ({
  Authorization: `Bearer ${serverEnv.BRIGHTDATA_API_KEY}`,
})

/** The Authorization header value Bright Data must echo on every webhook. */
export const webhookAuthHeader = () =>
  `Bearer ${serverEnv.BRIGHTDATA_WEBHOOK_SECRET}`

/** Builds the trigger URL. Exported for tests only. */
export const buildTriggerUrl = (params: TriggerCollectionParams): string => {
  const url = new URL(`${BASE_URL}/trigger`)
  url.searchParams.set("dataset_id", params.datasetId)
  url.searchParams.set("format", "json")
  url.searchParams.set("include_errors", "true")
  url.searchParams.set("notify", absoluteUrl(ROUTES.api.brightdataWebhook))
  url.searchParams.set("auth_header", webhookAuthHeader())
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
const snapshotResponseSchema = z.array(jsonSchema)

/**
 * Starts an asynchronous collection and returns its snapshot id. Server code
 * only. Contacts Bright Data and is billed per run; completion is delivered
 * to our webhook.
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

/**
 * Downloads every record of a ready snapshot as a JSON array. Server code
 * only; read-only. Throws `AppError(EXTERNAL_SERVICE)` while Bright Data still
 * answers 202 (not ready), so a webhook caller returns non-2xx and is retried.
 */
export const downloadSnapshot = async (snapshotId: string): Promise<Json[]> => {
  const url = `${BASE_URL}/snapshot/${encodeURIComponent(snapshotId)}?format=json`
  const response = await fetch(url, { headers: authHeaders() })
  if (!response.ok || response.status === 202) {
    throw requestFailed("snapshot", response.status)
  }

  const parsed = snapshotResponseSchema.safeParse(await response.json())
  if (!parsed.success) throw requestFailed("snapshot", response.status)
  return parsed.data
}
