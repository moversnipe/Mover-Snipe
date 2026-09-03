import { NextResponse } from "next/server"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import { absoluteUrl } from "@/config/site"
import { sanitizeNextPath } from "@/features/auth/redirect"
import { createClient } from "@/lib/supabase/server"

/**
 * Exchanges the PKCE `code` from a Supabase email link for a session.
 *
 * Redirect targets are built from NEXT_PUBLIC_SITE_URL rather than the request:
 * `new URL(request.url).origin` follows the Host header, which a proxy that does
 * not pin it would let a caller forge.
 */
export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = sanitizeNextPath(
    searchParams.get("next"),
    DEFAULT_AUTHENTICATED_PATH
  )

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(absoluteUrl(next))
  }

  return NextResponse.redirect(absoluteUrl(ROUTES.authError))
}
