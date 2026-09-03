import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { ROUTES } from "@/config/routes"
import { createClient } from "@/lib/supabase/server"

/**
 * Current user or null. Wrapped in React.cache so several Server Components in
 * one request share a single auth round-trip.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/** Current user, or redirect to login. Use in protected layouts and actions. */
export const requireUser = async () => {
  const user = await getUser()
  if (!user) redirect(ROUTES.login)
  return user
}

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  return data
})
