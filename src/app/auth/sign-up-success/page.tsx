import type { Metadata } from "next"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { AuthTopBar } from "@/features/auth/components/auth-top-bar"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Confirm your email" }

// Shown after sign-up when the project requires email confirmation, so the
// account exists but has no session yet.
const SignUpSuccessPage = () => (
  <>
    <AuthTopBar link={{ href: ROUTES.login, label: "Login" }} />
    <AuthPageHeader
      title="Check your email"
      description="We sent you a confirmation link. Open it to activate your account, then sign in."
    />
    <Button variant="outline" render={<Link href={ROUTES.login} />}>
      Back to sign in
    </Button>
  </>
)

export default SignUpSuccessPage
