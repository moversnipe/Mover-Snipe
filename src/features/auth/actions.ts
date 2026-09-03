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
  if (error) return fail(ErrorCode.UNAUTHENTICATED, error.message)

  revalidatePath("/", "layout")
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
  const { error } = await supabase.auth.signUp({
    ...validated.data,
    options: { emailRedirectTo: callbackUrl.toString() },
  })
  if (error) return fail(ErrorCode.VALIDATION, error.message)

  return ok({ message: "Check your email to confirm your account." })
}

export const signOut = async (): Promise<void> => {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect(ROUTES.login)
}
