import type { Metadata } from "next"
import Link from "next/link"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { AuthTopBar } from "@/features/auth/components/auth-top-bar"
import { SignUpForm } from "@/features/auth/components/sign-up-form"
import { sanitizeNextPath } from "@/features/auth/redirect"
import { FieldDescription } from "@/components/ui/field"

export const metadata: Metadata = { title: "Create account" }

type SignUpPageProps = {
  searchParams: Promise<{ next?: string }>
}

// Signed-in users never reach this page: src/proxy.ts redirects them.
const SignUpPage = async ({ searchParams }: SignUpPageProps) => {
  const { next } = await searchParams
  const safeNext = sanitizeNextPath(next, DEFAULT_AUTHENTICATED_PATH)
  const loginHref = `${ROUTES.login}?next=${encodeURIComponent(safeNext)}`

  return (
    <>
      <AuthTopBar link={{ href: loginHref, label: "Login" }} />
      <AuthPageHeader
        title="Create an account"
        description="Enter your email below to create your account"
      />
      <SignUpForm next={safeNext} />
      <FieldDescription className="px-6 text-center">
        Already have an account? <Link href={loginHref}>Sign in</Link>.
      </FieldDescription>
    </>
  )
}

export default SignUpPage
