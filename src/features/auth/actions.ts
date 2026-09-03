"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import { absoluteUrl } from "@/config/site"
import { getUser } from "@/features/auth/queries"
import { sanitizeNextPath } from "@/features/auth/redirect"
import {
  credentialsSchema,
  forgotPasswordSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/features/auth/schemas"
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

/** Absolute URL Supabase Auth sends the user back to after an email link. */
const emailRedirectUrl = (next: string): string => {
  const url = new URL(absoluteUrl(ROUTES.authCallback))
  url.searchParams.set("next", next)
  return url.toString()
}

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
  const validated = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!validated.success) return failValidation(validated.error)

  const { email, password } = validated.data
  const next = sanitizeNextPath(
    formData.get("next")?.toString(),
    DEFAULT_AUTHENTICATED_PATH
  )

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: emailRedirectUrl(next) },
  })
  if (error) {
    logger.warn("Sign-up failed", { code: error.code })
    return fail(
      ErrorCode.VALIDATION,
      "Could not create the account. Try a different email or a stronger password."
    )
  }

  // With email confirmation enabled the user has no session yet and must open
  // the link we just sent; the success page explains that. With confirmation
  // disabled (the Supabase CLI default) signUp already returns a session.
  if (!data.session) redirect(ROUTES.signUpSuccess)

  revalidatePath(ROUTES.home, "layout")
  redirect(next)
}

/**
 * Sends a password recovery link. The result is deliberately identical whether
 * or not the address has an account, so the form cannot be used to discover
 * which emails are registered.
 */
export const requestPasswordReset = async (
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> => {
  const validated = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })
  if (!validated.success) return failValidation(validated.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(
    validated.data.email,
    { redirectTo: emailRedirectUrl(ROUTES.updatePassword) }
  )
  if (error) logger.warn("Password reset request failed", { code: error.code })

  return ok({
    message:
      "If an account exists for that address, a reset link is on its way.",
  })
}

/**
 * Sets a new password for the signed-in user. Reached from the recovery link,
 * which establishes a session before this page is rendered.
 */
export const updatePassword = async (
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> => {
  const validated = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!validated.success) return failValidation(validated.error)

  const user = await getUser()
  if (!user) {
    return fail(
      ErrorCode.UNAUTHENTICATED,
      "Your reset link has expired. Request a new one."
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  })
  if (error) {
    logger.warn("Password update failed", { code: error.code, userId: user.id })
    return fail(
      ErrorCode.VALIDATION,
      "Could not update the password. Choose a different one and try again."
    )
  }

  revalidatePath(ROUTES.home, "layout")
  redirect(DEFAULT_AUTHENTICATED_PATH)
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
