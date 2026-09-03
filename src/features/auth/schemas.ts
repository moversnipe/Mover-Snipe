import { z } from "zod"

const emailSchema = z.email("Enter a valid email address")

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")

/** Sign-in: what the user types on /auth/login. */
export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type CredentialsInput = z.infer<typeof credentialsSchema>

/** Sign-up: credentials plus a confirmation of the chosen password. */
export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignUpInput = z.infer<typeof signUpSchema>

/** Forgot password: only the address the recovery link is sent to. */
export const forgotPasswordSchema = z.object({ email: emailSchema })

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/** Update password: the new password, typed twice. */
export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
