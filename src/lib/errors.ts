/**
 * Application error codes.
 *
 * Every error surfaced to a caller (Server Action result, API response, log
 * line) carries one of these codes so clients can branch on a stable string
 * instead of parsing messages. Add new codes here, never inline.
 */
export const ErrorCode = {
  VALIDATION: "validation_error",
  UNAUTHENTICATED: "unauthenticated",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  RATE_LIMITED: "rate_limited",
  EXTERNAL_SERVICE: "external_service_error",
  INTERNAL: "internal_error",
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

/** HTTP status used when an error code is returned from a Route Handler. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION]: 400,
  [ErrorCode.UNAUTHENTICATED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.EXTERNAL_SERVICE]: 502,
  [ErrorCode.INTERNAL]: 500,
}

/**
 * Error type for expected failures. Throw this from server code when the
 * failure is part of the domain (not found, forbidden, ...). Unexpected
 * failures should stay as plain `Error`s so they surface as INTERNAL.
 */
export class AppError extends Error {
  readonly code: ErrorCode

  constructor(code: ErrorCode, message?: string, options?: ErrorOptions) {
    super(message ?? code, options)
    this.name = "AppError"
    this.code = code
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError

/** Message safe to show to an end user. Hides internals of unknown errors. */
export const toUserMessage = (error: unknown): string => {
  if (isAppError(error)) return error.message
  return "Something went wrong. Please try again."
}

export const toErrorCode = (error: unknown): ErrorCode =>
  isAppError(error) ? error.code : ErrorCode.INTERNAL
