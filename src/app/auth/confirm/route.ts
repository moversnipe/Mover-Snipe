import { NextResponse } from "next/server"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import { isEmailOtpType } from "@/features/auth/otp"
import { sanitizeNextPath } from "@/features/auth/redirect"
import { createClient } from "@/lib/supabase/server"

/**
 * Verifies a `token_hash` email link (signup, recovery, email change) and
 * starts a session. Supabase's default templates send users through
 * /auth/callback with a PKCE `code`; point a template at this route with
 * `{{ .TokenHash }}` when the link may be opened in a different browser than
 * the one that requested it, where the PKCE verifier cookie is missing.
 */
export const GET = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = sanitizeNextPath(
    searchParams.get("next"),
    DEFAULT_AUTHENTICATED_PATH
  )

  if (tokenHash && isEmailOtpType(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}${ROUTES.authError}`)
}
