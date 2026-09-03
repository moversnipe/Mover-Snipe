import type { Metadata } from "next"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { AuthTopBar } from "@/features/auth/components/auth-top-bar"
import { Button } from "@/components/ui/button"
import { FieldDescription } from "@/components/ui/field"

export const metadata: Metadata = { title: "Sign in failed" }

const AuthCodeErrorPage = () => (
  <>
    <AuthTopBar link={{ href: ROUTES.login, label: "Login" }} />
    <AuthPageHeader
      title="Sign in failed"
      description="The confirmation link may have expired or already been used. Please try signing in again."
    />
    <Button render={<Link href={ROUTES.login} />}>Back to sign in</Button>
    <FieldDescription className="px-6 text-center">
      Need a new password link?{" "}
      <Link href={ROUTES.forgotPassword}>Request one</Link>.
    </FieldDescription>
  </>
)

export default AuthCodeErrorPage
