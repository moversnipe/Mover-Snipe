import "server-only"

import { timingSafeEqual } from "node:crypto"

import { z } from "zod"

import { webhookAuthHeader } from "@/lib/brightdata/server"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"

/**
 * Completion notification Bright Data posts to the `notify` URL: the snapshot
 * that finished and its final status (`ready` or `failed`). Other fields are
 * ignored.
 */
const notificationSchema = z.object({
  snapshot_id: z.string().min(1).max(255),
  status: z.string().min(1).max(64),
  error: z.string().max(1000).optional(),
})

export type BrightDataEvent = {
  /** Bright Data snapshot id; doubles as the idempotency event id. */
  snapshotId: string
  /** Final status as Bright Data reports it, e.g. "ready" or "failed". */
  status: string
  /** Error text Bright Data included with a failed notification, if any. */
  error: string | null
}

const isEqual = (a: string, b: string) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * Verifies a Bright Data webhook request and returns the typed event. The
 * request must carry our shared secret in the Authorization header (Bright
 * Data echoes the `auth_header` value we triggered with); a missing or wrong
 * value throws `AppError(UNAUTHENTICATED)` (HTTP 401) and a malformed body
 * throws `AppError(VALIDATION)` (HTTP 400).
 */
export const verifyBrightDataWebhook = async (
  request: Request
): Promise<BrightDataEvent> => {
  const authorization = request.headers.get("authorization") ?? ""
  if (!isEqual(authorization, webhookAuthHeader())) {
    logger.warn("Rejected Bright Data webhook with invalid secret")
    throw new AppError(ErrorCode.UNAUTHENTICATED, "Invalid webhook secret")
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new AppError(ErrorCode.VALIDATION, "Request body must be valid JSON")
  }
  const parsed = notificationSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, "Invalid notification payload")
  }
  return {
    snapshotId: parsed.data.snapshot_id,
    status: parsed.data.status,
    error: parsed.data.error ?? null,
  }
}
