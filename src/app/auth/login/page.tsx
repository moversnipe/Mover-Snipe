import type { Metadata } from "next"

import { DEFAULT_AUTHENTICATED_PATH } from "@/config/routes"
import { LoginForm } from "@/features/auth/components/login-form"
import { sanitizeNextPath } from "@/features/auth/redirect"

export const metadata: Metadata = { title: "Login" }

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>
}

// Signed-in users never reach this page: src/proxy.ts redirects them.
const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { next } = await searchParams
  const safeNext = sanitizeNextPath(next, DEFAULT_AUTHENTICATED_PATH)

  return <LoginForm next={safeNext} />
}

export default LoginPage
