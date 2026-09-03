import type { Metadata } from "next"
import Link from "next/link"

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "@/config/routes"
import { SignUpForm } from "@/features/auth/components/sign-up-form"
import { sanitizeNextPath } from "@/features/auth/redirect"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = { title: "Create account" }

type SignUpPageProps = {
  searchParams: Promise<{ next?: string }>
}

// Signed-in users never reach this page: src/proxy.ts redirects them.
const SignUpPage = async ({ searchParams }: SignUpPageProps) => {
  const { next } = await searchParams
  const safeNext = sanitizeNextPath(next, DEFAULT_AUTHENTICATED_PATH)
  const loginHref = `${ROUTES.login}?next=${encodeURIComponent(safeNext)}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Use your email and pick a password to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm next={safeNext} />
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default SignUpPage
