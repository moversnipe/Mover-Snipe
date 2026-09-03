import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { ROUTES } from "@/config/routes"
import { AppError, ErrorCode } from "@/lib/errors"
import { throwIfError } from "@/lib/supabase/errors"
import { createClient } from "@/lib/supabase/server"

/** Identity established from verified JWT claims. */
export type SessionUser = {
  id: string
  email: string | undefined
}

/**
 * Current user identity or null, from the access token's verified claims.
 *
 * getClaims() checks the signature against the project's JWT signing keys
 * locally (JWKS, cached) and only falls back to the Auth server when the
 * project still uses the legacy symmetric secret. Never use getSession() for
 * identity: it reads cookies without verifying them. Use supabase.auth.getUser()
 * only when you need the fresh user record itself, not just the identity.
 *
 * Wrapped in React.cache so several Server Components in one request share
 * one verification.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data) return null
  return { id: data.claims.sub, email: data.claims.email }
})

/** Current user, or redirect to login. Use in protected layouts and actions. */
export const requireUser = async () => {
  const user = await getUser()
  if (!user) redirect(ROUTES.login)
  return user
}

/** Current user, or throw UNAUTHENTICATED. Use in Route Handlers (createHandler maps it to 401). */
export const getUserOrThrow = async () => {
  const user = await getUser()
  if (!user) throw new AppError(ErrorCode.UNAUTHENTICATED, "Sign in required")
  return user
}

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle()

  throwIfError(error, "getProfile")
  return data
})
