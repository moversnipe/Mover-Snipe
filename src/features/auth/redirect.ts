import { ROUTES } from "@/config/routes"
import { absoluteUrl } from "@/config/site"

/**
 * Only allow same-origin path redirects for the `next` parameter.
 * Rejects protocol-relative ("//host"), backslash parser-confusion ("/\\host"),
 * and absolute URLs.
 */
export const sanitizeNextPath = (
  raw: string | null | undefined,
  fallback: string = ROUTES.home
): string => {
  if (!raw) return fallback
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback
  }
  return raw
}

/**
 * Absolute URL of our PKCE callback with `next` attached, for Supabase Auth to
 * send the user back to after an email link (confirmation, recovery).
 */
export const emailRedirectUrl = (next: string): string => {
  const url = new URL(absoluteUrl(ROUTES.authCallback))
  url.searchParams.set("next", next)
  return url.toString()
}
