import "server-only"

import { apiError } from "@/lib/api/response"
import { ErrorCode, isAppError } from "@/lib/errors"
import { logger } from "@/lib/logger"

type RouteParams = Record<string, string | string[] | undefined>

type HandlerContext<P extends RouteParams> = {
  request: Request
  params: P
}

type RouteHandler<P extends RouteParams> = (
  context: HandlerContext<P>
) => Promise<Response> | Response

/**
 * Wraps every Route Handler under `src/app/api/`.
 *
 * - Resolves the `params` promise Next.js passes for dynamic segments.
 * - Turns a thrown `AppError` into the JSON error envelope with the right
 *   HTTP status.
 * - Logs any other exception and returns a generic 500, so internals never
 *   reach the caller.
 *
 * Usage: `export const POST = createHandler(async ({ request }) => ...)`.
 */
export const createHandler =
  <P extends RouteParams = Record<string, never>>(handler: RouteHandler<P>) =>
  async (request: Request, context?: { params: Promise<P> }) => {
    try {
      const params = context ? await context.params : ({} as P)
      return await handler({ request, params })
    } catch (error) {
      if (isAppError(error)) return apiError(error.code, error.message)

      logger.error("Unhandled route handler error", {
        method: request.method,
        path: new URL(request.url).pathname,
        message: error instanceof Error ? error.message : String(error),
      })
      return apiError(ErrorCode.INTERNAL, "Internal server error")
    }
  }
