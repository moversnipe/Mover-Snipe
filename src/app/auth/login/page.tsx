import type { Metadata } from "next"

import { DEFAULT_AUTHENTICATED_PATH } from "@/config/routes"
import { LoginForm } from "@/features/auth/components/login-form"
import { sanitizeNextPath } from "@/features/auth/redirect"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = { title: "Sign in" }

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>
}

// Signed-in users never reach this page: src/proxy.ts redirects them.
const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { next } = await searchParams

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            next={sanitizeNextPath(next, DEFAULT_AUTHENTICATED_PATH)}
          />
        </CardContent>
      </Card>
    </main>
  )
}

export default LoginPage
