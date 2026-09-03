import type { EmailOtpType } from "@supabase/supabase-js"

/**
 * Email link types this app verifies at /auth/confirm. Supabase types
 * `EmailOtpType` as a widened string, so the allowlist is what actually keeps
 * an arbitrary `type` query parameter out of `verifyOtp`.
 */
const EMAIL_OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const satisfies readonly EmailOtpType[]

export type SupportedEmailOtpType = (typeof EMAIL_OTP_TYPES)[number]

export const isEmailOtpType = (
  value: string | null | undefined
): value is SupportedEmailOtpType =>
  typeof value === "string" &&
  (EMAIL_OTP_TYPES as readonly string[]).includes(value)
