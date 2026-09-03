import { NextResponse } from "next/server"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import { sanitizeNextPath } from "@/features/auth/redirect"
import { createClient } from "@/lib/supabase/server"

/** Exchanges the PKCE `code` from a Supabase email link for a session. */
export const GET = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = sanitizeNextPath(
    searchParams.get("next"),
    DEFAULT_AUTHENTICATED_PATH
  )

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}${ROUTES.authError}`)
}
