import type { Metadata } from "next"
import Link from "next/link"

import { ROUTES } from "@/config/routes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = { title: "Confirm your email" }

// Shown after sign-up when the project requires email confirmation, so the
// account exists but has no session yet.
const SignUpSuccessPage = () => (
  <Card>
    <CardHeader>
      <CardTitle>Check your email</CardTitle>
      <CardDescription>
        We sent you a confirmation link. Open it to activate your account, then
        sign in.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button variant="outline" render={<Link href={ROUTES.login} />}>
        Back to sign in
      </Button>
    </CardContent>
  </Card>
)

export default SignUpSuccessPage
