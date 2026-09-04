import "server-only"

import { ROUTES } from "@/config/routes"
import { getUserOrThrow } from "@/features/auth/queries"
import { emailRedirectUrl } from "@/features/auth/redirect"
import type {
  ForgotPasswordInput,
  NewPasswordInput,
} from "@/features/auth/schemas"
import { AppError, ErrorCode } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

/**
 * Sends a password recovery email to the address if an account exists for it.
 * Anyone may call it; it resolves the same way whether or not the address is
 * registered, so it cannot be used to discover accounts. Sends mail.
 */
export const sendPasswordResetEmail = async (
  input: ForgotPasswordInput
): Promise<void> => {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: emailRedirectUrl(ROUTES.updatePassword),
  })
  if (error) {
    logger.warn("Password reset request failed", {
      event: "auth.password_reset.request_failed",
      code: error.code,
    })
    return
  }
  // No id on purpose: logging the address would record which emails exist.
  logger.info("Password reset requested", {
    event: "auth.password_reset.requested",
  })
}

/**
 * Replaces the signed-in user's password and revokes their other sessions.
 * Signed-in users only; throws UNAUTHENTICATED without a session,
 * REAUTHENTICATION_REQUIRED when Supabase's `secure_password_change` wants a
 * fresh sign-in first, and VALIDATION when the provider rejects the password.
 * Writes to Supabase Auth.
 */
export const updatePassword = async (
  input: NewPasswordInput
): Promise<void> => {
  const user = await getUserOrThrow()

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: input.password,
  })
  if (error) {
    logger.warn("Password update failed", {
      event: "auth.password.update_failed",
      code: error.code,
      userId: user.id,
    })
    if (error.code === "reauthentication_needed") {
      throw new AppError(
        ErrorCode.REAUTHENTICATION_REQUIRED,
        "For security, sign in again before changing your password."
      )
    }
    throw new AppError(
      ErrorCode.VALIDATION,
      "Could not update the password. Choose a different one and try again."
    )
  }

  // Drop every other session so a stolen cookie cannot outlive the reset.
  const { error: signOutError } = await supabase.auth.signOut({
    scope: "others",
  })
  if (signOutError) {
    logger.warn("Could not revoke other sessions after password update", {
      event: "auth.sessions.revoke_failed",
      code: signOutError.code,
      userId: user.id,
    })
  }

  logger.info("Password updated", {
    event: "auth.password.updated",
    userId: user.id,
  })
}
