import type { Metadata } from "next"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = { title: "Reset password" }

// Signed-in users never reach this page: src/proxy.ts redirects them.
const ForgotPasswordPage = () => (
  <Card>
    <CardHeader>
      <CardTitle>Reset your password</CardTitle>
      <CardDescription>
        Enter your email and we will send you a link to choose a new password.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ForgotPasswordForm />
    </CardContent>
    <CardFooter>
      <p className="text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href={ROUTES.login}
          className="text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </CardFooter>
  </Card>
)

export default ForgotPasswordPage
