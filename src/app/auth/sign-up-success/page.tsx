import type { Metadata } from "next"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"

export const metadata: Metadata = { title: "Confirm your email" }

// Shown after sign-up when the project requires email confirmation, so the
// account exists but has no session yet.
const SignUpSuccessPage = () => (
  <FieldGroup>
    <AuthPageHeader
      title="Check your email"
      description="We sent you a confirmation link. Open it to activate your account, then login"
    />
    <Field>
      <Button variant="outline" render={<Link href={ROUTES.login} />}>
        Back to login
      </Button>
    </Field>
  </FieldGroup>
)

export default SignUpSuccessPage
