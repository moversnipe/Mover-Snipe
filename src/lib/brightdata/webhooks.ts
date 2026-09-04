import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { gunzipSync } from "node:zlib"

import { z } from "zod"

import { serverEnv } from "@/lib/env/server"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import type { Json } from "@/lib/supabase/database.types"

/**
 * One inbound Bright Data webhook call, identified by the job id we put in the
 * webhook URL when the scrape was requested.
 *
 * - `delivery`: the records of a finished collection (the `endpoint` URL).
 * - `notification`: a status notice for a snapshot (the `notify` URL).
 *
 * `id` is stable per (job, kind, status) and keys the idempotency ledger.
 */
export type BrightDataEvent =
  | { id: string; type: "delivery"; jobId: string; records: Json[] }
  | {
      id: string
      type: "notification"
      jobId: string
      snapshotId: string
      /** Bright Data snapshot status: starting, running, ready, or failed. */
      status: string
    }

/** Query parameter of the webhook URL that carries the scrape job id. */
export const SCRAPE_JOB_QUERY_PARAM = "job"

const querySchema = z.object({ [SCRAPE_JOB_QUERY_PARAM]: z.uuid() })

const deliverySchema = z.array(z.json())

const notificationSchema = z.object({
  snapshot_id: z.string().min(1),
  status: z.string().min(1).max(32),
})

/**
 * The `Authorization` value registered with Bright Data as `auth_header` for
 * one job, and expected back on every call about it. Derived per job from
 * `BRIGHTDATA_WEBHOOK_SECRET`, so the secret itself never leaves the server
 * and a leaked webhook URL authorises exactly one job.
 */
export const webhookAuthorization = (jobId: string) =>
  `Bearer ${createHmac("sha256", serverEnv.BRIGHTDATA_WEBHOOK_SECRET)
    .update(jobId)
    .digest("hex")}`

const isAuthorized = (header: string | null, jobId: string) => {
  const expected = Buffer.from(webhookAuthorization(jobId))
  const actual = Buffer.from(header ?? "")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/**
 * Upper bound on one delivery. A synchronous job has at most 20 inputs, so a
 * body anywhere near this is not one of ours; the same cap bounds inflation.
 */
export const MAX_WEBHOOK_BODY_BYTES = 32 * 1024 * 1024

const readJsonBody = async (request: Request): Promise<unknown> => {
  const raw = Buffer.from(await request.arrayBuffer())
  if (raw.length > MAX_WEBHOOK_BODY_BYTES) {
    throw new AppError(ErrorCode.VALIDATION, "Body too large")
  }
  const encoding = request.headers.get("content-encoding")
  try {
    const text =
      encoding === "gzip"
        ? gunzipSync(raw, { maxOutputLength: MAX_WEBHOOK_BODY_BYTES })
        : raw
    return JSON.parse(text.toString("utf8"))
  } catch {
    throw new AppError(ErrorCode.VALIDATION, "Body must be JSON")
  }
}

/**
 * Authenticates a Bright Data webhook request and returns the typed event.
 * The request must name the job in the `job` query parameter and carry that
 * job's `webhookAuthorization` value in `Authorization`. Throws
 * `AppError(VALIDATION)` for a missing job id or an unrecognised body and
 * `AppError(UNAUTHENTICATED)` for a bad token, so Bright Data stops retrying
 * either.
 */
export const verifyBrightDataWebhook = async (
  request: Request
): Promise<BrightDataEvent> => {
  const query = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  )
  if (!query.success) {
    throw new AppError(ErrorCode.VALIDATION, "Missing or invalid job id")
  }
  const jobId = query.data[SCRAPE_JOB_QUERY_PARAM]

  if (!isAuthorized(request.headers.get("authorization"), jobId)) {
    logger.warn("Rejected Bright Data webhook with invalid credentials", {
      jobId,
    })
    throw new AppError(ErrorCode.UNAUTHENTICATED, "Invalid webhook credentials")
  }

  const body = await readJsonBody(request)

  const delivery = deliverySchema.safeParse(body)
  if (delivery.success) {
    return {
      id: `${jobId}:delivery`,
      type: "delivery",
      jobId,
      records: delivery.data,
    }
  }

  const notification = notificationSchema.safeParse(body)
  if (notification.success) {
    return {
      id: `${jobId}:notification:${notification.data.status}`,
      type: "notification",
      jobId,
      snapshotId: notification.data.snapshot_id,
      status: notification.data.status,
    }
  }

  throw new AppError(ErrorCode.VALIDATION, "Unrecognised webhook body")
}
