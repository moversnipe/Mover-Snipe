import type { z } from "zod"

import { AppError, ErrorCode } from "@/lib/errors"

const firstIssue = (error: z.ZodError) =>
  error.issues[0]?.message ?? "Invalid request"

/** Parses and validates a JSON body. Throws `AppError(VALIDATION)` on failure. */
export const parseJsonBody = async <T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<T> => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new AppError(ErrorCode.VALIDATION, "Request body must be valid JSON")
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, firstIssue(parsed.error))
  }
  return parsed.data
}

/** Parses and validates the query string. Throws `AppError(VALIDATION)` on failure. */
export const parseSearchParams = <T>(
  request: Request,
  schema: z.ZodType<T>
): T => {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  )
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, firstIssue(parsed.error))
  }
  return parsed.data
}
