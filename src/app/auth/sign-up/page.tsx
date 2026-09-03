import type { Metadata } from "next"

import { DEFAULT_AUTHENTICATED_PATH } from "@/config/routes"
import { SignUpForm } from "@/features/auth/components/sign-up-form"
import { sanitizeNextPath } from "@/features/auth/redirect"

export const metadata: Metadata = { title: "Create account" }

type SignUpPageProps = {
  searchParams: Promise<{ next?: string }>
}

// Signed-in users never reach this page: src/proxy.ts redirects them.
const SignUpPage = async ({ searchParams }: SignUpPageProps) => {
  const { next } = await searchParams
  const safeNext = sanitizeNextPath(next, DEFAULT_AUTHENTICATED_PATH)

  return <SignUpForm next={safeNext} />
}

export default SignUpPage
