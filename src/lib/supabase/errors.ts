import "server-only"

import { logger } from "@/lib/logger"

/**
 * The `error` half of a `postgrest-js` result (queries and RPCs).
 *
 * PostgREST failures arrive as a plain object parsed straight out of the
 * response body (`{ code, details, hint, message }`) — not an `Error`. The
 * types say otherwise: `PostgrestResponseFailure` declares `error:
 * PostgrestError`, and `PostgrestError extends Error`, which is why
 * `throw error` type-checked for so long. At runtime the value has no `name`,
 * so throwing it hands React a non-Error: Next.js wraps it in
 * `new Error(JSON.stringify(error))` whose stack holds only framework frames,
 * tags the digest with its `@E394` "thrown value was not an Error" code, and
 * the error boundary is left with a reference number and nothing that names
 * the query. Route every failed result through `throwIfError`.
 *
 * This applies to `postgrest-js` only. `@supabase/auth-js` returns real
 * `AuthError` subclasses, so auth code paths handle `error` directly.
 */
export type SupabaseQueryError = {
  message: string
  code?: string
  details?: string | null
  hint?: string | null
}

type ThrowIfError = (
  error: SupabaseQueryError | null,
  context: string
) => asserts error is null

/**
 * Logs a failed Supabase result with the fields PostgREST returned, then
 * throws a real `Error` naming `context` so the stack points at the caller.
 *
 * The message is for the server log only: unexpected failures stay plain
 * `Error`s, so `failFromError`/`error.tsx` still show the user a generic line
 * and a digest, never the provider's text.
 */
export const throwIfError: ThrowIfError = (error, context) => {
  if (!error) return

  // `error`, not `message`: the logger spreads these fields over its own
  // envelope, so a `message` key here would replace the log line's message.
  //
  // `details` is deliberately left out. Postgres fills it with row contents on
  // a constraint violation ("Failing row contains (uuid, user@example.com,
  // ...)"), which would put profile and subscription data in log storage.
  // `code`, `hint` and `message` are constants and constraint names.
  logger.error("Supabase query failed", {
    context,
    code: error.code,
    hint: error.hint,
    error: error.message,
  })

  throw new Error(`${context}: ${error.message}`, { cause: error })
}
