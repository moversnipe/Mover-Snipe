import { ROUTES } from "@/config/routes"

/**
 * Only allow same-origin path redirects for the `next` parameter.
 * Rejects protocol-relative ("//host"), backslash parser-confusion ("/\host"),
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
