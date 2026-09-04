import "server-only"

import { timingSafeEqual } from "node:crypto"

import {
  type Json,
  snapshotRecordsSchema,
  webhookAuthHeader,
} from "@/lib/brightdata/server"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"

/** One completed collection as Bright Data delivers it to the `endpoint` URL. */
export type BrightDataDelivery = {
  /** The collected records, verbatim, in snapshot order. */
  records: Json[]
}

const isEqual = (a: string, b: string) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * Verifies a Bright Data delivery request and returns the records. The
 * request must carry our shared secret in the Authorization header (Bright
 * Data sends the value we triggered with); a missing or wrong value throws
 * `AppError(UNAUTHENTICATED)` (HTTP 401), and a body that is not a JSON array
 * throws `AppError(VALIDATION)` (HTTP 400). Who the records belong to is read
 * from the URL by the route, not from the body.
 */
export const verifyBrightDataWebhook = async (
  request: Request
): Promise<BrightDataDelivery> => {
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
  const parsed = snapshotRecordsSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, "Delivery must be a JSON array")
  }
  return { records: parsed.data }
}
