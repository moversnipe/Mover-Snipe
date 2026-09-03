import type { Metadata } from "next"
import Link from "next/link"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { AuthTopBar } from "@/features/auth/components/auth-top-bar"
import { LoginForm } from "@/features/auth/components/login-form"
import { sanitizeNextPath } from "@/features/auth/redirect"
import { FieldDescription } from "@/components/ui/field"

export const metadata: Metadata = { title: "Sign in" }

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>
}

// Signed-in users never reach this page: src/proxy.ts redirects them.
const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { next } = await searchParams
  const safeNext = sanitizeNextPath(next, DEFAULT_AUTHENTICATED_PATH)
  const signUpHref = `${ROUTES.signUp}?next=${encodeURIComponent(safeNext)}`

  return (
    <>
      <AuthTopBar link={{ href: signUpHref, label: "Sign up" }} />
      <AuthPageHeader
        title="Sign in to your account"
        description="Enter your email and password below to sign in"
      />
      <LoginForm next={safeNext} />
      <FieldDescription className="px-6 text-center">
        No account yet? <Link href={signUpHref}>Create one</Link>.
      </FieldDescription>
    </>
  )
}

export default LoginPage
