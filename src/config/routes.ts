/**
 * Single source of truth for application paths.
 *
 * Import from here instead of writing string literals so that renaming a route
 * is a one-line change and the proxy, redirects, and links stay in sync.
 */
export const ROUTES = {
  home: "/",
  login: "/auth/login",
  signUp: "/auth/sign-up",
  signUpSuccess: "/auth/sign-up-success",
  forgotPassword: "/auth/forgot-password",
  updatePassword: "/auth/update-password",
  authCallback: "/auth/callback",
  authConfirm: "/auth/confirm",
  authError: "/auth/auth-code-error",
  dashboard: "/dashboard",
  billing: "/billing",
  api: {
    health: "/api/health",
    stripeWebhook: "/api/webhooks/stripe",
  },
} as const

/**
 * Paths reachable without a session. Everything else requires a signed-in user.
 *
 * `updatePassword` is deliberately absent: it is reached from a recovery link
 * that has already established a session, so the proxy must keep anonymous
 * visitors out.
 */
const PUBLIC_PATHS: readonly string[] = [
  ROUTES.home,
  ROUTES.login,
  ROUTES.signUp,
  ROUTES.signUpSuccess,
  ROUTES.forgotPassword,
  ROUTES.authCallback,
  ROUTES.authConfirm,
  ROUTES.authError,
  ROUTES.api.health,
  ROUTES.api.stripeWebhook,
]

/**
 * Auth pages that only make sense for anonymous visitors. A signed-in user who
 * lands on one is sent to the app instead. `authCallback`, `authConfirm` and
 * `updatePassword` are excluded on purpose: each is reached *with* a session.
 */
const AUTH_ENTRY_PATHS: readonly string[] = [
  ROUTES.login,
  ROUTES.signUp,
  ROUTES.signUpSuccess,
  ROUTES.forgotPassword,
]

const matchesPath = (pathname: string, candidate: string): boolean =>
  pathname === candidate || pathname.startsWith(`${candidate}/`)

export const isPublicPath = (pathname: string): boolean =>
  PUBLIC_PATHS.some((publicPath) => matchesPath(pathname, publicPath))

export const isAuthEntryPath = (pathname: string): boolean =>
  AUTH_ENTRY_PATHS.some((entryPath) => matchesPath(pathname, entryPath))

/** Where a signed-in user lands after login or when visiting an auth page. */
export const DEFAULT_AUTHENTICATED_PATH = ROUTES.dashboard
