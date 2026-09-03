/**
 * Single source of truth for application paths.
 *
 * Import from here instead of writing string literals so that renaming a route
 * is a one-line change and the proxy, redirects, and links stay in sync.
 */
export const ROUTES = {
  home: "/",
  login: "/auth/login",
  authCallback: "/auth/callback",
  authError: "/auth/auth-code-error",
  dashboard: "/dashboard",
  billing: "/billing",
  api: {
    health: "/api/health",
    stripeWebhook: "/api/webhooks/stripe",
  },
} as const

/** Paths reachable without a session. Everything else requires a signed-in user. */
const PUBLIC_PATHS: readonly string[] = [
  ROUTES.home,
  ROUTES.login,
  ROUTES.authCallback,
  ROUTES.authError,
  ROUTES.api.health,
  ROUTES.api.stripeWebhook,
]

export const isPublicPath = (pathname: string): boolean =>
  PUBLIC_PATHS.some(
    (publicPath) =>
      pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  )

/** Where a signed-in user lands after login or when visiting an auth page. */
export const DEFAULT_AUTHENTICATED_PATH = ROUTES.dashboard
