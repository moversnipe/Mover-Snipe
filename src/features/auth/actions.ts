"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import {
  sendPasswordResetEmail,
  updatePassword,
} from "@/features/auth/password"
import { getUser } from "@/features/auth/queries"
import { emailRedirectUrl, sanitizeNextPath } from "@/features/auth/redirect"
import {
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/features/auth/schemas"
import {
  type ActionResult,
  fail,
  failFromError,
  failValidation,
  ok,
} from "@/lib/actions/result"
import { ErrorCode, isAppError } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export type AuthActionResult = ActionResult<{ message?: string }>

/** The `next` form field, or undefined when the form did not send one. */
const readNext = (formData: FormData): string | undefined =>
  formData.get("next")?.toString()

/**
 * Signs the visitor in with email and password, sets the session cookie, and
 * redirects to `next` or the dashboard. Anyone may call it; returns a failed
 * result with a fixed message on bad credentials.
 */
export const signIn = async (
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> => {
  const validated = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: readNext(formData),
  })
  if (!validated.success) return failValidation(validated.error)

  const { email, password, next } = validated.data
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    // Never forward Supabase's message: it can reveal whether the email exists.
    logger.warn("Sign-in failed", {
      event: "auth.sign_in.failed",
      code: error.code,
    })
    return fail(ErrorCode.UNAUTHENTICATED, "Invalid email or password.")
  }

  logger.info("Signed in", {
    event: "auth.sign_in.succeeded",
    userId: data.user.id,
  })
  revalidatePath(ROUTES.home, "layout")
  redirect(sanitizeNextPath(next, DEFAULT_AUTHENTICATED_PATH))
}

/**
 * Creates an account with email and password, then redirects to `next` or, when
 * email confirmation is on, to the page that explains the confirmation email.
 * Anyone may call it. Sends the confirmation mail.
 */
export const signUp = async (
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> => {
  const validated = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    next: readNext(formData),
  })
  if (!validated.success) return failValidation(validated.error)

  const { email, password } = validated.data
  const next = sanitizeNextPath(validated.data.next, DEFAULT_AUTHENTICATED_PATH)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: emailRedirectUrl(next) },
  })
  if (error) {
    logger.warn("Sign-up failed", {
      event: "auth.sign_up.failed",
      code: error.code,
    })
    return fail(
      ErrorCode.VALIDATION,
      "Could not create the account. Try a different email or a stronger password."
    )
  }

  logger.info("Signed up", {
    event: "auth.sign_up.succeeded",
    userId: data.user?.id ?? null,
    hasSession: data.session !== null,
  })

  // With email confirmation enabled the user has no session yet and must open
  // the link we just sent; the success page explains that. With confirmation
  // disabled (the Supabase CLI default) signUp already returns a session.
  if (!data.session) redirect(ROUTES.signUpSuccess)

  revalidatePath(ROUTES.home, "layout")
  redirect(next)
}

/**
 * Form adapter over `sendPasswordResetEmail`. The confirmation is deliberately
 * identical whether or not the address has an account, so the form cannot be
 * used to discover which emails are registered.
 */
export const requestPasswordReset = async (
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> => {
  const validated = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })
  if (!validated.success) return failValidation(validated.error)

  await sendPasswordResetEmail(validated.data)

  return ok({
    message:
      "If an account exists for that address, a reset link is on its way.",
  })
}

/**
 * Form adapter over `updatePassword`: checks the two typed passwords match,
 * replaces the signed-in user's password, and redirects to the dashboard.
 * Reached from the recovery link, which establishes a session before the page
 * renders; without one the result tells the user to request a new link.
 */
export const submitNewPassword = async (
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> => {
  const validated = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!validated.success) return failValidation(validated.error)

  try {
    await updatePassword({ password: validated.data.password })
  } catch (error) {
    if (isAppError(error) && error.code === ErrorCode.UNAUTHENTICATED) {
      return fail(
        ErrorCode.UNAUTHENTICATED,
        "Your reset link has expired. Request a new one."
      )
    }
    return failFromError(error)
  }

  revalidatePath(ROUTES.home, "layout")
  redirect(DEFAULT_AUTHENTICATED_PATH)
}

/**
 * Redirect-only action bound straight to <form action>. It takes no input and
 * always ends in redirect(), so it is exempt from the ActionResult contract
 * (see .claude/rules/server-actions.md). Clears the session cookie.
 */
export const signOut = async (): Promise<void> => {
  const user = await getUser()
  const supabase = await createClient()
  await supabase.auth.signOut()
  logger.info("Signed out", {
    event: "auth.sign_out.succeeded",
    userId: user?.id ?? null,
  })
  revalidatePath(ROUTES.home, "layout")
  redirect(ROUTES.login)
}
