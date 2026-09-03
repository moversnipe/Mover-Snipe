import { NextResponse } from "next/server"

import { ERROR_STATUS, type ErrorCode } from "@/lib/errors"

/**
 * JSON envelope for Route Handlers under `src/app/api/`.
 *
 * Success: `{ data }`. Failure: `{ error: { code, message } }` with the HTTP
 * status derived from the error code, so clients never parse messages.
 */
export const apiSuccess = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ data }, init)

export const apiError = (code: ErrorCode, message: string) =>
  NextResponse.json(
    { error: { code, message } },
    { status: ERROR_STATUS[code] }
  )
