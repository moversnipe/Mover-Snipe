import type { Metadata } from "next"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { AuthPageHeader } from "@/features/auth/components/auth-page-header"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"

export const metadata: Metadata = { title: "Login failed" }

const AuthCodeErrorPage = () => (
  <FieldGroup>
    <AuthPageHeader
      title="Login failed"
      description="The confirmation link may have expired or already been used. Please try logging in again"
    />
    <Field>
      <Button render={<Link href={ROUTES.login} />}>Back to login</Button>
      <FieldDescription className="text-center">
        Need a new password link?{" "}
        <Link
          href={ROUTES.forgotPassword}
          className="underline underline-offset-4"
        >
          Request one
        </Link>
      </FieldDescription>
    </Field>
  </FieldGroup>
)

export default AuthCodeErrorPage
