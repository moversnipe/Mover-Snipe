import { z } from "zod"

const emailSchema = z.email("Enter a valid email address")

export const PASSWORD_MIN_LENGTH = 8

/**
 * The symbol set Supabase Auth counts for its
 * `lower_upper_letters_digits_symbols` password requirement. Keeping the two
 * in step means a password this schema accepts is never rejected by Auth for
 * lacking a symbol.
 */
const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~"

const hasSymbol = (value: string): boolean =>
  [...value].some((character) => PASSWORD_SYMBOLS.includes(character))

export type PasswordRuleId =
  "length" | "lowercase" | "uppercase" | "number" | "symbol"

export type PasswordRule = {
  id: PasswordRuleId
  /** Shown in the live checklist under the password input. */
  label: string
  test: (value: string) => boolean
}

/**
 * What a new password must contain. The checklist component renders these
 * one by one as the user types; `passwordSchema` enforces the same list on
 * the server so the two can never disagree.
 */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lowercase",
    label: "A lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "uppercase",
    label: "An uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: "A number",
    test: (value) => /[0-9]/.test(value),
  },
  {
    id: "symbol",
    label: "A symbol, such as ! @ # $ %",
    test: hasSymbol,
  },
]

/** The rules `value` does not satisfy yet, in checklist order. */
export const getUnmetPasswordRules = (value: string): PasswordRule[] =>
  PASSWORD_RULES.filter((rule) => !rule.test(value))

const lowercaseFirst = (text: string): string =>
  text.charAt(0).toLowerCase() + text.slice(1)

/** New passwords (sign-up, update): every rule in `PASSWORD_RULES`. */
const passwordSchema = z.string().superRefine((value, context) => {
  const unmet = getUnmetPasswordRules(value)
  if (unmet.length === 0) return

  context.addIssue({
    code: "custom",
    message: `Password needs ${unmet
      .map((rule) => lowercaseFirst(rule.label))
      .join(", ")}`,
  })
})

/**
 * Existing passwords (sign-in): only the minimum length. Accounts created
 * before the composition rules existed must still be able to sign in.
 */
const existingPasswordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  )

/**
 * Where to send the browser once a session exists. Any value that is not a
 * same-origin path is replaced by the default (`sanitizeNextPath`), so this
 * only bounds the size; it never rejects the request.
 */
const nextPathSchema = z
  .string()
  .max(2048)
  .optional()
  .describe(
    "Same-origin path to open after sign-in, such as /billing; anything else falls back to the dashboard"
  )

/** Email and existing password, as typed on /auth/login. */
export const credentialsSchema = z.object({
  email: emailSchema,
  password: existingPasswordSchema,
})

export type CredentialsInput = z.infer<typeof credentialsSchema>

/** Sign-in: credentials plus the optional path to return to. */
export const signInSchema = credentialsSchema.extend({ next: nextPathSchema })

export type SignInInput = z.infer<typeof signInSchema>

/**
 * Sign-up: email, a new password with its confirmation, and the optional
 * path to open once the account is ready.
 */
export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    next: nextPathSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignUpInput = z.infer<typeof signUpSchema>

/** Forgot password: only the address the recovery link is sent to. */
export const forgotPasswordSchema = z.object({ email: emailSchema })

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/** New password: what `updatePassword` needs, every rule in `PASSWORD_RULES`. */
export const newPasswordSchema = z.object({
  password: passwordSchema.describe(
    "The replacement password; must satisfy every rule in PASSWORD_RULES"
  ),
})

export type NewPasswordInput = z.infer<typeof newPasswordSchema>

/** Update-password form: the new password, typed twice. */
export const updatePasswordSchema = newPasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
