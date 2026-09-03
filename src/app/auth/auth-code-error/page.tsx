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

export const metadata: Metadata = { title: "Sign in failed" }

const AuthCodeErrorPage = () => (
  <main className="flex min-h-svh items-center justify-center p-4">
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in failed</CardTitle>
        <CardDescription>
          The confirmation link may have expired or already been used. Please
          try signing in again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button render={<Link href={ROUTES.login} />}>Back to sign in</Button>
      </CardContent>
    </Card>
  </main>
)

export default AuthCodeErrorPage
