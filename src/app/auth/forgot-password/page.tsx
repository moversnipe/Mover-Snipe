import type { Metadata } from "next"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { AuthTopBar } from "@/features/auth/components/auth-top-bar"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"
import { FieldDescription } from "@/components/ui/field"

export const metadata: Metadata = { title: "Reset password" }

// Signed-in users never reach this page: src/proxy.ts redirects them.
const ForgotPasswordPage = () => (
  <>
    <AuthTopBar link={{ href: ROUTES.login, label: "Login" }} />
    <AuthPageHeader
      title="Reset your password"
      description="Enter your email below and we will send you a reset link"
    />
    <ForgotPasswordForm />
    <FieldDescription className="px-6 text-center">
      Remembered it? <Link href={ROUTES.login}>Sign in</Link>.
    </FieldDescription>
  </>
)

export default ForgotPasswordPage
