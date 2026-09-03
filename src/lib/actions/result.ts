import type { z } from "zod"

import { ErrorCode, toErrorCode, toUserMessage } from "@/lib/errors"

/**
 * Standard return shape for every Server Action.
 *
 * Actions never throw to the client; they return `ok: false` with a stable
 * error code, a user-safe message, and optional per-field errors for forms.
 */
export type ActionError = {
  code: ErrorCode
  message: string
  fieldErrors?: Record<string, string[]>
}

export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: ActionError }

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data })

export const fail = <T = never>(
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<T> => ({ ok: false, error: { code, message, fieldErrors } })

/** Converts a failed Zod parse into a VALIDATION result with field errors. */
export const failValidation = <T = never>(
  error: z.ZodError
): ActionResult<T> => {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "form"
    ;(fieldErrors[key] ??= []).push(issue.message)
  }
  return fail(ErrorCode.VALIDATION, "Please fix the errors below.", fieldErrors)
}

/** Converts a thrown error (AppError or unknown) into a failed result. */
export const failFromError = <T = never>(error: unknown): ActionResult<T> =>
  fail(toErrorCode(error), toUserMessage(error))

/** Reads the first error for a field, for rendering under an input. */
export const fieldError = (
  result: ActionResult<unknown> | undefined,
  field: string
): string | undefined =>
  result && !result.ok ? result.error.fieldErrors?.[field]?.[0] : undefined
