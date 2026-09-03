"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import { absoluteUrl } from "@/config/site"
import { sanitizeNextPath } from "@/features/auth/redirect"
import { credentialsSchema } from "@/features/auth/schemas"
import {
  type ActionResult,
  fail,
  failValidation,
  ok,
} from "@/lib/actions/result"
import { ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export type AuthActionResult = ActionResult<{ message?: string }>

export const signIn = async (
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> => {
  const validated = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!validated.success) return failValidation(validated.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(validated.data)
  if (error) {
    // Never forward Supabase's message: it can reveal whether the email exists.
    logger.warn("Sign-in failed", { code: error.code })
    return fail(ErrorCode.UNAUTHENTICATED, "Invalid email or password.")
  }

  revalidatePath(ROUTES.home, "layout")
  redirect(
    sanitizeNextPath(
      formData.get("next")?.toString(),
      DEFAULT_AUTHENTICATED_PATH
    )
  )
}

export const signUp = async (
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> => {
  const validated = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!validated.success) return failValidation(validated.error)

  const next = sanitizeNextPath(
    formData.get("next")?.toString(),
    DEFAULT_AUTHENTICATED_PATH
  )
  const callbackUrl = new URL(absoluteUrl(ROUTES.authCallback))
  callbackUrl.searchParams.set("next", next)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    ...validated.data,
    options: { emailRedirectTo: callbackUrl.toString() },
  })
  if (error) {
    logger.warn("Sign-up failed", { code: error.code })
    return fail(
      ErrorCode.VALIDATION,
      "Could not create the account. Try a different email or a stronger password."
    )
  }

  // With email confirmation disabled (the Supabase CLI default), signUp
  // returns a session and the user is already signed in.
  if (!data.session) {
    return ok({ message: "Check your email to confirm your account." })
  }

  revalidatePath(ROUTES.home, "layout")
  redirect(next)
}

/**
 * Redirect-only action bound straight to <form action>. It takes no input and
 * always ends in redirect(), so it is exempt from the ActionResult contract
 * (see .claude/rules/server-actions.md).
 */
export const signOut = async (): Promise<void> => {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath(ROUTES.home, "layout")
  redirect(ROUTES.login)
}
